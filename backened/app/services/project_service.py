from sqlalchemy.orm import Session
from app.models.project import Project

def create_project(
    db: Session,
    user_id: int,
    client_id: int,
    title: str,
    description: str = None,
    hourly_rate: float = None,
    status: str = None
):
    project = Project(
        user_id=user_id,
        client_id=client_id,
        title=title,
        description=description,
        hourly_rate=hourly_rate,
        status=status
    )

    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def get_projects(db: Session, user_id: int):
    return db.query(Project).filter(Project.user_id == user_id).all()


def get_project(db: Session, project_id: int, user_id: int):
    return db.query(Project).filter(Project.id == project_id, Project.user_id == user_id).first()


def delete_project(db: Session, project_id: int, user_id: int):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == user_id).first()

    if project:
        db.delete(project)
        db.commit()

    return project