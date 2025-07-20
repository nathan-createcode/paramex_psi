from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import uvicorn

from scoring_logic import project_scorer
from ux_safety_check import ux_safety_checker
from supabase_email_service import SupabaseEmailService, EmailData
from notification_scheduler import NotificationScheduler
import os
from supabase import create_client, Client
from dotenv import load_dotenv
from datetime import datetime
import pytz
from groq_client import GroqLlamaClient

# Load environment variables from parent directory (psi_paramex/.env)
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent.parent))

# Try multiple locations for .env file
env_paths = [
    "../../.env",  # Original path
    "../../../.env",  # One level up
    ".env",  # Current directory
]

env_loaded = False
for env_path in env_paths:
    if Path(env_path).exists():
        load_dotenv(dotenv_path=env_path)
        print(f"✅ Environment variables loaded from: {env_path}")
        env_loaded = True
        break

if not env_loaded:
    print("⚠️ Warning: .env file not found in any expected location")
    print("   Please make sure .env file exists with required variables:")
    print("   - GROQ_API_KEY")
    print("   - VITE_SUPABASE_URL")
    print("   - VITE_SUPABASE_ANON_KEY")

# Initialize FastAPI app
app = FastAPI(title="ParameX PSI - AI Project Advisor API", version="1.0.0")

# Initialize Supabase client
supabase_url = os.getenv("VITE_SUPABASE_URL")
supabase_key = os.getenv("VITE_SUPABASE_ANON_KEY")
groq_api_key = os.getenv("GROQ_API_KEY")

print(f"🔍 Environment variables status:")
print(f"   GROQ_API_KEY: {'✅ Set' if groq_api_key else '❌ Missing'}")
print(f"   VITE_SUPABASE_URL: {'✅ Set' if supabase_url else '❌ Missing'}")
print(f"   VITE_SUPABASE_ANON_KEY: {'✅ Set' if supabase_key else '❌ Missing'}")

supabase: Client = None
notification_scheduler = None
email_service = None

try:
    if supabase_url and supabase_key:
        supabase = create_client(supabase_url, supabase_key)
        print("✅ Supabase client initialized successfully")
        
        # Test database connection
        try:
            test_response = supabase.table("projects").select("count", count="exact").limit(1).execute()
            print(f"✅ Database connection test successful")
        except Exception as db_error:
            print(f"⚠️ Database connection test failed: {db_error}")
        
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

# Initialize optimized Groq client with balanced performance
groq_client = None
try:
    if groq_api_key:
        groq_client = GroqLlamaClient(performance_mode="balanced")  # Better for project context analysis
        print("✅ Groq AI client initialized successfully")
    else:
        print("❌ GROQ_API_KEY missing - AI features will be disabled")
except Exception as e:
    print(f"⚠️ Warning: Could not initialize Groq client: {e}")
    print("AI features will be disabled")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://127.0.0.1:5173",  # Vite dev server
        "https://paramex-psi.vercel.app",  # Production Vercel deployment
        "https://paramex-psi.vercel.app/",  # With trailing slash
        "*",  # Allow all origins for deployment flexibility
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Pydantic models for request/response
class ChatMessage(BaseModel):
    type: str
    content: str
    timestamp: Optional[str] = None

class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[ChatMessage]] = []
    user_id: Optional[str] = None  # Add user_id to get project context

class ChatResponse(BaseModel):
    response: str
    status: str = "success"

class ProjectAnalysisRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    timeline: Optional[str] = None
    budget: Optional[str] = None
    client_type: Optional[str] = None
    complexity: Optional[str] = None

class QuickAdviceRequest(BaseModel):
    question_type: str

# Email-related models
class EmailTestRequest(BaseModel):
    user_email: str
    user_name: Optional[str] = "User"

class ProjectUpdateRequest(BaseModel):
    project_id: str
    old_status: str
    new_status: str
    update_message: Optional[str] = ""

class WelcomeEmailRequest(BaseModel):
    user_email: str
    user_name: Optional[str] = "New User"

# Health check endpoint
@app.get("/")
async def root():
    return {"message": "ParameX PSI AI Project Advisor API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "AI Project Advisor API"}

# New endpoint to get user projects for AI context
@app.get("/api/user-projects/{user_id}")
async def get_user_projects(user_id: str):
    """
    Get user projects for AI context
    """
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Database connection not configured")
        
        # Get projects with related data
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
        ).eq("user_id", user_id).order("created_at", desc=True).execute()
        
        if response.data:
            # Format projects for AI context
            formatted_projects = []
            for project in response.data:
                formatted_projects.append({
                    "id": project["project_id"],
                    "name": project["project_name"],
                    "client": project["client_name"],
                    "start_date": project["start_date"],
                    "deadline": project["deadline"],
                    "payment": project["payment_amount"],
                    "difficulty": project["difficulty_level"],
                    "type": project["type_id"]["type_name"] if project["type_id"] else "Unknown",
                    "status": project["status_id"]["status_name"] if project["status_id"] else "Unknown"
                })
            
            return {"projects": formatted_projects, "status": "success"}
        else:
            return {"projects": [], "status": "success"}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch projects: {str(e)}")

# Chat endpoint for project advice
@app.post("/api/chat", response_model=ChatResponse)
async def chat_with_advisor(request: ChatRequest):
    """
    Chat with AI Project Advisor using Meta Llama model with safety checks and project context
    """
    try:
        if not request.message.strip():
            raise HTTPException(status_code=400, detail="Message cannot be empty")
        
        # Safety check for user input
        safety_check = ux_safety_checker.check_user_input(request.message)
        if not safety_check['is_safe']:
            return ChatResponse(
                response=f"I understand you're looking for help, but I can only assist with project management topics. {safety_check['suggestion']}"
            )
        
        # Get current date and time for real-time context
        jakarta_tz = pytz.timezone('Asia/Jakarta')
        current_datetime = datetime.now(jakarta_tz)
        current_date_context = f"\n\nCurrent Date & Time: {current_datetime.strftime('%A, %B %d, %Y at %I:%M %p')} (Jakarta Time)\n"
        
        # Enhanced project context with better keyword detection
        project_context = ""
        project_keywords = [
            "project", "deadline", "workload", "client", "status", "timeline", 
            "progress", "task", "work", "busy", "schedule", "priority", "urgent",
            "review", "current", "ongoing", "active", "completed", "finished",
            "saya", "ku", "my", "what", "how", "when", "which", "where",
            "bagaimana", "apa", "kapan", "mana", "siapa", "berapa"
        ]
        
        # Check if user is asking about projects (more flexible detection)
        should_fetch_projects = (
            request.user_id and supabase and 
            (any(keyword in request.message.lower() for keyword in project_keywords) or
             len(request.message.split()) <= 5 or  # Short questions often about status
             "?" in request.message or  # Questions often need project context
             len(request.message) < 50)  # Short messages often need context
        )
        
        if should_fetch_projects:
            matched_keywords = [kw for kw in project_keywords if kw in request.message.lower()]
            print(f"🔍 Project context triggered - Keywords: {matched_keywords if matched_keywords else 'short question/question mark'}")
            
            try:
                print(f"🔍 Getting project context for user: {request.user_id}")
                projects_response = await get_user_projects(request.user_id)
                
                if projects_response.get("projects") and len(projects_response["projects"]) > 0:
                    projects = projects_response["projects"]
                    print(f"📊 Found {len(projects)} projects for user")
                    
                    # Enhanced context with key project details - FIXED STATUS LOGIC
                    active_projects = [p for p in projects if p['status'] != 'Done']  # Only exclude "Done" projects
                    urgent_projects = []
                    overdue_projects = []
                    
                    print(f"🔍 Active projects: {len(active_projects)} (excluding Done status)")
                    print(f"🔍 Project statuses: {[p['status'] for p in projects]}")
                    
                    # Calculate urgency and overdue status - ONLY FOR ACTIVE PROJECTS
                    for project in active_projects:
                        try:
                            if project['deadline']:
                                deadline_date = datetime.strptime(project['deadline'], '%Y-%m-%d')
                                days_until = (deadline_date - current_datetime.replace(tzinfo=None)).days
                                
                                if days_until < 0:
                                    overdue_projects.append(project['name'])
                                    print(f"📍 Overdue project: {project['name']} (deadline: {project['deadline']}, days past: {abs(days_until)})")
                                elif days_until <= 7:
                                    urgent_projects.append(project['name'])
                                    print(f"⚠️ Urgent project: {project['name']} (deadline: {project['deadline']}, days left: {days_until})")
                        except Exception as e:
                            print(f"⚠️ Date parsing error for project {project['name']}: {e}")
                            pass
                    
                    # Build informative context
                    context_parts = [
                        f"User has {len(projects)} total projects, {len(active_projects)} active"
                    ]
                    
                    if urgent_projects:
                        context_parts.append(f"Urgent (≤7 days): {', '.join(urgent_projects[:3])}")
                    
                    if overdue_projects:
                        context_parts.append(f"Overdue: {', '.join(overdue_projects[:3])}")
                    
                    # Add project types if diverse
                    project_types = list(set([p['type'] for p in projects if p['type'] != 'Unknown']))
                    if len(project_types) > 1:
                        context_parts.append(f"Types: {', '.join(project_types[:3])}")
                    
                    project_context = ". ".join(context_parts) + "."
                    print(f"✅ Project context built: {project_context}")
                    
                else:
                    project_context = "User has no projects in the system yet."
                    print(f"📭 No projects found for user")
                    
            except Exception as e:
                print(f"❌ Failed to get project context: {str(e)}")
                project_context = ""
        else:
            print(f"⏭️ Skipping project context - No relevant keywords or conditions met")
            print(f"   Message: '{request.message}'")
            print(f"   User ID: {request.user_id}")
            print(f"   Supabase: {supabase is not None}")
        
        # Convert conversation history to the format expected by groq_client
        history = []
        if request.conversation_history:
            for msg in request.conversation_history:
                history.append({
                    "type": msg.type,
                    "content": msg.content
                })
        
        # Enhanced message with better context
        enhanced_message = f"{request.message}"
        
        # ALWAYS include current time context for better AI responses
        current_time_info = f"\n\n[CURRENT TIME CONTEXT: {current_datetime.strftime('%A, %B %d, %Y at %I:%M %p')} Jakarta time (GMT+7)]"
        enhanced_message += current_time_info
        
        # Include project context if available and relevant
        if project_context.strip():
            enhanced_message += f"\n\n[Project Status: {project_context.strip()}]"
            
        # ALWAYS include full project data if available for better AI understanding
        if should_fetch_projects:
            try:
                projects_response = await get_user_projects(request.user_id)
                if projects_response.get("projects") and len(projects_response["projects"]) > 0:
                    projects = projects_response["projects"]
                    
                    # Add detailed project information to the message
                    project_details = "\n\n[USER'S PROJECT DATA]:\n"
                    for i, project in enumerate(projects[:10], 1):  # Limit to 10 projects
                        project_details += f"{i}. {project['name']} - {project['client']}\n"
                        project_details += f"   Status: {project['status']}, Deadline: {project['deadline']}\n"
                        project_details += f"   Payment: ${project['payment']:,}, Type: {project['type']}\n"
                        project_details += f"   Difficulty: {project['difficulty']}\n\n"
                    
                    enhanced_message += project_details
                    print(f"✅ Added detailed project data to AI prompt ({len(projects)} projects)")
                else:
                    enhanced_message += "\n\n[USER'S PROJECT DATA]: No projects found in database."
                    print(f"📭 No projects found for user context")
            except Exception as e:
                print(f"❌ Failed to get detailed project data: {str(e)}")
                enhanced_message += f"\n\n[PROJECT DATA ERROR]: Could not retrieve project details from database."
        
        print(f"🤖 Sending message to AI: {request.message[:100]}...")
        print(f"🔍 Enhanced message length: {len(enhanced_message)} characters")
        
        # Debug: Show what's being sent to AI
        if "[USER'S PROJECT DATA]" in enhanced_message:
            print(f"✅ Project data included in AI prompt")
        else:
            print(f"❌ No project data in AI prompt")
            
        # Check if Groq client is available
        if not groq_client:
            return ChatResponse(
                response="I apologize, but the AI service is currently unavailable. Please make sure the GROQ_API_KEY is configured correctly and the backend server is running properly."
            )
        
        # Get AI response from Groq with enhanced project context
        ai_response = await groq_client.get_project_advice(
            user_message=enhanced_message,
            conversation_history=history
        )
        
        # Safety check for AI response
        response_safety = ux_safety_checker.check_ai_response(ai_response)
        if not response_safety['is_safe']:
            ai_response = "I apologize, but I need to provide a more appropriate response. Let me help you with your project management question in a different way. Could you please rephrase your question focusing on specific project challenges you're facing?"
        
        print(f"✅ AI response generated successfully")
        return ChatResponse(response=ai_response)
        
    except Exception as e:
        print(f"❌ Error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get AI response: {str(e)}")

# Project analysis endpoint
@app.post("/api/analyze-project")
async def analyze_project(request: ProjectAnalysisRequest):
    """
    Analyze project data and get AI insights with scoring
    """
    try:
        project_data = request.dict()
        
        # Get complexity analysis
        complexity_analysis = project_scorer.analyze_project_complexity(project_data)
        
        # Get risk assessment
        risk_assessment = project_scorer.assess_project_risks(project_data)
        
        # Get pricing recommendations
        pricing_recommendations = project_scorer.generate_pricing_recommendation(
            project_data, complexity_analysis['overall_complexity']
        )
        
        # Get AI analysis from Groq
        ai_analysis = await groq_client.get_project_insights(project_data)
        
        # Combine all analyses
        comprehensive_analysis = {
            "ai_insights": ai_analysis,
            "complexity_analysis": complexity_analysis,
            "risk_assessment": risk_assessment,
            "pricing_recommendations": pricing_recommendations,
            "summary": {
                "complexity_level": complexity_analysis['complexity_level'],
                "risk_level": risk_assessment['risk_level'],
                "recommended_rate": pricing_recommendations['hourly_rate_recommendation'],
                "estimated_total": pricing_recommendations['total_project_estimate']
            }
        }
        
        return {"analysis": comprehensive_analysis, "status": "success"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze project: {str(e)}")

# Quick advice endpoint
@app.post("/api/quick-advice")
async def get_quick_advice(request: QuickAdviceRequest):
    """
    Get quick advice for common project management scenarios
    """
    try:
        advice = await groq_client.get_quick_advice(request.question_type)
        
        return {"advice": advice, "status": "success"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get quick advice: {str(e)}")

# Endpoint to get available quick question types
@app.get("/api/quick-questions")
async def get_quick_questions():
    """
    Get list of available quick question types
    """
    questions = {
        "prioritization": "How do I prioritize multiple urgent projects?",
        "estimation": "What's the best way to estimate project timelines?",
        "communication": "How can I improve client communication?",
        "scope_creep": "Tips for managing project scope creep?",
        "deadlines": "How to handle difficult project deadlines?",
        "pricing": "Best practices for freelance project pricing?"
    }
    
    return {"questions": questions, "status": "success"}

# Email endpoints
@app.post("/api/email/test")
async def send_test_email(request: EmailTestRequest):
    """
    Send a test email to verify email functionality
    """
    try:
        if not email_service or not email_service.enabled:
            raise HTTPException(status_code=503, detail="Email service not configured. Please check Supabase connection.")
        
        result = await email_service.send_test_email(
            to_email=request.user_email,
            user_name=request.user_name
        )
        
        if result["success"]:
            return {"message": "Test email sent successfully", "status": "success", "email_id": result.get("message_id")}
        else:
            raise HTTPException(status_code=500, detail=f"Failed to send test email: {result.get('error')}")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send test email: {str(e)}")

@app.post("/api/email/project-update")
async def send_project_update_email(request: ProjectUpdateRequest):
    """
    Send project status update email notification
    """
    try:
        if not email_service or not email_service.enabled:
            raise HTTPException(status_code=503, detail="Supabase email service not configured")
        
        if not notification_scheduler:
            raise HTTPException(status_code=503, detail="Notification scheduler not available")
        
        result = await notification_scheduler.send_project_status_update(
            project_id=request.project_id,
            old_status=request.old_status,
            new_status=request.new_status,
            update_message=request.update_message
        )
        
        if result["success"]:
            return {"message": "Project update email sent successfully", "status": "success", "email_id": result.get("message_id")}
        else:
            raise HTTPException(status_code=500, detail=f"Failed to send project update email: {result.get('error')}")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send project update email: {str(e)}")

@app.post("/api/email/welcome")
async def send_welcome_email(request: WelcomeEmailRequest):
    """
    Send welcome email to new users
    """
    try:
        if not email_service or not email_service.enabled:
            raise HTTPException(status_code=503, detail="Supabase email service not configured")
        
        if not notification_scheduler:
            raise HTTPException(status_code=503, detail="Notification scheduler not available")
        
        result = await notification_scheduler.send_welcome_email_to_user(
            user_id="",  # User ID not required for welcome email
            user_email=request.user_email,
            user_name=request.user_name
        )
        
        if result["success"]:
            return {"message": "Welcome email sent successfully", "status": "success", "email_id": result.get("message_id")}
        else:
            raise HTTPException(status_code=500, detail=f"Failed to send welcome email: {result.get('error')}")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send welcome email: {str(e)}")

@app.get("/api/email/status")
async def get_email_service_status():
    """
    Get email service status and configuration
    """
    try:
        status = {
            "email_service_enabled": email_service.enabled if email_service else False,
            "email_service_type": "Supabase Integration",
            "notification_scheduler_available": notification_scheduler is not None,
            "supabase_connected": supabase is not None,
            "from_email": email_service.from_email if email_service and email_service.enabled else "Not configured",
            "app_url": email_service.app_url if email_service and email_service.enabled else "Not configured"
        }
        
        return {"status": status, "message": "Supabase email service status retrieved successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get email service status: {str(e)}")

@app.post("/api/project-analysis")
async def analyze_project_decision(request: dict):
    """
    Analyze user's project history and provide AI-powered decision on taking new projects
    """
    try:
        user_id = request.get('user_id')
        project_history = request.get('project_history', {})
        completion_rate = request.get('completion_rate', 0)
        current_workload = request.get('current_workload', 0)
        
        # Build context for AI analysis
        context = f"""
        You are an AI business advisor helping a freelancer decide whether to take on a new project.
        
        FREELANCER PROFILE:
        - Total Projects: {project_history.get('totalProjects', 0)}
        - Completed Projects: {len(project_history.get('completedProjects', []))}
        - Current Active Projects: {current_workload}
        - Completion Rate: {completion_rate:.1f}%
        - Average Payment: ${project_history.get('averagePayment', 0):,.2f}
        - Project Types: {', '.join(project_history.get('projectTypes', []))}
        
        ANALYSIS REQUESTED:
        Provide a decision on whether this freelancer should take on a new project right now.
        
        Consider:
        1. Current workload capacity (5+ projects = overloaded)
        2. Completion rate (below 70% is concerning)
        3. Project performance history
        4. Financial stability and growth potential
        5. Risk of overcommitment vs opportunity cost
        
        DECISION OPTIONS:
        - "proceed" - Strong recommendation to take the project
        - "caution" - Proceed but with careful consideration
        - "defer" - Should not take the project now
        
        Provide:
        1. Decision (proceed/caution/defer)
        2. Confidence level (0-100%)
        3. Clear reasoning
        4. Timeline recommendation
        5. 3-4 key insights
        
        Be decisive and practical. Focus on business success and client satisfaction.
        Do not provide pricing suggestions.
        """
        
        # Use Groq for intelligent analysis
        try:
            response = groq_client.client.chat.completions.create(
                model="meta-llama/llama-4-scout-17b-16e-instruct",
                messages=[
                    {"role": "system", "content": "You are a senior business advisor with expertise in freelance project management and business development. Provide structured, actionable advice."},
                    {"role": "user", "content": context}
                ],
                temperature=0.3,
                max_tokens=1000
            )
            
            ai_response = response.choices[0].message.content
            
            # Parse AI response to extract structured data
            decision_data = parse_ai_decision(ai_response, project_history, completion_rate, current_workload)
            
            return {
                "success": True,
                "decision": decision_data,
                "ai_response": ai_response
            }
            
        except Exception as groq_error:
            print(f"Groq API error: {groq_error}")
            # Fallback to local analysis
            decision_data = generate_fallback_decision(project_history, completion_rate, current_workload)
            return {
                "success": True,
                "decision": decision_data,
                "source": "fallback"
            }
            
    except Exception as e:
        print(f"Error in project analysis: {e}")
        return {
            "success": False,
            "error": str(e)
        }

def parse_ai_decision(ai_response: str, project_history: dict, completion_rate: float, current_workload: int):
    """
    Parse AI response and structure the decision data
    """
    # Extract decision keywords from AI response
    ai_lower = ai_response.lower()
    
    if "proceed" in ai_lower and "caution" not in ai_lower:
        decision = "proceed"
        confidence = 85
    elif "caution" in ai_lower:
        decision = "caution"
        confidence = 70
    elif "defer" in ai_lower:
        decision = "defer"
        confidence = 90
    else:
        decision = "proceed"
        confidence = 80
    
    # Extract confidence if mentioned
    import re
    confidence_match = re.search(r'(\d+)%', ai_response)
    if confidence_match:
        confidence = int(confidence_match.group(1))
    
    # Calculate timeline
    completed_projects = project_history.get('completedProjects', [])
    if completed_projects:
        # This would need actual timeline calculation from project data
        timeline = 30  # Default for now
    else:
        timeline = 30
    
    return {
        "decision": {
            "recommendation": decision,
            "confidence": confidence,
            "reasoning": ai_response[:200] + "..." if len(ai_response) > 200 else ai_response
        },
        "timeline": {
            "suggested": timeline,
            "reasoning": f"Recommended based on performance analysis"
        },
        "workload": {
            "currentLoad": current_workload,
            "recommendation": f"Current workload: {current_workload} projects",
            "status": "high" if current_workload >= 5 else "moderate" if current_workload >= 3 else "low"
        },
        "insights": extract_insights_from_ai_response(ai_response, project_history, completion_rate)
    }

def generate_fallback_decision(project_history: dict, completion_rate: float, current_workload: int):
    """
    Generate decision when AI service is unavailable
    """
    avg_payment = project_history.get('averagePayment', 1500)
    
    if current_workload >= 5:
        decision = "defer"
        confidence = 90
        reasoning = "Workload at capacity - focus on completing current projects first"
    elif completion_rate < 70 and project_history.get('totalProjects', 0) > 3:
        decision = "caution"
        confidence = 75
        reasoning = f"Completion rate of {completion_rate:.1f}% needs improvement"
    else:
        decision = "proceed"
        confidence = 85
        reasoning = "Good capacity and performance metrics"
    
    return {
        "decision": {
            "recommendation": decision,
            "confidence": confidence,
            "reasoning": reasoning
        },
        "timeline": {
            "suggested": 30,
            "reasoning": "Standard timeline recommendation"
        },
        "workload": {
            "currentLoad": current_workload,
            "recommendation": f"Current workload: {current_workload} projects",
            "status": "high" if current_workload >= 5 else "moderate" if current_workload >= 3 else "low"
        },
        "insights": [
            f"Portfolio: {project_history.get('totalProjects', 0)} projects, {completion_rate:.1f}% completion rate",
            f"Performance: {len(project_history.get('completedProjects', []))} completed projects",
            f"Capacity: {5 - current_workload} slots available",
            f"Recommendation: {decision.upper()}"
        ]
    }

def extract_insights_from_ai_response(ai_response: str, project_history: dict, completion_rate: float):
    """
    Extract key insights from AI response
    """
    # Simple extraction - in practice, you'd use more sophisticated NLP
    insights = []
    
    lines = ai_response.split('\n')
    for line in lines:
        if any(keyword in line.lower() for keyword in ['insight', 'key', 'important', 'recommend', 'suggest']):
            clean_line = line.strip('- *').strip()
            if clean_line and len(clean_line) > 10:
                insights.append(clean_line)
    
    # Fallback insights
    if not insights:
        insights = [
            f"Portfolio analysis: {project_history.get('totalProjects', 0)} projects tracked",
            f"Performance: {completion_rate:.1f}% completion rate",
            f"Current capacity: {5 - project_history.get('currentWorkload', 0)} project slots available",
            "AI recommends data-driven project decisions"
        ]
    
    return insights[:4]  # Return max 4 insights

@app.post("/api/dashboard-summary")
async def generate_dashboard_summary(request: dict):
    """
    Generate simple AI summary of dashboard data
    """
    try:
        user_id = request.get('user_id')
        data = request.get('dashboard_data', {})
        
        # Build context for simple summary
        context = f"""
        Please provide a simple, natural summary of this freelancer's dashboard data in 2-3 sentences.
        
        DASHBOARD DATA:
        - Total Projects: {data.get('totalProjects', 0)}
        - Completed Projects: {data.get('completedProjects', 0)}
        - Ongoing Projects: {data.get('ongoingProjects', 0)}
        - Completion Rate: {data.get('completionRate', 0):.1f}%
        - Total Earnings: ${data.get('totalEarnings', 0):,.2f}
        - This Month's Earnings: ${data.get('monthlyEarnings', 0):,.2f} (based on project completion dates)
        - Most Common Project Type: {data.get('mostCommonType', 'None')}
        
        Write a friendly, conversational summary that explains what these numbers mean in simple terms.
        Don't give business advice or recommendations - just summarize the current state.
        """
        
        # Use Groq for intelligent summary
        try:
            response = groq_client.client.chat.completions.create(
                model="meta-llama/llama-4-scout-17b-16e-instruct",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that explains data in simple, friendly language. Keep responses concise and conversational."},
                    {"role": "user", "content": context}
                ],
                temperature=0.3,
                max_tokens=200
            )
            
            ai_summary = response.choices[0].message.content.strip()
            
            return {
                "success": True,
                "summary": ai_summary
            }
            
        except Exception as groq_error:
            print(f"Groq API error: {groq_error}")
            # Fallback to local summary
            local_summary = generate_simple_fallback(data)
            return {
                "success": True,
                "summary": local_summary,
                "source": "fallback"
            }
            
    except Exception as e:
        print(f"Error in dashboard summary: {e}")
        return {
            "success": False,
            "error": str(e)
        }

def generate_simple_fallback(data):
    """
    Generate simple fallback summary when AI service is unavailable
    """
    total = data.get('totalProjects', 0)
    completed = data.get('completedProjects', 0)
    ongoing = data.get('ongoingProjects', 0)
    completion_rate = data.get('completionRate', 0)
    total_earnings = data.get('totalEarnings', 0)
    monthly_earnings = data.get('monthlyEarnings', 0)
    most_common = data.get('mostCommonType', 'None')
    
    summary = f"You currently have {total} projects in your portfolio"
    
    if completed > 0:
        summary += f", with {completed} completed successfully ({completion_rate:.1f}% completion rate)"
    
    if ongoing > 0:
        summary += f" and {ongoing} currently active"
    
    summary += ". "
    
    if total_earnings > 0:
        summary += f"Your total earnings are ${total_earnings:,.0f}"
        if monthly_earnings > 0:
            summary += f", including ${monthly_earnings:,.0f} earned this month"
        summary += ". "
    
    if most_common and most_common != 'None':
        summary += f"Most of your work focuses on {most_common} projects. "
    
    summary += "This gives you a clear picture of your current freelance status."
    
    return summary

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
