from datetime import datetime, timedelta
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.project import Project
from app.models.task import Task
from app.models.time_entry import TimeEntry
from app.models.invoice import Invoice
from app.models.client import Client


def get_dashboard_summary(db: Session, user_id: int):
    today = datetime.utcnow().date()

    # ── Get user's project & task IDs ──
    user_project_ids = [
        p.id for p in db.query(Project.id).filter(Project.user_id == user_id).all()
    ]
    user_task_ids = [
        t.id for t in db.query(Task.id).filter(Task.user_id == user_id).all()
    ]

    # ── 4 Cards ──
    total_projects = db.query(Project).filter(Project.user_id == user_id).count()
    total_tasks    = db.query(Task).filter(Task.user_id == user_id).count()
    total_clients  = db.query(Client).filter(Client.user_id == user_id).count()
    total_invoices = db.query(Invoice).filter(Invoice.user_id == user_id).count()

    # Hours this week (Mon → today)
    week_start  = today - timedelta(days=today.weekday())
    week_dates  = [
        (week_start + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(7)
    ]
    hours_this_week = 0.0
    if user_task_ids:
        secs = db.query(func.sum(TimeEntry.duration_seconds)).filter(
            TimeEntry.task_id.in_(user_task_ids),
            TimeEntry.date.in_(week_dates)
        ).scalar()
        hours_this_week = round((secs or 0) / 3600, 1)

    # Pending invoices
    pending_invoices = db.query(Invoice).filter(
        Invoice.user_id == user_id,
        Invoice.status != "paid"
    ).all()
    pending_invoices_amount = sum(float(inv.total_amount or 0) for inv in pending_invoices)
    pending_invoices_count  = len(pending_invoices)

    # ── Productivity ──
    completed_tasks  = db.query(Task).filter(
        Task.user_id == user_id, Task.status == "done"
    ).count()
    productivity_pct = round((completed_tasks / total_tasks * 100) if total_tasks > 0 else 0)

    # ── Weekly Goal (target 35h) ──
    weekly_hours_target = 35
    weekly_goal_pct     = min(round((hours_this_week / weekly_hours_target) * 100), 100)

    # ── Recent Tasks (last 3) ──
    recent_raw = (
        db.query(Task, Project.title.label("project_title"))
        .join(Project, Task.project_id == Project.id)
        .filter(Task.user_id == user_id)
        .order_by(Task.created_at.desc())
        .limit(3)
        .all()
    )
    recent_tasks = []
    for task, project_title in recent_raw:
        task_secs = db.query(func.sum(TimeEntry.duration_seconds)).filter(
            TimeEntry.task_id == task.id
        ).scalar() or 0
        recent_tasks.append({
            "title":         task.title,
            "project_title": project_title or "No Project",
            "status":        task.status,
            "hours":         round(task_secs / 3600, 1),
        })

    # ── Priority Alert — tasks not done ──
    todo_tasks_count = db.query(Task).filter(
        Task.user_id == user_id,
        Task.status.in_(["todo", "in_progress"])
    ).count()

    # ── Activity Graph (last 9 months) ──
    activity_data = []
    for i in range(8, -1, -1):
        month_date  = (today.replace(day=1) - timedelta(days=i * 30))
        month_str   = month_date.strftime("%Y-%m")
        month_label = month_date.strftime("%b")

        month_hours = 0.0
        if user_task_ids:
            secs = db.query(func.sum(TimeEntry.duration_seconds)).filter(
                TimeEntry.task_id.in_(user_task_ids),
                TimeEntry.date.like(f"{month_str}%")
            ).scalar()
            month_hours = round((secs or 0) / 3600, 1)

        activity_data.append({"month": month_label, "hours": month_hours})

    return {
        "total_projects":          total_projects,
        "total_tasks":             total_tasks,
        "total_clients":           total_clients,
        "total_invoices":          total_invoices,
        "hours_this_week":         hours_this_week,
        "pending_invoices_amount": pending_invoices_amount,
        "pending_invoices_count":  pending_invoices_count,
        "completed_tasks":         completed_tasks,
        "productivity_pct":        productivity_pct,
        "weekly_hours_target":     weekly_hours_target,
        "weekly_goal_pct":         weekly_goal_pct,
        "recent_tasks":            recent_tasks,
        "todo_tasks_count":        todo_tasks_count,
        "activity_data":           activity_data,
    }