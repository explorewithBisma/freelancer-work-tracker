from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import date, timedelta

from app.dependencies import get_db, get_current_user
from app.models.project import Project
from app.models.task import Task
from app.models.time_entry import TimeEntry
from app.models.invoice import Invoice
from app.models.client import Client

router = APIRouter(tags=["Chatbot"])

class ChatRequest(BaseModel):
    message: str

def get_bot_response(message: str, db: Session, user_id: int) -> str:
    msg = message.lower().strip()

    # ── Greetings ──
    if any(w in msg for w in ["hi", "hello", "hey", "greet", "good"]):
        return ("Hello! I'm your FWT Assistant 👋\n"
                "I can help you with:\n"
                "• Project status\n"
                "• Task overview\n"
                "• Revenue & invoices\n"
                "• Time tracking\n"
                "• Client list")

    # ── Projects ──
    if any(w in msg for w in ["project", "projects", "work"]):
        projects = db.query(Project).filter(Project.user_id == user_id).all()
        if not projects:
            return "You don't have any projects yet. Go to the Projects page to add one!"
        active    = [p for p in projects if p.status == "active"]
        completed = [p for p in projects if p.status == "completed"]
        on_hold   = [p for p in projects if p.status == "on_hold"]
        resp = f"You have {len(projects)} project(s) in total:\n"
        if active:    resp += f"✅ Active ({len(active)}): " + ", ".join(p.title for p in active) + "\n"
        if on_hold:   resp += f"⏸ On Hold ({len(on_hold)}): " + ", ".join(p.title for p in on_hold) + "\n"
        if completed: resp += f"🏁 Completed ({len(completed)}): " + ", ".join(p.title for p in completed)
        return resp.strip()

    # ── Tasks ──
    if any(w in msg for w in ["task", "tasks", "todo", "pending", "complete", "done"]):
        tasks = db.query(Task).filter(Task.user_id == user_id).all()
        if not tasks:
            return "No tasks found. Go to the Tasks page to create one!"
        todo   = [t for t in tasks if t.status == "todo"]
        inprog = [t for t in tasks if t.status == "in_progress"]
        done   = [t for t in tasks if t.status == "done"]
        return (f"Here's your task overview:\n"
                f"📌 To Do: {len(todo)}\n"
                f"⚡ In Progress: {len(inprog)}\n"
                f"✅ Completed: {len(done)}\n"
                f"📊 Total: {len(tasks)} tasks")

    # ── Revenue / Invoice ──
    if any(w in msg for w in ["revenue", "earning", "income", "invoice", "invoices", "payment", "paid", "money", "billing"]):
        invoices = db.query(Invoice).filter(Invoice.user_id == user_id).all()
        if not invoices:
            return "No invoices found yet. Go to the Invoices page to create one!"
        total_earned = sum(float(i.total_amount or 0) for i in invoices if i.status == "paid")
        pending      = sum(float(i.total_amount or 0) for i in invoices if i.status != "paid")
        drafts       = len([i for i in invoices if i.status == "draft"])
        sent         = len([i for i in invoices if i.status == "sent"])
        paid         = len([i for i in invoices if i.status == "paid"])
        return (f"💰 Your earnings summary:\n"
                f"Total Earned: ${total_earned:.2f}\n"
                f"Pending Amount: ${pending:.2f}\n"
                f"─────────────\n"
                f"📄 Draft: {drafts} | Sent: {sent} | Paid: {paid}\n"
                f"Total Invoices: {len(invoices)}")

    # ── Hours / Time ──
    if any(w in msg for w in ["hour", "hours", "time", "tracked", "week", "tracking"]):
        today      = date.today()
        week_start = today - timedelta(days=today.weekday())
        entries    = db.query(TimeEntry).join(Task).filter(Task.user_id == user_id).all()
        week_entries = [e for e in entries if e.date and str(e.date) >= str(week_start)]
        total_secs   = sum(e.duration_seconds or 0 for e in entries)
        week_secs    = sum(e.duration_seconds or 0 for e in week_entries)
        total_hrs = round(total_secs / 3600, 1)
        week_hrs  = round(week_secs / 3600, 1)
        return (f"⏱ Time Tracking Summary:\n"
                f"This Week: {week_hrs} hours\n"
                f"All Time: {total_hrs} hours\n"
                f"Sessions: {len(entries)} total")

    # ── Clients ──
    if any(w in msg for w in ["client", "clients", "customer", "customers"]):
        clients = db.query(Client).filter(Client.user_id == user_id).all()
        if not clients:
            return "No clients found. Go to the Clients page to add one!"
        client_list = "\n".join(
            f"👤 {c.name}" + (f" — {c.company}" if c.company else "")
            for c in clients
        )
        return f"You have {len(clients)} client(s):\n{client_list}"

    # ── Summary / Overview ──
    if any(w in msg for w in ["summary", "overview", "status", "report", "all"]):
        projects = db.query(Project).filter(Project.user_id == user_id).all()
        tasks    = db.query(Task).filter(Task.user_id == user_id).all()
        invoices = db.query(Invoice).filter(Invoice.user_id == user_id).all()
        clients  = db.query(Client).filter(Client.user_id == user_id).all()
        earned   = sum(float(i.total_amount or 0) for i in invoices if i.status == "paid")
        pending_tasks = len([t for t in tasks if t.status == "todo"])
        return (f"📊 Your FWT Overview:\n"
                f"Projects: {len(projects)} total\n"
                f"Tasks: {len(tasks)} ({pending_tasks} pending)\n"
                f"Clients: {len(clients)}\n"
                f"Revenue: ${earned:.2f} earned\n"
                f"Invoices: {len(invoices)} total")

    # ── Help ──
    if any(w in msg for w in ["help", "what", "can", "?"]):
        return ("I can answer questions like:\n"
                "📁 'What is my project status?'\n"
                "✅ 'How many tasks are pending?'\n"
                "💰 'What are my total earnings?'\n"
                "⏱ 'How many hours did I work this week?'\n"
                "👥 'Who are my clients?'\n"
                "📊 'Give me a summary'")

    # ── Default ──
    return ("I didn't quite understand that. Try asking:\n"
            "• 'What is my project status?'\n"
            "• 'How many tasks are pending?'\n"
            "• 'What are my total earnings?'\n"
            "• 'Give me a summary'")


@router.post("/message")
def chat_message(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    response = get_bot_response(payload.message, db, current_user.id)
    return {"reply": response}