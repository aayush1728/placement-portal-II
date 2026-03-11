# PlaceHub — Placement Portal Application V2

> **App Development II Project — Jan 2026**  
> A full-stack campus recruitment management system built with Flask, Vue 3, Redis, and Celery.

---

## Problem Statement

Institutes currently rely on spreadsheets, emails, and manual coordination to manage campus placements — making it difficult to track company approvals, placement drives, student registrations, and application statuses efficiently.

**PlaceHub** solves this by providing a centralised web platform where:
- The **Institute Admin** can manage and approve companies, drives, and students from a single dashboard
- **Companies** can register, post placement drives, and track applicants through the hiring pipeline
- **Students** can browse eligible drives, apply, track their application status, and export their placement history

---

## Features Implemented

### Core Features
- **Role-Based Authentication** — JWT token-based login for Admin, Company, and Student roles. Admin is pre-seeded at startup (no registration route). Companies require admin approval before login.
- **Admin Dashboard** — Live stats (total students, companies, drives, applications) cached in Redis for fast load times. Admin can approve/reject company registrations and placement drives, search students and companies, and blacklist or deactivate any account.
- **Company Dashboard** — Companies can create placement drives (only after admin approval), view applicant lists, and update each student's status through the hiring pipeline — Applied → Shortlisted → Selected/Rejected.
- **Student Dashboard** — Students can browse all approved drives with eligibility-based filtering, apply to drives, track their application status in real time, and view their full placement history.
- **Eligibility Validation** — CGPA requirement is enforced at the API level before a student can apply. Duplicate applications are prevented both at the API level and by a database UniqueConstraint.
- **Resume Upload** — Students can upload their resume (PDF/DOC/DOCX). File type is validated server-side.
- **Profile Management** — Students can edit their profile (name, branch, CGPA, phone) with CGPA range validation (0–10).

### Background Jobs (Celery + Redis)
| Job | Type | Schedule | Description |
|-----|------|----------|-------------|
| Daily Deadline Reminders | Scheduled | Every 24 hours | Emails students about drives closing within the next 3 days |
| Monthly Activity Report | Scheduled | Every 30 days | Emails admin an HTML report with monthly placement stats |
| CSV Export | User-triggered | On demand | Generates and emails a CSV of a student's full application history |

### Performance & Caching
- Admin dashboard stats cached in Redis for **60 seconds**
- Approved drives list cached in Redis for **120 seconds**
- Cache is invalidated automatically on any status change

### Validation
- Backend validation on all forms — required fields, email format, CGPA range (0–10), year range (1–4), password minimum length
- Frontend validation using HTML5 form attributes and Vue reactive checks
- Server returns clean error messages (no 500 crashes on missing fields)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend API | Flask 3.0 + Flask-JWT-Extended |
| Database | SQLite + Flask-SQLAlchemy |
| Frontend | Vue 3 (CDN) + Bootstrap 5 |
| Cache | Redis |
| Background Jobs | Celery + Celery Beat |
| Email | Flask-Mail + Gmail SMTP |

---

## Project Structure

```
placement_portal_II/
├── backend/
│   ├── app.py              # Flask app factory + admin seed
│   ├── models.py           # SQLAlchemy ORM models (5 tables)
│   ├── extensions.py       # Redis cache instance
│   ├── routes/
│   │   ├── auth.py         # Login, register (student & company), /me
│   │   ├── admin.py        # Admin management endpoints
│   │   ├── company.py      # Company drive & application endpoints
│   │   └── student.py      # Student browse, apply, profile endpoints
│   ├── tasks/
│   │   ├── celery_app.py   # Celery config + beat schedule
│   │   └── jobs.py         # 3 background task definitions
│   └── uploads/            # Student resume files
└── frontend/
    └── index.html          # Complete Vue 3 SPA (no build step needed)
```

---

## Database Models

| Model | Table | Description |
|-------|-------|-------------|
| User | `users` | Unified user table for all 3 roles |
| Student | `students` | Academic profile linked to User |
| Company | `companies` | Company profile linked to User |
| PlacementDrive | `placement_drives` | Job drives created by companies |
| Application | `applications` | Student-to-drive application records |

---

## API Endpoints

### Auth (`/api/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/login` | Login — returns JWT token |
| POST | `/register/student` | Student self-registration |
| POST | `/register/company` | Company self-registration |
| GET | `/me` | Get current logged-in user profile |

### Admin (`/api/admin`) — Admin JWT required
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | Stats dashboard (Redis cached 60s) |
| GET | `/companies?q=` | List / search companies |
| POST | `/companies/:id/action` | approve, reject, blacklist, deactivate, delete |
| GET | `/students?q=` | List / search students |
| POST | `/students/:id/action` | blacklist, deactivate, delete |
| GET | `/drives` | All drives (all statuses) |
| POST | `/drives/:id/action` | approve or reject a drive |
| GET | `/applications` | All applications system-wide |

### Company (`/api/company`) — Company JWT required
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | Company profile + drives summary |
| POST | `/drives` | Create placement drive |
| PUT | `/drives/:id` | Edit drive details |
| DELETE | `/drives/:id` | Delete drive |
| POST | `/drives/:id/close` | Close drive to new applications |
| GET | `/drives/:id/applications` | View all applicants for a drive |
| PUT | `/applications/:id/status` | Update application status |

### Student (`/api/student`) — Student JWT required
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/drives?q=` | Browse approved drives (Redis cached 120s) |
| POST | `/apply/:id` | Apply to a drive |
| GET | `/applications` | My applications |
| GET | `/history` | Full placement history |
| GET | `/profile` | Get profile |
| PUT | `/profile` | Update profile |
| POST | `/profile/resume` | Upload resume file |
| POST | `/export-csv` | Trigger async CSV export |
| GET | `/export-status/:task_id` | Poll CSV export progress |

---

## Setup & Running

### Prerequisites
- Python 3.10+ with a conda environment
- Redis installed and running (`redis-cli ping` → `PONG`)

### 1. Install Dependencies
```bash
cd backend
pip install Flask==3.0.0 Flask-SQLAlchemy==3.1.1 Flask-JWT-Extended==4.6.0
pip install Flask-Cors==4.0.0 Werkzeug==3.0.1 redis==5.0.1
pip install celery==5.3.6 Flask-Mail==0.9.1 python-dotenv
```

### 2. Configure Email (Optional)
Create `backend/.env`:
```
MAIL_USERNAME=yourgmail@gmail.com
MAIL_PASSWORD=your_16_char_app_password
```
Generate an App Password at: Gmail → Security → 2-Step Verification → App Passwords

### 3. Run the Application (4 terminals)

**Terminal 1 — Flask API:**
```bash
cd backend
python app.py
```
API runs at: `http://localhost:5000`  
Admin auto-created: `admin@placement.com` / `admin123`

**Terminal 2 — Celery Worker:**
```bash
cd backend
celery -A tasks.celery_app.celery worker --loglevel=info --pool=solo
```

**Terminal 3 — Celery Beat:**
```bash
cd backend
celery -A tasks.celery_app.celery beat --loglevel=info
```

**Browser — Frontend:**  
Open `frontend/index.html` via VS Code Live Server  
No build step needed — Vue 3 is loaded via CDN.

---

## Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@placement.com | admin123 |
| Company | Register via the app | — |
| Student | Register via the app | — |