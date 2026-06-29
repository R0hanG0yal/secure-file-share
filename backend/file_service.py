import os
import uuid
import mimetypes
from werkzeug.utils import secure_filename
from database import get_db

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "uploads")
ALLOWED_MIME_TYPES = {
    # Images
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp', 'image/tiff',
    # Documents
    'application/pdf', 'text/plain', 'text/csv', 'text/html', 'text/css', 'text/javascript',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    # Archives
    'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed', 'application/gzip',
    # Audio/Video
    'audio/mpeg', 'audio/wav', 'audio/ogg', 'video/mp4', 'video/webm', 'video/ogg', 'audio/mp4',
    # Code / Data
    'application/json', 'application/xml', 'text/xml', 'text/markdown',
    # Fallback (encrypted blobs)
    'application/octet-stream',
}

def save_file(file, owner_id):
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    
    # Path Traversal Protection
    safe_filename = secure_filename(file.filename)
    if not safe_filename:
        safe_filename = "unnamed_file"
        
    # MIME-Type Validation
    mime_type = file.mimetype
    if mime_type not in ALLOWED_MIME_TYPES:
        # Fallback to guessing if the browser didn't send a strict mimetype or if we want to be safe
        guess_type, _ = mimetypes.guess_type(safe_filename)
        if guess_type not in ALLOWED_MIME_TYPES and mime_type != 'application/octet-stream':
            raise ValueError(f"Disallowed MIME type: {mime_type}")

    stored_name = f"{uuid.uuid4()}_{safe_filename}"
    path = os.path.join(UPLOAD_FOLDER, stored_name)
    file.save(path)

    db = get_db()
    db.execute(
        "INSERT INTO files (owner_id, filename, stored_name) VALUES (?, ?, ?)",
        (owner_id, safe_filename, stored_name)
    )
    db.commit()

def get_user_files(user_id):
    db = get_db()
    return db.execute(
        "SELECT * FROM files WHERE owner_id = ?", (user_id,)
    ).fetchall()

def get_file(file_id):
    db = get_db()
    return db.execute("SELECT * FROM files WHERE id = ?", (file_id,)).fetchone()