#!/usr/bin/env python3
"""
Quick-start entry point: runs the Flask development server.

Usage:
    cd placement_portal
    python run.py
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
os.environ.setdefault('FLASK_ENV', 'development')

from app import flask_app  # noqa: E402

if __name__ == '__main__':
    flask_app.run(
        host='0.0.0.0',
        port=5000,
        debug=True,
    )
