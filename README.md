# 🎓 Placement Portal Application (PPA)

A full-featured campus recruitment management system built with **Flask**, **Vue.js 3**, **SQLite**, **Redis**, and **Celery**.

---

## 📁 Project Structure

```
placement_portal/
├── backend/
│   ├── app.py               ← Flask application factory + entry point
│   ├── config.py            ← Environment-based configuration
│   ├── extensions.py        ← Flask extension instances
│   ├── models.py            ← SQLAlchemy models (User, Student, Company, Drive, Application)
│   ├── celery_worker.py     ← Celery worker entry point
│   ├── requirements.txt
│   ├── routes/
│   │   ├── auth.py          ← Login, register (student/company)
│   │   ├── admin.py         ← Admin management endpoints
│   │   ├── company.py       ← Company dashboard, drives, applications
│   │   └── student.py       ← Student dashboard, drives, profile, CSV export
│   ├── tasks/
│   │   └── jobs.py          ← Celery tasks (CSV export, daily reminders, monthly report)
│   └── uploads/             ← Resume storage (auto-created)
├── frontend/
│   ├── index.html           ← Jinja2 entry point (loads Vue 3 via CDN)
│   └── src/
│       ├── store.js         ← Reactive auth store
│       ├── api.js           ← Axios API wrapper
│       ├── router.js        ← Vue Router 4
│       ├── main.js          ← App bootstrap
│       └── components/
│           ├── common/      ← Navbar, Toast
│           ├── auth/        ← Login, Student Register, Company Register
│           ├── admin/       ← Dashboard, Companies, Students, Drives, Applications
│           ├── company/     ← Dashboard, Drives, Drive Form, Applications
│           └── student/     ← Dashboard, Browse Drives, My Applications, Profile
├── run.py                   ← Quick-start server
└── .env.example             ← Environment variable template
```

---

## ⚡ Quick Start

### 1. Prerequisites
- Python 3.10+
- Redis (running on `localhost:6379`)
- Node.js (not required — Vue uses CDN)

### 2. Install Python dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 3. Configure environment
```bash
cp .env.example .env
# Edit .env with your mail credentials
```

### 4. Start Redis
```bash
redis-server
```

### 5. Run the Flask server
```bash
cd ..          # back to placement_portal/
python run.py
```
Visit: **http://localhost:5000**

### 6. Start Celery worker (background jobs)
```bash
cd backend
celery -A celery_worker.celery worker --loglevel=info
```

### 7. Start Celery Beat scheduler (scheduled jobs)
```bash
cd backend
celery -A celery_worker.celery beat --loglevel=info
```

---

## 🔐 Default Admin Credentials
| Field    | Value                    |
|----------|--------------------------|
| Email    | admin@placement.edu      |
| Password | Admin@2026               |

The admin account is automatically seeded on the first run.

---

## 🔗 API Endpoints

### Auth
| Method | Endpoint                     | Description            |
|--------|------------------------------|------------------------|
| POST   | `/api/auth/login`            | Login (all roles)      |
| POST   | `/api/auth/register/student` | Student registration   |
| POST   | `/api/auth/register/company` | Company registration   |
| GET    | `/api/auth/me`               | Get current user       |

### Admin (`/api/admin/`)
| Method | Endpoint                             | Description               |
|--------|--------------------------------------|---------------------------|
| GET    | `/dashboard`                         | Stats + monthly chart      |
| GET    | `/companies`                         | List/search companies      |
| PUT    | `/companies/<id>/approve`            | Approve company            |
| PUT    | `/companies/<id>/reject`             | Reject company             |
| PUT    | `/companies/<id>/blacklist`          | Toggle blacklist           |
| GET    | `/students`                          | List/search students       |
| PUT    | `/students/<id>/blacklist`           | Toggle blacklist           |
| PUT    | `/students/<id>/deactivate`          | Toggle activation          |
| GET    | `/drives`                            | List/filter drives         |
| PUT    | `/drives/<id>/approve`               | Approve drive              |
| PUT    | `/drives/<id>/reject`                | Reject drive               |
| GET    | `/applications`                      | All applications           |
| GET    | `/reports/monthly`                   | Monthly stats              |

### Company (`/api/company/`)
| Method | Endpoint                             | Description               |
|--------|--------------------------------------|---------------------------|
| GET    | `/dashboard`                         | Company dashboard stats   |
| GET    | `/drives`                            | List own drives            |
| POST   | `/drives`                            | Create drive              |
| PUT    | `/drives/<id>`                       | Update drive              |
| PUT    | `/drives/<id>/close`                 | Close drive               |
| GET    | `/drives/<id>/applications`          | Drive applicants           |
| PUT    | `/applications/<id>/status`          | Update applicant status    |
| PUT    | `/profile`                           | Update company profile     |

### Student (`/api/student/`)
| Method | Endpoint                             | Description               |
|--------|--------------------------------------|---------------------------|
| GET    | `/dashboard`                         | Student dashboard         |
| GET    | `/drives`                            | Browse eligible drives     |
| GET    | `/drives/<id>`                       | Drive detail              |
| POST   | `/drives/<id>/apply`                 | Apply to drive            |
| GET    | `/applications`                      | My applications            |
| PUT    | `/profile`                           | Update profile            |
| POST   | `/profile/resume`                    | Upload resume             |
| POST   | `/export-csv`                        | Trigger CSV export (async) |
| GET    | `/export-csv/status/<task_id>`       | Check export status        |

---

## ⚙️ Background Jobs (Celery)

| Job | Trigger | Description |
|-----|---------|-------------|
| `export_applications_csv` | User-triggered | Generates and emails application history CSV |
| `send_deadline_reminders` | Daily @ 8 AM | Emails students about drives closing in 3 days |
| `send_monthly_report` | 1st of month @ 7 AM | Emails admin an HTML activity report |

---

## 🛠️ Tech Stack
- **Backend:** Flask 3, Flask-SQLAlchemy, Flask-JWT-Extended, Flask-Caching, Flask-Mail
- **Database:** SQLite (via SQLAlchemy ORM — programmatically created)
- **Cache:** Redis via Flask-Caching
- **Queue:** Celery + Redis
- **Frontend:** Vue.js 3 (CDN), Vue Router 4, Axios, Bootstrap 5, Chart.js
- **Styling:** Bootstrap 5 only (no other CSS framework)
