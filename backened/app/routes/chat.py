from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import date, timedelta
from groq import Groq
import os

from app.dependencies import get_db, get_current_user
from app.models.project import Project
from app.models.task import Task
from app.models.time_entry import TimeEntry
from app.models.invoice import Invoice
from app.models.client import Client

router = APIRouter(tags=["Chatbot"])

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
MODEL = "llama-3.1-8b-instant"


class ChatRequest(BaseModel):
    message: str

class ClientChatRequest(BaseModel):
    message: str
    context: Optional[str] = ""


def build_freelancer_context(db, user_id):
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


@router.post("/message")
def chat_message(payload: ChatRequest, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    try:
        context = build_freelancer_context(db, current_user.id)
        response = groq_client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": f"You are FWT Assistant built into Freelancer Work Tracker.\n\n{context}\n\nAnswer clearly, be friendly, keep under 150 words. Never make up data."},
                {"role": "user", "content": payload.message}
            ],
            max_tokens=300
        )
        reply = response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Groq error: {e}")
        reply = "I'm having trouble connecting right now. Please try again in a moment."
    return {"reply": reply}


@router.post("/client-message")
def client_chat_message(payload: ClientChatRequest):
    try:
        user_question = payload.message.split("[USER QUESTION]")[-1].strip() if "[USER QUESTION]" in payload.message else payload.message
        response = groq_client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": f"You are a Portal Assistant for a client in FWT.\n\n{payload.context}\n\nBe friendly, answer using data above, keep under 4 sentences."},
                {"role": "user", "content": user_question}
            ],
            max_tokens=200
        )
        reply = response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Groq client error: {e}")
        reply = "I'm having trouble right now. Please try again."
    return {"reply": reply}


@router.post("/landing-message")
async def landing_chat(request: Request):
    try:
        body = await request.json()
        user_message = body.get("message", "")
        if not user_message:
            return JSONResponse({"reply": "Please ask me something!"})
        response = groq_client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": "You are FWT Assistant for Freelancer Work Tracker. Features: Project & Task Management, Time Tracking, Invoice Generation, Client Portal, AI Chatbot, Dashboard. FWT is FREE. Stack: React + FastAPI + MySQL. Be warm, friendly, concise. Keep under 4 sentences."},
                {"role": "user", "content": user_message}
            ],
            max_tokens=200
        )
        reply = response.choices[0].message.content.strip()
        return JSONResponse({"reply": reply})
    except Exception as e:
        print(f"Landing chat error: {e}")
        return JSONResponse({"reply": "I'm having trouble right now. Please try again!"})