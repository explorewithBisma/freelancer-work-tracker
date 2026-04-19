from pydantic import BaseModel
from typing import Optional
from enum import Enum


class TaskStatus(str, Enum):
    todo        = "todo"
    in_progress = "in_progress"
    done        = "done"


class TaskPriority(str, Enum):
    low    = "low"
    medium = "medium"
    high   = "high"


class TaskCreate(BaseModel):
    project_id:  int
    title:       str
    description: Optional[str] = None
    status:      TaskStatus    = TaskStatus.todo
    priority:    TaskPriority  = TaskPriority.medium


class TaskOut(BaseModel):
    id:          int
    project_id:  int
    user_id:     int
    title:       str
    description: Optional[str] = None
    status:      str
    priority:    str = "medium"

    class Config:
        orm_mode = True


class TaskUpdate(BaseModel):
    title:       Optional[str]          = None
    description: Optional[str]          = None
    status:      Optional[TaskStatus]   = None
    priority:    Optional[TaskPriority] = None
    project_id:  Optional[int]          = None

# ✅ FIX: Alias so tasks.py route can import TaskResponse
TaskResponse = TaskOut