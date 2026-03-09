"""
Background jobs powered by Celery + Redis.
  1. export_applications_csv  – user-triggered async CSV export
  2. send_deadline_reminders  – daily scheduled job
  3. send_monthly_report      – monthly scheduled job (1st of each month)
"""
import csv
import io
import os
from datetime import datetime, timedelta
from celery import Celery
from celery.schedules import crontab


def make_celery(app):
    celery = Celery(app.import_name)
    celery.conf.update(
        broker_url=app.config['CELERY_BROKER_URL'],
        result_backend=app.config['CELERY_RESULT_BACKEND'],
        task_serializer='json',
        result_serializer='json',
        accept_content=['json'],
        timezone='Asia/Kolkata',
        beat_schedule={
            'daily-deadline-reminders': {
                'task': 'tasks.jobs.send_deadline_reminders',
                'schedule': crontab(hour=8, minute=0),  # 8 AM daily
            },
            'monthly-activity-report': {
                'task': 'tasks.jobs.send_monthly_report',
                'schedule': crontab(hour=7, minute=0, day_of_month=1),  # 1st of each month
            },
        },
    )
    celery.conf.update(app.config)

    class ContextTask(celery.Task):
        def __call__(self, *args, **kwargs):
            with app.app_context():
                return self.run(*args, **kwargs)

    celery.Task = ContextTask
    return celery


# This module-level celery instance is replaced when the app is created.
celery_app = None


# ──────────────────────── Task: CSV Export ────────────────────────

def export_applications_csv(student_id, student_email):
    """Async task: generate a CSV of the student's application history and email it."""
    from extensions import mail, db
    from models import StudentProfile, Application
    from flask_mail import Message

    student = StudentProfile.query.get(student_id)
    if not student:
        return {'error': 'Student not found'}

    apps = student.applications.order_by(Application.applied_at.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        'Application ID', 'Student ID', 'Company Name',
        'Drive Title', 'Job Type', 'Location', 'Package (LPA)',
        'Application Status', 'Applied Date', 'Last Updated'
    ])

    for app in apps:
        writer.writerow([
            app.id,
            student_id,
            app.drive.company.company_name,
            app.drive.job_title,
            app.drive.job_type,
            app.drive.location or 'N/A',
            app.drive.package_lpa or 'N/A',
            app.status,
            app.applied_at.strftime('%Y-%m-%d %H:%M'),
            app.updated_at.strftime('%Y-%m-%d %H:%M'),
        ])

    csv_content = output.getvalue()
    output.close()

    # Email the CSV
    try:
        msg = Message(
            subject='Placement Portal – Your Application History Export',
            recipients=[student_email],
            body=(
                f'Dear {student.full_name},\n\n'
                'Please find your placement application history attached as a CSV file.\n\n'
                'Best regards,\nPlacement Portal Team'
            ),
        )
        msg.attach(
            filename='placement_history.csv',
            content_type='text/csv',
            data=csv_content,
        )
        mail.send(msg)
        return {'status': 'success', 'records': len(apps), 'email': student_email}
    except Exception as exc:
        # Even if mail fails, return the CSV content so the task shows success data
        return {'status': 'email_failed', 'error': str(exc), 'records': len(apps)}


# ──────────────────────── Task: Daily Deadline Reminders ────────────────────────

def send_deadline_reminders():
    """Daily job: email students about drives whose deadline is within 3 days."""
    from extensions import mail, db
    from models import PlacementDrive, StudentProfile, Application
    from flask_mail import Message

    cutoff = datetime.utcnow() + timedelta(days=3)
    upcoming_drives = PlacementDrive.query.filter(
        PlacementDrive.status == 'approved',
        PlacementDrive.application_deadline <= cutoff,
        PlacementDrive.application_deadline >= datetime.utcnow(),
    ).all()

    if not upcoming_drives:
        return {'reminded': 0}

    students = StudentProfile.query.join(StudentProfile.user).filter_by(
        is_active=True, is_blacklisted=False
    ).all()

    reminded = 0
    for student in students:
        applied_ids = {a.drive_id for a in student.applications.all()}
        relevant = []
        for drive in upcoming_drives:
            if drive.id in applied_ids:
                continue
            # Quick eligibility check
            if drive.eligible_branches:
                allowed = [b.strip().lower() for b in drive.eligible_branches.split(',')]
                if student.branch.lower() not in allowed:
                    continue
            if drive.min_cgpa and student.cgpa < drive.min_cgpa:
                continue
            relevant.append(drive)

        if not relevant:
            continue

        lines = [f'  • {d.job_title} at {d.company.company_name} — deadline {d.application_deadline.strftime("%d %b %Y")}'
                 for d in relevant]
        body = (
            f'Dear {student.full_name},\n\n'
            'The following placement drives are closing soon. Don\'t miss out!\n\n'
            + '\n'.join(lines)
            + '\n\nLog in to the Placement Portal to apply.\n\nBest,\nPlacement Cell'
        )
        try:
            msg = Message(
                subject='[Placement Portal] Upcoming Drive Deadlines – Act Now!',
                recipients=[student.user.email],
                body=body,
            )
            mail.send(msg)
            reminded += 1
        except Exception:
            pass

    return {'reminded': reminded, 'drives_checked': len(upcoming_drives)}


# ──────────────────────── Task: Monthly Report ────────────────────────

def send_monthly_report():
    """First of every month: generate and email an HTML report to admin."""
    from extensions import mail, db
    from models import PlacementDrive, Application, User
    from flask_mail import Message

    now = datetime.utcnow()
    prev_month = (now.replace(day=1) - timedelta(days=1))
    month_str = prev_month.strftime('%Y-%m')
    month_label = prev_month.strftime('%B %Y')

    drives = PlacementDrive.query.filter(
        db.func.strftime('%Y-%m', PlacementDrive.created_at) == month_str
    ).all()
    apps = Application.query.filter(
        db.func.strftime('%Y-%m', Application.applied_at) == month_str
    ).all()
    selected = [a for a in apps if a.status == 'selected']

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
    <meta charset='utf-8'>
    <style>
      body {{ font-family: Arial, sans-serif; color: #333; }}
      h1 {{ color: #1a237e; }} h2 {{ color: #283593; border-bottom: 1px solid #ccc; }}
      .stat-box {{ display:inline-block; background:#e8eaf6; padding:16px 24px;
                  border-radius:8px; margin:8px; text-align:center; }}
      .stat-box .num {{ font-size:2em; font-weight:bold; color:#1a237e; }}
      table {{ border-collapse:collapse; width:100%; }}
      th {{ background:#3949ab; color:#fff; padding:8px; }}
      td {{ padding:8px; border:1px solid #ddd; }}
      tr:nth-child(even) {{ background:#f5f5f5; }}
    </style>
    </head>
    <body>
    <h1>📊 Monthly Placement Activity Report</h1>
    <p><strong>Period:</strong> {month_label}</p>
    <p><strong>Generated on:</strong> {now.strftime('%d %B %Y %H:%M UTC')}</p>

    <h2>Summary</h2>
    <div>
      <div class='stat-box'><div class='num'>{len(drives)}</div><div>Drives Posted</div></div>
      <div class='stat-box'><div class='num'>{len(apps)}</div><div>Applications</div></div>
      <div class='stat-box'><div class='num'>{len(selected)}</div><div>Students Selected</div></div>
    </div>

    <h2>Drives Conducted</h2>
    {'<p>No drives this month.</p>' if not drives else ''}
    """

    if drives:
        html += """
        <table>
          <tr><th>#</th><th>Company</th><th>Job Title</th><th>Type</th>
              <th>Deadline</th><th>Status</th><th>Applicants</th></tr>
        """
        for i, d in enumerate(drives, 1):
            html += (
                f"<tr><td>{i}</td><td>{d.company.company_name}</td>"
                f"<td>{d.job_title}</td><td>{d.job_type}</td>"
                f"<td>{d.application_deadline.strftime('%d %b %Y')}</td>"
                f"<td>{d.status}</td><td>{d.applications.count()}</td></tr>"
            )
        html += "</table>"

    html += "</body></html>"

    admin_user = User.query.filter_by(role='admin').first()
    if not admin_user:
        return {'error': 'Admin not found'}

    try:
        msg = Message(
            subject=f'[Placement Portal] Monthly Activity Report – {month_label}',
            recipients=[admin_user.email],
            html=html,
            body=f'Monthly placement report for {month_label}. Please view in an HTML-compatible email client.',
        )
        mail.send(msg)
        return {'status': 'sent', 'month': month_label, 'drives': len(drives)}
    except Exception as exc:
        return {'status': 'failed', 'error': str(exc)}
