"""
Entry point for Celery worker.
Run with: celery -A celery_worker.celery_app worker --loglevel=info
Run beat:  celery -A celery_worker.celery_app beat  --loglevel=info
"""
from app import create_app
from extensions import celery_app

flask_app = create_app("development")
flask_app.app_context().push()

# Import tasks so Celery discovers them
import tasks.reminders  # noqa
import tasks.reports    # noqa
import tasks.exports    # noqa
