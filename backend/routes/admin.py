from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, Student, Company, PlacementDrive, Application
from extensions import cache
import json

admin_bp = Blueprint('admin', __name__)

def admin_required(fn):
    from functools import wraps
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        uid = int(get_jwt_identity())
        user = User.query.get(uid)
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        return fn(*args, **kwargs)
    return wrapper

@admin_bp.route('/dashboard', methods=['GET'])
@admin_required
def dashboard():
    cache_key = 'admin:dashboard'
    cached = cache.get(cache_key)
    if cached:
        return jsonify(json.loads(cached)), 200

    stats = {
        'total_students': Student.query.count(),
        'total_companies': Company.query.filter_by(approval_status='approved').count(),
        'total_drives': PlacementDrive.query.count(),
        'total_applications': Application.query.count(),
        'pending_companies': Company.query.filter_by(approval_status='pending').count(),
        'pending_drives': PlacementDrive.query.filter_by(status='pending').count(),
        'selected_students': Application.query.filter_by(status='selected').count(),
    }
    cache.setex(cache_key, 60, json.dumps(stats))
    return jsonify(stats), 200


@admin_bp.route('/companies', methods=['GET'])
@admin_required
def get_companies():
    q = request.args.get('q', '').strip()
    query = Company.query
    if q:
        query = query.filter(Company.company_name.ilike(f'%{q}%'))
    companies = [c.to_dict() for c in query.order_by(Company.id.desc()).all()]
    return jsonify(companies), 200

@admin_bp.route('/companies/<int:cid>/action', methods=['POST'])
@admin_required
def company_action(cid):
    data = request.get_json()
    action = data.get('action')
    comp = Company.query.get_or_404(cid)
    user = User.query.get(comp.user_id)

    actions = {
        'approve': lambda: setattr(comp, 'approval_status', 'approved'),
        'reject': lambda: setattr(comp, 'approval_status', 'rejected'),
        'blacklist': lambda: setattr(user, 'is_blacklisted', True),
        'unblacklist': lambda: setattr(user, 'is_blacklisted', False),
        'deactivate': lambda: setattr(user, 'is_active', False),
        'activate': lambda: setattr(user, 'is_active', True),
    }
    if action == 'delete':
        db.session.delete(user)
    elif action in actions:
        actions[action]()
    else:
        return jsonify({'error': 'Unknown action'}), 400

    db.session.commit()
    cache.delete('admin:dashboard')
    return jsonify({'message': 'Done'}), 200


@admin_bp.route('/students', methods=['GET'])
@admin_required
def get_students():
    q = request.args.get('q', '').strip()
    query = Student.query.join(User)
    if q:
        query = query.filter(
            db.or_(Student.name.ilike(f'%{q}%'), Student.roll_number.ilike(f'%{q}%'),
                   User.email.ilike(f'%{q}%'), Student.phone.ilike(f'%{q}%'))
        )
    return jsonify([s.to_dict() for s in query.order_by(Student.id.desc()).all()]), 200

@admin_bp.route('/students/<int:sid>/action', methods=['POST'])
@admin_required
def student_action(sid):
    data = request.get_json()
    action = data.get('action')
    student = Student.query.get_or_404(sid)
    user = User.query.get(student.user_id)

    if action == 'blacklist': user.is_blacklisted = True
    elif action == 'unblacklist': user.is_blacklisted = False
    elif action == 'deactivate': user.is_active = False
    elif action == 'activate': user.is_active = True
    elif action == 'delete': db.session.delete(user)
    else: return jsonify({'error': 'Unknown action'}), 400

    db.session.commit()
    cache.delete('admin:dashboard')
    return jsonify({'message': 'Done'}), 200


@admin_bp.route('/drives', methods=['GET'])
@admin_required
def get_drives():
    drives = PlacementDrive.query.order_by(PlacementDrive.id.desc()).all()
    return jsonify([d.to_dict() for d in drives]), 200

@admin_bp.route('/drives/<int:did>/action', methods=['POST'])
@admin_required
def drive_action(did):
    data = request.get_json()
    action = data.get('action')
    drive = PlacementDrive.query.get_or_404(did)
    if action == 'approve': drive.status = 'approved'
    elif action == 'reject': drive.status = 'closed'
    else: return jsonify({'error': 'Unknown action'}), 400
    db.session.commit()
    cache.delete(f'drives:approved')
    return jsonify({'message': 'Done'}), 200


@admin_bp.route('/applications', methods=['GET'])
@admin_required
def get_applications():
    apps = Application.query.order_by(Application.id.desc()).all()
    return jsonify([a.to_dict() for a in apps]), 200
