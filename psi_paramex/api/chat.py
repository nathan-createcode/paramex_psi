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

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "groq_available": groq_client is not None,
        "supabase_available": supabase is not None
    }

# Export app for Vercel
from fastapi import FastAPI
from mangum import Mangum

handler = Mangum(app) 