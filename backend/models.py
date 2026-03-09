from extensions import db
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash


# ─────────────────────────────────────────────
#  UNIFIED USER MODEL
# ─────────────────────────────────────────────
class User(db.Model):
    __tablename__ = "users"

    id            = db.Column(db.Integer, primary_key=True)
    email         = db.Column(db.String(150), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256), nullable=False)
    role          = db.Column(db.String(20), nullable=False)   # admin | company | student
    is_active     = db.Column(db.Boolean, default=True)
    is_blacklisted= db.Column(db.Boolean, default=False)
    created_at    = db.Column(db.DateTime, default=datetime.utcnow)

    student_profile = db.relationship("StudentProfile", backref="user", uselist=False, cascade="all, delete-orphan")
    company_profile = db.relationship("CompanyProfile", backref="user", uselist=False, cascade="all, delete-orphan")

    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "role": self.role,
            "is_active": self.is_active,
            "is_blacklisted": self.is_blacklisted,
            "created_at": self.created_at.isoformat(),
        }


# ─────────────────────────────────────────────
#  STUDENT PROFILE
# ─────────────────────────────────────────────
class StudentProfile(db.Model):
    __tablename__ = "student_profiles"

    id          = db.Column(db.Integer, primary_key=True)
    user_id     = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, unique=True)
    full_name   = db.Column(db.String(150), nullable=False)
    roll_number = db.Column(db.String(50), unique=True)
    branch      = db.Column(db.String(100))
    cgpa        = db.Column(db.Float, default=0.0)
    year        = db.Column(db.Integer)          # current year of study
    grad_year   = db.Column(db.Integer)          # expected graduation year
    phone       = db.Column(db.String(20))
    skills      = db.Column(db.Text)             # comma-separated
    resume_path = db.Column(db.String(300))
    updated_at  = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    applications = db.relationship("Application", backref="student", lazy="dynamic", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "full_name": self.full_name,
            "email": self.user.email,
            "roll_number": self.roll_number,
            "branch": self.branch,
            "cgpa": self.cgpa,
            "year": self.year,
            "grad_year": self.grad_year,
            "phone": self.phone,
            "skills": self.skills,
            "resume_path": self.resume_path,
            "is_active": self.user.is_active,
            "is_blacklisted": self.user.is_blacklisted,
        }


# ─────────────────────────────────────────────
#  COMPANY PROFILE
# ─────────────────────────────────────────────
class CompanyProfile(db.Model):
    __tablename__ = "company_profiles"

    id              = db.Column(db.Integer, primary_key=True)
    user_id         = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, unique=True)
    company_name    = db.Column(db.String(200), nullable=False)
    hr_name         = db.Column(db.String(150))
    hr_contact      = db.Column(db.String(100))
    website         = db.Column(db.String(300))
    description     = db.Column(db.Text)
    industry        = db.Column(db.String(100))
    headquarters    = db.Column(db.String(200))
    approval_status = db.Column(db.String(20), default="pending")  # pending | approved | rejected
    registered_at   = db.Column(db.DateTime, default=datetime.utcnow)

    drives = db.relationship("PlacementDrive", backref="company", lazy="dynamic", cascade="all, delete-orphan")

    def to_dict(self, include_drives=False):
        data = {
            "id": self.id,
            "user_id": self.user_id,
            "company_name": self.company_name,
            "email": self.user.email,
            "hr_name": self.hr_name,
            "hr_contact": self.hr_contact,
            "website": self.website,
            "description": self.description,
            "industry": self.industry,
            "headquarters": self.headquarters,
            "approval_status": self.approval_status,
            "is_active": self.user.is_active,
            "is_blacklisted": self.user.is_blacklisted,
            "registered_at": self.registered_at.isoformat(),
        }
        if include_drives:
            data["drives_count"] = self.drives.count()
        return data


# ─────────────────────────────────────────────
#  PLACEMENT DRIVE
# ─────────────────────────────────────────────
class PlacementDrive(db.Model):
    __tablename__ = "placement_drives"

    id                   = db.Column(db.Integer, primary_key=True)
    company_id           = db.Column(db.Integer, db.ForeignKey("company_profiles.id"), nullable=False)
    job_title            = db.Column(db.String(200), nullable=False)
    job_description      = db.Column(db.Text)
    job_type             = db.Column(db.String(50), default="Full-Time")  # Full-Time | Internship | Contract
    location             = db.Column(db.String(200))
    package_lpa          = db.Column(db.Float)           # in LPA
    eligible_branches    = db.Column(db.String(500), default="All")   # comma-separated or "All"
    min_cgpa             = db.Column(db.Float, default=0.0)
    eligible_grad_year   = db.Column(db.Integer)         # graduating batch year
    application_deadline = db.Column(db.DateTime)
    interview_date       = db.Column(db.DateTime)
    status               = db.Column(db.String(20), default="pending")  # pending | approved | closed | rejected
    created_at           = db.Column(db.DateTime, default=datetime.utcnow)

    applications = db.relationship("Application", backref="drive", lazy="dynamic", cascade="all, delete-orphan")

    def to_dict(self, include_company=True):
        data = {
            "id": self.id,
            "company_id": self.company_id,
            "job_title": self.job_title,
            "job_description": self.job_description,
            "job_type": self.job_type,
            "location": self.location,
            "package_lpa": self.package_lpa,
            "eligible_branches": self.eligible_branches,
            "min_cgpa": self.min_cgpa,
            "eligible_grad_year": self.eligible_grad_year,
            "application_deadline": self.application_deadline.isoformat() if self.application_deadline else None,
            "interview_date": self.interview_date.isoformat() if self.interview_date else None,
            "status": self.status,
            "applications_count": self.applications.count(),
            "created_at": self.created_at.isoformat(),
        }
        if include_company:
            data["company_name"] = self.company.company_name
            data["company_industry"] = self.company.industry
        return data


# ─────────────────────────────────────────────
#  APPLICATION
# ─────────────────────────────────────────────
class Application(db.Model):
    __tablename__ = "applications"

    id         = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey("student_profiles.id"), nullable=False)
    drive_id   = db.Column(db.Integer, db.ForeignKey("placement_drives.id"), nullable=False)
    applied_at = db.Column(db.DateTime, default=datetime.utcnow)
    status     = db.Column(db.String(20), default="applied")  # applied|shortlisted|selected|rejected
    notes      = db.Column(db.Text)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint("student_id", "drive_id", name="uq_student_drive"),
    )

    def to_dict(self, include_student=False, include_drive=False):
        data = {
            "id": self.id,
            "student_id": self.student_id,
            "drive_id": self.drive_id,
            "applied_at": self.applied_at.isoformat(),
            "status": self.status,
            "notes": self.notes,
            "updated_at": self.updated_at.isoformat(),
        }
        if include_student:
            data["student"] = {
                "full_name": self.student.full_name,
                "roll_number": self.student.roll_number,
                "branch": self.student.branch,
                "cgpa": self.student.cgpa,
                "email": self.student.user.email,
            }
        if include_drive:
            data["drive"] = {
                "job_title": self.drive.job_title,
                "company_name": self.drive.company.company_name,
                "location": self.drive.location,
                "package_lpa": self.drive.package_lpa,
                "status": self.drive.status,
            }
        return data
