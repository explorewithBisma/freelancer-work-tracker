# FWT — Freelancer Work Tracker

Developed by Bisma Noreen — solo Final Year Project, BS IT, University of Gujrat (2026).
Full stack (FastAPI + React + Groq AI) designed and built independently.

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
| Database  | MySQL or PostgreSQL (via SQLAlchemy) |
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
- A database — either MySQL 8+ (good for local dev) or PostgreSQL 14+ (good for free-tier deployment on Neon/Supabase/Koyeb, since free MySQL hosting without a credit card is scarce). The app supports both — see Database setup below.
- A [Groq API key](https://console.groq.com) — needed for the AI chatbot features

### 1. Backend setup

```bash
cd backened
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

pip install -r requirements.txt
```

`requirements.txt` already includes everything needed — notably `email-validator` (required by Pydantic's `EmailStr` fields; the app won't start without it), a pinned `bcrypt==4.0.1` (newer `bcrypt` releases break password hashing under the `passlib` version this project uses), and both database drivers (`pymysql` for MySQL, `psycopg2-binary` for PostgreSQL) so either works without installing anything extra.

### 2. Configure environment variables

Create `backened/.env` (this file is **git-ignored — never commit it**, see note at the bottom):

```env
# MySQL (local dev):
DATABASE_URL=mysql+pymysql://<db_user>:<db_password>@127.0.0.1:3306/freelancer_work_tracker

# PostgreSQL (e.g. Neon/Supabase, for deployment) — use this format instead:
# DATABASE_URL=postgresql://<db_user>:<db_password>@<host>:5432/<db_name>

SECRET_KEY=<a-long-random-secret-string>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
GROQ_API_KEY=<your-groq-api-key>
GROQ_MODEL=openai/gpt-oss-20b
```

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | Yes | SQLAlchemy connection string — MySQL or PostgreSQL, see Database section. Use a dedicated app user, not `root`/a superuser. |
| `SECRET_KEY` | Yes | Signs JWTs. Any long random string — e.g. `python -c "import secrets; print(secrets.token_hex(32))"`. |
| `ALGORITHM` | Yes | JWT signing algorithm. Leave as `HS256` unless you have a reason to change it. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Yes | How long login tokens stay valid. |
| `GROQ_API_KEY` | Yes | Powers all three AI chatbots (landing, freelancer, client portal). |
| `GROQ_MODEL` | No | Defaults to `openai/gpt-oss-20b` if omitted. Override to point at a different Groq model. |

### 3. Database setup

The app works against either MySQL or PostgreSQL — SQLAlchemy abstracts the difference, and both drivers are already in `requirements.txt`. Pick one.

**Option A — MySQL (local dev)**

Create a dedicated database and app user — avoid using `root` for the running app:

```sql
CREATE DATABASE freelancer_work_tracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'fwt_user'@'localhost' IDENTIFIED BY '<a-strong-password>';
GRANT ALL PRIVILEGES ON freelancer_work_tracker.* TO 'fwt_user'@'localhost';
FLUSH PRIVILEGES;
```

```
DATABASE_URL=mysql+pymysql://fwt_user:<a-strong-password>@127.0.0.1:3306/freelancer_work_tracker
```

**Option B — PostgreSQL (e.g. Neon, Supabase, Koyeb — good for free-tier deployment)**

Create a database and app user (adjust to whatever your provider's dashboard/CLI gives you — most managed Postgres providers create the database and a user for you and just hand you a connection string):

```sql
CREATE DATABASE freelancer_work_tracker;
CREATE USER fwt_user WITH PASSWORD '<a-strong-password>';
GRANT ALL PRIVILEGES ON DATABASE freelancer_work_tracker TO fwt_user;
```

```
DATABASE_URL=postgresql://fwt_user:<a-strong-password>@<host>:5432/freelancer_work_tracker
```

Neon and Supabase often hand you a `postgres://...` URL — `app/database.py` automatically normalizes that to `postgresql://...` (SQLAlchemy 1.4+ requires the longer form), so either works.

**Then, regardless of which database you chose:**

Put the credentials into `DATABASE_URL` in `.env`, then create the tables:

```bash
python create_tables.py
```

**There is no Alembic migration setup in this project.** `create_tables.py` simply calls SQLAlchemy's `Base.metadata.create_all()` — it creates whatever tables don't exist yet and leaves existing tables untouched, regardless of which database engine is behind `DATABASE_URL`. It's safe to re-run, but it will **not** pick up schema changes to a table that already exists (no column diffing, no `ALTER`). If you change a model later, you'll need to either hand-write the `ALTER` statement for whichever database you're running, or introduce a real migration tool yourself. (`Database/fwt database.sql` in the repo root is old MySQL-only history from before this file supported Postgres — see the header comment in that file — not something to run today.)

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

**Bisma Noreen** sole developer
University of Gujrat — Final Year Project (FYP), 2026

- GitHub: [@explorewithBisma](https://github.com/explorewithBisma)

---

## License

MIT License © 2026 Bisma Noreen — see [LICENSE](LICENSE) for details.
Any copy or fork must keep the original copyright notice.
