from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.routes.health import router as health_router
from app.routes.auth import router as auth_router
from app.routes.clients import router as clients_router
from app.routes import projects
from app.routes import tasks
from app.routes import time_entries
from app.routes import invoices
from app.routes import conversations
from app.routes import messages

app = FastAPI(
    title="Freelancer Work Tracker API",
    description="Backend API for authentication, clients, projects, invoices, and time tracking.",
    version="1.0.0",
)

# CORS for frontend (React/Vite)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging (optional but professional)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("app")

@app.on_event("startup")
def startup():
    logger.info("Freelancer Work Tracker API started")

@app.get("/")
def root():
    return {
        "message": "Freelancer Work Tracker API is running ",
        "docs": "http://127.0.0.1:8000/docs",
        "health": "http://127.0.0.1:8000/health",
    }

app.include_router(health_router)
app.include_router(auth_router) 
app.include_router(clients_router)
app.include_router(projects.router)
app.include_router(tasks.router)
app.include_router(time_entries.router)
app.include_router(invoices.router)
app.include_router(conversations.router)
app.include_router(messages.router)