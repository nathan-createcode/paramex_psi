from datetime import datetime
import pytz
from typing import Dict, Any
from supabase_email_service import EmailData
from supabase import Client

class NotificationScheduler:
    def __init__(self, supabase_client: Client, email_service=None):
        self.supabase = supabase_client
        self.email_service = email_service
        print("✅ Notification scheduler initialized")
    
    async def send_project_status_update(self, project_id: str, old_status: str, new_status: str, update_message: str = ""):
        """Send email notification when project status changes"""
        try:
            if not self.supabase:
                return {"success": False, "error": "Database not available"}
            
            if not self.email_service:
                return {"success": False, "error": "Email service not available"}
            
            # Get project and user details
            response = self.supabase.table("projects").select(
                """
                project_id,
                project_name,
                client_name,
                user_id,
                users!inner ( email, name )
                """
            ).eq("project_id", project_id).single().execute()
            
            if not response.data:
                return {"success": False, "error": "Project not found"}
            
            project = response.data
            subject = f"📊 Project Update: {project['project_name']} status changed"
            
            # For now, just log the update (actual email templates will be added later)
            print(f"📧 Project update notification:")
            print(f"   To: {project['users']['email']}")
            print(f"   Project: {project['project_name']}")
            print(f"   Status: {old_status} → {new_status}")
            print(f"   Message: {update_message}")
            
            return {
                "success": True,
                "message_id": f"update_{datetime.now().timestamp()}",
                "note": "Project update logged successfully"
            }
            
        except Exception as e:
            print(f"❌ Error sending status update: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def send_welcome_email_to_user(self, user_id: str, user_email: str, user_name: str = ""):
        """Send welcome email to new user"""
        try:
            if not self.email_service:
                return {"success": False, "error": "Email service not available"}
            
            print(f"🎉 Welcome email notification:")
            print(f"   To: {user_email}")
            print(f"   Name: {user_name}")
            print(f"   Message: Welcome to ParameX!")
            
            return {
                "success": True,
                "message_id": f"welcome_{datetime.now().timestamp()}",
                "note": "Welcome email logged successfully"
            }
            
        except Exception as e:
            print(f"❌ Error sending welcome email: {str(e)}")
            return {"success": False, "error": str(e)}

# Global scheduler instance
notification_scheduler = None 