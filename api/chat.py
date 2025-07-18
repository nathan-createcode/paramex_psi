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
    allow_origins=["*"],
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

# Simple AI response generator
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
        response = generate_simple_response(request.message)
        return ChatResponse(response=response, status="success")
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        return ChatResponse(
            response="I apologize, but I'm experiencing technical difficulties. Please try again later.",
            status="error"
        )

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "AI Project Advisor",
        "version": "1.0.0"
    }

# Export handler for Vercel
handler = Mangum(app) 