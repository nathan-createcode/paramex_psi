from fastapi import FastAPI
from mangum import Mangum
import os

app = FastAPI()

@app.get("/api/debug")
def debug():
    return {
        "message": "Debug endpoint working",
        "environment": {
            "GROQ_API_KEY": "set" if os.getenv("GROQ_API_KEY") else "not set",
            "VITE_SUPABASE_URL": "set" if os.getenv("VITE_SUPABASE_URL") else "not set",
            "VITE_SUPABASE_ANON_KEY": "set" if os.getenv("VITE_SUPABASE_ANON_KEY") else "not set"
        }
    }

handler = Mangum(app) 