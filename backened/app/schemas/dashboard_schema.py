from pydantic import BaseModel
from typing import List


class RecentTaskItem(BaseModel):
    title: str
    project_title: str
    status: str
    hours: float


class ActivityItem(BaseModel):
    month: str
    hours: float


class DashboardSummaryResponse(BaseModel):
    # ── 4 Cards ──
    total_projects: int
    total_tasks: int
    total_clients: int
    total_invoices: int
    hours_this_week: float
    pending_invoices_amount: float
    pending_invoices_count: int

    # ── Productivity ──
    completed_tasks: int
    productivity_pct: int

    # ── Weekly Goal ──
    weekly_hours_target: int
    weekly_goal_pct: int

    # ── Recent Tasks ──
    recent_tasks: List[RecentTaskItem]

    # ── Priority Alert ──
    todo_tasks_count: int

    # ── Activity Graph ──
    activity_data: List[ActivityItem]

    class Config:
        orm_mode = True