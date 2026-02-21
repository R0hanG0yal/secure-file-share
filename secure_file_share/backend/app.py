from flask import Flask, render_template, request, redirect, url_for, flash, session, send_from_directory, abort
from werkzeug.utils import secure_filename
import os
from config import Config
from models import init_db, get_user_by_email, create_user, verify_user, get_user_files, save_file_metadata, get_file_by_id, create_share_link, get_share_link, increment_download_count, delete_share_link, get_access_requests, create_access_request, update_request_status
from utils import allowed_file, save_uploaded_file

app = Flask(__name__)
app.config.from_object(Config)

# Ensure upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Initialize database
init_db()

@app.before_request
def require_login():
    protected_routes = ['dashboard', 'upload', 'requests', 'share_file']
    if request.endpoint in protected_routes and 'user_id' not in session:
        return redirect(url_for('login'))

def login_required(f):
    def wrap(*args, **kwargs):
        if 'user_id' not in session:
            flash('Please log in to access this page.', 'error')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    wrap.__name__ = f.__name__
    return wrap

@app.route('/')
def index():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        user = verify_user(email, password)
        if user:
            session['user_id'] = user['id']
            session['email'] = user['email']
            flash('Login successful!', 'success')
            return redirect(url_for('dashboard'))
        flash('Invalid email or password.', 'error')
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        if create_user(email, password):
            flash('Registration successful! Please log in.', 'success')
            return redirect(url_for('login'))
        flash('Email already exists.', 'error')
    return render_template('register.html')

@app.route('/logout')
def logout():
    session.clear()
    flash('Logged out successfully.', 'success')
    return redirect(url_for('login'))

@app.route('/dashboard')
@login_required
def dashboard():
    files = get_user_files(session['user_id'])
    return render_template('dashboard.html', files=files)

@app.route('/upload', methods=['GET', 'POST'])
@login_required
def upload():
    if request.method == 'POST':
        if 'file' not in request.files:
            flash('No file selected.', 'error')
            return redirect(request.url)
        
        file = request.files['file']
        if file.filename == '':
            flash('No file selected.', 'error')
            return redirect(request.url)
        
        filename, filepath, size = save_uploaded_file(file, app.config['UPLOAD_FOLDER'])
        if filename:
            file_id = save_file_metadata(session['user_id'], filename, file.filename, size)
            flash(f'File "{file.filename}" uploaded successfully! ID: {file_id}', 'success')
        else:
            flash('Invalid file type. Allowed: txt, pdf, png, jpg, jpeg, gif, zip, doc, docx', 'error')
        return redirect(url_for('dashboard'))
    
    return render_template('upload.html')

@app.route('/share/<int:file_id>', methods=['GET', 'POST'])
@login_required
def share_file(file_id):
    file_data = get_file_by_id(file_id)
    if not file_data or file_data[1] != session['user_id']:
        flash('File not found or access denied.', 'error')
        return redirect(url_for('dashboard'))
    
    requests = get_access_requests(file_id)
    
    if request.method == 'POST':
        action = request.form.get('action')
        if action == 'create_link':
            expires_hours = int(request.form.get('expires_hours', 24))
            one_time = 'one_time' in request.form
            token = create_share_link(file_id, expires_hours, one_time)
            share_url = url_for('download_share', token=token, _external=True)
            flash(f'Share link created: {share_url}', 'success')
        elif action == 'request_access':
            email = request.form['requester_email']
            create_access_request(file_id, email)
            flash(f'Access request sent to {email}', 'success')
        elif action == 'update_request':
            request_id = int(request.form['request_id'])
            status = request.form['status']
            update_request_status(request_id, status)
            flash(f'Request {status}', 'success')
    
    return render_template('share.html', file=file_data, requests=requests)

@app.route('/download/<token>')
def download_share(token):
    link_data = get_share_link(token)
    if not link_data:
        abort(404)
    
    file_path = link_data[7]  # file_path index
    filename = link_data[8]   # original_filename index
    
    increment_download_count(token)
    
    # Check if one-time and already downloaded
    if link_data[5] and link_data[4] >= 1:  # is_one_time and downloads >= 1
        delete_share_link(token)
    
    return send_from_directory(
        app.config['UPLOAD_FOLDER'], 
        link_data[9],  # filename index
        as_attachment=True,
        download_name=filename,
        mimetype='application/octet-stream'
    )

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
