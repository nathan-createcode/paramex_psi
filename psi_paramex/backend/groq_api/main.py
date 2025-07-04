from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import uvicorn
from groq_client import groq_client
from scoring_logic import project_scorer
from ux_safety_check import ux_safety_checker

# Initialize FastAPI app
app = FastAPI(title="ParameX PSI - AI Project Advisor API", version="1.0.0")

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

# Health check endpoint
@app.get("/")
async def root():
    return {"message": "ParameX PSI AI Project Advisor API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "AI Project Advisor API"}

# Chat endpoint for project advice
@app.post("/api/chat", response_model=ChatResponse)
async def chat_with_advisor(request: ChatRequest):
    """
    Chat with AI Project Advisor using Meta Llama model with safety checks
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
        
        # Convert conversation history to the format expected by groq_client
        history = []
        if request.conversation_history:
            for msg in request.conversation_history:
                history.append({
                    "type": msg.type,
                    "content": msg.content
                })
        
        # Get AI response from Groq
        ai_response = await groq_client.get_project_advice(
            user_message=request.message,
            conversation_history=history
        )
        
        # Safety check for AI response
        response_safety = ux_safety_checker.check_ai_response(ai_response)
        if not response_safety['is_safe']:
            ai_response = "I apologize, but I need to provide a more appropriate response. Let me help you with your project management question in a different way. Could you please rephrase your question focusing on specific project challenges you're facing?"
        
        return ChatResponse(response=ai_response)
        
    except Exception as e:
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

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
