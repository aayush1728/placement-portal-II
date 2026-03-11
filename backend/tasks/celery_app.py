from celery import Celery
import os

REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')

celery = Celery(
    'ppa_tasks',
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=['tasks.jobs']
)

celery.conf.update(
    task_serializer='json',
    result_serializer='json',
    accept_content=['json'],
    timezone='Asia/Kolkata',
    enable_utc=True,
    beat_schedule={
        'daily-deadline-reminders': {
            'task': 'tasks.jobs.send_deadline_reminders',
            'schedule': 86400.0,  # every 24 hours
        },
        'monthly-activity-report': {
            'task': 'tasks.jobs.send_monthly_report',
            'schedule': 2592000.0,  # every 30 days
        },
    }
)
