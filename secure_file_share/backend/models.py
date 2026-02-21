import sqlite3
import os
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash

def init_db():
    """Initialize database and create tables"""
    conn = sqlite3.connect('secure_share.db')
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Files table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS files (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            filename TEXT NOT NULL,
            original_filename TEXT NOT NULL,
            file_path TEXT NOT NULL,
            file_size INTEGER,
            upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Share links table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS share_links (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            file_id INTEGER NOT NULL,
            token TEXT UNIQUE NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            is_one_time BOOLEAN DEFAULT FALSE,
            downloads INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (file_id) REFERENCES files (id)
        )
    ''')
    
    # Access requests table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS access_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            file_id INTEGER NOT NULL,
            requester_email TEXT NOT NULL,
            status TEXT DEFAULT 'pending',  -- pending, approved, denied
            requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (file_id) REFERENCES files (id)
        )
    ''')
    
    conn.commit()
    conn.close()

def get_user_by_email(email):
    conn = sqlite3.connect('secure_share.db')
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users WHERE email = ?', (email,))
    user = cursor.fetchone()
    conn.close()
    return user

def create_user(email, password):
    conn = sqlite3.connect('secure_share.db')
    cursor = conn.cursor()
    password_hash = generate_password_hash(password)
    try:
        cursor.execute('INSERT INTO users (email, password_hash) VALUES (?, ?)', 
                      (email, password_hash))
        conn.commit()
        conn.close()
        return True
    except sqlite3.IntegrityError:
        conn.close()
        return False

def verify_user(email, password):
    user = get_user_by_email(email)
    if user and check_password_hash(user[2], password):
        return {'id': user[0], 'email': user[1]}
    return None

def get_user_files(user_id):
    conn = sqlite3.connect('secure_share.db')
    cursor = conn.cursor()
    cursor.execute('''
        SELECT id, filename, original_filename, file_size, upload_date 
        FROM files WHERE user_id = ? ORDER BY upload_date DESC
    ''', (user_id,))
    files = cursor.fetchall()
    conn.close()
    return files

def save_file_metadata(user_id, filename, original_filename, file_size):
    conn = sqlite3.connect('secure_share.db')
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO files (user_id, filename, original_filename, file_size)
        VALUES (?, ?, ?, ?)
    ''', (user_id, filename, original_filename, file_size))
    file_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return file_id

def get_file_by_id(file_id):
    conn = sqlite3.connect('secure_share.db')
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM files WHERE id = ?', (file_id,))
    file_data = cursor.fetchone()
    conn.close()
    return file_data

def create_share_link(file_id, expires_hours=24, one_time=False):
    import secrets
    import uuid
    token = str(uuid.uuid4())
    expires_at = datetime.now() + timedelta(hours=expires_hours)
    
    conn = sqlite3.connect('secure_share.db')
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO share_links (file_id, token, expires_at, is_one_time)
        VALUES (?, ?, ?, ?)
    ''', (file_id, token, expires_at, one_time))
    conn.commit()
    conn.close()
    return token

def get_share_link(token):
    conn = sqlite3.connect('secure_share.db')
    cursor = conn.cursor()
    cursor.execute('''
        SELECT sl.*, f.file_path, f.original_filename, f.filename, u.email
        FROM share_links sl
        JOIN files f ON sl.file_id = f.id
        JOIN users u ON f.user_id = u.id
        WHERE sl.token = ? AND sl.expires_at > datetime('now')
    ''', (token,))
    link = cursor.fetchone()
    conn.close()
    return link

def increment_download_count(token):
    conn = sqlite3.connect('secure_share.db')
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE share_links SET downloads = downloads + 1 WHERE token = ?
    ''', (token,))
    conn.commit()
    conn.close()

def delete_share_link(token):
    conn = sqlite3.connect('secure_share.db')
    cursor = conn.cursor()
    cursor.execute('DELETE FROM share_links WHERE token = ?', (token,))
    conn.commit()
    conn.close()

def get_access_requests(file_id):
    conn = sqlite3.connect('secure_share.db')
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM access_requests WHERE file_id = ? ORDER BY requested_at DESC
    ''', (file_id,))
    requests = cursor.fetchall()
    conn.close()
    return requests

def create_access_request(file_id, email):
    conn = sqlite3.connect('secure_share.db')
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO access_requests (file_id, requester_email)
        VALUES (?, ?)
    ''', (file_id, email))
    conn.commit()
    conn.close()

def update_request_status(request_id, status):
    conn = sqlite3.connect('secure_share.db')
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE access_requests SET status = ? WHERE id = ?
    ''', (status, request_id))
    conn.commit()
    conn.close()
