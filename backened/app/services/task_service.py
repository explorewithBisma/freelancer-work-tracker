from sqlalchemy.orm import Session
from app.models.task import Task

def create_task(
    db: Session,
    user_id: int,
    project_id: int,
    title: str,
    description: str = None,
    status: str = "todo",
    priority: str = "medium",  # ✅ NEW
):
    task = Task(
        user_id=user_id,
        project_id=project_id,
        title=title,
        description=description,
        status=status,
        priority=priority,  # ✅ NEW
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def get_tasks(db: Session, user_id: int):
    return db.query(Task).filter(Task.user_id == user_id).all()


def get_task(db: Session, task_id: int, user_id: int):
    return db.query(Task).filter(Task.id == task_id, Task.user_id == user_id).first()


def update_task_status(db: Session, task_id: int, user_id: int, new_status: str):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user_id).first()
    if task:
        task.status = new_status
        db.commit()
        db.refresh(task)
    return task


def delete_task(db: Session, task_id: int, user_id: int):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user_id).first()
    if task:
        db.delete(task)
        db.commit()
        return True
    return False