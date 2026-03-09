import os
from flask import Flask, jsonify, send_from_directory
from config import config_map
from extensions import db, jwt, mail, cache, cors, make_celery
from models import User


def create_app(env: str = "development") -> Flask:
    app = Flask(__name__, template_folder="templates", static_folder="static")
    app.config.from_object(config_map.get(env, config_map["default"]))

    # Ensure upload dir exists
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    # Init extensions
    db.init_app(app)
    jwt.init_app(app)
    mail.init_app(app)
    cache.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # Celery
    make_celery(app)

    # Blueprints
    from routes import auth_bp, admin_bp, company_bp, student_bp, drives_bp
    app.register_blueprint(auth_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(company_bp)
    app.register_blueprint(student_bp)
    app.register_blueprint(drives_bp)

    # Serve resume/export files
    @app.route("/api/files/<path:filename>")
    def serve_file(filename):
        return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

    # Health check
    @app.route("/api/health")
    def health():
        return jsonify({"status": "ok", "service": "Placement Portal API"})

    # Catch-all: serve Vue SPA
    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def spa_index(path):
        from flask import render_template
        return render_template("index.html")

    # JWT error handlers
    @jwt.expired_token_loader
    def expired(_jwt_header, _jwt_data):
        return jsonify({"error": "Token has expired. Please log in again."}), 401

    @jwt.invalid_token_loader
    def invalid(reason):
        return jsonify({"error": f"Invalid token: {reason}"}), 422

    @jwt.unauthorized_loader
    def unauthorized(reason):
        return jsonify({"error": "Authorization required."}), 401

    # Generic error handlers
    @app.errorhandler(404)
    def not_found(_):
        return jsonify({"error": "Resource not found."}), 404

    @app.errorhandler(500)
    def server_error(_):
        return jsonify({"error": "Internal server error."}), 500

    # DB init + seed admin
    with app.app_context():
        db.create_all()
        _seed_admin(app)

    return app


def _seed_admin(app: Flask):
    """Create the admin user if it doesn't exist."""
    email = app.config["ADMIN_EMAIL"]
    if not User.query.filter_by(email=email, role="admin").first():
        admin = User(email=email, role="admin")
        admin.set_password(app.config["ADMIN_PASSWORD"])
        db.session.add(admin)
        db.session.commit()
        print(f"[Seed] Admin created: {email}")


if __name__ == "__main__":
    flask_app = create_app("development")
    flask_app.run(debug=True, host="0.0.0.0", port=5000)
