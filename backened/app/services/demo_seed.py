"""Create or reset the public demo freelancer and its sample data.

Safety: every delete/insert is scoped to the demo user's id. Other users' data is
never read or written. The user row itself is kept (stable id), so open demo
sessions survive a reset.
"""
import random
import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.demo import DEMO_USER_NAME, demo_client_email, demo_user_email
from app.models.client import Client
from app.models.invoice import Invoice
from app.models.project import Project
from app.models.task import Task
from app.models.time_entry import TimeEntry
from app.models.user import User
from app.services.auth_service import hash_password

# (name, company, email, phone) — the first client is the one with demo client-portal access
def _clients():
    return [
        ("Northwind Studio", "Northwind Studio Ltd", demo_client_email(), "+1 555 0101"),
        ("Brightside Bakery", "Brightside Bakery Co.", "hello@brightside-bakery.example.com", "+1 555 0102"),
        ("Orbit Fitness", "Orbit Fitness Inc.", "team@orbit-fitness.example.com", "+1 555 0103"),
        ("Lumen Law Partners", "Lumen Law LLP", "office@lumen-law.example.com", "+1 555 0104"),
    ]


# (client index, title, description, hourly rate, status)
PROJECTS = [
    (0, "Northwind Website Redesign", "Modern, responsive redesign of the marketing site.", 65, "active"),
    (0, "Northwind Brand Style Guide", "Logo usage, colours and typography guide.", 55, "completed"),
    (1, "Brightside Online Ordering", "Online ordering and pickup scheduling for the bakery.", 70, "active"),
    (2, "Orbit Mobile App MVP", "Workout tracking MVP, paused until funding is confirmed.", 85, "on_hold"),
    (3, "Lumen Legal Portal", "Secure document portal for Lumen's clients.", 75, "completed"),
]

# project index -> [(title, status, priority)]
TASKS = {
    0: [("Homepage wireframes", "done", "high"), ("Design system & components", "done", "medium"),
        ("Build responsive layout", "in_progress", "high"), ("Contact form + validation", "todo", "medium"),
        ("SEO & performance pass", "todo", "low")],
    1: [("Logo variations", "done", "medium"), ("Colour palette & typography", "done", "medium"),
        ("Write usage guidelines", "done", "low")],
    2: [("Menu & product data model", "done", "high"), ("Cart and checkout flow", "in_progress", "high"),
        ("Pickup time slots", "in_progress", "medium"), ("Order confirmation emails", "todo", "medium")],
    3: [("User research summary", "done", "medium"), ("Workout logging screens", "in_progress", "high"),
        ("Push notification spec", "todo", "low")],
    4: [("Auth & roles", "done", "high"), ("Document upload & storage", "done", "high"),
        ("Audit log", "done", "medium"), ("Launch checklist", "done", "low")],
}

NOTES = ["Planning & research", "Implementation", "Review with client", "Bug fixing", "Design iteration",
         "Meeting & feedback", "Testing", "Documentation", "Refactoring"]

# project index -> (invoice suffix, status, days ago issued, share of project hours billed)
INVOICES = [
    (1, "paid", 70, 1.0), (4, "paid", 28, 1.0), (0, "sent", 6, 0.6), (2, "draft", 1, 0.5), (3, "sent", 14, 1.0),
]


def _delete_demo_data(db: Session, uid: int) -> None:
    """Remove all data owned by the demo user (FK-safe order). Only this user_id."""
    p = {"u": uid}
    for sql in [
        "DELETE FROM messages WHERE conversation_id IN (SELECT id FROM conversations WHERE user_id = :u)",
        "DELETE FROM conversations WHERE user_id = :u",
        "DELETE FROM invoices WHERE user_id = :u",
        "DELETE FROM time_entries WHERE task_id IN (SELECT id FROM tasks WHERE user_id = :u)",
        "DELETE FROM tasks WHERE user_id = :u",
        "DELETE FROM projects WHERE user_id = :u",
        "DELETE FROM clients WHERE user_id = :u",
        "DELETE FROM user_settings WHERE user_id = :u",
        "DELETE FROM demo_chat_usage WHERE user_id = :u",   # resets the daily chat counter
    ]:
        db.execute(text(sql), p)


def seed_demo(db: Session) -> dict:
    """Idempotent: creates the demo user if missing, otherwise resets it. Commits once."""
    rng = random.Random(2026)  # deterministic shape; dates are relative to today
    now = datetime.now(timezone.utc).replace(tzinfo=None, microsecond=0)
    today = now.date()

    email = demo_user_email()
    user = db.query(User).filter(User.email == email).first()
    # Unguessable password: login is only possible through /auth/demo-login.
    unusable_hash = hash_password(secrets.token_urlsafe(40))
    if user is None:
        user = User(full_name=DEMO_USER_NAME, email=email, password_hash=unusable_hash,
                    phone="+1 555 0100", bio="Freelance web designer & developer. This is a demo account.")
        db.add(user)
        db.flush()
    else:
        user.full_name, user.password_hash = DEMO_USER_NAME, unusable_hash
        user.phone = "+1 555 0100"
        user.bio = "Freelance web designer & developer. This is a demo account."
        db.flush()
    uid = user.id

    _delete_demo_data(db, uid)

    clients = []
    for name, company, c_email, phone in _clients():
        # Every demo client gets an unusable password, so "portal access" exists
        # but only /client-portal/demo-login can open it.
        c = Client(user_id=uid, name=name, company=company, email=c_email, phone=phone,
                   password_hash=hash_password(secrets.token_urlsafe(40)),
                   created_at=now - timedelta(days=rng.randint(60, 200)))
        clients.append(c)
    db.add_all(clients)
    db.flush()

    projects = []
    for ci, title, desc, rate, status in PROJECTS:
        projects.append(Project(user_id=uid, client_id=clients[ci].id, title=title, description=desc,
                                hourly_rate=rate, status=status, created_at=now - timedelta(days=rng.randint(20, 120))))
    db.add_all(projects)
    db.flush()

    tasks = []  # (Task, project index)
    for pi, items in TASKS.items():
        for k, (title, status, priority) in enumerate(items):
            tasks.append((Task(user_id=uid, project_id=projects[pi].id, title=title, status=status, priority=priority,
                               description=f"{title} for {PROJECTS[pi][1]}.",
                               created_at=now - timedelta(days=rng.randint(1, 40), hours=k)), pi))
    db.add_all([t for t, _ in tasks])
    db.flush()

    # Time entries: dense over the last ~5 weeks (weekdays), always including today and
    # yesterday so "hours this week" is non-zero, plus sparse older work for the 9-month chart.
    entries, hours_by_project = [], {i: 0.0 for i in range(len(PROJECTS))}
    workable = [(t, pi) for t, pi in tasks if t.status in ("done", "in_progress")]

    def add_entry(offset_days: int):
        t, pi = rng.choice(workable)
        secs = rng.choice([1800, 2700, 3600, 5400, 7200, 9000, 10800])
        day = today - timedelta(days=offset_days)
        entries.append(TimeEntry(task_id=t.id, duration_seconds=secs, date=day.strftime("%Y-%m-%d"),
                                 note=rng.choice(NOTES), created_at=datetime.combine(day, datetime.min.time()) + timedelta(hours=14)))
        hours_by_project[pi] += secs / 3600

    for offset in (0, 0, 1):
        add_entry(offset)
    for offset in range(1, 36):
        if (today - timedelta(days=offset)).weekday() < 5:
            for _ in range(rng.choice([1, 1, 2])):
                add_entry(offset)
    for offset in range(40, 250, 9):
        add_entry(offset)
    db.add_all(entries)
    db.flush()

    # Invoices: amount = billed share of the project's logged hours x its rate
    invoices = []
    for n, (pi, status, days_ago, share) in enumerate(INVOICES, start=1):
        proj = projects[pi]
        amount = round(hours_by_project[pi] * share * float(proj.hourly_rate), 2)
        issued = today - timedelta(days=days_ago)
        invoices.append(Invoice(user_id=uid, client_id=proj.client_id, project_id=proj.id, project_name=proj.title,
                                invoice_number=f"DEMO-INV-{n:04d}", date_from=issued - timedelta(days=30), date_to=issued,
                                total_amount=amount, status=status, created_at=now - timedelta(days=days_ago)))
    db.add_all(invoices)
    db.commit()

    return {"user_id": uid, "clients": len(clients), "projects": len(projects), "tasks": len(tasks),
            "time_entries": len(entries), "invoices": len(invoices)}
