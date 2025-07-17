from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import uvicorn
from groq_client import groq_client
from scoring_logic import project_scorer
from ux_safety_check import ux_safety_checker
from supabase_email_service import SupabaseEmailService, EmailData
from notification_scheduler import NotificationScheduler
import os
from supabase import create_client, Client
from dotenv import load_dotenv
from datetime import datetime
import pytz

# Load environment variables from parent directory (psi_paramex/.env)
load_dotenv(dotenv_path="../../.env")

# Initialize FastAPI app
app = FastAPI(title="ParameX PSI - AI Project Advisor API", version="1.0.0")

# Initialize Supabase client
supabase_url = os.getenv("VITE_SUPABASE_URL")
supabase_key = os.getenv("VITE_SUPABASE_ANON_KEY")
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
except Exception as e:
    print(f"⚠️ Warning: Could not initialize Supabase client: {e}")
    print("Project context features will be disabled")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
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
        
        # Get user projects for context if user_id is provided
        project_context = ""
        project_summary = ""
        if request.user_id and supabase:
            try:
                print(f"🔍 Getting projects for user: {request.user_id}")
                print(f"🔗 Supabase connection status: {supabase is not None}")
                
                projects_response = await get_user_projects(request.user_id)
                print(f"📈 Projects response: {projects_response}")
                
                if projects_response.get("projects") and len(projects_response["projects"]) > 0:
                    print(f"📊 Found {len(projects_response['projects'])} projects for user")
                    project_context = "Your Current Projects:\n"
                    active_projects = 0
                    overdue_projects = 0
                    urgent_projects = 0
                    
                    for project in projects_response["projects"]:
                        # Calculate days until deadline
                        try:
                            deadline_date = datetime.strptime(project['deadline'], '%Y-%m-%d')
                            days_until_deadline = (deadline_date - current_datetime.replace(tzinfo=None)).days
                            deadline_info = f"Deadline: {project['deadline']}"
                            
                            if days_until_deadline >= 0:
                                deadline_info += f" ({days_until_deadline} days remaining)"
                                if days_until_deadline <= 7:
                                    urgent_projects += 1
                                    deadline_info += " ⚠️ URGENT"
                            else:
                                deadline_info += f" ({abs(days_until_deadline)} days overdue) ❌ OVERDUE"
                                overdue_projects += 1
                            
                            if project['status'].lower() not in ['completed', 'cancelled']:
                                active_projects += 1
                                
                        except Exception as date_error:
                            print(f"⚠️ Date parsing error for project {project.get('name', 'Unknown')}: {date_error}")
                            deadline_info = f"Deadline: {project['deadline']}"
                        
                        # Add start date info
                        start_date_info = f"Start: {project['start_date']}" if project['start_date'] else "Start: Not specified"
                        
                        # Format project info with more detail
                        project_context += f"- {project['name']} (Client: {project['client']}, Status: {project['status']}, Type: {project['type']}, Difficulty: {project['difficulty']}/5, Payment: ${project['payment']}, {start_date_info}, {deadline_info})\n"
                    
                    # Add project summary for AI
                    project_summary = f"Project Summary: You have {len(projects_response['projects'])} total projects, {active_projects} active, {urgent_projects} urgent (deadline ≤7 days), {overdue_projects} overdue."
                    
                    if urgent_projects > 0:
                        project_summary += f" ⚠️ You have {urgent_projects} urgent project(s) that need immediate attention!"
                    if overdue_projects > 0:
                        project_summary += f" ❌ You have {overdue_projects} overdue project(s) that need urgent action!"
                        
                else:
                    print("📭 No projects found for user - response was empty or no projects")
                    project_context = "You don't have any projects in the system yet. I can help you plan new projects or discuss general project management strategies."
                    
            except Exception as e:
                print(f"❌ Failed to get project context - Full error: {str(e)}")
                print(f"❌ Error type: {type(e).__name__}")
                import traceback
                print(f"❌ Full traceback: {traceback.format_exc()}")
                project_context = "I'm having trouble accessing your project data right now, but I can still help with general project management advice."
        elif not request.user_id:
            print("⚠️ No user_id provided in request")
            project_context = "No user ID provided - please make sure you're logged in to access your project data."
        elif not supabase:
            print("⚠️ No supabase connection available") 
            project_context = "Database connection not available - project data cannot be accessed."
        
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
        
        # Always add current time context for AI awareness (but subtle)
        enhanced_message += f"\n\n[Context: Current time is {current_datetime.strftime('%A, %B %d, %Y at %I:%M %p')} Jakarta time]"
        
        # Always include project context if available (AI will decide when to use it)
        if project_context.strip() and request.user_id:
            enhanced_message += f"\n\n[Project Database Access: {project_summary.strip()}]"
            enhanced_message += f"\n[Your Projects: {project_context.strip()}]"
        
        print(f"🤖 Sending message to AI: {request.message[:100]}...")
        
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

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
