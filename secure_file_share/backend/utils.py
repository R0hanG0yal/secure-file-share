import os
import secrets
from werkzeug.utils import secure_filename

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in {
               'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'zip', 'doc', 'docx'
           }

def save_uploaded_file(file, upload_folder):
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        # Generate unique filename
        while os.path.exists(os.path.join(upload_folder, filename)):
            filename = secure_filename(secrets.token_urlsafe(16) + '_' + file.filename)
        
        filepath = os.path.join(upload_folder, filename)
        file.save(filepath)
        return filename, filepath, os.path.getsize(filepath)
    return None, None, 0
