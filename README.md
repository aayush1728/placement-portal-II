# Placement Portal V2 — App Dev II

## Tech Stack
- **Backend**: Flask + Flask-JWT-Extended + Flask-SQLAlchemy + Flask-Mail
- **Frontend**: Vue 3 (CDN) + Bootstrap 5
- **Database**: SQLite
- **Cache**: Redis
- **Background Jobs**: Celery + Redis

---

## Setup Instructions

### 1. Install Redis (required for Celery)
**Ubuntu/WSL:**
```bash
sudo apt install redis-server
sudo service redis-server start
```
**Mac:**
```bash
brew install redis && brew services start redis
```
**Verify:** `redis-cli ping` → should return `PONG`

### 2. Backend Setup
```bash
cd backend
pip install -r requirements.txt
```

**Optional: Set mail credentials (for email features)**
```bash
export MAIL_USERNAME=your_gmail@gmail.com
export MAIL_PASSWORD=your_app_password
```
(Gmail → Security → App Passwords to generate one)

### 3. Run the Flask API
```bash
cd backend
python app.py
```
API runs at: http://localhost:5000
Admin auto-created: **admin@placement.com / admin123**

### 4. Run Celery Worker (background jobs)
Open a new terminal:
```bash
cd backend
celery -A tasks.celery_app.celery worker --loglevel=info
```

### 5. Run Celery Beat (scheduled jobs)
Open another terminal:
```bash
cd backend
celery -A tasks.celery_app.celery beat --loglevel=info
```

### 6. Open the Frontend
Just open `frontend/index.html` directly in your browser.
No build step needed — uses Vue 3 via CDN.

---

## API Endpoints

### Auth (`/api/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/login` | Login (returns JWT token) |
| POST | `/register/student` | Student registration |
| POST | `/register/company` | Company registration |
| GET | `/me` | Get current user profile |

### Admin (`/api/admin`) — JWT required
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | Stats (cached 60s) |
| GET | `/companies?q=` | List/search companies |
| POST | `/companies/:id/action` | approve/reject/blacklist/delete |
| GET | `/students?q=` | List/search students |
| POST | `/students/:id/action` | blacklist/deactivate/delete |
| GET | `/drives` | All drives |
| POST | `/drives/:id/action` | approve/reject |
| GET | `/applications` | All applications |

### Company (`/api/company`) — JWT required
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | Company + drives |
| POST | `/drives` | Create drive |
| PUT | `/drives/:id` | Edit drive |
| DELETE | `/drives/:id` | Delete drive |
| POST | `/drives/:id/close` | Close drive |
| GET | `/drives/:id/applications` | View applicants |
| PUT | `/applications/:id/status` | Update status |

### Student (`/api/student`) — JWT required
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/drives?q=` | List approved drives (cached) |
| POST | `/apply/:id` | Apply to drive |
| GET | `/applications` | My applications |
| GET | `/history` | Placement history |
| GET | `/profile` | Get profile |
| PUT | `/profile` | Update profile |
| POST | `/profile/resume` | Upload resume |
| POST | `/export-csv` | Trigger CSV export (async) |
| GET | `/export-status/:task_id` | Check export status |

---

## Background Jobs

| Job | Type | Trigger | Description |
|-----|------|---------|-------------|
| Daily Reminders | Scheduled | Every 24h | Emails students about drives closing in 3 days |
| Monthly Report | Scheduled | Every 30 days | Emails admin an HTML activity report |
| CSV Export | User-triggered | Student clicks Export | Generates CSV of application history, emails it |

---

## Project Structure
```
ppa_v2/
├── backend/
│   ├── app.py              # Flask factory, Redis setup
│   ├── models.py           # SQLAlchemy models
│   ├── requirements.txt
│   ├── uploads/            # Resume files
│   ├── routes/
│   │   ├── auth.py
│   │   ├── admin.py
│   │   ├── company.py
│   │   └── student.py
│   └── tasks/
│       ├── celery_app.py   # Celery config + beat schedule
│       └── jobs.py         # 3 background tasks
└── frontend/
    └── index.html          # Single-page Vue 3 app (no build needed)
```
