from fastapi import FastAPI
from mangum import Mangum
import os

app = FastAPI()

@app.get("/api/test")
async def test_endpoint():
    return {
        "message": "API is working!",
        "environment": {
            "groq_key_set": bool(os.getenv("GROQ_API_KEY")),
            "supabase_url_set": bool(os.getenv("VITE_SUPABASE_URL")),
            "supabase_key_set": bool(os.getenv("VITE_SUPABASE_ANON_KEY"))
        }
    }

handler = Mangum(app) 