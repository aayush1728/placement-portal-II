from dotenv import load_dotenv
load_dotenv()

from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from models import db, User, Student, Company, PlacementDrive, Application
from werkzeug.security import generate_password_hash
import redis
import os

from extensions import cache

def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///placement.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = 'ppa_jwt_secret_2026_secure'
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = False  # tokens don't expire for demo
    app.config['MAIL_SERVER'] = 'smtp.gmail.com'
    app.config['MAIL_PORT'] = 587
    app.config['MAIL_USE_TLS'] = True
    app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME', '')
    app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD', '')
    app.config['MAIL_DEFAULT_SENDER'] = os.environ.get('MAIL_USERNAME', 'noreply@placement.com')
    app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), 'uploads')
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    CORS(app, origins='*', supports_credentials=True)
    db.init_app(app)
    JWTManager(app)

    from routes.auth import auth_bp
    from routes.admin import admin_bp
    from routes.company import company_bp
    from routes.student import student_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(company_bp, url_prefix='/api/company')
    app.register_blueprint(student_bp, url_prefix='/api/student')

    with app.app_context():
        db.create_all()
        _seed_admin()

    return app

def _seed_admin():
    if not User.query.filter_by(role='admin').first():
        admin = User(email='admin@placement.com',
                     password=generate_password_hash('admin123'),
                     role='admin', is_active=True)
        db.session.add(admin)
        db.session.commit()
        print('Admin created: admin@placement.com / admin123')

app = create_app()

if __name__ == '__main__':
    app.run(debug=True, port=5000)
