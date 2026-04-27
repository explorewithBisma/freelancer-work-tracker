# 🚀 FWT — Freelancer Work Tracker

A full-stack web application for freelancers to manage projects, track time, generate invoices, and collaborate with clients — all in one clean dashboard.

---

## 🌟 Features

### 👨‍💻 Freelancer Dashboard
- **Project Management** — Create, edit, filter and close projects with deadlines
- **Task Management** — Kanban board (To Do → In Progress → Done) with priority levels
- **Time Tracking** — Real-time stopwatch with localStorage persistence + manual entries
- **Invoice Generation** — Auto-generated invoices with PDF preview and status tracking (Draft → Sent → Paid)
- **Client Management** — Add clients, view detailed client pages with stats
- **Settings** — Profile, password, currency & tax preferences
- **AI Chatbot** — Powered by Gemma 3-27B, answers questions about your real-time data

### 👥 Client Portal
- Secure JWT-based client login (isolated per freelancer)
- View assigned projects with progress bars
- View invoices with PDF preview & print
- AI-powered Portal Assistant chatbot
- Data isolation — same client email, different freelancers = different data

### 🌐 Landing Page
- Responsive landing page with hero section
- FAQ + AI-powered chatbot (Gemma 3-4B, fast responses)
- Feature showcase, footer with contact info

---

## 🛠️ Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Frontend  | React 18, React Router, Axios     |
| Backend   | FastAPI, SQLAlchemy, Uvicorn      |
| Database  | MySQL                             |
| Auth      | JWT (JSON Web Tokens)             |
| AI        | Google Gemma (via Google AI Studio) |
| Email     | SMTP (Gmail)                      |
| Styling   | Custom CSS, Responsive Design     |

---

## 📁 Project Structure

```
freelancer-work-tracker/
├── frontend/                  # React App
│   ├── src/
│   │   ├── pages/             # All page components
│   │   │   ├── landing.jsx
│   │   │   ├── LandingChatWidget.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Clients.jsx
│   │   │   ├── ClientDetail.jsx
│   │   │   ├── Projects.jsx
│   │   │   ├── Tasks.jsx
│   │   │   ├── TimeEntries.jsx
│   │   │   ├── Invoices.jsx
│   │   │   ├── Settings.jsx
│   │   │   ├── clientportal.jsx
│   │   │   └── ClientChatWidget.jsx
│   │   ├── components/        # Shared components
│   │   │   ├── layout.jsx
│   │   │   └── ChatWidget.jsx
│   │   └── api/               # Axios API calls
│   └── public/
│
└── backened/                  # FastAPI App
    └── app/
        ├── routes/            # API endpoints
        │   ├── auth.py
        │   ├── clients.py
        │   ├── projects.py
        │   ├── tasks.py
        │   ├── time_entries.py
        │   ├── invoices.py
        │   ├── dashboard.py
        │   ├── settings.py
        │   ├── chat.py
        │   └── clientportal.py
        ├── models/            # SQLAlchemy models
        ├── schemas/           # Pydantic schemas
        ├── services/          # Business logic
        └── main.py
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js 18+
- Python 3.11+
- MySQL 8+
- Google AI Studio API Key

### Backend Setup

```bash
cd backened
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Fill in: DB_URL, SECRET_KEY, API_KEY, EMAIL credentials
```

### Database Setup

```sql
CREATE DATABASE freelancer_db;
```

```bash
# Run migrations
alembic upgrade head

# Or create tables directly
python -c "from app.database import Base, engine; Base.metadata.create_all(bind=engine)"
```

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

### Running the App

```bash
# Terminal 1 — Backend
cd backened
uvicorn app.main:app --reload

# Terminal 2 — Frontend
cd frontend
npm start
```

Visit: `http://localhost:3000`

---

## 🔐 Environment Variables

Create `backened/.env`:

```env
DATABASE_URL=mysql+pymysql://root:password@localhost/freelancer_db
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
API_KEY=your-google-ai-studio-key
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

---

## 📱 Responsive Design

Fully responsive across all screen sizes:

| Breakpoint | Size |
|------------|------|
| Extra Small | < 380px |
| Small | < 480px |
| Medium | < 768px |
| Large | < 1024px |
| Extra Large | 1024px+ |

---

## 🤖 AI Chatbots

| Bot | Model | Auth Required |
|-----|-------|---------------|
| Landing Bot | Gemma 3-4B (fast) | No |
| Freelancer Bot | Gemma 3-27B | Yes (JWT) |
| Client Portal Bot | Gemma 3-27B | Yes (Client JWT) |

---

## 👩‍💻 Developer

**Bisma Noreen**
University of Lahore — Final Year Project (FYP)

---

## 📄 License

This project is for educational purposes.
