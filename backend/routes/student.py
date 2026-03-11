from flask import Blueprint, request, jsonify, current_app, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from models import db, User, Student, PlacementDrive, Application
from extensions import cache
from tasks.jobs import export_csv_task
import os, json

student_bp = Blueprint('student', __name__)
ALLOWED = {'pdf', 'doc', 'docx'}

def student_required(fn):
    from functools import wraps
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        uid = int(get_jwt_identity())
        user = User.query.get(uid)
        if not user or user.role != 'student':
            return jsonify({'error': 'Student access required'}), 403
        return fn(*args, **kwargs)
    return wrapper

def get_student():
    uid = int(get_jwt_identity())
    return Student.query.filter_by(user_id=uid).first()

@student_bp.route('/drives', methods=['GET'])
@student_required
def get_drives():
    q = request.args.get('q', '').strip()
    cache_key = f'drives:approved:{q}'
    cached = cache.get(cache_key)
    if cached and not q:
        return jsonify(json.loads(cached)), 200

    query = PlacementDrive.query.filter_by(status='approved')
    if q:
        query = query.filter(
            db.or_(PlacementDrive.job_title.ilike(f'%{q}%'),
                   PlacementDrive.branches_allowed.ilike(f'%{q}%'))
        )
    drives = [d.to_dict() for d in query.order_by(PlacementDrive.application_deadline).all()]

    if not q:
        cache.setex(cache_key, 120, json.dumps(drives))
    return jsonify(drives), 200

@student_bp.route('/apply/<int:did>', methods=['POST'])
@student_required
def apply(did):
    student = get_student()
    drive = PlacementDrive.query.filter_by(id=did, status='approved').first()
    if not drive:
        return jsonify({'error': 'Drive not available'}), 404
    if student.cgpa < drive.cgpa_required:
        return jsonify({'error': f'CGPA {drive.cgpa_required} required. Yours: {student.cgpa}'}), 403
    existing = Application.query.filter_by(student_id=student.id, drive_id=did).first()
    if existing:
        return jsonify({'error': 'Already applied to this drive'}), 409
    app = Application(student_id=student.id, drive_id=did)
    db.session.add(app)
    db.session.commit()
    return jsonify({'message': 'Application submitted!'}), 201

@student_bp.route('/applications', methods=['GET'])
@student_required
def my_applications():
    student = get_student()
    apps = Application.query.filter_by(student_id=student.id).order_by(Application.application_date.desc()).all()
    return jsonify([a.to_dict() for a in apps]), 200

@student_bp.route('/history', methods=['GET'])
@student_required
def history():
    student = get_student()
    apps = Application.query.filter_by(student_id=student.id).order_by(Application.application_date.desc()).all()
    return jsonify([a.to_dict() for a in apps]), 200

@student_bp.route('/profile', methods=['GET'])
@student_required
def get_profile():
    student = get_student()
    return jsonify(student.to_dict()), 200

@student_bp.route('/profile', methods=['PUT'])
@student_required
def update_profile():
    student = get_student()
    data = request.get_json()
    for field in ['name', 'branch', 'phone']:
        if field in data: setattr(student, field, data[field])
    if 'cgpa' in data:
        cgpa = float(data['cgpa'])
        if cgpa < 0 or cgpa > 10:
            return jsonify({'error': 'CGPA must be between 0 and 10'}), 400
        student.cgpa = cgpa
    if 'year' in data: student.year = int(data['year'])
    db.session.commit()
    return jsonify({'message': 'Profile updated', 'profile': student.to_dict()}), 200

@student_bp.route('/profile/resume', methods=['POST'])
@student_required
def upload_resume():
    student = get_student()
    if 'resume' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    f = request.files['resume']
    if not f.filename or f.filename.rsplit('.', 1)[-1].lower() not in ALLOWED:
        return jsonify({'error': 'Only PDF/DOC files allowed'}), 400
    filename = secure_filename(f.filename)
    filename = f'resume_{student.id}_{filename}'
    f.save(os.path.join(current_app.config['UPLOAD_FOLDER'], filename))
    student.resume_filename = filename
    db.session.commit()
    return jsonify({'message': 'Resume uploaded', 'filename': filename}), 200

@student_bp.route('/export-csv', methods=['POST'])
@student_required
def export_csv():
    student = get_student()
    task = export_csv_task.delay(student.id)
    return jsonify({'message': 'Export started. You will receive an email when ready.', 'task_id': task.id}), 202

@student_bp.route('/export-status/<task_id>', methods=['GET'])
@student_required
def export_status(task_id):
    from tasks.celery_app import celery
    task = celery.AsyncResult(task_id)
    if task.state == 'SUCCESS':
        return jsonify({'status': 'done', 'result': task.result}), 200
    elif task.state == 'FAILURE':
        return jsonify({'status': 'failed'}), 500
    return jsonify({'status': task.state}), 200

@student_bp.route('/uploads/<filename>', methods=['GET'])
@jwt_required()
def get_resume(filename):
    return send_from_directory(current_app.config['UPLOAD_FOLDER'], filename)
