from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
# Load environment variables from .env file
load_dotenv()


app = FastAPI()

origins = [
    "http://localhost:3000",
    os.getenv("WEBDOMAIN")
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# add a route with parameter of name to show a greeting message
@app.get("/greet/{name}")
async def greet(name: str):
    return {"message": f"How are u, {name}!"}