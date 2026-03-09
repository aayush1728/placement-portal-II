from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from extensions import db, cache
from models import User, StudentProfile, CompanyProfile, PlacementDrive, Application
from datetime import datetime

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


def _require_admin():
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Admin access required."}), 403
    return None


def _err(msg, code=400):
    return jsonify({"error": msg}), code


# ── dashboard stats ───────────────────────────────────────────────────────────

@admin_bp.route("/stats", methods=["GET"])
@jwt_required()
@cache.cached(timeout=120, key_prefix="admin_stats")
def get_stats():
    guard = _require_admin()
    if guard:
        return guard
    return jsonify({
        "total_students":    StudentProfile.query.count(),
        "total_companies":   CompanyProfile.query.count(),
        "approved_companies":CompanyProfile.query.filter_by(approval_status="approved").count(),
        "pending_companies": CompanyProfile.query.filter_by(approval_status="pending").count(),
        "total_drives":      PlacementDrive.query.count(),
        "approved_drives":   PlacementDrive.query.filter_by(status="approved").count(),
        "pending_drives":    PlacementDrive.query.filter_by(status="pending").count(),
        "total_applications":Application.query.count(),
        "selected_students": Application.query.filter_by(status="selected").count(),
    })


# ── companies management ──────────────────────────────────────────────────────

@admin_bp.route("/companies", methods=["GET"])
@jwt_required()
def list_companies():
    guard = _require_admin()
    if guard:
        return guard

    status = request.args.get("status", "")
    search = request.args.get("search", "").strip()
    page   = int(request.args.get("page", 1))
    per_pg = int(request.args.get("per_page", 10))

    q = CompanyProfile.query
    if status:
        q = q.filter_by(approval_status=status)
    if search:
        q = q.filter(CompanyProfile.company_name.ilike(f"%{search}%"))

    pagination = q.order_by(CompanyProfile.registered_at.desc()).paginate(page=page, per_page=per_pg, error_out=False)
    return jsonify({
        "companies":  [c.to_dict(include_drives=True) for c in pagination.items],
        "total":      pagination.total,
        "pages":      pagination.pages,
        "current_page": page,
    })


@admin_bp.route("/companies/<int:company_id>", methods=["PATCH"])
@jwt_required()
def update_company(company_id):
    guard = _require_admin()
    if guard:
        return guard

    cp   = CompanyProfile.query.get_or_404(company_id)
    body = request.get_json(silent=True) or {}

    if "approval_status" in body and body["approval_status"] in ("approved", "rejected", "pending"):
        cp.approval_status = body["approval_status"]

    if "is_blacklisted" in body:
        cp.user.is_blacklisted = bool(body["is_blacklisted"])

    if "is_active" in body:
        cp.user.is_active = bool(body["is_active"])

    db.session.commit()
    cache.delete("admin_stats")
    return jsonify({"message": "Company updated.", "company": cp.to_dict()})


# ── students management ───────────────────────────────────────────────────────

@admin_bp.route("/students", methods=["GET"])
@jwt_required()
def list_students():
    guard = _require_admin()
    if guard:
        return guard

    search = request.args.get("search", "").strip()
    branch = request.args.get("branch", "").strip()
    page   = int(request.args.get("page", 1))
    per_pg = int(request.args.get("per_page", 10))

    q = StudentProfile.query.join(User)
    if search:
        q = q.filter(
            db.or_(
                StudentProfile.full_name.ilike(f"%{search}%"),
                StudentProfile.roll_number.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%"),
            )
        )
    if branch:
        q = q.filter(StudentProfile.branch.ilike(f"%{branch}%"))

    pagination = q.order_by(StudentProfile.id.desc()).paginate(page=page, per_page=per_pg, error_out=False)
    return jsonify({
        "students": [s.to_dict() for s in pagination.items],
        "total":    pagination.total,
        "pages":    pagination.pages,
        "current_page": page,
    })


@admin_bp.route("/students/<int:student_id>", methods=["PATCH"])
@jwt_required()
def update_student(student_id):
    guard = _require_admin()
    if guard:
        return guard

    sp   = StudentProfile.query.get_or_404(student_id)
    body = request.get_json(silent=True) or {}

    if "is_blacklisted" in body:
        sp.user.is_blacklisted = bool(body["is_blacklisted"])
    if "is_active" in body:
        sp.user.is_active = bool(body["is_active"])

    db.session.commit()
    return jsonify({"message": "Student updated.", "student": sp.to_dict()})


# ── drives management ─────────────────────────────────────────────────────────

@admin_bp.route("/drives", methods=["GET"])
@jwt_required()
def list_drives():
    guard = _require_admin()
    if guard:
        return guard

    status = request.args.get("status", "")
    page   = int(request.args.get("page", 1))
    per_pg = int(request.args.get("per_page", 10))

    q = PlacementDrive.query
    if status:
        q = q.filter_by(status=status)

    pagination = q.order_by(PlacementDrive.created_at.desc()).paginate(page=page, per_page=per_pg, error_out=False)
    return jsonify({
        "drives": [d.to_dict() for d in pagination.items],
        "total":  pagination.total,
        "pages":  pagination.pages,
        "current_page": page,
    })


@admin_bp.route("/drives/<int:drive_id>", methods=["PATCH"])
@jwt_required()
def update_drive_status(drive_id):
    guard = _require_admin()
    if guard:
        return guard

    drive = PlacementDrive.query.get_or_404(drive_id)
    body  = request.get_json(silent=True) or {}

    if "status" in body and body["status"] in ("approved", "rejected", "closed", "pending"):
        drive.status = body["status"]
        db.session.commit()
        cache.delete("admin_stats")
        cache.delete("approved_drives")
        return jsonify({"message": "Drive status updated.", "drive": drive.to_dict()})

    return _err("Invalid or missing status value.")


# ── applications overview ──────────────────────────────────────────────────────

@admin_bp.route("/applications", methods=["GET"])
@jwt_required()
def list_applications():
    guard = _require_admin()
    if guard:
        return guard

    status = request.args.get("status", "")
    page   = int(request.args.get("page", 1))
    per_pg = int(request.args.get("per_page", 15))

    q = Application.query
    if status:
        q = q.filter_by(status=status)

    pagination = q.order_by(Application.applied_at.desc()).paginate(page=page, per_page=per_pg, error_out=False)
    return jsonify({
        "applications": [a.to_dict(include_student=True, include_drive=True) for a in pagination.items],
        "total":  pagination.total,
        "pages":  pagination.pages,
        "current_page": page,
    })


# ── monthly report data ────────────────────────────────────────────────────────

@admin_bp.route("/report/monthly", methods=["GET"])
@jwt_required()
def monthly_report():
    guard = _require_admin()
    if guard:
        return guard

    month = int(request.args.get("month", datetime.utcnow().month))
    year  = int(request.args.get("year",  datetime.utcnow().year))

    drives = PlacementDrive.query.filter(
        db.extract("month", PlacementDrive.created_at) == month,
        db.extract("year",  PlacementDrive.created_at) == year,
    ).all()

    drive_ids = [d.id for d in drives]
    apps = Application.query.filter(Application.drive_id.in_(drive_ids)).all() if drive_ids else []

    return jsonify({
        "month": month,
        "year":  year,
        "drives_conducted": len(drives),
        "total_applications": len(apps),
        "students_selected": sum(1 for a in apps if a.status == "selected"),
        "students_shortlisted": sum(1 for a in apps if a.status == "shortlisted"),
        "drives": [d.to_dict() for d in drives],
    })
