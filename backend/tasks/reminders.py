import requests
from datetime import datetime, timedelta
from extensions import celery_app, mail, db
from flask_mail import Message


@celery_app.task(name="tasks.reminders.send_deadline_reminders")
def send_deadline_reminders():
    """Send email/webhook reminders to students about upcoming deadlines (within 3 days)."""
    from models import PlacementDrive, Application, StudentProfile
    from flask import current_app

    cutoff = datetime.utcnow() + timedelta(days=3)
    upcoming = PlacementDrive.query.filter(
        PlacementDrive.status == "approved",
        PlacementDrive.application_deadline <= cutoff,
        PlacementDrive.application_deadline >= datetime.utcnow(),
    ).all()

    if not upcoming:
        return "No upcoming deadlines."

    # Notify all students who haven't applied
    for drive in upcoming:
        applied_ids = {a.student_id for a in drive.applications.all()}
        students = StudentProfile.query.all()
        for sp in students:
            if sp.id in applied_ids:
                continue
            # Check eligibility before spamming
            if drive.min_cgpa and sp.cgpa < drive.min_cgpa:
                continue

            try:
                msg = Message(
                    subject=f"[Placement Portal] Deadline Reminder: {drive.job_title} at {drive.company.company_name}",
                    recipients=[sp.user.email],
                    html=f"""
                    <h3>📅 Application Deadline Approaching</h3>
                    <p>Hi {sp.full_name},</p>
                    <p>The application deadline for <strong>{drive.job_title}</strong> at
                    <strong>{drive.company.company_name}</strong> is on
                    <strong>{drive.application_deadline.strftime('%d %b %Y')}</strong>.</p>
                    <p>Package: ₹{drive.package_lpa} LPA | Location: {drive.location}</p>
                    <p>Log in to the Placement Portal to apply before the deadline.</p>
                    <br><small>Institute Placement Portal</small>
                    """,
                )
                mail.send(msg)
            except Exception as e:
                print(f"[Reminder] Failed to email {sp.user.email}: {e}")

    # Optional: Google Chat Webhook
    webhook = current_app.config.get("GCHAT_WEBHOOK_URL", "")
    if webhook:
        drive_list = "\n".join([f"• {d.job_title} @ {d.company.company_name} — deadline {d.application_deadline.strftime('%d %b')}" for d in upcoming])
        try:
            requests.post(webhook, json={"text": f"📣 *Placement Deadlines (next 3 days):*\n{drive_list}"}, timeout=5)
        except Exception:
            pass

    return f"Reminders sent for {len(upcoming)} drives."
