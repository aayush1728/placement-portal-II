from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity, get_jwt,
)
from extensions import db, cache
from models import User, StudentProfile, CompanyProfile

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

# ── helpers ─────────────────────────────────────────────────────────────────

def _err(msg, code=400):
    return jsonify({"error": msg}), code

def _ok(data, code=200):
    return jsonify(data), code


# ── register: student ───────────────────────────────────────────────────────

@auth_bp.route("/register/student", methods=["POST"])
def register_student():
    body = request.get_json(silent=True) or {}
    required = ["email", "password", "full_name", "roll_number"]
    missing  = [f for f in required if not body.get(f)]
    if missing:
        return _err(f"Missing fields: {', '.join(missing)}")

    if User.query.filter_by(email=body["email"].lower()).first():
        return _err("Email already registered.", 409)

    if StudentProfile.query.filter_by(roll_number=body["roll_number"]).first():
        return _err("Roll number already in use.", 409)

    user = User(email=body["email"].lower(), role="student")
    user.set_password(body["password"])
    db.session.add(user)
    db.session.flush()

    profile = StudentProfile(
        user_id     = user.id,
        full_name   = body["full_name"],
        roll_number = body["roll_number"],
        branch      = body.get("branch", ""),
        cgpa        = float(body.get("cgpa", 0.0)),
        year        = int(body.get("year", 1)),
        grad_year   = int(body.get("grad_year", 2026)),
        phone       = body.get("phone", ""),
    )
    db.session.add(profile)
    db.session.commit()
    cache.delete_memoized(_cached_admin_stats)
    return _ok({"message": "Student registered successfully."}, 201)


# ── register: company ───────────────────────────────────────────────────────

@auth_bp.route("/register/company", methods=["POST"])
def register_company():
    body = request.get_json(silent=True) or {}
    required = ["email", "password", "company_name"]
    missing  = [f for f in required if not body.get(f)]
    if missing:
        return _err(f"Missing fields: {', '.join(missing)}")

    if User.query.filter_by(email=body["email"].lower()).first():
        return _err("Email already registered.", 409)

    user = User(email=body["email"].lower(), role="company")
    user.set_password(body["password"])
    db.session.add(user)
    db.session.flush()

    profile = CompanyProfile(
        user_id      = user.id,
        company_name = body["company_name"],
        hr_name      = body.get("hr_name", ""),
        hr_contact   = body.get("hr_contact", ""),
        website      = body.get("website", ""),
        description  = body.get("description", ""),
        industry     = body.get("industry", ""),
        headquarters = body.get("headquarters", ""),
    )
    db.session.add(profile)
    db.session.commit()
    return _ok({"message": "Company registered. Awaiting admin approval."}, 201)


# ── login ────────────────────────────────────────────────────────────────────

@auth_bp.route("/login", methods=["POST"])
def login():
    body = request.get_json(silent=True) or {}
    email    = body.get("email", "").lower()
    password = body.get("password", "")

    if not email or not password:
        return _err("Email and password are required.")

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return _err("Invalid credentials.", 401)

    if user.is_blacklisted:
        return _err("Your account has been blacklisted. Contact the admin.", 403)

    if not user.is_active:
        return _err("Your account is inactive. Contact the admin.", 403)

    if user.role == "company":
        cp = user.company_profile
        if cp and cp.approval_status == "pending":
            return _err("Company registration is awaiting admin approval.", 403)
        if cp and cp.approval_status == "rejected":
            return _err("Company registration was rejected by the admin.", 403)

    access_token  = create_access_token(identity=str(user.id), additional_claims={"role": user.role})
    refresh_token = create_refresh_token(identity=str(user.id))

    profile_data = {}
    if user.role == "student" and user.student_profile:
        profile_data = {"full_name": user.student_profile.full_name}
    elif user.role == "company" and user.company_profile:
        profile_data = {"company_name": user.company_profile.company_name}
    elif user.role == "admin":
        profile_data = {"full_name": "Administrator"}

    return _ok({
        "access_token":  access_token,
        "refresh_token": refresh_token,
        "user": {**user.to_dict(), **profile_data},
    })


# ── refresh token ────────────────────────────────────────────────────────────

@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    uid   = get_jwt_identity()
    user  = User.query.get_or_404(int(uid))
    token = create_access_token(identity=str(user.id), additional_claims={"role": user.role})
    return _ok({"access_token": token})


# ── me ───────────────────────────────────────────────────────────────────────

@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    uid  = get_jwt_identity()
    user = User.query.get_or_404(int(uid))
    data = user.to_dict()
    if user.role == "student" and user.student_profile:
        data["profile"] = user.student_profile.to_dict()
    elif user.role == "company" and user.company_profile:
        data["profile"] = user.company_profile.to_dict()
    return _ok(data)


def _cached_admin_stats():
    pass  # placeholder for cache invalidation key
