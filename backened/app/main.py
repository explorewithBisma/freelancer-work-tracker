from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

# Importing routers
from app.routes.health import router as health_router
from app.routes.auth import router as auth_router
from app.routes.clients import router as clients_router
from app.routes import projects, tasks, time_entries, invoices, conversations, messages, dashboard
from app.routes import settings

app = FastAPI(
    title="Freelancer Work Tracker API",
    description="Backend API for authentication, clients, projects, invoices, and time tracking.",
    version="1.0.0",
)

# --- CORS CONFIGURATION ---
# Updated to ensure all local development variations are covered
app.add_middleware(
    CORSMiddleware,
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

# --- LOGGING ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("app")

@app.on_event("startup")
async def startup():
    logger.info("🚀 Freelancer Work Tracker API started and ready for requests")

@app.get("/")
def root():
    return {
        "status": "online",
        "message": "Welcome to the Freelancer Work Tracker API",
        "docs": "/docs",
    }

# --- ROUTES REGISTRATION ---
# NOTE: The prefixes here must match exactly what Axios is calling in React.
app.include_router(health_router, prefix="/health", tags=["Health"])
app.include_router(auth_router, prefix="/auth", tags=["Auth"]) 
app.include_router(clients_router, prefix="/clients", tags=["Clients"])
app.include_router(projects.router, prefix="/projects", tags=["Projects"])
app.include_router(tasks.router, prefix="/tasks", tags=["Tasks"])

# This is the line that connects your Stopwatch data to the Database
app.include_router(time_entries.router, prefix="/time-entries", tags=["Time Entries"])

app.include_router(invoices.router, prefix="/invoices", tags=["Invoices"])
app.include_router(conversations.router, prefix="/conversations", tags=["AI Chat"])
app.include_router(messages.router, prefix="/messages", tags=["Messages"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
app.include_router(settings.router, prefix="/settings", tags=["Settings"])
