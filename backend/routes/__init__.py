from .auth    import auth_bp
from .admin   import admin_bp
from .company import company_bp
from .student import student_bp
from .drives  import drives_bp

__all__ = ["auth_bp", "admin_bp", "company_bp", "student_bp", "drives_bp"]
