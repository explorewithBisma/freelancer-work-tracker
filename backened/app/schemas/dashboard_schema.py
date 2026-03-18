from pydantic import BaseModel

class DashboardSummaryResponse(BaseModel):
    total_clients: int
    total_projects: int
    total_tasks: int
    total_time_entries: int
    total_invoices: int
    total_conversations: int
    total_messages: int