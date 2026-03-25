from sqlalchemy.orm import Session
from app.models.task import Task

def create_task(
    db: Session,
    project_id: int,
    title: str,
    description: str = None,
    status: str = "todo"
):
    task = Task(
        project_id=project_id,
        title=title,
        description=description,
        status=status
    )

    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def get_tasks(db: Session):
    return db.query(Task).all()


def get_task(db: Session, task_id: int):
    return db.query(Task).filter(Task.id == task_id).first()

# --- NEW UPDATE FUNCTION ADDED HERE ---
def update_task_status(db: Session, task_id: int, new_status: str):
    """
    Finds the task by ID and updates its status in the database.
    """
    task = db.query(Task).filter(Task.id == task_id).first()
    
    if task:
        task.status = new_status
        db.commit()
        db.refresh(task)  # This refreshes the object with the new data from the DB
        
    return task


def delete_task(db: Session, task_id: int):
    task = db.query(Task).filter(Task.id == task_id).first()

    if task:
        db.delete(task)
        db.commit()

    return task