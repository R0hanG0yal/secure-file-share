"""
WSGI entry point for Render / Gunicorn.
Adds the backend directory to sys.path so all imports work correctly.
"""
import sys
import os

# Make sure the backend folder is on the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

from app import app  # noqa: E402

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5004))
    app.run(host="0.0.0.0", port=port, debug=False)
