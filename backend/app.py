from flask import Flask, render_template, request, redirect, session, send_from_directory, flash
import os, base64, mimetypes
from database import init_db
from auth import register_user, authenticate_user, login_required
from file_service import save_file, get_user_files, get_file, UPLOAD_FOLDER
from share_service import *

app = Flask(__name__,
            template_folder="../frontend",
            static_folder="../frontend/static")

app.secret_key = os.getenv('SECRET_KEY', 'super-secure-secret')

init_db()

@app.route("/", methods=["GET", "POST"])
@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        user = authenticate_user(request.form["email"], request.form["password"])
        if user:
            session["user_id"] = user["id"]
            session["email"] = request.form["email"]
            return redirect("/dashboard")
    return render_template("login.html")

@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        if register_user(request.form["email"], request.form["password"]):
            return redirect("/login")
    return render_template("register.html")

@app.route("/logout")
def logout():
    session.clear()
    return redirect("/login")

@app.route("/dashboard")
@login_required
def dashboard():
    files = get_user_files(session["user_id"])
    return render_template("dashboard.html", files=files)

@app.route("/upload", methods=["GET", "POST"])
@login_required
def upload():
    if request.method == "POST":
        save_file(request.files["file"], session["user_id"])
        return redirect("/dashboard")
    return render_template("upload.html")

@app.route("/share/<int:file_id>", methods=["POST"])
@login_required
def share(file_id):
    token = create_share(
        file_id,
        int(request.form["hours"]),
        "one_time" in request.form
    )
    return render_template("share_link.html", link=f"http://{request.host}/download/{token}")

@app.route("/download/<token>", methods=["GET", "POST"])
def download(token):
    share = get_share(token)
    if not share:
        return "Invalid or expired link"

    file = get_file(share["file_id"])

    if request.method == "POST":
        email = request.form.get("email")
        if not email:
            flash("Please provide an email address.", "error")
            return render_template("shared_file.html", file=file)

        status = check_access(file["id"], email)

        if status == "approved":
            increment_download(share)
            
            # If one_time is enabled, render a secure preview page instead of downloading
            is_one_time = bool(share["one_time"])
            
            if is_one_time:
                flash("This is a one-time secure preview. You will not be able to access this link again.", "info")
                file_path = os.path.join(UPLOAD_FOLDER, file["stored_name"])
                mime_type, _ = mimetypes.guess_type(file["filename"])
                
                # Check if it's a previewable file
                if mime_type and (mime_type.startswith("image/") or mime_type == "application/pdf" or mime_type.startswith("text/")):
                    with open(file_path, "rb") as f:
                        file_bytes = f.read()
                        if mime_type.startswith("text/"):
                            content_data = file_bytes.decode("utf-8", errors="replace")
                        else:
                            content_data = base64.b64encode(file_bytes).decode("utf-8")
                    return render_template("secure_preview.html", file=file, content=content_data, mime_type=mime_type)
                else:
                    flash(f"This file type ({file['filename']}) cannot be securely previewed in the browser. Please ask the owner to share it as a standard download.", "error")
                    return render_template("shared_file.html", file=file)
            else:
                flash("Your access was approved! Starting download...", "success")
                return send_from_directory(
                    UPLOAD_FOLDER,
                    file["stored_name"],
                    as_attachment=True,
                    download_name=file["filename"]
                )
        elif status == "pending":
            flash("Your access request is still pending approval by the owner.", "info")
        elif status == "denied":
            flash("Your access request was denied.", "error")
        else:
            request_access(file["id"], email)
            flash("Access requested! Please wait for the owner to approve.", "success")

    return render_template("shared_file.html", file=file)

@app.route("/access_requests", methods=["GET", "POST"])
@login_required
def access_requests():
    if request.method == "POST":
        update_request(request.form["id"], request.form["status"])
        flash(f"Request {request.form['status']} successfully.", "success")
    
    all_requests = get_requests(session["user_id"])
    pending_requests = [r for r in all_requests if r["status"] == "pending"]
    history_requests = [r for r in all_requests if r["status"] != "pending"]
    
    return render_template("access_requests.html", pending_requests=pending_requests, history_requests=history_requests)

    port = int(os.getenv('PORT', 5004))
    app.run(host="0.0.0.0", port=port, debug=False)