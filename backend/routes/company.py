from flask import Blueprint, request, jsonify, current_app, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from models import db, User, Company, PlacementDrive, Application
from extensions import cache
import os, json

company_bp = Blueprint('company', __name__)

ALLOWED = {'pdf', 'doc', 'docx'}

def company_required(fn):
    from functools import wraps
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        uid = int(get_jwt_identity())
        user = User.query.get(uid)
        if not user or user.role != 'company':
            return jsonify({'error': 'Company access required'}), 403
        return fn(*args, **kwargs)
    return wrapper

def get_company():
    uid = int(get_jwt_identity())
    return Company.query.filter_by(user_id=uid).first()

@company_bp.route('/dashboard', methods=['GET'])
@company_required
def dashboard():
    comp = get_company()
    if not comp:
        return jsonify({'error': 'Company not found'}), 404
    drives = [d.to_dict() for d in PlacementDrive.query.filter_by(company_id=comp.id).order_by(PlacementDrive.id.desc()).all()]
    return jsonify({'company': comp.to_dict(), 'drives': drives}), 200

@company_bp.route('/drives', methods=['POST'])
@company_required
def create_drive():
    comp = get_company()
    if comp.approval_status != 'approved':
        return jsonify({'error': 'Admin approval required before creating drives'}), 403
    data = request.get_json()
    drive = PlacementDrive(
        company_id=comp.id,
        job_title=data['job_title'],
        job_description=data.get('job_description', ''),
        eligibility_criteria=data.get('eligibility_criteria', ''),
        cgpa_required=float(data.get('cgpa_required', 0)),
        branches_allowed=data.get('branches_allowed', 'All'),
        application_deadline=data['application_deadline'],
        package_lpa=float(data.get('package_lpa', 0))
    )
    db.session.add(drive)
    db.session.commit()
    cache.delete('drives:approved')
    return jsonify({'message': 'Drive submitted for admin approval', 'drive': drive.to_dict()}), 201

@company_bp.route('/drives/<int:did>', methods=['PUT'])
@company_required
def edit_drive(did):
    comp = get_company()
    drive = PlacementDrive.query.filter_by(id=did, company_id=comp.id).first_or_404()
    data = request.get_json()
    for field in ['job_title','job_description','eligibility_criteria','branches_allowed','application_deadline']:
        if field in data: setattr(drive, field, data[field])
    if 'cgpa_required' in data: drive.cgpa_required = float(data['cgpa_required'])
    if 'package_lpa' in data: drive.package_lpa = float(data['package_lpa'])
    db.session.commit()
    cache.delete('drives:approved')
    return jsonify({'message': 'Drive updated', 'drive': drive.to_dict()}), 200

@company_bp.route('/drives/<int:did>', methods=['DELETE'])
@company_required
def delete_drive(did):
    comp = get_company()
    drive = PlacementDrive.query.filter_by(id=did, company_id=comp.id).first_or_404()
    db.session.delete(drive)
    db.session.commit()
    cache.delete('drives:approved')
    return jsonify({'message': 'Drive deleted'}), 200

@company_bp.route('/drives/<int:did>/close', methods=['POST'])
@company_required
def close_drive(did):
    comp = get_company()
    drive = PlacementDrive.query.filter_by(id=did, company_id=comp.id).first_or_404()
    drive.status = 'closed'
    db.session.commit()
    cache.delete('drives:approved')
    return jsonify({'message': 'Drive closed'}), 200

@company_bp.route('/drives/<int:did>/applications', methods=['GET'])
@company_required
def drive_applications(did):
    comp = get_company()
    PlacementDrive.query.filter_by(id=did, company_id=comp.id).first_or_404()
    apps = Application.query.filter_by(drive_id=did).all()
    result = []
    for a in apps:
        d = a.to_dict()
        d['phone'] = a.student.phone
        d['email'] = a.student.user.email if a.student and a.student.user else None
        d['resume_filename'] = a.student.resume_filename if a.student else None
        result.append(d)
    return jsonify(result), 200

@company_bp.route('/applications/<int:aid>/status', methods=['PUT'])
@company_required
def update_status(aid):
    data = request.get_json()
    new_status = data.get('status')
    if new_status not in ('applied','shortlisted','selected','rejected'):
        return jsonify({'error': 'Invalid status'}), 400
    app = Application.query.get_or_404(aid)
    app.status = new_status
    db.session.commit()
    return jsonify({'message': 'Status updated'}), 200
