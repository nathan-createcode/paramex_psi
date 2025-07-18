from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
from supabase import create_client, Client
from dotenv import load_dotenv
from datetime import datetime
import pytz
import sys
from pathlib import Path

# Add backend directory to path for imports
sys.path.append(str(Path(__file__).parent.parent / "backend" / "groq_api"))

from groq_client import GroqLlamaClient

# Load environment variables
load_dotenv()

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

# Initialize services
supabase_url = os.getenv("VITE_SUPABASE_URL")
supabase_key = os.getenv("VITE_SUPABASE_ANON_KEY")
groq_api_key = os.getenv("GROQ_API_KEY")

supabase: Client = None
groq_client = None

if supabase_url and supabase_key:
    supabase = create_client(supabase_url, supabase_key)

if groq_api_key:
    groq_client = GroqLlamaClient(performance_mode="balanced")

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

# API Routes
@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """AI Chat endpoint for project advisor"""
    
    if not groq_client:
        raise HTTPException(status_code=500, detail="AI service not available")
    
    try:
        # Get user project context if user_id provided
        user_context = ""
        if request.user_id and supabase:
            try:
                projects_response = supabase.table("projects").select("*").eq("user_id", request.user_id).execute()
                if projects_response.data:
                    user_context = f"User has {len(projects_response.data)} projects: " + \
                                 ", ".join([p.get("title", "Untitled") for p in projects_response.data[:3]])
            except Exception as e:
                print(f"Could not fetch user context: {e}")
        
        # Build conversation context
        conversation_context = ""
        if request.conversation_history:
            for msg in request.conversation_history[-5:]:  # Last 5 messages
                conversation_context += f"{msg.type}: {msg.content}\n"
        
        # Generate AI response
        system_prompt = f"""
        You are an expert freelance project advisor. Help users with project management, 
        pricing, workflow optimization, and business advice.
        
        User Context: {user_context}
        Recent Conversation: {conversation_context}
        
        Provide practical, actionable advice. Be friendly and professional.
        """
        
        response = groq_client.generate_response(
            prompt=request.message,
            system_prompt=system_prompt,
            max_tokens=1000,
            temperature=0.7
        )
        
        return ChatResponse(response=response, status="success")
        
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/user-projects/{user_id}")
async def get_user_projects(user_id: str):
    """Get user projects for AI context"""
    
    if not supabase:
        raise HTTPException(status_code=500, detail="Database service not available")
    
    try:
        projects_response = supabase.table("projects").select("*").eq("user_id", user_id).execute()
        
        return {
            "projects": projects_response.data or [],
            "count": len(projects_response.data) if projects_response.data else 0
        }
        
    except Exception as e:
        print(f"Error fetching user projects: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/project-analysis")
async def project_analysis(request: ProjectAnalysisRequest):
    """AI-powered project analysis and recommendations"""
    
    if not groq_client:
        # Return a simple local analysis
        return {
            "decision": {
                "recommendation": "proceed" if request.current_workload < 3 else "defer",
                "confidence": 75,
                "reasoning": "Based on current workload and project history analysis"
            }
        }
    
    try:
        # Generate AI analysis
        analysis_prompt = f"""
        Analyze this freelancer's situation for a new project decision:
        
        Project History: {request.project_history}
        Completion Rate: {request.completion_rate}%
        Current Workload: {request.current_workload} projects
        
        Provide a recommendation with confidence level and reasoning.
        """
        
        ai_response = groq_client.generate_response(
            prompt=analysis_prompt,
            max_tokens=500,
            temperature=0.3
        )
        
        # Parse AI response (simplified)
        recommendation = "proceed" if "recommend" in ai_response.lower() or "take" in ai_response.lower() else "defer"
        confidence = 80 if recommendation == "proceed" else 60
        
        return {
            "decision": {
                "recommendation": recommendation,
                "confidence": confidence,
                "reasoning": ai_response
            }
        }
        
    except Exception as e:
        print(f"Error in project analysis: {e}")
        # Fallback to simple logic
        return {
            "decision": {
                "recommendation": "proceed" if request.current_workload < 3 else "defer",
                "confidence": 70,
                "reasoning": "Analysis based on workload capacity"
            }
        }

@app.post("/api/dashboard-summary")
async def dashboard_summary(request: DashboardSummaryRequest):
    """Generate AI-powered dashboard summary"""
    
    if not groq_client:
        # Return a simple local summary
        data = request.dashboard_data
        return {
            "summary": f"You have {data.get('totalProjects', 0)} total projects with {data.get('completedProjects', 0)} completed. Your current earnings are ${data.get('totalEarnings', 0):,.0f}."
        }
    
    try:
        # Generate AI summary
        summary_prompt = f"""
        Create a brief, friendly summary of this freelancer's dashboard:
        
        Total Projects: {request.dashboard_data.get('totalProjects', 0)}
        Completed: {request.dashboard_data.get('completedProjects', 0)}
        Ongoing: {request.dashboard_data.get('ongoingProjects', 0)}
        Completion Rate: {request.dashboard_data.get('completionRate', 0)}%
        Total Earnings: ${request.dashboard_data.get('totalEarnings', 0):,.0f}
        Monthly Earnings: ${request.dashboard_data.get('monthlyEarnings', 0):,.0f}
        Most Common Type: {request.dashboard_data.get('mostCommonType', 'None')}
        
        Write a 2-3 sentence summary that's encouraging and informative.
        """
        
        ai_response = groq_client.generate_response(
            prompt=summary_prompt,
            max_tokens=300,
            temperature=0.7
        )
        
        return {"summary": ai_response}
        
    except Exception as e:
        print(f"Error in dashboard summary: {e}")
        # Fallback to simple summary
        data = request.dashboard_data
        return {
            "summary": f"You have {data.get('totalProjects', 0)} total projects with {data.get('completedProjects', 0)} completed. Your current earnings are ${data.get('totalEarnings', 0):,.0f}."
        }

@app.post("/api/email/test")
async def test_email(request: EmailTestRequest):
    """Test email sending functionality"""
    
    # For now, just return success
    # In production, you would integrate with your email service
    return {
        "success": True,
        "message": f"Test email would be sent to {request.user_email}"
    }

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "groq_available": groq_client is not None,
        "supabase_available": supabase is not None
    }

# Export app for Vercel
from mangum import Mangum

handler = Mangum(app) 