from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import os

from app.database import Base, engine, IS_VERCEL

# Importing routers
from app.routes.client_portal import router as client_portal_router
from app.routes.health import router as health_router
from app.routes.auth import router as auth_router
from app.routes.clients import router as clients_router
from app.routes import projects, tasks, time_entries, invoices, conversations, messages, dashboard
from app.routes.chat import router as chat_router
from app.routes import settings
from app.routes.internal import router as internal_router
import app.models.demo_usage  # noqa: F401  (registers the demo_chat_usage table)

# --- LOGGING ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("app")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Importing the routers above registers every model on Base.metadata.
    # create_all is idempotent (CREATE TABLE IF NOT EXISTS) and does not alter existing tables.
    if IS_VERCEL:
        # Serverless cold starts: skip schema work. Create tables beforehand with
        # `python create_tables.py` (or by running the app once locally).
        logger.info("Running on Vercel; skipping create_all")
    else:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables verified; Freelancer Work Tracker API ready")
    yield


app = FastAPI(
    title="Freelancer Work Tracker API",
    description="Backend API for authentication, clients, projects, invoices, and time tracking.",
    version="1.0.0",
    lifespan=lifespan,
)

# --- CORS CONFIGURATION ---
# FRONTEND_URL may be comma-separated (e.g. production + preview URLs).
_dev_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
_env_origins = [
    o.strip().rstrip("/")
    for o in os.getenv("FRONTEND_URL", "").split(",")
    if o.strip()
]
ALLOWED_ORIGINS = list(dict.fromkeys(_env_origins + _dev_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Custom 500 handler: log details server-side, return a generic message.
# CORS headers are added only for allowed origins (so browsers can read the error).
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    headers = {}
    origin = request.headers.get("origin")
    if origin in ALLOWED_ORIGINS:
        headers = {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
        }
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
        headers=headers,
    )


@app.get("/")
def root():
    return {
        "status": "online",
        "message": "Welcome to the Freelancer Work Tracker API",
        "docs": "/docs",
    }

# --- ROUTES REGISTRATION ---
app.include_router(health_router,                         tags=["Health"])
app.include_router(auth_router,          prefix="/auth",          tags=["Auth"])
app.include_router(clients_router)
app.include_router(client_portal_router, prefix="/client-portal", tags=["Client Portal"])
app.include_router(projects.router,      prefix="/projects",      tags=["Projects"])
app.include_router(tasks.router,         prefix="/tasks",         tags=["Tasks"])
app.include_router(time_entries.router,  prefix="/time-entries",  tags=["Time Entries"])
app.include_router(invoices.router)
app.include_router(conversations.router, prefix="/conversations",  tags=["AI Chat"])
app.include_router(chat_router,          prefix="/chat",           tags=["Chatbot"])
app.include_router(messages.router,      prefix="/messages",       tags=["Messages"])
app.include_router(dashboard.router,     prefix="/dashboard",      tags=["Dashboard"])
app.include_router(settings.router)
app.include_router(internal_router)