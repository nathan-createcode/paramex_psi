import os
from typing import Dict, Any
from datetime import datetime
import pytz
from jinja2 import Environment, BaseLoader
from pydantic import BaseModel

# Email templates
TEST_EMAIL_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Test Email - ParameX</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #667eea; color: white; padding: 20px; text-align: center; border-radius: 8px;">
        <h1>✅ Email Test Successful!</h1>
        <p>ParameX Email Service (Supabase)</p>
    </div>
    
    <div style="padding: 20px; border: 1px solid #e0e0e0; border-top: none;">
        <h2>Hi {{ user_name }},</h2>
        <p>This is a test email to verify that your email notifications are working correctly with Supabase.</p>
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 15px 0;">
            <p><strong>Test Details:</strong></p>
            <ul style="margin: 0;">
                <li>Email service: Active ✅</li>
                <li>Time sent: {{ current_time }} (Jakarta Time)</li>
                <li>Recipient: {{ user_email }}</li>
                <li>Service: Supabase Email System</li>
            </ul>
        </div>
        
        <p>Your email notifications are now configured and working properly!</p>
        
        <div style="text-align: center; margin: 20px 0;">
            <a href="{{ app_url }}/settings" style="background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Manage Notifications</a>
        </div>
        
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #e0e0e0;">
        <p style="font-size: 12px; color: #666; text-align: center;">
            This was a test email from ParameX Project Management System using Supabase.
        </p>
    </div>
</body>
</html>
"""

class EmailData(BaseModel):
    to_email: str
    to_name: str
    subject: str
    template_data: Dict[str, Any]

class SupabaseEmailService:
    def __init__(self, supabase_client=None):
        self.supabase = supabase_client
        self.app_url = os.getenv("APP_URL", "http://localhost:5173")
        self.from_email = os.getenv("FROM_EMAIL", "ParameX <notifications@paramex.dev>")
        
        if not self.supabase:
            print("⚠️ Warning: Supabase client not available. Email functionality will be disabled.")
            self.enabled = False
        else:
            self.enabled = True
            print("✅ Supabase email service initialized successfully")
        
        self.env = Environment(loader=BaseLoader())
    
    def render_template(self, template_string: str, data: Dict[str, Any]) -> str:
        """Render email template with data"""
        template = self.env.from_string(template_string)
        return template.render(**data)
    
    async def send_test_email(self, to_email: str, user_name: str) -> Dict[str, Any]:
        """Send test email to verify email functionality"""
        if not self.enabled:
            return {"success": False, "error": "Supabase email service not configured"}
        
        try:
            jakarta_tz = pytz.timezone('Asia/Jakarta')
            current_time = datetime.now(jakarta_tz).strftime('%Y-%m-%d %H:%M:%S')
            
            template_data = {
                "user_name": user_name,
                "user_email": to_email,
                "current_time": current_time,
                "app_url": self.app_url
            }
            
            html_content = self.render_template(TEST_EMAIL_TEMPLATE, template_data)
            
            # For now, simulate email sending by logging
            print(f"📧 Test email would be sent to: {to_email}")
            print(f"📧 Subject: ParameX Email Test - Supabase Integration Working!")
            print(f"📧 Content preview: Email test for {user_name} at {current_time}")
            
            # Log to console (in production, this would send actual email)
            return {
                "success": True,
                "message_id": f"supabase_test_{datetime.now().timestamp()}",
                "response": {
                    "status": "simulated_sent",
                    "to": to_email,
                    "subject": "ParameX Email Test - Supabase Integration Working!",
                    "service": "supabase_simulation",
                    "note": "Email simulated successfully - integrate with actual email service for production"
                }
            }
        
        except Exception as e:
            print(f"Email test error: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            } 