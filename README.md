# FWT — Freelancer Work Tracker

A full-stack web application designed to help freelancers manage their projects, tasks, time tracking, invoices, and client relationships in one place.

---

## Features

### Freelancer Dashboard
- Real-time overview of projects, tasks, hours, and revenue
- Productivity ring and weekly goal tracker
- Activity chart with monthly breakdown
- Notifications for pending tasks and unpaid invoices

### Project Management
- Create, edit, and delete projects
- Link projects to clients
- Filter by status: Active, On Hold, Completed

### Task Management
- Kanban board: To Do, In Progress, Done
- Priority levels: High, Medium, Low
- Integrated stopwatch for real-time time tracking per task

### Time Tracking
- Auto-save from stopwatch on task cards
- Manual time entry support
- View all sessions with notes and durations

### Invoice Management
- Generate invoices linked to clients and projects
- Status workflow: Draft, Sent, Paid
- PDF preview and browser print support

### Client Management
- Add and manage clients with contact details
- Set client portal access via email and password
- Automated portal invitation email sent to client

### Client Portal
- Separate login for clients
- View assigned project progress with visual progress bars
- View invoice status and pending amounts
- Built-in chatbot assistant for project-related queries

### Chatbot Assistant
- Rule-based assistant available for both freelancer and client
- Responds to queries about projects, tasks, revenue, hours, and clients
- Floating widget accessible on all authenticated pages

### Settings
- Update profile: name, email, phone, bio
- Change password with strength indicator
- Configure default currency and tax rate for invoices

---

## Tech Stack

| Layer          | Technology              |
|----------------|-------------------------|
| Frontend       | React.js, CSS3          |
| Backend        | FastAPI (Python)        |
| Database       | MySQL                   |
| Authentication | JWT (JSON Web Tokens)   |
| Email          | Gmail SMTP              |
| Version Control| Git and GitHub          |

---

## Project Structure

```
freelancer-work-tracker/
├── backend/
│   ├── app/
│   │   ├── models/          # SQLAlchemy database models
│   │   ├── routes/          # FastAPI route handlers
│   │   ├── schemas/         # Pydantic request/response schemas
│   │   ├── services/        # Business logic layer
│   │   ├── config.py        # Application configuration
│   │   ├── database.py      # Database connection setup
│   │   └── dependencies.py  # Auth and DB dependencies
│   └── main.py
│
└── frontend/
    └── src/
        ├── api/             # Axios API service calls
        ├── auth/            # Authentication context
        ├── components/      # Reusable components (Layout, ChatWidget)
        └── pages/           # All application page components
```

---

## Getting Started

### Prerequisites
- Python 3.10 or higher
- Node.js 18 or higher
- MySQL 8.0 or higher

### Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

### Environment Variables

Create a `.env` file inside the `backend/` directory:

```
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
DATABASE_URL=mysql+pymysql://root:password@localhost/freelancer_work_tracker
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_gmail_app_password
FRONTEND_URL=http://localhost:3000
```

---

## API Documentation

Once the backend is running, visit:

```
http://localhost:8000/docs
```

FastAPI provides interactive Swagger UI documentation for all endpoints.

---

## Academic Context

This project was developed as a Final Year Project (FYP) for the degree of BS Software Engineering at the University of Lahore.

- Developer: Bisma Noreen
- Session: 2022 - 2026

---

## License

This project is developed for academic purposes only.