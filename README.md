# FWT — Freelancer Work Tracker

A full-stack web application for freelancers to manage projects, track time, generate invoices, and collaborate with clients — all in one clean dashboard.

> **Note on folder naming:** the backend lives in `backened/` (not `backend/`) — that's a pre-existing typo baked into the project layout, not a typo in this README. Every command below uses the real folder name so copy-paste works.

---

## Features

### Freelancer Dashboard
- **Project Management** — Create, edit, filter and close projects with deadlines
- **Task Management** — Kanban board (To Do → In Progress → Done) with priority levels
- **Time Tracking** — Real-time stopwatch with localStorage persistence + manual entries
- **Invoice Generation** — Auto-generated invoices with PDF preview and status tracking (Draft → Sent → Paid)
- **Client Management** — Add clients, view detailed client pages with stats
- **Settings** — Profile, password, currency & tax preferences
- **AI Chatbot** — Answers questions about your real-time data, powered by Groq

### Client Portal
- Client login (isolated per freelancer)
- View assigned projects with progress bars
- View invoices with PDF preview & print
- AI-powered Portal Assistant chatbot
- Data isolation — same client email, different freelancers = different data

### Landing Page
- Responsive landing page with hero section
- FAQ + AI-powered chatbot
- Feature showcase, footer with contact info

---

## Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Frontend  | React 19, React Router, Axios     |
| Backend   | FastAPI, SQLAlchemy, Uvicorn      |
| Database  | MySQL                             |
| Auth      | JWT (JSON Web Tokens)             |
| AI        | Groq API (`openai/gpt-oss-20b` by default) |
| Styling   | Custom CSS, Responsive Design     |

---

## Project Structure

```
freelancer-work-tracker/
├── frontend/                  # React App
│   ├── src/
│   │   ├── pages/             # All page components
│   │   ├── components/        # Shared components
│   │   └── api/                # Axios API calls
│   └── public/
│
└── backened/                  # FastAPI App (folder name has a typo — see note above)
    ├── app/
    │   ├── routes/            # API endpoints
    │   ├── models/            # SQLAlchemy models
    │   ├── schemas/           # Pydantic schemas
    │   ├── services/          # Business logic
    │   └── main.py
    ├── create_tables.py       # One-time table creation (see Database section)
    └── requirements.txt
```

---

## Setup & Installation

### Prerequisites
- Python 3.11+
- Node.js 18+
- MySQL 8+
- A [Groq API key](https://console.groq.com) — needed for the AI chatbot features

### 1. Backend setup

```bash
cd backened
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

pip install -r requirements.txt
```

`requirements.txt` already includes everything needed — notably `email-validator` (required by Pydantic's `EmailStr` fields; the app won't start without it) and a pinned `bcrypt==4.0.1` (newer `bcrypt` releases break password hashing under the `passlib` version this project uses).

### 2. Configure environment variables

Create `backened/.env` (this file is **git-ignored — never commit it**, see note at the bottom):

```env
DATABASE_URL=mysql+pymysql://<db_user>:<db_password>@127.0.0.1:3306/freelancer_work_tracker
SECRET_KEY=<a-long-random-secret-string>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
GROQ_API_KEY=<your-groq-api-key>
GROQ_MODEL=openai/gpt-oss-20b
```

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | Yes | SQLAlchemy connection string. Use a dedicated MySQL user, not `root` (see Database section). |
| `SECRET_KEY` | Yes | Signs JWTs. Any long random string — e.g. `python -c "import secrets; print(secrets.token_hex(32))"`. |
| `ALGORITHM` | Yes | JWT signing algorithm. Leave as `HS256` unless you have a reason to change it. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Yes | How long login tokens stay valid. |
| `GROQ_API_KEY` | Yes | Powers all three AI chatbots (landing, freelancer, client portal). |
| `GROQ_MODEL` | No | Defaults to `openai/gpt-oss-20b` if omitted. Override to point at a different Groq model. |

### 3. Database setup

Create a dedicated MySQL database and app user — avoid using `root` for the running app:

```sql
CREATE DATABASE freelancer_work_tracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'fwt_user'@'localhost' IDENTIFIED BY '<a-strong-password>';
GRANT ALL PRIVILEGES ON freelancer_work_tracker.* TO 'fwt_user'@'localhost';
FLUSH PRIVILEGES;
```

Put those credentials into `DATABASE_URL` above, then create the tables:

```bash
python create_tables.py
```

**There is no Alembic migration setup in this project.** `create_tables.py` simply calls SQLAlchemy's `Base.metadata.create_all()` — it creates whatever tables don't exist yet and leaves existing tables untouched. It's safe to re-run, but it will **not** pick up schema changes to a table that already exists (no column diffing, no `ALTER`). If you change a model later, you'll need to either hand-write the `ALTER TABLE` (see `Database/fwt database.sql` for examples of that style) or introduce a real migration tool yourself.

### 4. Run the backend

```bash
uvicorn app.main:app --reload
```

API runs at `http://127.0.0.1:8000`, interactive docs at `http://127.0.0.1:8000/docs`.

### 5. Frontend setup

```bash
cd frontend
npm install
npm start
```

Visit `http://localhost:3000`.

---

## Secrets & `.env`

`backened/.env` holds real credentials (DB password, JWT signing key, Groq API key) and is listed in `.gitignore` — **never commit it**. Before committing anything in this repo, it's worth running `git status` first: `.gitignore` only stops a file from being tracked the *first* time; it has no effect once a file is already tracked, so double-check nothing in `.env` shows up staged.

---

## Responsive Design

Fully responsive across all screen sizes:

| Breakpoint | Size |
|------------|------|
| Extra Small | < 380px |
| Small | < 480px |
| Medium | < 768px |
| Large | < 1024px |
| Extra Large | 1024px+ |

---

## AI Chatbots

All three chatbots share one Groq model (`GROQ_MODEL`, defaults to `openai/gpt-oss-20b`):

| Bot | Endpoint |
|-----|----------|
| Landing Bot | `POST /chat/landing-message` |
| Freelancer Bot | `POST /chat/message` |
| Client Portal Bot | `POST /chat/client-message` |

---

## Developer

**Bisma Noreen**
University of Gujrat — Final Year Project (FYP)

---

## License

This project is for educational purposes.
