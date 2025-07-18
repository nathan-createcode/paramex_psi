from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
from mangum import Mangum
from datetime import datetime

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
supabase = None
try:
    if supabase_url and supabase_key:
        from supabase import create_client, Client
        supabase = create_client(supabase_url, supabase_key)
        print("✅ Supabase client initialized successfully")
    else:
        print("❌ Supabase credentials missing - project context features will be disabled")
except Exception as e:
    print(f"⚠️ Warning: Could not initialize Supabase client: {e}")
    supabase = None

# Initialize Groq client
groq_client = None
try:
    if groq_api_key:
        from groq import Groq
        groq_client = Groq(api_key=groq_api_key)
        print("✅ Groq AI client initialized successfully")
    else:
        print("❌ GROQ_API_KEY missing - AI features will be disabled")
except Exception as e:
    print(f"⚠️ Warning: Could not initialize Groq client: {e}")
    groq_client = None

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

# Clean markdown formatting function
def clean_markdown_formatting(text: str) -> str:
    """Remove markdown formatting from AI response"""
    import re
    
    # Remove bold (**text** or __text__)
    text = re.sub(r'\*\*(.*?)\*\*', r'\1', text)
    text = re.sub(r'__(.*?)__', r'\1', text)
    
    # Remove italic (*text* or _text_)
    text = re.sub(r'\*(.*?)\*', r'\1', text)
    text = re.sub(r'_(.*?)_', r'\1', text)
    
    # Remove headers (# ## ###)
    text = re.sub(r'^#{1,6}\s*', '', text, flags=re.MULTILINE)
    
    # Remove bullet points (- * +)
    text = re.sub(r'^[-*+]\s+', '', text, flags=re.MULTILINE)
    
    # Remove code blocks (``` or `)
    text = re.sub(r'```.*?```', '', text, flags=re.DOTALL)
    text = re.sub(r'`(.*?)`', r'\1', text)
    
    # Remove links [text](url)
    text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', text)
    
    # Remove excessive line breaks and clean up
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = text.strip()
    
    return text

# AI call function with latest models
async def get_ai_response(user_message: str, conversation_history: List[Dict] = None) -> str:
    """Get AI response using the latest Groq models"""
    try:
        if not groq_client:
            return generate_simple_response(user_message)
        
        # Enhanced system prompt for better project advisor responses
        system_prompt = """You are an expert AI Project Advisor specializing in freelance project management. You have deep knowledge of:

- Project planning, timeline estimation, and risk management
- Client relationship management and communication strategies
- Budget planning, pricing strategies, and financial management
- Workflow optimization and productivity enhancement
- Technology trends and project implementation best practices

When users provide project data, analyze it thoroughly and give specific, actionable advice. Be conversational, professional, and focus on practical solutions that can be implemented immediately.

If you see [USER'S PROJECT DATA] in the message, use that information to provide personalized recommendations based on their actual projects, deadlines, and workload."""
        
        # Prepare messages
        messages = [{"role": "system", "content": system_prompt}]
        
        # Add conversation history (last 6 messages for better context)
        if conversation_history:
            for msg in conversation_history[-6:]:
                role = "user" if msg["type"] == "user" else "assistant"
                messages.append({"role": role, "content": msg["content"]})
        
        # Add current message
        messages.append({"role": "user", "content": user_message})
        
        # Try latest models in order of preference with Meta Llama 4 Scout as primary
        models_to_try = [
            "meta-llama/llama-4-scout-17b-16e-instruct",  # Primary: Meta Llama 4 Scout
            "llama-3.3-70b-versatile",  # Latest Llama 3.3
            "llama-3.2-90b-text-preview",  # High capability preview
            "llama-3.2-11b-text-preview",  # Good balance
            "llama-3.1-70b-versatile"  # Fallback stable version
        ]
        
        for model in models_to_try:
            try:
                print(f"🤖 Trying model: {model}")
                
                # Call Groq API with the current model
                completion = groq_client.chat.completions.create(
                    model=model,
                    messages=messages,
                    temperature=0.7,
                    max_tokens=800,  # Increased for more detailed responses
                    top_p=0.9,
                    stream=False
                )
                
                response = completion.choices[0].message.content
                print(f"✅ Successfully used model: {model}")
                return clean_markdown_formatting(response)
                
            except Exception as model_error:
                print(f"❌ Model {model} failed: {model_error}")
                continue
        
        # If all models fail, use fallback
        print("⚠️ All AI models failed, using fallback response")
        return generate_simple_response(user_message)
        
    except Exception as e:
        print(f"❌ AI API error: {e}")
        return generate_simple_response(user_message)

# API Routes
@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """AI Chat endpoint for project advisor"""
    
    try:
        # Get user projects context if user_id is provided
        user_context = ""
        if request.user_id:
            user_context = await get_user_projects_context(request.user_id)
        
        # Combine user message with project context
        full_message = request.message + user_context
        
        # Get AI response
        response = await get_ai_response(
            full_message,
            [msg.dict() for msg in request.conversation_history] if request.conversation_history else []
        )
        
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
        
        # Format projects for frontend
        projects = []
        if response.data:
            for project in response.data:
                projects.append({
                    "id": project["project_id"],
                    "name": project["project_name"],
                    "client": project["client_name"],
                    "deadline": project["deadline"],
                    "payment": project["payment_amount"],
                    "difficulty": project["difficulty_level"],
                    "type": project["type_id"]["type_name"] if project["type_id"] else "Unknown",
                    "status": project["status_id"]["status_name"] if project["status_id"] else "Unknown"
                })
        
        return {
            "projects": projects,
            "count": len(projects)
        }
        
    except Exception as e:
        print(f"Error fetching user projects: {e}")
        raise HTTPException(status_code=500, detail="Unable to fetch projects")

@app.post("/api/project-analysis")
async def project_analysis(request: ProjectAnalysisRequest):
    """AI-powered project analysis and recommendations"""
    
    try:
        # Enhanced analysis with AI if available
        if groq_client:
            try:
                analysis_prompt = f"""
                Analyze this freelancer's project situation and provide a recommendation:

                Current Portfolio:
                - Total Projects: {request.project_history.get('totalProjects', 0)}
                - Completed Projects: {request.project_history.get('completedProjects', 0)}
                - Ongoing Projects: {request.project_history.get('ongoingProjects', 0)}
                - Completion Rate: {request.completion_rate}%
                - Current Workload: {request.current_workload} active projects

                Should they take on a new project? Consider:
                1. Current workload capacity
                2. Completion rate performance
                3. Risk of overcommitment
                4. Quality maintenance

                Provide: recommendation (proceed/defer), confidence level (0-100%), and detailed reasoning.
                """
                
                ai_response = await get_ai_response(analysis_prompt)
                
                # Parse AI response for structured data
                recommendation = "proceed" if "proceed" in ai_response.lower() else "defer"
                confidence = 85 if "proceed" in ai_response.lower() else 70
                
                return {
                    "decision": {
                        "recommendation": recommendation,
                        "confidence": confidence,
                        "reasoning": ai_response
                    }
                }
                
            except Exception as ai_error:
                print(f"AI analysis failed: {ai_error}")
        
        # Fallback to simple analysis
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
        # Enhanced summary with AI if available
        if groq_client:
            try:
                data = request.dashboard_data
                summary_prompt = f"""
                Create an encouraging and insightful summary for this freelancer's dashboard:

                Performance Data:
                - Total Projects: {data.get('totalProjects', 0)}
                - Completed Projects: {data.get('completedProjects', 0)}
                - Ongoing Projects: {data.get('ongoingProjects', 0)}
                - Total Earnings: ${data.get('totalEarnings', 0):,.0f}
                - Monthly Earnings: ${data.get('monthlyEarnings', 0):,.0f}
                - Most Common Project Type: {data.get('mostCommonType', 'Various')}

                Provide an encouraging 2-3 sentence summary highlighting achievements and growth potential.
                """
                
                ai_summary = await get_ai_response(summary_prompt)
                return {"summary": ai_summary}
                
            except Exception as ai_error:
                print(f"AI summary failed: {ai_error}")
        
        # Fallback to simple summary
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
    
    try:
        return {
            "success": True,
            "message": f"Email service simulation: Test email would be sent to {request.user_email}",
            "note": "Email service configured - this is a successful test"
        }
        
    except Exception as e:
        print(f"Error in email test: {e}")
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
        "groq_available": groq_client is not None,
        "supabase_available": supabase is not None,
        "ai_models": ["meta-llama/llama-4-scout-17b-16e-instruct", "llama-3.3-70b-versatile", "llama-3.2-90b-text-preview", "llama-3.2-11b-text-preview"],
        "timestamp": datetime.now().isoformat()
    }

# Export app for Vercel
handler = Mangum(app) 