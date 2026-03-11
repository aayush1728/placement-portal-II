from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # admin | company | student
    is_active = db.Column(db.Boolean, default=True)
    is_blacklisted = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    student = db.relationship('Student', backref='user', uselist=False, cascade='all, delete-orphan')
    company = db.relationship('Company', backref='user', uselist=False, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id, 'email': self.email, 'role': self.role,
            'is_active': self.is_active, 'is_blacklisted': self.is_blacklisted,
            'created_at': self.created_at.isoformat()
        }


class Student(db.Model):
    __tablename__ = 'students'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    roll_number = db.Column(db.String(50), unique=True, nullable=False)
    branch = db.Column(db.String(50), nullable=False)
    cgpa = db.Column(db.Float, default=0.0)
    year = db.Column(db.Integer, default=4)
    phone = db.Column(db.String(20))
    resume_filename = db.Column(db.String(200))
    applications = db.relationship('Application', backref='student', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id, 'user_id': self.user_id, 'name': self.name,
            'roll_number': self.roll_number, 'branch': self.branch,
            'cgpa': self.cgpa, 'year': self.year, 'phone': self.phone,
            'resume_filename': self.resume_filename,
            'email': self.user.email if self.user else None,
            'is_active': self.user.is_active if self.user else True,
            'is_blacklisted': self.user.is_blacklisted if self.user else False
        }


class Company(db.Model):
    __tablename__ = 'companies'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True, nullable=False)
    company_name = db.Column(db.String(150), nullable=False)
    hr_contact = db.Column(db.String(100))
    website = db.Column(db.String(200))
    description = db.Column(db.Text)
    approval_status = db.Column(db.String(20), default='pending')  # pending|approved|rejected
    drives = db.relationship('PlacementDrive', backref='company', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id, 'user_id': self.user_id, 'company_name': self.company_name,
            'hr_contact': self.hr_contact, 'website': self.website,
            'description': self.description, 'approval_status': self.approval_status,
            'email': self.user.email if self.user else None,
            'is_active': self.user.is_active if self.user else True,
            'is_blacklisted': self.user.is_blacklisted if self.user else False
        }


class PlacementDrive(db.Model):
    __tablename__ = 'placement_drives'
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False)
    job_title = db.Column(db.String(150), nullable=False)
    job_description = db.Column(db.Text)
    eligibility_criteria = db.Column(db.Text)
    cgpa_required = db.Column(db.Float, default=0.0)
    branches_allowed = db.Column(db.String(200), default='All')
    application_deadline = db.Column(db.String(20), nullable=False)
    package_lpa = db.Column(db.Float, default=0.0)
    status = db.Column(db.String(20), default='pending')  # pending|approved|closed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    applications = db.relationship('Application', backref='drive', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id, 'company_id': self.company_id,
            'company_name': self.company.company_name if self.company else None,
            'job_title': self.job_title, 'job_description': self.job_description,
            'eligibility_criteria': self.eligibility_criteria,
            'cgpa_required': self.cgpa_required, 'branches_allowed': self.branches_allowed,
            'application_deadline': self.application_deadline, 'package_lpa': self.package_lpa,
            'status': self.status, 'created_at': self.created_at.isoformat(),
            'applicant_count': len(self.applications)
        }


class Application(db.Model):
    __tablename__ = 'applications'
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False)
    drive_id = db.Column(db.Integer, db.ForeignKey('placement_drives.id'), nullable=False)
    application_date = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), default='applied')  # applied|shortlisted|selected|rejected
    __table_args__ = (db.UniqueConstraint('student_id', 'drive_id'),)

    def to_dict(self):
        return {
            'id': self.id, 'student_id': self.student_id, 'drive_id': self.drive_id,
            'application_date': self.application_date.isoformat(), 'status': self.status,
            'student_name': self.student.name if self.student else None,
            'roll_number': self.student.roll_number if self.student else None,
            'branch': self.student.branch if self.student else None,
            'cgpa': self.student.cgpa if self.student else None,
            'company_name': self.drive.company.company_name if self.drive and self.drive.company else None,
            'job_title': self.drive.job_title if self.drive else None,
            'package_lpa': self.drive.package_lpa if self.drive else None,
        }
