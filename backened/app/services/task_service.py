from sqlalchemy.orm import Session
from app.models.task import Task

def create_task(
    db: Session,
    user_id: int,  # Added: Link task to the logged-in user
    project_id: int,
    title: str,
    description: str = None,
    status: str = "todo"
):
    task = Task(
        user_id=user_id,
        project_id=project_id,
        title=title,
        description=description,
        status=status
    )

    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def get_tasks(db: Session, user_id: int):
    # FIXED: Now takes 2 arguments and filters by user_id
    return db.query(Task).filter(Task.user_id == user_id).all()


def get_task(db: Session, task_id: int, user_id: int):
    # Security: Ensure the task belongs to the user
    return db.query(Task).filter(Task.id == task_id, Task.user_id == user_id).first()


def update_task_status(db: Session, task_id: int, user_id: int, new_status: str):
    """
    Finds the task by ID and User ID, then updates its status.
    """
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
        return True # Return success
    
    return False