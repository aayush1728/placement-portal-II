import os
import csv
from datetime import datetime
from extensions import celery_app


@celery_app.task(name="tasks.exports.export_applications_csv", bind=True)
def export_applications_csv(self, student_profile_id: int) -> str:
    """Export all placement applications for a student to a CSV file."""
    from models import Application, StudentProfile
    from flask import current_app

    sp   = StudentProfile.query.get(student_profile_id)
    apps = Application.query.filter_by(student_id=sp.id).order_by(Application.applied_at.desc()).all()

    export_dir = os.path.join(current_app.config["UPLOAD_FOLDER"], "exports")
    os.makedirs(export_dir, exist_ok=True)

    filename = f"applications_{sp.roll_number}_{int(datetime.utcnow().timestamp())}.csv"
    filepath = os.path.join(export_dir, filename)

    with open(filepath, "w", newline="", encoding="utf-8") as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=[
            "Application ID", "Student ID", "Student Name", "Roll Number",
            "Company Name", "Drive Title", "Job Type", "Location",
            "Package (LPA)", "Application Date", "Application Status",
        ])
        writer.writeheader()
        for a in apps:
            writer.writerow({
                "Application ID":    a.id,
                "Student ID":        sp.id,
                "Student Name":      sp.full_name,
                "Roll Number":       sp.roll_number,
                "Company Name":      a.drive.company.company_name,
                "Drive Title":       a.drive.job_title,
                "Job Type":          a.drive.job_type,
                "Location":          a.drive.location or "—",
                "Package (LPA)":     a.drive.package_lpa or "—",
                "Application Date":  a.applied_at.strftime("%Y-%m-%d"),
                "Application Status": a.status.capitalize(),
            })

    return filename
