from flask import Flask, render_template, request, redirect, session, send_from_directory, flash, jsonify
import os, base64, mimetypes, uuid, string, random
import threading, time, urllib.request, sys

# Add the backend directory to sys.path so imports work when run from the parent directory (e.g. by Gunicorn on Render)
_BASE = os.path.dirname(os.path.abspath(__file__))
if _BASE not in sys.path:
    sys.path.insert(0, _BASE)

# pyrefly: ignore [missing-import]
from flask_wtf.csrf import CSRFProtect
# pyrefly: ignore [missing-import]
from flask_limiter import Limiter
# pyrefly: ignore [missing-import]
from flask_limiter.util import get_remote_address
from database import init_db
from auth import register_user, authenticate_user, login_required
from file_service import save_file, get_user_files, get_file, UPLOAD_FOLDER
from share_service import *

_BASE = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__,
            template_folder=os.path.join(_BASE, "..", "frontend"),
            static_folder=os.path.join(_BASE, "..", "frontend", "static"))

app.secret_key = os.getenv('SECRET_KEY', 'super-secure-secret')

# Strict Session Cookies
app.config.update(
    SESSION_COOKIE_SECURE=True,
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE='Lax'
)

# CSRF Protection
csrf = CSRFProtect(app)

# Rate Limiting
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://"
)

@app.after_request
def add_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' stun: turn: turns: *.google.com:* *.metered.ca:*; img-src 'self' data: blob: https://api.qrserver.com; child-src 'self' blob:; frame-src 'self' blob:; object-src 'self' blob:;"
    
    # Prevent caching for API endpoints
    if request.path.startswith('/api/'):
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
        
    return response

init_db()

@app.route("/", methods=["GET", "POST"])
@app.route("/login", methods=["GET", "POST"])
@limiter.limit("10 per minute")
def login():
    if request.method == "POST":
        user = authenticate_user(request.form["email"], request.form["password"])
        if user:
            session["user_id"] = user["id"]
            session["email"] = request.form["email"]
            return redirect("/dashboard")
    return render_template("login.html")

@app.route("/register", methods=["GET", "POST"])
@limiter.limit("5 per minute")
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
        try:
            if "file" not in request.files or request.files["file"].filename == "":
                return jsonify({"error": "No file selected"}), 400
            save_file(request.files["file"], session["user_id"])
            db = get_db()
            file_record = db.execute("SELECT id FROM files WHERE owner_id = ? ORDER BY id DESC LIMIT 1", (session["user_id"],)).fetchone()
            return jsonify({"success": True, "file_id": file_record["id"]})
        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        except Exception as e:
            return jsonify({"error": "Upload failed: " + str(e)}), 500
    return render_template("upload.html")

@app.route("/share/<int:file_id>", methods=["POST"])
@login_required
def share(file_id):
    token = create_share(
        file_id,
        int(request.form["hours"]),
        "one_time" in request.form
    )
    return render_template("share_link.html", link=f"http://{request.host}/download/{token}", file_id=file_id)

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

    return render_template("shared_file.html", file=file, email=request.form.get("email") if request.method == "POST" else None)

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

@app.route("/ping")
def ping():
    return "pong", 200

def keep_alive():
    url = os.getenv("RENDER_EXTERNAL_URL")
    if not url:
        return
    # wait a bit before first ping
    time.sleep(10)
    ping_url = f"{url.rstrip('/')}/ping"
    while True:
        try:
            req = urllib.request.Request(ping_url, headers={'User-Agent': 'KeepAlive/1.0'})
            urllib.request.urlopen(req)
        except Exception:
            pass
        time.sleep(14 * 60)

threading.Thread(target=keep_alive, daemon=True).start()

# ============================================================
# P2P Signaling and Room Management (AirIt Model)
# ============================================================

# In-memory stores for P2P state
active_rooms = {}  # room_code -> { "created_at": timestamp, "files": [] }
room_access_requests = {} # room_code -> [ { "id": req_id, "email": email, "status": "pending" | "approved" | "denied" } ]
active_signals = {} # room_code -> { "sender_queue": [], "receiver_queue": [], "last_activity": timestamp }

def generate_room_code():
    while True:
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        if code not in active_rooms:
            return code

@app.route("/p2p", strict_slashes=False)
def p2p_portal():
    return render_template("p2p_portal.html")

@app.route("/p2p/send", strict_slashes=False)
def p2p_send():
    return render_template("p2p_send.html")

@app.route("/p2p/receive", strict_slashes=False)
def p2p_receive():
    room_code = request.args.get("room", "")
    return render_template("p2p_receive.html", room_code=room_code)

def cleanup_stale_rooms():
    now = time.time()
    stale_codes = [code for code, data in active_rooms.items() if now - data["created_at"] > 3600]
    for code in stale_codes:
        active_rooms.pop(code, None)
        room_access_requests.pop(code, None)
        active_signals.pop(code, None)

@app.route("/api/p2p/create", methods=["POST"])
@csrf.exempt
@limiter.limit("10 per minute")
def api_p2p_create():
    cleanup_stale_rooms()
    if len(active_rooms) > 10000:
        return jsonify({"error": "Too many active rooms"}), 429
    code = generate_room_code()
    active_rooms[code] = {
        "created_at": time.time(),
        "files": []
    }
    room_access_requests[code] = []
    active_signals[code] = {
        "sender_queue": [],
        "receiver_queue": [],
        "last_activity": time.time()
    }
    return jsonify({"room_code": code})

@app.route("/api/p2p/register_files/<room_code>", methods=["POST"])
@csrf.exempt
@limiter.exempt
def api_p2p_register_files(room_code):
    if room_code not in active_rooms:
        return jsonify({"error": "Room not found"}), 404
    data = request.get_json() or {}
    active_rooms[room_code]["files"] = data.get("files", [])
    return jsonify({"success": True})

@app.route("/api/p2p/room_info/<room_code>", methods=["GET"])
@limiter.exempt
def api_p2p_room_info(room_code):
    if room_code not in active_rooms:
        return jsonify({"error": "Room not found"}), 404
    return jsonify({
        "room_code": room_code,
        "files": active_rooms[room_code]["files"]
    })

@app.route("/api/p2p/request_access/<room_code>", methods=["POST"])
@csrf.exempt
@limiter.limit("5 per minute")
def api_p2p_request_access(room_code):
    if room_code not in active_rooms:
        return jsonify({"error": "Room not found"}), 404
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    if not email:
        return jsonify({"error": "Email is required"}), 400
    
    requests_list = room_access_requests.setdefault(room_code, [])
    req_id = str(uuid.uuid4())
    new_req = {
        "id": req_id,
        "email": email,
        "status": "pending"
    }
    requests_list.append(new_req)
    return jsonify({"request_id": req_id, "status": "pending"})

@app.route("/api/p2p/check_approval/<room_code>/<request_id>", methods=["GET"])
@limiter.exempt
def api_p2p_check_approval(room_code, request_id):
    if room_code not in room_access_requests:
        return jsonify({"error": "Room not found"}), 404
    for req in room_access_requests[room_code]:
        if req["id"] == request_id:
            return jsonify({"status": req["status"]})
    return jsonify({"error": "Request not found"}), 404

@app.route("/api/p2p/check_requests/<room_code>", methods=["GET"])
@limiter.exempt
def api_p2p_check_requests(room_code):
    if room_code not in room_access_requests:
        return jsonify({"error": "Room not found"}), 404
    pending = [r for r in room_access_requests[room_code] if r["status"] == "pending"]
    return jsonify({"requests": pending})

@app.route("/api/p2p/approve_request/<room_code>/<request_id>", methods=["POST"])
@csrf.exempt
@limiter.exempt
def api_p2p_approve_request(room_code, request_id):
    if room_code not in room_access_requests:
        return jsonify({"error": "Room not found"}), 404
    data = request.get_json() or {}
    status = data.get("status", "approved")
    for req in room_access_requests[room_code]:
        if req["id"] == request_id:
            req["status"] = status
            return jsonify({"success": True, "status": status})
    return jsonify({"error": "Request not found"}), 404

@app.route("/api/p2p/signal/<room_code>/send", methods=["POST"])
@csrf.exempt
@limiter.exempt
def api_p2p_signal_send(room_code):
    if room_code not in active_signals:
        return jsonify({"error": "Room not found"}), 404
    data = request.get_json() or {}
    role = data.get("role")
    msg = data.get("message")
    
    if not role or not msg:
        return jsonify({"error": "Role and message are required"}), 400
        
    active_signals[room_code]["last_activity"] = time.time()
    
    if role == "sender":
        active_signals[room_code]["receiver_queue"].append(msg)
    else:
        active_signals[room_code]["sender_queue"].append(msg)
        
    return jsonify({"success": True})

@app.route("/api/p2p/signal/<room_code>/receive", methods=["GET"])
@limiter.exempt
def api_p2p_signal_receive(room_code):
    if room_code not in active_signals:
        return jsonify({"error": "Room not found"}), 404
    role = request.args.get("role")
    if not role:
        return jsonify({"error": "Role is required"}), 400
        
    active_signals[room_code]["last_activity"] = time.time()
    
    if role == "sender":
        messages = active_signals[room_code]["sender_queue"]
        active_signals[room_code]["sender_queue"] = []
    else:
        messages = active_signals[room_code]["receiver_queue"]
        active_signals[room_code]["receiver_queue"] = []
        
    return jsonify({"messages": messages})

if __name__ == "__main__":
    init_db()
    port = int(os.getenv("PORT", 8000))
    app.run(host="0.0.0.0", port=port, debug=False)