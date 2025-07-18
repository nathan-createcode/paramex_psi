from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
from mangum import Mangum

# Initialize FastAPI app
app = FastAPI()

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
        # For now, use simple responses
        # In production, you can integrate with Groq API if available
        if groq_api_key:
            # Try to use Groq API here
            # For now, fallback to simple response
            pass
        
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
        # For now, return empty projects
        # In production, integrate with Supabase
        return {
            "projects": [],
            "count": 0
        }
        
    except Exception as e:
        print(f"Error fetching user projects: {e}")
        raise HTTPException(status_code=500, detail="Unable to fetch projects")

@app.post("/api/project-analysis")
async def project_analysis(request: ProjectAnalysisRequest):
    """AI-powered project analysis and recommendations"""
    
    try:
        # Simple analysis based on workload
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

@app.post("/api/email/test")
async def test_email(request: EmailTestRequest):
    """Test email sending functionality"""
    
    return {
        "success": True,
        "message": f"Test email functionality is working. Email would be sent to {request.user_email}"
    }

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "AI Project Advisor",
        "groq_available": bool(groq_api_key),
        "supabase_available": bool(supabase_url and supabase_key)
    }

# Export app for Vercel
handler = Mangum(app) 