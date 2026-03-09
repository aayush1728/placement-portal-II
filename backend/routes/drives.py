from flask import Blueprint, request, jsonify
from extensions import cache
from models import PlacementDrive, CompanyProfile
from extensions import db

drives_bp = Blueprint("drives", __name__, url_prefix="/api/drives")


@drives_bp.route("", methods=["GET"])
@cache.cached(timeout=180, key_prefix="approved_drives", query_string=True)
def list_approved_drives():
    search   = request.args.get("search", "").strip()
    job_type = request.args.get("job_type", "").strip()
    branch   = request.args.get("branch", "").strip()
    page     = int(request.args.get("page", 1))
    per_pg   = int(request.args.get("per_page", 12))

    q = PlacementDrive.query.filter_by(status="approved").join(PlacementDrive.company)

    if search:
        q = q.filter(
            db.or_(
                PlacementDrive.job_title.ilike(f"%{search}%"),
                CompanyProfile.company_name.ilike(f"%{search}%"),
                PlacementDrive.location.ilike(f"%{search}%"),
            )
        )
    if job_type:
        q = q.filter(PlacementDrive.job_type == job_type)
    if branch:
        q = q.filter(
            db.or_(
                PlacementDrive.eligible_branches.ilike("All"),
                PlacementDrive.eligible_branches.ilike(f"%{branch}%"),
            )
        )

    pagination = q.order_by(PlacementDrive.application_deadline.asc()).paginate(
        page=page, per_page=per_pg, error_out=False
    )
    return jsonify({
        "drives": [d.to_dict() for d in pagination.items],
        "total":  pagination.total,
        "pages":  pagination.pages,
        "current_page": page,
    })


@drives_bp.route("/<int:drive_id>", methods=["GET"])
def get_drive(drive_id):
    drive = PlacementDrive.query.filter_by(id=drive_id, status="approved").first_or_404()
    return jsonify(drive.to_dict())
