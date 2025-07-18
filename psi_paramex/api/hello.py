from fastapi import FastAPI
from mangum import Mangum

app = FastAPI()

@app.get("/api/hello")
def hello():
    return {"message": "Hello from Vercel!"}

@app.get("/api/test")
def test():
    return {"status": "OK", "service": "AI Backend"}

handler = Mangum(app) 