import redis
import os

REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
cache = redis.from_url(REDIS_URL, decode_responses=True)