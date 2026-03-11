from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User, Student, Company
import re

auth_bp = Blueprint('auth', __name__)

def valid_email(email):
    return re.match(r'^[\w\.-]+@[\w\.-]+\.\w{2,}$', email)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    email = data.get('email', '').strip()
    password = data.get('password', '').strip()

    
    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400
    if not valid_email(email):
        return jsonify({'error': 'Invalid email format'}), 400
    
    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password, password):
        return jsonify({'error': 'Invalid email or password'}), 401
    if user.is_blacklisted:
        return jsonify({'error': 'Account blacklisted. Contact admin.'}), 403
    if not user.is_active:
        return jsonify({'error': 'Account inactive. Contact admin.'}), 403
    if user.role == 'company':
        comp = Company.query.filter_by(user_id=user.id).first()
        if comp and comp.approval_status != 'approved':
            return jsonify({'error': 'Company pending admin approval.'}), 403

    token = create_access_token(identity=str(user.id))
    profile = None
    if user.role == 'student':
        s = Student.query.filter_by(user_id=user.id).first()
        profile = s.to_dict() if s else None
    elif user.role == 'company':
        c = Company.query.filter_by(user_id=user.id).first()
        profile = c.to_dict() if c else None

    return jsonify({'token': token, 'user': user.to_dict(), 'profile': profile}), 200


@auth_bp.route('/register/student', methods=['POST'])
def register_student():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    required = ['email', 'password', 'name', 'roll_number', 'branch']
    for field in required:
        if not data.get(field, '').strip():
            return jsonify({'error': f'{field} is required'}), 400

    if not valid_email(data['email'].strip()):
        return jsonify({'error': 'Invalid email format'}), 400
    if len(data['password']) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400

    cgpa = float(data.get('cgpa', 0))
    if cgpa < 0 or cgpa > 10:
        return jsonify({'error': 'CGPA must be between 0 and 10'}), 400

    year = int(data.get('year', 1))
    if year < 1 or year > 4:
        return jsonify({'error': 'Year must be between 1 and 4'}), 400

    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 409
    if Student.query.filter_by(roll_number=data['roll_number']).first():
        return jsonify({'error': 'Roll number already registered'}), 409

    user = User(email=data['email'].strip(),
                password=generate_password_hash(data['password']),
                role='student')
    db.session.add(user)
    db.session.flush()
    student = Student(
        user_id=user.id, name=data['name'].strip(),
        roll_number=data['roll_number'].strip(), branch=data['branch'].strip(),
        cgpa=cgpa, year=year, phone=data.get('phone', '')
    )
    db.session.add(student)
    db.session.commit()
    return jsonify({'message': 'Registration successful. You can now log in.'}), 201


@auth_bp.route('/register/company', methods=['POST'])
def register_company():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    for field in ['email', 'password', 'company_name']:
        if not data.get(field, '').strip():
            return jsonify({'error': f'{field} is required'}), 400

    if not valid_email(data['email'].strip()):
        return jsonify({'error': 'Invalid email format'}), 400
    if len(data['password']) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400

    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 409

    user = User(email=data['email'].strip(),
                password=generate_password_hash(data['password']),
                role='company')
    db.session.add(user)
    db.session.flush()
    company = Company(
        user_id=user.id, company_name=data['company_name'].strip(),
        hr_contact=data.get('hr_contact', ''), website=data.get('website', ''),
        description=data.get('description', '')
    )
    db.session.add(company)
    db.session.commit()
    return jsonify({'message': 'Company registered. Awaiting admin approval.'}), 201


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    profile = None
    if user.role == 'student':
        s = Student.query.filter_by(user_id=user.id).first()
        profile = s.to_dict() if s else None
    elif user.role == 'company':
        c = Company.query.filter_by(user_id=user.id).first()
        profile = c.to_dict() if c else None
    return jsonify({'user': user.to_dict(), 'profile': profile}), 200
    