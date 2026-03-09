from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_mail import Mail
from flask_caching import Cache
from flask_cors import CORS
from celery import Celery

db = SQLAlchemy()
jwt = JWTManager()
mail = Mail()
cache = Cache()
cors = CORS()
celery_app = Celery()


def make_celery(app):
    """Bind Celery to the Flask app context."""
    celery_app.conf.update(
        broker_url=app.config["CELERY_BROKER_URL"],
        result_backend=app.config["CELERY_RESULT_BACKEND"],
        task_serializer="json",
        result_serializer="json",
        accept_content=["json"],
        timezone="Asia/Kolkata",
        enable_utc=True,
        beat_schedule={
            "daily-deadline-reminders": {
                "task": "tasks.reminders.send_deadline_reminders",
                "schedule": 86400,  # every 24 hours
            },
            "monthly-activity-report": {
                "task": "tasks.reports.send_monthly_report",
                "schedule": 2592000,  # ~30 days
            },
        },
    )

    class ContextTask(celery_app.Task):
        def __call__(self, *args, **kwargs):
            with app.app_context():
                return self.run(*args, **kwargs)

    celery_app.Task = ContextTask
    return celery_app
