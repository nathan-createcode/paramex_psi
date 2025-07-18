from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from datetime import datetime
import json
import pytz
from typing import List, Dict, Any, Optional

# Import modules from backend/groq_api
from groq_client import GroqLlamaClient
from scoring_logic import project_scorer
from ux_safety_check import ux_safety_checker
from supabase_email_service import SupabaseEmailService, EmailData
from notification_scheduler import NotificationScheduler

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

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
        groq_client = GroqLlamaClient(api_key=groq_api_key)
        print("✅ Groq AI client initialized successfully")
    else:
        print("❌ GROQ_API_KEY missing - AI features will be disabled")
except Exception as e:
    print(f"⚠️ Warning: Could not initialize Groq client: {e}")
    groq_client = None

# Initialize email service
email_service = None
try:
    if supabase:
        email_service = SupabaseEmailService(supabase)
        print("✅ Email service initialized successfully")
    else:
        print("❌ Email service disabled - Supabase not available")
except Exception as e:
    print(f"⚠️ Warning: Could not initialize email service: {e}")
    email_service = None

# Initialize notification scheduler
notification_scheduler = None
try:
    if supabase and email_service:
        notification_scheduler = NotificationScheduler(supabase, email_service)
        print("✅ Notification scheduler initialized successfully")
    else:
        print("❌ Notification scheduler disabled - dependencies not available")
except Exception as e:
    print(f"⚠️ Warning: Could not initialize notification scheduler: {e}")
    notification_scheduler = None

# Helper function to get user projects for context
def get_user_projects_context(user_id: str) -> str:
    """Get user's projects formatted for AI context"""
    if not supabase:
        return "No project context available (Supabase not initialized)"
    
    try:
        response = supabase.table("projects").select("*").eq("user_id", user_id).execute()
        
        if not response.data:
            return "No projects found for this user"
        
        projects = []
        for project in response.data:
            project_info = f"""
Project: {project.get('name', 'Unnamed')}
Status: {project.get('status', 'Unknown')}
Description: {project.get('description', 'No description')}
Tech Stack: {project.get('tech_stack', 'Not specified')}
"""
            projects.append(project_info)
        
        return "\n".join(projects)
    
    except Exception as e:
        return f"Error fetching projects: {str(e)}"

# Routes
@app.route('/')
def root():
    """Root endpoint"""
    return jsonify({
        "message": "ParameX PSI - AI Project Advisor API",
        "version": "1.0.0",
        "status": "active"
    })

@app.route('/health')
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now(pytz.timezone('Asia/Jakarta')).isoformat(),
        "services": {
            "groq": bool(groq_client),
            "supabase": bool(supabase),
            "email": bool(email_service),
            "scheduler": bool(notification_scheduler)
        }
    })

@app.route('/api/user-projects/<user_id>')
def get_user_projects(user_id):
    """Get user projects"""
    if not supabase:
        return jsonify({"error": "Supabase not initialized"}), 500
    
    try:
        response = supabase.table("projects").select("*").eq("user_id", user_id).execute()
        return jsonify({"projects": response.data})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    """Chat endpoint"""
    if not groq_client:
        return jsonify({"error": "Groq client not initialized"}), 500
    
    try:
        data = request.get_json()
        message = data.get('message', '')
        user_id = data.get('user_id')
        
        # Get user context
        user_context = ""
        if user_id:
            user_context = get_user_projects_context(user_id)
        
        # Generate response
        response = groq_client.generate_response(message, user_context)
        
        return jsonify({
            "response": response,
            "timestamp": datetime.now(pytz.timezone('Asia/Jakarta')).isoformat()
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/analyze-project', methods=['POST'])
def analyze_project():
    """Analyze project endpoint"""
    try:
        data = request.get_json()
        project_data = data.get('project_data', {})
        
        # Use scoring logic
        score = project_scorer.calculate_score(project_data)
        
        return jsonify({
            "score": score,
            "analysis": "Project analysis completed",
            "timestamp": datetime.now(pytz.timezone('Asia/Jakarta')).isoformat()
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/quick-advice', methods=['POST'])
def quick_advice():
    """Quick advice endpoint"""
    if not groq_client:
        return jsonify({"error": "Groq client not initialized"}), 500
    
    try:
        data = request.get_json()
        question = data.get('question', '')
        
        # Generate quick advice
        advice = groq_client.generate_quick_advice(question)
        
        return jsonify({
            "advice": advice,
            "timestamp": datetime.now(pytz.timezone('Asia/Jakarta')).isoformat()
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/quick-questions')
def quick_questions():
    """Get quick questions"""
    questions = [
        "Bagaimana cara memulai proyek Python?",
        "Apa teknologi terbaik untuk web development?",
        "Bagaimana cara mengoptimalkan database?",
        "Strategi testing yang efektif?",
        "Bagaimana cara deploy aplikasi ke cloud?"
    ]
    
    return jsonify({"questions": questions})

@app.route('/api/email/test', methods=['POST'])
def test_email():
    """Test email endpoint"""
    if not email_service:
        return jsonify({"error": "Email service not initialized"}), 500
    
    try:
        data = request.get_json()
        email_data = EmailData(
            to_email=data.get('to_email'),
            subject=data.get('subject', 'Test Email'),
            content=data.get('content', 'This is a test email')
        )
        
        result = email_service.send_email(email_data)
        return jsonify({"result": result})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/email/project-update', methods=['POST'])
def project_update_email():
    """Send project update email"""
    if not email_service:
        return jsonify({"error": "Email service not initialized"}), 500
    
    try:
        data = request.get_json()
        result = email_service.send_project_update_email(data)
        return jsonify({"result": result})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/email/welcome', methods=['POST'])
def welcome_email():
    """Send welcome email"""
    if not email_service:
        return jsonify({"error": "Email service not initialized"}), 500
    
    try:
        data = request.get_json()
        result = email_service.send_welcome_email(data)
        return jsonify({"result": result})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/email/status')
def email_status():
    """Get email status"""
    if not email_service:
        return jsonify({"error": "Email service not initialized"}), 500
    
    try:
        status = email_service.get_status()
        return jsonify({"status": status})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/project-analysis', methods=['POST'])
def project_analysis():
    """Project analysis endpoint"""
    if not groq_client:
        return jsonify({"error": "Groq client not initialized"}), 500
    
    try:
        data = request.get_json()
        project_data = data.get('project_data', {})
        
        # UX Safety Check
        safety_check = ux_safety_checker.check_project_safety(project_data)
        
        # Scoring
        score = project_scorer.calculate_score(project_data)
        
        # AI Analysis
        analysis = groq_client.analyze_project(project_data)
        
        return jsonify({
            "safety_check": safety_check,
            "score": score,
            "analysis": analysis,
            "timestamp": datetime.now(pytz.timezone('Asia/Jakarta')).isoformat()
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/dashboard-summary', methods=['POST'])
def dashboard_summary():
    """Dashboard summary endpoint"""
    if not supabase:
        return jsonify({"error": "Supabase not initialized"}), 500
    
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        
        # Get user projects summary
        response = supabase.table("projects").select("*").eq("user_id", user_id).execute()
        projects = response.data
        
        # Calculate summary statistics
        total_projects = len(projects)
        completed_projects = len([p for p in projects if p.get('status') == 'completed'])
        in_progress_projects = len([p for p in projects if p.get('status') == 'in_progress'])
        
        return jsonify({
            "total_projects": total_projects,
            "completed_projects": completed_projects,
            "in_progress_projects": in_progress_projects,
            "projects": projects,
            "timestamp": datetime.now(pytz.timezone('Asia/Jakarta')).isoformat()
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Vercel serverless function handler
def handler(request):
    """Vercel handler function"""
    return app(request.environ, request.start_response)

# For local development
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=8000) 