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
from app.routes import dashboard

app = FastAPI(
    title="Freelancer Work Tracker API",
    description="Backend API for authentication, clients, projects, invoices, and time tracking.",
    version="1.0.0",
)

# CORS for frontend (React/Vite)
app.add_middleware(
    CORSMiddleware,
    # Maine yahan 5173 (Vite) aur 3000 (React default) dono add kar diye hain
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("app")

@app.on_event("startup")
def startup():
    logger.info("Freelancer Work Tracker API started")

@app.get("/")
def root():
    return {
        "message": "Freelancer Work Tracker API is running",
        "docs": "http://127.0.0.1:8000/docs",
    }

# --- ROUTES WITH PREFIXES ---
# Ye prefixes zaroori hain taake React 'http://localhost:8000/tasks' ko hit kar sakay
app.include_router(health_router, prefix="/health", tags=["Health"])
app.include_router(auth_router, prefix="/auth", tags=["Auth"]) 
app.include_router(clients_router, prefix="/clients", tags=["Clients"])
app.include_router(projects.router, prefix="/projects", tags=["Projects"])
app.include_router(tasks.router, prefix="/tasks", tags=["Tasks"])
app.include_router(time_entries.router, prefix="/time-entries", tags=["Time Entries"])
app.include_router(invoices.router, prefix="/invoices", tags=["Invoices"])
app.include_router(conversations.router, prefix="/conversations", tags=["AI Chat"])
app.include_router(messages.router, prefix="/messages", tags=["Messages"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])