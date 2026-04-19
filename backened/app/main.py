from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
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
# ✅ FIX: CORS middleware MUST be added first — before any routes or exception handlers
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ FIX: Custom 500 handler — ensures CORS headers present even on crashes
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    origin = request.headers.get("origin", "http://localhost:3000")
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"},
        headers={
            "Access-Control-Allow-Origin": origin if origin in ALLOWED_ORIGINS else "http://localhost:3000",
            "Access-Control-Allow-Credentials": "true",
        }
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
app.include_router(health_router, prefix="/health", tags=["Health"])
app.include_router(auth_router, prefix="/auth", tags=["Auth"])
app.include_router(clients_router)
app.include_router(projects.router, prefix="/projects", tags=["Projects"])
app.include_router(tasks.router, prefix="/tasks", tags=["Tasks"])
app.include_router(time_entries.router, prefix="/time-entries", tags=["Time Entries"])
app.include_router(invoices.router)
app.include_router(conversations.router, prefix="/conversations", tags=["AI Chat"])
app.include_router(messages.router, prefix="/messages", tags=["Messages"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
app.include_router(settings.router)