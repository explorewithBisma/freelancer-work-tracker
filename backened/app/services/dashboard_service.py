from sqlalchemy.orm import Session
from app.models.client import Client
from app.models.project import Project
from app.models.task import Task
from app.models.time_entry import TimeEntry
from app.models.invoice import Invoice
from app.models.conversation import Conversation
from app.models.message import Message

def get_dashboard_summary(db: Session, user_id: int):
    total_clients = db.query(Client).filter(Client.user_id == user_id).count()
    total_projects = db.query(Project).filter(Project.user_id == user_id).count()
    total_invoices = db.query(Invoice).filter(Invoice.user_id == user_id).count()
    total_conversations = db.query(Conversation).filter(Conversation.user_id == user_id).count()

    user_project_ids = [p.id for p in db.query(Project.id).filter(Project.user_id == user_id).all()]
    user_conversation_ids = [c.id for c in db.query(Conversation.id).filter(Conversation.user_id == user_id).all()]

    total_tasks = 0
    total_time_entries = 0
    total_messages = 0

    if user_project_ids:
        total_tasks = db.query(Task).filter(Task.project_id.in_(user_project_ids)).count()

        task_ids = [t.id for t in db.query(Task.id).filter(Task.project_id.in_(user_project_ids)).all()]
        if task_ids:
            total_time_entries = db.query(TimeEntry).filter(TimeEntry.task_id.in_(task_ids)).count()

    if user_conversation_ids:
        total_messages = db.query(Message).filter(Message.conversation_id.in_(user_conversation_ids)).count()

    return {
        "total_clients": total_clients,
        "total_projects": total_projects,
        "total_tasks": total_tasks,
        "total_time_entries": total_time_entries,
        "total_invoices": total_invoices,
        "total_conversations": total_conversations,
        "total_messages": total_messages,
    }