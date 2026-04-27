from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import date, timedelta
import google.generativeai as genai
import os

from app.dependencies import get_db, get_current_user
from app.models.project import Project
from app.models.task import Task
from app.models.time_entry import TimeEntry
from app.models.invoice import Invoice
from app.models.client import Client

router = APIRouter(tags=["Chatbot"])

genai.configure(api_key=os.getenv("API_KEY"))
model = genai.GenerativeModel("gemma-3-27b-it")
fast_model = genai.GenerativeModel("gemma-3-4b-it")


class ChatRequest(BaseModel):
    message: str

class ClientChatRequest(BaseModel):
    message: str
    context: Optional[str] = ""


def build_freelancer_context(db: Session, user_id: int) -> str:
    projects = db.query(Project).filter(Project.user_id == user_id).all()
    tasks    = db.query(Task).filter(Task.user_id == user_id).all()
    invoices = db.query(Invoice).filter(Invoice.user_id == user_id).all()
    clients  = db.query(Client).filter(Client.user_id == user_id).all()

    today      = date.today()
    week_start = today - timedelta(days=today.weekday())
    entries    = db.query(TimeEntry).join(Task).filter(Task.user_id == user_id).all()
    week_entries = [e for e in entries if e.date and str(e.date) >= str(week_start)]
    total_hrs  = round(sum(e.duration_seconds or 0 for e in entries) / 3600, 1)
    week_hrs   = round(sum(e.duration_seconds or 0 for e in week_entries) / 3600, 1)

    earned  = sum(float(i.total_amount or 0) for i in invoices if i.status == "paid")
    pending = sum(float(i.total_amount or 0) for i in invoices if i.status != "paid")
    todo    = [t for t in tasks if t.status == "todo"]
    inprog  = [t for t in tasks if t.status == "in_progress"]
    done    = [t for t in tasks if t.status == "done"]

    ctx  = "=== FREELANCER WORK TRACKER DATA ===\n\n"
    ctx += f"PROJECTS ({len(projects)} total):\n"
    for p in projects:
        ctx += f"  - {p.title} | Status: {p.status} | Rate: ${p.hourly_rate or 0}/hr\n"

    ctx += f"\nTASKS ({len(tasks)} total):\n"
    ctx += f"  To Do: {len(todo)} | In Progress: {len(inprog)} | Done: {len(done)}\n"
    for t in tasks[:15]:
        ctx += f"  - [{t.status.upper()}] {t.title} | Priority: {t.priority or 'medium'}\n"

    ctx += f"\nTIME TRACKING:\n"
    ctx += f"  This week: {week_hrs}h | All time: {total_hrs}h | Sessions: {len(entries)}\n"

    ctx += f"\nFINANCIALS:\n"
    ctx += f"  Total Earned: ${earned:.2f} | Pending: ${pending:.2f}\n"
    ctx += f"  Invoices: {len(invoices)} total\n"
    for i in invoices[:5]:
        ctx += f"  - {i.invoice_number} | ${i.total_amount} | {i.status}\n"

    ctx += f"\nCLIENTS ({len(clients)} total):\n"
    for c in clients:
        ctx += f"  - {c.name}" + (f" ({c.company})" if c.company else "") + "\n"

    return ctx


# ── Freelancer Bot ──
@router.post("/message")
def chat_message(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        context = build_freelancer_context(db, current_user.id)

        prompt = f"""You are FWT Assistant — an intelligent AI assistant built into the Freelancer Work Tracker app.

You have access to real-time data about this freelancer's work:

{context}

INSTRUCTIONS:
- Answer clearly and concisely using the data above
- Use bullet points or line breaks for readability
- Be friendly and professional
- If asked about totals, calculate them from the data
- If the question is unrelated to freelancing data, still help helpfully
- Never make up data that isn't in the context
- Keep responses under 150 words unless detail is needed

User: {payload.message}
Assistant:"""

        response = model.generate_content(prompt)
        reply = response.text.strip()

    except Exception as e:
        print(f"Gemma error: {e}")
        reply = "I'm having trouble connecting right now. Please try again in a moment."

    return {"reply": reply}


# ── Client Portal Bot ──
@router.post("/client-message")
def client_chat_message(payload: ClientChatRequest):
    try:
        prompt = f"""You are a Portal Assistant for a client in the Freelancer Work Tracker app.

You have access to this client's project data:

{payload.context}

INSTRUCTIONS:
- Be friendly, warm and conversational
- If the question is about projects, tasks, invoices or hours — answer using the data above
- If the question is general (jokes, greetings, math, etc) — answer naturally and helpfully
- Keep responses under 4 sentences
- Never make up project data that is not provided

Client question: {payload.message.split("[USER QUESTION]")[-1].strip() if "[USER QUESTION]" in payload.message else payload.message}
Assistant:"""

        response = model.generate_content(prompt)
        reply = response.text.strip()

    except Exception as e:
        print(f"Gemma client error: {e}")
        reply = "I'm having trouble right now. Please try again."

    return {"reply": reply}


# ── Landing Page Bot (No Auth) ──
@router.post("/landing-message")
async def landing_chat(request: Request):
    try:
        body = await request.json()
        user_message = body.get("message", "")

        if not user_message:
            return JSONResponse({"reply": "Please ask me something!"})

        system_prompt = """You are FWT Assistant, a friendly AI chatbot for FWT (Freelancer Work Tracker).

FWT Features:
- Project & Task Management with Kanban board (To Do, In Progress, Done)
- Real-Time Time Tracking with built-in stopwatch
- Automatic Invoice Generation (Draft, Sent, Paid + PDF preview)
- Client Portal for clients to view their projects
- AI Chatbot for freelancers and clients
- Dashboard with analytics
- Settings (profile, password, currency & tax)

Key facts:
- FWT is completely FREE
- JWT authentication (secure)
- Forgot password via email
- Contact: fwtapp860@gmail.com
- Stack: React + FastAPI + MySQL

Instructions:
- Answer ANY question — FWT related or general
- For jokes, math, general questions — answer naturally
- Be warm, friendly and concise
- Keep responses under 4 sentences"""

        response = fast_model.generate_content(
            f"{system_prompt}\n\nUser: {user_message}\nAssistant:"
        )
        reply = response.text.strip()
        return JSONResponse({"reply": reply})

    except Exception as e:
        print(f"Landing chat error: {e}")
        return JSONResponse({"reply": "I'm having trouble right now. Please try again!"})