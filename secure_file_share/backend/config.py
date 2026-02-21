import os
from werkzeug.security import generate_password_hash, check_password_hash

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'your-super-secret-key-change-in-production'
    UPLOAD_FOLDER ='/app/uploads' 
    MAX_CONTENT_LENGTH = 100 * 1024 * 1024  # 100MB max file size
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SECURE = False  # Set to True in production with HTTPS
    PERMANENT_SESSION_LIFETIME = 3600  # 1 hour

 