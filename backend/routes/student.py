import os
import csv
import io
from flask import Blueprint, request, jsonify, current_app, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from extensions import db, cache
from models import User, StudentProfile, PlacementDrive, Application
from datetime import datetime

student_bp = Blueprint("student", __name__, url_prefix="/api/student")

ALLOWED_EXTS = {"pdf", "doc", "docx"}


def _allowed(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTS


def _get_student_profile():
    uid  = get_jwt_identity()
    user = User.query.get(int(uid))
    if not user or user.role != "student":
        return None, (jsonify({"error": "Student access required."}), 403)
    if user.is_blacklisted:
        return None, (jsonify({"error": "Your account has been blacklisted."}), 403)
    return user.student_profile, None


def _err(msg, code=400):
    return jsonify({"error": msg}), code


# ── profile ───────────────────────────────────────────────────────────────────

@student_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_profile():
    sp, err = _get_student_profile()
    if err:
        return err
    return jsonify(sp.to_dict())


@student_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    sp, err = _get_student_profile()
    if err:
        return err

    body = request.get_json(silent=True) or {}
    updatable = ["full_name", "phone", "branch", "skills"]
    for field in updatable:
        if field in body:
            setattr(sp, field, body[field])

    if "cgpa" in body:
        cgpa = float(body["cgpa"])
        if not (0.0 <= cgpa <= 10.0):
            return _err("CGPA must be between 0 and 10.")
        sp.cgpa = cgpa
    if "year" in body:
        sp.year = int(body["year"])
    if "grad_year" in body:
        sp.grad_year = int(body["grad_year"])

    db.session.commit()
    return jsonify({"message": "Profile updated.", "profile": sp.to_dict()})


@student_bp.route("/resume", methods=["POST"])
@jwt_required()
def upload_resume():
    sp, err = _get_student_profile()
    if err:
        return err

    if "resume" not in request.files:
        return _err("No file provided.")
    file = request.files["resume"]
    if file.filename == "" or not _allowed(file.filename):
        return _err("Invalid file. Only PDF, DOC, DOCX are allowed.")

    filename = secure_filename(f"resume_{sp.roll_number}_{int(datetime.utcnow().timestamp())}.{file.filename.rsplit('.',1)[1].lower()}")
    upload_dir = current_app.config["UPLOAD_FOLDER"]
    os.makedirs(upload_dir, exist_ok=True)
    filepath = os.path.join(upload_dir, filename)
    file.save(filepath)

    sp.resume_path = filename
    db.session.commit()
    return jsonify({"message": "Resume uploaded.", "filename": filename})


# ── drives ────────────────────────────────────────────────────────────────────

@student_bp.route("/drives", methods=["GET"])
@jwt_required()
def available_drives():
    sp, err = _get_student_profile()
    if err:
        return err

    search    = request.args.get("search", "").strip()
    job_type  = request.args.get("job_type", "")
    only_eligible = request.args.get("eligible_only", "false").lower() == "true"
    page   = int(request.args.get("page", 1))
    per_pg = int(request.args.get("per_page", 10))

    q = PlacementDrive.query.filter_by(status="approved").join(
        PlacementDrive.company
    )
    if search:
        from models import CompanyProfile
        q = q.filter(
            db.or_(
                PlacementDrive.job_title.ilike(f"%{search}%"),
                CompanyProfile.company_name.ilike(f"%{search}%"),
            )
        )
    if job_type:
        q = q.filter_by(job_type=job_type)

    drives = q.order_by(PlacementDrive.application_deadline.asc()).all()

    # Eligibility filter
    if only_eligible:
        def is_eligible(d):
            if d.min_cgpa and sp.cgpa < d.min_cgpa:
                return False
            if d.eligible_grad_year and sp.grad_year != d.eligible_grad_year:
                return False
            if d.eligible_branches and d.eligible_branches.lower() != "all":
                branches = [b.strip().lower() for b in d.eligible_branches.split(",")]
                if sp.branch and sp.branch.lower() not in branches:
                    return False
            return True
        drives = [d for d in drives if is_eligible(d)]

    # Attach applied status
    applied_ids = {a.drive_id for a in sp.applications.all()}
    result = []
    for d in drives:
        item = d.to_dict()
        item["already_applied"] = d.id in applied_ids
        # Eligibility info
        item["eligible"] = True
        if d.min_cgpa and sp.cgpa < d.min_cgpa:
            item["eligible"] = False
            item["ineligibility_reason"] = f"Requires CGPA ≥ {d.min_cgpa}"
        result.append(item)

    total = len(result)
    start = (page - 1) * per_pg
    paginated = result[start:start + per_pg]

    return jsonify({
        "drives": paginated,
        "total": total,
        "pages": (total + per_pg - 1) // per_pg,
        "current_page": page,
    })


@student_bp.route("/drives/<int:drive_id>/apply", methods=["POST"])
@jwt_required()
def apply_for_drive(drive_id):
    sp, err = _get_student_profile()
    if err:
        return err

    drive = PlacementDrive.query.get_or_404(drive_id)
    if drive.status != "approved":
        return _err("This drive is not accepting applications.")

    # Deadline check
    if drive.application_deadline and datetime.utcnow() > drive.application_deadline:
        return _err("Application deadline has passed.")

    # Duplicate check
    existing = Application.query.filter_by(student_id=sp.id, drive_id=drive_id).first()
    if existing:
        return _err("You have already applied to this drive.", 409)

    # Eligibility check
    if drive.min_cgpa and sp.cgpa < drive.min_cgpa:
        return _err(f"Your CGPA ({sp.cgpa}) does not meet the minimum requirement ({drive.min_cgpa}).")
    if drive.eligible_grad_year and sp.grad_year != drive.eligible_grad_year:
        return _err(f"This drive is for the {drive.eligible_grad_year} graduating batch only.")
    if drive.eligible_branches and drive.eligible_branches.lower() != "all":
        branches = [b.strip().lower() for b in drive.eligible_branches.split(",")]
        if sp.branch and sp.branch.lower() not in branches:
            return _err(f"Your branch ({sp.branch}) is not eligible for this drive.")

    app_obj = Application(student_id=sp.id, drive_id=drive_id)
    db.session.add(app_obj)
    db.session.commit()
    cache.delete("admin_stats")
    return jsonify({"message": "Application submitted successfully.", "application": app_obj.to_dict(include_drive=True)}), 201


# ── application history ───────────────────────────────────────────────────────

@student_bp.route("/applications", methods=["GET"])
@jwt_required()
def my_applications():
    sp, err = _get_student_profile()
    if err:
        return err

    apps = sp.applications.order_by(Application.applied_at.desc()).all()
    return jsonify({
        "applications": [a.to_dict(include_drive=True) for a in apps],
        "total": len(apps),
    })


# ── async CSV export ──────────────────────────────────────────────────────────

@student_bp.route("/export-csv", methods=["POST"])
@jwt_required()
def trigger_csv_export():
    sp, err = _get_student_profile()
    if err:
        return err

    from tasks.exports import export_applications_csv
    task = export_applications_csv.delay(sp.id)
    return jsonify({"message": "Export started.", "task_id": task.id}), 202


@student_bp.route("/export-status/<task_id>", methods=["GET"])
@jwt_required()
def export_status(task_id):
    from tasks.exports import export_applications_csv
    result = export_applications_csv.AsyncResult(task_id)
    if result.state == "PENDING":
        return jsonify({"status": "pending"})
    elif result.state == "SUCCESS":
        return jsonify({"status": "success", "file": result.result})
    elif result.state == "FAILURE":
        return jsonify({"status": "failed", "error": str(result.result)})
    return jsonify({"status": result.state.lower()})


@student_bp.route("/download-csv/<filename>", methods=["GET"])
@jwt_required()
def download_csv(filename):
    export_dir = os.path.join(current_app.config["UPLOAD_FOLDER"], "exports")
    return send_from_directory(export_dir, filename, as_attachment=True)
