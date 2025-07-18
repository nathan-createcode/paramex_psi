from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
from mangum import Mangum
from datetime import datetime
import pytz
from supabase import create_client, Client

# Import our custom modules
from groq_client import GroqLlamaClient
from scoring_logic import ProjectScorer
from supabase_email_service import SupabaseEmailService
from notification_scheduler import NotificationScheduler
from ux_safety_check import UXSafetyChecker

# Initialize FastAPI app
app = FastAPI(title="ParameX PSI - AI Project Advisor API", version="1.0.0")

# Configure CORS for Vercel
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for Vercel deployment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get environment variables
groq_api_key = os.getenv("GROQ_API_KEY")
supabase_url = os.getenv("VITE_SUPABASE_URL")
supabase_key = os.getenv("VITE_SUPABASE_ANON_KEY")

print(f"🔍 Environment variables status:")
print(f"   GROQ_API_KEY: {'✅ Set' if groq_api_key else '❌ Missing'}")
print(f"   VITE_SUPABASE_URL: {'✅ Set' if supabase_url else '❌ Missing'}")
print(f"   VITE_SUPABASE_ANON_KEY: {'✅ Set' if supabase_key else '❌ Missing'}")

# Initialize Supabase client
supabase: Client = None
notification_scheduler = None
email_service = None

try:
    if supabase_url and supabase_key:
        supabase = create_client(supabase_url, supabase_key)
        print("✅ Supabase client initialized successfully")
        
        # Initialize email service
        email_service = SupabaseEmailService(supabase)
        print("✅ Email service initialized successfully")
        
        # Initialize notification scheduler
        notification_scheduler = NotificationScheduler(supabase, email_service)
        print("✅ Notification scheduler initialized successfully")
    else:
        print("❌ Supabase credentials missing - project context features will be disabled")
except Exception as e:
    print(f"⚠️ Warning: Could not initialize Supabase client: {e}")
    print("Project context features will be disabled")

# Initialize Groq client
groq_client = None
try:
    if groq_api_key:
        groq_client = GroqLlamaClient(performance_mode="balanced")
        print("✅ Groq AI client initialized successfully")
    else:
        print("❌ GROQ_API_KEY missing - AI features will be disabled")
except Exception as e:
    print(f"⚠️ Warning: Could not initialize Groq client: {e}")
    print("AI features will be disabled")

# Initialize other services
project_scorer = ProjectScorer()
ux_safety_checker = UXSafetyChecker()

# Pydantic models
class ChatMessage(BaseModel):
    type: str
    content: str
    timestamp: Optional[str] = None

class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[ChatMessage]] = []
    user_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    status: str = "success"

class ProjectAnalysisRequest(BaseModel):
    user_id: str
    project_history: Dict[str, Any]
    completion_rate: float
    current_workload: int
    request_type: str = "new_project_decision"

class DashboardSummaryRequest(BaseModel):
    user_id: str
    dashboard_data: Dict[str, Any]

class EmailTestRequest(BaseModel):
    user_email: str
    user_name: str

class ProjectUpdateRequest(BaseModel):
    project_id: str
    old_status: str
    new_status: str
    update_message: Optional[str] = ""

class WelcomeEmailRequest(BaseModel):
    user_email: str
    user_name: Optional[str] = "New User"

class QuickAdviceRequest(BaseModel):
    question_type: str

class AnalyzeProjectRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    timeline: Optional[str] = None
    budget: Optional[str] = None
    client_type: Optional[str] = None
    complexity: Optional[str] = None

# Helper function to get user projects for context
async def get_user_projects_context(user_id: str) -> str:
    """Get user's projects formatted for AI context"""
    try:
        if not supabase:
            return ""
        
        # Get user projects from Supabase
        response = supabase.table("projects").select(
            """
            project_id,
            project_name,
            client_name,
            start_date,
            deadline,
            payment_amount,
            difficulty_level,
            type_id:type_id ( type_name ),
            status_id:status_id ( status_name )
            """
        ).eq("user_id", user_id).order("created_at", {"ascending": False}).limit(10).execute()
        
        if not response.data:
            return ""
        
        projects = response.data
        context = "\n[USER'S PROJECT DATA]\n"
        
        for project in projects:
            context += f"• {project['project_name']} ({project['client_name']})\n"
            context += f"  Status: {project['status_id']['status_name'] if project['status_id'] else 'Unknown'}\n"
            context += f"  Type: {project['type_id']['type_name'] if project['type_id'] else 'Unknown'}\n"
            context += f"  Deadline: {project['deadline']}\n"
            context += f"  Payment: ${project['payment_amount']:,.0f}\n"
            context += f"  Difficulty: {project['difficulty_level']}\n\n"
        
        return context
        
    except Exception as e:
        print(f"Error getting user projects: {e}")
        return ""

# Simple AI response generator (fallback without Groq)
def generate_simple_response(message: str) -> str:
    """Generate a simple response without AI"""
    message_lower = message.lower()
    
    if "hello" in message_lower or "hi" in message_lower:
        return "Hello! I'm your AI Project Advisor. How can I help you with your freelance projects today?"
    elif "project" in message_lower and "priority" in message_lower:
        return "For project prioritization, I recommend focusing on: 1) Deadline urgency, 2) Payment amount, 3) Project complexity. Consider your current workload and choose projects that align with your skills."
    elif "timeline" in message_lower or "deadline" in message_lower:
        return "For project timelines, always add 20-30% buffer time for unexpected issues. Break large projects into smaller milestones and communicate progress regularly with clients."
    elif "client" in message_lower:
        return "Client management tips: Set clear expectations upfront, communicate regularly, document all changes, and don't be afraid to ask questions. Good communication prevents most project issues."
    elif "price" in message_lower or "pricing" in message_lower:
        return "For pricing, consider: your expertise level, market rates, project complexity, timeline, and client budget. Don't undervalue your work - quality deserves fair compensation."
    else:
        return "I'm here to help with your freelance project management! Ask me about project prioritization, client communication, timeline planning, pricing strategies, or any other project-related questions."

# API Routes
@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """AI Chat endpoint for project advisor"""
    
    try:
        # Safety check user input
        safety_check = ux_safety_checker.check_user_input(request.message)
        
        if not safety_check["is_safe"]:
            if safety_check["suggestion"]:
                return ChatResponse(response=safety_check["suggestion"], status="warning")
            return ChatResponse(response="Please keep our conversation focused on professional project management topics.", status="warning")
        
        # Get user projects context if user_id is provided
        user_context = ""
        if request.user_id:
            user_context = await get_user_projects_context(request.user_id)
        
        # Combine user message with project context
        full_message = request.message + user_context
        
        # Try to use Groq API if available
        if groq_api_key and groq_client:
            try:
                # Get AI response using Groq
                response = await groq_client.get_project_advice(
                    user_message=full_message,
                    conversation_history=[msg.dict() for msg in request.conversation_history] if request.conversation_history else []
                )
                
                # Safety check AI response
                ai_safety_check = ux_safety_checker.check_ai_response(response)
                
                if not ai_safety_check["is_safe"]:
                    response = "I apologize, but I need to provide a more appropriate response. Please ask about project management topics."
                
                return ChatResponse(response=response, status="success")
                
            except Exception as groq_error:
                print(f"Groq API error: {groq_error}")
                # Fall back to simple response if Groq fails
                response = generate_simple_response(request.message)
                return ChatResponse(response=response, status="success")
        else:
            # No Groq API key, use simple response
            response = generate_simple_response(request.message)
            return ChatResponse(response=response, status="success")
        
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        return ChatResponse(
            response="I apologize, but I'm experiencing technical difficulties. Please try again later.",
            status="error"
        )

@app.get("/api/user-projects/{user_id}")
async def get_user_projects(user_id: str):
    """Get user projects for AI context"""
    
    try:
        if not supabase:
            return {"projects": [], "count": 0}
        
        # Get user projects from Supabase
        response = supabase.table("projects").select(
            """
            project_id,
            project_name,
            client_name,
            start_date,
            deadline,
            payment_amount,
            difficulty_level,
            type_id:type_id ( type_name ),
            status_id:status_id ( status_name )
            """
        ).eq("user_id", user_id).order("created_at", {"ascending": False}).execute()
        
        return {
            "projects": response.data or [],
            "count": len(response.data) if response.data else 0
        }
        
    except Exception as e:
        print(f"Error fetching user projects: {e}")
        raise HTTPException(status_code=500, detail="Unable to fetch projects")

@app.post("/api/project-analysis")
async def project_analysis(request: ProjectAnalysisRequest):
    """AI-powered project analysis and recommendations"""
    
    try:
        # Use Groq AI if available for more sophisticated analysis
        if groq_client and groq_api_key:
            try:
                # Prepare project data for AI analysis
                project_data = {
                    "total_projects": request.project_history.get("totalProjects", 0),
                    "completed_projects": request.project_history.get("completedProjects", 0),
                    "ongoing_projects": request.project_history.get("ongoingProjects", 0),
                    "completion_rate": request.completion_rate,
                    "current_workload": request.current_workload
                }
                
                # Create detailed prompt for AI analysis
                prompt = f"""
                Analyze this user's project situation and provide a recommendation:
                
                Project Portfolio:
                - Total Projects: {project_data['total_projects']}
                - Completed Projects: {project_data['completed_projects']}
                - Ongoing Projects: {project_data['ongoing_projects']}
                - Completion Rate: {project_data['completion_rate']}%
                - Current Workload: {project_data['current_workload']} projects
                
                Request Type: {request.request_type}
                
                Please provide:
                1. Should they take on a new project? (proceed/defer)
                2. Confidence level (0-100%)
                3. Brief reasoning
                
                Format your response as a decision with reasoning.
                """
                
                ai_response = await groq_client.get_project_advice(prompt)
                
                # Parse AI response to extract decision
                recommendation = "proceed" if "proceed" in ai_response.lower() else "defer"
                confidence = 85 if recommendation == "proceed" else 70
                
                return {
                    "decision": {
                        "recommendation": recommendation,
                        "confidence": confidence,
                        "reasoning": ai_response
                    }
                }
                
            except Exception as ai_error:
                print(f"AI analysis error: {ai_error}")
                # Fall back to simple analysis
                pass
        
        # Simple analysis based on workload (fallback)
        recommendation = "proceed" if request.current_workload < 3 else "defer"
        confidence = 85 if request.current_workload < 2 else 70
        
        reasoning = f"Based on your current workload of {request.current_workload} projects and {request.completion_rate}% completion rate, I recommend you {recommendation} with this project."
        
        return {
            "decision": {
                "recommendation": recommendation,
                "confidence": confidence,
                "reasoning": reasoning
            }
        }
        
    except Exception as e:
        print(f"Error in project analysis: {e}")
        return {
            "decision": {
                "recommendation": "proceed",
                "confidence": 60,
                "reasoning": "Analysis based on basic workload assessment"
            }
        }

@app.post("/api/dashboard-summary")
async def dashboard_summary(request: DashboardSummaryRequest):
    """Generate AI-powered dashboard summary"""
    
    try:
        # Use AI if available for richer summaries
        if groq_client and groq_api_key:
            try:
                data = request.dashboard_data
                
                prompt = f"""
                Generate a friendly and encouraging summary for this user's project dashboard:
                
                Dashboard Data:
                - Total Projects: {data.get('totalProjects', 0)}
                - Completed Projects: {data.get('completedProjects', 0)}
                - Ongoing Projects: {data.get('ongoingProjects', 0)}
                - Total Earnings: ${data.get('totalEarnings', 0):,.0f}
                - Monthly Earnings: ${data.get('monthlyEarnings', 0):,.0f}
                - Most Common Project Type: {data.get('mostCommonType', 'Various')}
                
                Provide an encouraging, personalized summary in 2-3 sentences.
                """
                
                ai_summary = await groq_client.get_project_advice(prompt)
                return {"summary": ai_summary}
                
            except Exception as ai_error:
                print(f"AI summary error: {ai_error}")
                # Fall back to simple summary
                pass
        
        # Simple summary (fallback)
        data = request.dashboard_data
        total_projects = data.get('totalProjects', 0)
        completed_projects = data.get('completedProjects', 0)
        total_earnings = data.get('totalEarnings', 0)
        
        summary = f"You have {total_projects} total projects with {completed_projects} completed successfully. "
        
        if total_earnings > 0:
            summary += f"Your earnings total ${total_earnings:,.0f}. "
        
        if completed_projects > 0:
            completion_rate = (completed_projects / total_projects) * 100 if total_projects > 0 else 0
            summary += f"With a {completion_rate:.0f}% completion rate, you're showing great project management skills!"
        else:
            summary += "You're just getting started - focus on delivering quality work to build your reputation!"
        
        return {"summary": summary}
        
    except Exception as e:
        print(f"Error in dashboard summary: {e}")
        return {"summary": "Dashboard summary is currently unavailable."}

@app.post("/api/analyze-project")
async def analyze_project(request: AnalyzeProjectRequest):
    """Analyze a specific project for complexity and recommendations"""
    
    try:
        project_data = {
            "title": request.title or "",
            "description": request.description or "",
            "timeline": request.timeline or "",
            "budget": request.budget or "",
            "client_type": request.client_type or "",
            "complexity": request.complexity or ""
        }
        
        # Use project scorer for detailed analysis
        complexity_analysis = project_scorer.analyze_project_complexity(project_data)
        risk_analysis = project_scorer.assess_project_risks(project_data)
        pricing_analysis = project_scorer.generate_pricing_recommendation(project_data, complexity_analysis["overall_complexity"])
        
        # Get AI insights if available
        ai_insights = ""
        if groq_client and groq_api_key:
            try:
                ai_insights = await groq_client.get_project_insights(project_data)
            except Exception as ai_error:
                print(f"AI insights error: {ai_error}")
                ai_insights = "AI insights temporarily unavailable."
        
        return {
            "complexity_analysis": complexity_analysis,
            "risk_analysis": risk_analysis,
            "pricing_analysis": pricing_analysis,
            "ai_insights": ai_insights,
            "recommendation": "proceed" if complexity_analysis["overall_complexity"] < 7 else "caution"
        }
        
    except Exception as e:
        print(f"Error in project analysis: {e}")
        return {
            "error": "Unable to analyze project",
            "recommendation": "manual_review"
        }

@app.post("/api/quick-advice")
async def quick_advice(request: QuickAdviceRequest):
    """Get quick advice for common scenarios"""
    
    try:
        if groq_client and groq_api_key:
            try:
                advice = await groq_client.get_quick_advice(request.question_type)
                return {"advice": advice}
            except Exception as ai_error:
                print(f"AI advice error: {ai_error}")
        
        # Fallback advice
        advice_map = {
            "prioritization": "Focus on high-paying projects with reasonable deadlines. Consider your current workload and expertise level.",
            "estimation": "Break projects into smaller tasks, add 25% buffer time, and track your actual time to improve future estimates.",
            "communication": "Set clear expectations, provide regular updates, and document all changes in writing.",
            "scope_creep": "Define project scope clearly upfront and charge extra for additional requests outside the original agreement.",
            "deadlines": "Negotiate realistic timelines, break work into milestones, and communicate early if issues arise.",
            "pricing": "Research market rates, consider project complexity, and don't undervalue your expertise."
        }
        
        advice = advice_map.get(request.question_type, "Focus on clear communication and realistic project planning.")
        
        return {"advice": advice}
        
    except Exception as e:
        print(f"Error in quick advice: {e}")
        return {"advice": "Unable to provide advice at this time."}

@app.post("/api/email/test")
async def test_email(request: EmailTestRequest):
    """Test email sending functionality"""
    
    try:
        if email_service:
            result = await email_service.send_test_email(request.user_email, request.user_name)
            return result
        else:
            return {
                "success": True,
                "message": f"Email service simulation: Test email would be sent to {request.user_email}",
                "note": "Email service not configured - this is a simulation"
            }
        
    except Exception as e:
        print(f"Error in email test: {e}")
        return {
            "success": False,
            "error": str(e)
        }

@app.post("/api/email/project-update")
async def send_project_update(request: ProjectUpdateRequest):
    """Send project status update email"""
    
    try:
        if notification_scheduler:
            result = await notification_scheduler.send_project_status_update(
                request.project_id,
                request.old_status,
                request.new_status,
                request.update_message
            )
            return result
        else:
            return {
                "success": True,
                "message": "Project update notification logged",
                "note": "Notification service not configured - this is a simulation"
            }
        
    except Exception as e:
        print(f"Error in project update: {e}")
        return {
            "success": False,
            "error": str(e)
        }

@app.post("/api/email/welcome")
async def send_welcome_email(request: WelcomeEmailRequest):
    """Send welcome email to new user"""
    
    try:
        if notification_scheduler:
            result = await notification_scheduler.send_welcome_email_to_user(
                "",  # user_id not needed for welcome email
                request.user_email,
                request.user_name
            )
            return result
        else:
            return {
                "success": True,
                "message": f"Welcome email would be sent to {request.user_email}",
                "note": "Email service not configured - this is a simulation"
            }
        
    except Exception as e:
        print(f"Error in welcome email: {e}")
        return {
            "success": False,
            "error": str(e)
        }

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "AI Project Advisor",
        "groq_available": bool(groq_api_key),
        "supabase_available": bool(supabase_url and supabase_key),
        "email_service_available": email_service is not None,
        "notification_service_available": notification_scheduler is not None
    }

# Export app for Vercel
handler = Mangum(app) 