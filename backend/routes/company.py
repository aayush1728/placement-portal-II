from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from extensions import db, cache
from models import User, CompanyProfile, PlacementDrive, Application
from datetime import datetime

company_bp = Blueprint("company", __name__, url_prefix="/api/company")


def _get_company_profile():
    uid  = get_jwt_identity()
    user = User.query.get(int(uid))
    if not user or user.role != "company":
        return None, (jsonify({"error": "Company access required."}), 403)
    if not user.company_profile or user.company_profile.approval_status != "approved":
        return None, (jsonify({"error": "Company not yet approved by admin."}), 403)
    return user.company_profile, None


def _err(msg, code=400):
    return jsonify({"error": msg}), code


# ── profile ───────────────────────────────────────────────────────────────────

@company_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_profile():
    uid  = get_jwt_identity()
    user = User.query.get_or_404(int(uid))
    if user.role != "company":
        return _err("Company access required.", 403)
    cp = user.company_profile
    if not cp:
        return _err("Profile not found.", 404)
    return jsonify(cp.to_dict(include_drives=True))


@company_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    uid  = get_jwt_identity()
    user = User.query.get_or_404(int(uid))
    if user.role != "company":
        return _err("Company access required.", 403)
    cp   = user.company_profile
    body = request.get_json(silent=True) or {}

    updatable = ["company_name", "hr_name", "hr_contact", "website", "description", "industry", "headquarters"]
    for field in updatable:
        if field in body:
            setattr(cp, field, body[field])

    db.session.commit()
    return jsonify({"message": "Profile updated.", "profile": cp.to_dict()})


# ── drives ────────────────────────────────────────────────────────────────────

@company_bp.route("/drives", methods=["GET"])
@jwt_required()
def list_company_drives():
    cp, err = _get_company_profile()
    if err:
        return err

    drives = PlacementDrive.query.filter_by(company_id=cp.id)\
                .order_by(PlacementDrive.created_at.desc()).all()
    return jsonify({"drives": [d.to_dict(include_company=False) for d in drives]})


@company_bp.route("/drives", methods=["POST"])
@jwt_required()
def create_drive():
    cp, err = _get_company_profile()
    if err:
        return err

    body = request.get_json(silent=True) or {}
    if not body.get("job_title"):
        return _err("Job title is required.")

    deadline = None
    if body.get("application_deadline"):
        try:
            deadline = datetime.fromisoformat(body["application_deadline"])
        except ValueError:
            return _err("Invalid deadline format. Use ISO 8601.")

    interview_dt = None
    if body.get("interview_date"):
        try:
            interview_dt = datetime.fromisoformat(body["interview_date"])
        except ValueError:
            return _err("Invalid interview date format.")

    drive = PlacementDrive(
        company_id           = cp.id,
        job_title            = body["job_title"],
        job_description      = body.get("job_description", ""),
        job_type             = body.get("job_type", "Full-Time"),
        location             = body.get("location", ""),
        package_lpa          = float(body["package_lpa"]) if body.get("package_lpa") else None,
        eligible_branches    = body.get("eligible_branches", "All"),
        min_cgpa             = float(body.get("min_cgpa", 0.0)),
        eligible_grad_year   = int(body["eligible_grad_year"]) if body.get("eligible_grad_year") else None,
        application_deadline = deadline,
        interview_date       = interview_dt,
        status               = "pending",
    )
    db.session.add(drive)
    db.session.commit()
    cache.delete("admin_stats")
    return jsonify({"message": "Drive created. Awaiting admin approval.", "drive": drive.to_dict()}), 201


@company_bp.route("/drives/<int:drive_id>", methods=["PUT"])
@jwt_required()
def update_drive(drive_id):
    cp, err = _get_company_profile()
    if err:
        return err

    drive = PlacementDrive.query.filter_by(id=drive_id, company_id=cp.id).first_or_404()
    body  = request.get_json(silent=True) or {}

    updatable = ["job_title", "job_description", "job_type", "location", "eligible_branches", "min_cgpa"]
    for field in updatable:
        if field in body:
            setattr(drive, field, body[field])

    if body.get("package_lpa") is not None:
        drive.package_lpa = float(body["package_lpa"])
    if body.get("application_deadline"):
        drive.application_deadline = datetime.fromisoformat(body["application_deadline"])
    if body.get("interview_date"):
        drive.interview_date = datetime.fromisoformat(body["interview_date"])

    db.session.commit()
    cache.delete("approved_drives")
    return jsonify({"message": "Drive updated.", "drive": drive.to_dict()})


# ── applications ───────────────────────────────────────────────────────────────

@company_bp.route("/drives/<int:drive_id>/applications", methods=["GET"])
@jwt_required()
def drive_applications(drive_id):
    cp, err = _get_company_profile()
    if err:
        return err

    drive = PlacementDrive.query.filter_by(id=drive_id, company_id=cp.id).first_or_404()
    status_filter = request.args.get("status", "")

    q = drive.applications
    if status_filter:
        q = q.filter_by(status=status_filter)

    apps = q.order_by(Application.applied_at.asc()).all()
    return jsonify({
        "drive": drive.to_dict(include_company=False),
        "applications": [a.to_dict(include_student=True) for a in apps],
        "total": len(apps),
    })


@company_bp.route("/applications/<int:app_id>", methods=["PATCH"])
@jwt_required()
def update_application_status(app_id):
    cp, err = _get_company_profile()
    if err:
        return err

    app_obj = Application.query.get_or_404(app_id)
    # Verify this application belongs to a drive owned by this company
    if app_obj.drive.company_id != cp.id:
        return _err("Access denied.", 403)

    body = request.get_json(silent=True) or {}
    new_status = body.get("status", "")
    valid = {"shortlisted", "selected", "rejected", "applied"}
    if new_status not in valid:
        return _err(f"Invalid status. Must be one of: {', '.join(valid)}")

    app_obj.status = new_status
    if "notes" in body:
        app_obj.notes = body["notes"]
    db.session.commit()
    return jsonify({"message": "Application status updated.", "application": app_obj.to_dict(include_student=True)})
