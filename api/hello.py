from fastapi import FastAPI
from mangum import Mangum

app = FastAPI()

@app.get("/api/hello")
def hello():
    return {"message": "Hello from Vercel API!", "status": "working"}

handler = Mangum(app) 