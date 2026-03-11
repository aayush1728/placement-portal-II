from tasks.celery_app import celery
import csv, io, os
from datetime import datetime, timedelta

def get_app():
    """Lazy import to avoid circular deps."""
    import sys
    sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
    from app import create_app
    return create_app()


@celery.task(name='tasks.jobs.send_deadline_reminders')
def send_deadline_reminders():
    """Send email reminders to students about drives closing in the next 3 days."""
    flask_app = get_app()
    with flask_app.app_context():
        from models import PlacementDrive, Application, Student, User
        from flask_mail import Mail, Message
        mail = Mail(flask_app)

        today = datetime.utcnow().date()
        cutoff = today + timedelta(days=3)

        upcoming = PlacementDrive.query.filter(
            PlacementDrive.status == 'approved',
            PlacementDrive.application_deadline <= str(cutoff),
            PlacementDrive.application_deadline >= str(today)
        ).all()

        if not upcoming:
            return 'No upcoming deadlines.'

        students = Student.query.join(User).filter(User.is_active == True, User.is_blacklisted == False).all()
        count = 0
        for student in students:
            applied_ids = {a.drive_id for a in student.applications}
            relevant = [d for d in upcoming if d.id not in applied_ids]
            if not relevant:
                continue
            body_lines = [f"<li><strong>{d.job_title}</strong> at {d.company.company_name} — Deadline: {d.application_deadline}</li>" for d in relevant]
            html = f"""
            <h2>Placement Portal — Deadline Reminders</h2>
            <p>Hi {student.name}, the following drives are closing soon:</p>
            <ul>{''.join(body_lines)}</ul>
            <p>Log in now to apply before they close!</p>
            """
            try:
                msg = Message("⏰ Upcoming Placement Drive Deadlines",
                              recipients=[student.user.email], html=html)
                mail.send(msg)
                count += 1
            except Exception as e:
                print(f"Failed to email {student.user.email}: {e}")
        return f'Reminders sent to {count} students.'


@celery.task(name='tasks.jobs.send_monthly_report')
def send_monthly_report():
    """Generate and email monthly placement report to admin."""
    flask_app = get_app()
    with flask_app.app_context():
        from models import PlacementDrive, Application, Student, Company, User
        from flask_mail import Mail, Message
        mail = Mail(flask_app)

        now = datetime.utcnow()
        month_start = now.replace(day=1, hour=0, minute=0, second=0)

        drives_count = PlacementDrive.query.filter(PlacementDrive.created_at >= month_start).count()
        apps = Application.query.filter(Application.application_date >= month_start).all()
        selected_count = sum(1 for a in apps if a.status == 'selected')
        new_students = Student.query.join(User).filter(User.created_at >= month_start).count()
        new_companies = Company.query.join(User).filter(User.created_at >= month_start).count()

        html = f"""
        <!DOCTYPE html><html><head><style>
        body {{ font-family: Arial, sans-serif; background: #f5f5f5; }}
        .card {{ background: white; border-radius: 8px; padding: 20px; margin: 10px; display: inline-block; min-width: 150px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,.1); }}
        .num {{ font-size: 2rem; font-weight: bold; color: #0d6efd; }}
        table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
        th {{ background: #0d6efd; color: white; padding: 10px; }}
        td {{ padding: 8px; border: 1px solid #dee2e6; }}
        </style></head><body>
        <div style="max-width:700px;margin:auto;padding:30px;">
          <h1 style="color:#1a1a2e;">📊 Monthly Placement Report</h1>
          <p style="color:#6c757d;">{now.strftime('%B %Y')} — Generated on {now.strftime('%d %b %Y')}</p>
          <div>
            <div class="card"><div class="num">{drives_count}</div><div>Drives Created</div></div>
            <div class="card"><div class="num">{len(apps)}</div><div>Applications</div></div>
            <div class="card"><div class="num">{selected_count}</div><div>Students Selected</div></div>
            <div class="card"><div class="num">{new_students}</div><div>New Students</div></div>
            <div class="card"><div class="num">{new_companies}</div><div>New Companies</div></div>
          </div>
          <h3 style="margin-top:30px;">Application Status Breakdown</h3>
          <table>
            <tr><th>Status</th><th>Count</th></tr>
            {"".join(f"<tr><td>{s.title()}</td><td>{sum(1 for a in apps if a.status == s)}</td></tr>" for s in ['applied','shortlisted','selected','rejected'])}
          </table>
        </div></body></html>
        """

        admin = User.query.filter_by(role='admin').first()
        if admin:
            try:
                msg = Message(f"📊 Monthly Placement Report — {now.strftime('%B %Y')}",
                              recipients=[admin.email], html=html)
                mail.send(msg)
                return f'Monthly report sent to {admin.email}'
            except Exception as e:
                return f'Failed: {e}'
        return 'No admin found.'



@celery.task(name='tasks.jobs.export_csv_task', bind=True)
def export_csv_task(self, student_id):
    """Export student's application history as CSV and email it."""
    flask_app = get_app()
    with flask_app.app_context():
        from models import Application, Student
        from flask_mail import Mail, Message
        mail = Mail(flask_app)

        student = Student.query.get(student_id)
        if not student:
            return {'error': 'Student not found'}

        apps = Application.query.filter_by(student_id=student_id).all()

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(['Application ID', 'Student ID', 'Student Name', 'Roll Number',
                         'Company Name', 'Drive Title', 'Package (LPA)', 'Application Status',
                         'Application Date'])
        for a in apps:
            writer.writerow([
                a.id, student.id, student.name, student.roll_number,
                a.drive.company.company_name if a.drive and a.drive.company else 'N/A',
                a.drive.job_title if a.drive else 'N/A',
                a.drive.package_lpa if a.drive else 'N/A',
                a.status,
                a.application_date.strftime('%Y-%m-%d')
            ])

        csv_content = output.getvalue()
        filename = f'applications_{student.roll_number}_{datetime.utcnow().strftime("%Y%m%d")}.csv'

        try:
            msg = Message(
                subject='✅ Your Application History Export is Ready',
                recipients=[student.user.email],
                body=f'Hi {student.name},\n\nYour application history CSV is attached.\n\nPlacement Portal'
            )
            msg.attach(filename, 'text/csv', csv_content)
            mail.send(msg)
            return {'status': 'done', 'filename': filename, 'records': len(apps)}
        except Exception as e:
            return {'status': 'done_no_email', 'error': str(e), 'csv': csv_content}
