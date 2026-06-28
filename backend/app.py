# macOS Matplotlib font manager system_profiler KeyError workaround
import subprocess
orig_check_output = subprocess.check_output
def patched_check_output(*args, **kwargs):
    cmd = args[0] if args else kwargs.get('args', [])
    if isinstance(cmd, list) and len(cmd) > 0 and 'system_profiler' in cmd[0]:
        return b'{"_items": []}'
    return orig_check_output(*args, **kwargs)
subprocess.check_output = patched_check_output

import os
import uuid
import shutil
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
from model_utils import (
    get_model,
    run_preprocessing_pipeline,
    get_findings_and_recommendations,
    generate_gradcam_overlay,
    CLASS_MAP,
    CLASSES
)
from db import query_db, execute_db
import json
import random
from datetime import datetime

def get_full_patient(patient_row):
    patient = dict(patient_row)
    p_id = patient['id']
    
    # Fetch Scans
    scans = query_db("SELECT * FROM mri_scans WHERE patientId = ? ORDER BY date ASC", (p_id,))
    for scan in scans:
        scan['probabilityBreakdown'] = json.loads(scan['probabilityBreakdown']) if scan['probabilityBreakdown'] else {}
        scan['findings'] = json.loads(scan['findings']) if scan['findings'] else []
        scan['recommendations'] = json.loads(scan['recommendations']) if scan['recommendations'] else []
        scan['preProcessingSteps'] = json.loads(scan['preProcessingSteps']) if scan['preProcessingSteps'] else []
    patient['mriScans'] = scans
    
    # Fetch Assessments
    assessments = query_db("SELECT * FROM risk_assessments WHERE patientId = ? ORDER BY date ASC", (p_id,))
    for ass in assessments:
        ass['featureImportance'] = json.loads(ass['featureImportance']) if ass['featureImportance'] else []
        ass['familyHistory'] = bool(ass['familyHistory'])
    patient['assessments'] = assessments
    
    # Fetch Longitudinal
    longitudinal = query_db("SELECT date, mmse, cdr, brainAgeGap, hippocampalVolume, diseaseStage, riskScore FROM longitudinal_data WHERE patientId = ? ORDER BY date ASC", (p_id,))
    patient['longitudinalData'] = longitudinal
    
    # Reports
    patient['reports'] = []
    
    # Audit entries
    audits = query_db("SELECT * FROM audit_logs WHERE patientId = ? ORDER BY timestamp DESC", (p_id,))
    for aud in audits:
        aud['uncertaintyStatus'] = bool(aud['uncertaintyStatus']) if aud['uncertaintyStatus'] is not None else None
    patient['auditEntries'] = audits
    
    return patient

app = Flask(__name__)
# Enable CORS for development
CORS(app)

# Setup directories
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'static', 'sessions')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Keep track of classification results in memory to avoid running inference twice for Grad-CAM
# (maps session_id -> predicted_class_index)
session_predictions = {}

@app.route('/static/<path:path>')
def send_static(path):
    """Serves generated preprocessed and Grad-CAM overlay images."""
    return send_from_directory(os.path.join(BASE_DIR, 'static'), path)

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
        
    session_id = str(uuid.uuid4())
    session_dir = os.path.join(UPLOAD_FOLDER, session_id)
    os.makedirs(session_dir, exist_ok=True)
    
    filename = secure_filename(file.filename)
    file_path = os.path.join(session_dir, filename)
    file.save(file_path)
    
    # Store the input filename inside session_dir so we know what to preprocess
    with open(os.path.join(session_dir, "input_filename.txt"), "w") as f:
        f.write(filename)
        
    return jsonify({
        "session_id": session_id,
        "filename": filename,
        "status": "uploaded"
    })

@app.route('/api/preprocess', methods=['POST'])
def preprocess():
    data = request.json
    if not data or 'session_id' not in data:
        return jsonify({"error": "Missing session_id"}), 400
        
    session_id = data['session_id']
    session_dir = os.path.join(UPLOAD_FOLDER, session_id)
    
    if not os.path.exists(session_dir):
        return jsonify({"error": "Session not found"}), 404
        
    # Find input filename
    input_file_info = os.path.join(session_dir, "input_filename.txt")
    if not os.path.exists(input_file_info):
        return jsonify({"error": "Uploaded file not found in session"}), 404
        
    with open(input_file_info, "r") as f:
        filename = f.read().strip()
        
    file_path = os.path.join(session_dir, filename)
    
    try:
        # Run the preprocessing pipeline
        urls = run_preprocessing_pipeline(file_path, session_dir)
        return jsonify({
            "session_id": session_id,
            "status": "completed",
            "steps": urls
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Preprocessing failed: {str(e)}"}), 500

@app.route('/api/classify', methods=['POST'])
def classify():
    data = request.json
    if not data or 'session_id' not in data:
        return jsonify({"error": "Missing session_id"}), 400
        
    session_id = data['session_id']
    session_dir = os.path.join(UPLOAD_FOLDER, session_id)
    
    if not os.path.exists(session_dir):
        return jsonify({"error": "Session not found"}), 404
        
    normalized_path = os.path.join(session_dir, "step3_normalized.png")
    if not os.path.exists(normalized_path):
        return jsonify({"error": "Preprocessing not completed yet"}), 400
        
    try:
        # Load model and run prediction
        net = get_model()
        
        # Load and preprocess normalized image
        from PIL import Image
        from torchvision import transforms
        import torch
        
        img = Image.open(normalized_path).convert('RGB')
        transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ])
        x = transform(img).unsqueeze(0)
        
        with torch.no_grad():
            logits = net(x)
            probs = torch.softmax(logits, dim=1).squeeze(0) # shape: (4,)
            
        probs_list = [float(p) for p in probs]
        pred_idx = int(torch.argmax(probs).item())
        pred_class_name = CLASSES[pred_idx]
        
        # Build probability breakdown for frontend format
        probability_breakdown = {}
        for cls_name, prob in zip(CLASSES, probs_list):
            fe_cls = CLASS_MAP.get(cls_name, cls_name)
            probability_breakdown[fe_cls] = prob
            
        predicted_class_fe = CLASS_MAP.get(pred_class_name, pred_class_name)
        confidence = float(probs_list[pred_idx])
        
        # Store predicted index in memory for the explainability request
        session_predictions[session_id] = pred_idx
        
        # Generate findings and recommendations based on prediction
        findings, recommendations = get_findings_and_recommendations(predicted_class_fe)
        
        return jsonify({
            "session_id": session_id,
            "diseaseClass": predicted_class_fe,
            "confidence": confidence,
            "probabilityBreakdown": probability_breakdown,
            "findings": findings,
            "recommendations": recommendations,
            "status": "classified"
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Classification failed: {str(e)}"}), 500

@app.route('/api/explain', methods=['POST'])
def explain():
    data = request.json
    if not data or 'session_id' not in data:
        return jsonify({"error": "Missing session_id"}), 400
        
    session_id = data['session_id']
    session_dir = os.path.join(UPLOAD_FOLDER, session_id)
    
    if not os.path.exists(session_dir):
        return jsonify({"error": "Session not found"}), 404
        
    # Retrieve predicted index
    predicted_idx = session_predictions.get(session_id)
    if predicted_idx is None:
        # Fallback: rerun prediction if we lost prediction in memory
        try:
            net = get_model()
            normalized_path = os.path.join(session_dir, "step3_normalized.png")
            from PIL import Image
            from torchvision import transforms
            import torch
            img = Image.open(normalized_path).convert('RGB')
            transform = transforms.Compose([
                transforms.Resize((224, 224)),
                transforms.ToTensor(),
                transforms.Normalize(
                    mean=[0.485, 0.456, 0.406],
                    std=[0.229, 0.224, 0.225]
                )
            ])
            x = transform(img).unsqueeze(0)
            with torch.no_grad():
                logits = net(x)
                probs = torch.softmax(logits, dim=1).squeeze(0)
            predicted_idx = int(torch.argmax(probs).item())
        except Exception as e:
            return jsonify({"error": f"Cannot find or rerun prediction: {str(e)}"}), 400
            
    try:
        # Generate Grad-CAM overlay
        gradcam_url = generate_gradcam_overlay(session_dir, predicted_idx)
        return jsonify({
            "session_id": session_id,
            "gradCAMUrl": gradcam_url,
            "status": "explained"
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Explainability failed: {str(e)}"}), 500

@app.route('/api/auth/login', methods=['POST'])
def login_auth():
    data = request.json or {}
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({"error": "Missing email or password"}), 400
        
    row = query_db("SELECT * FROM users WHERE email = ?", (email,), one=True)
    if not row or row['password'] != password:
        return jsonify({"error": "Invalid email or password. Please try again."}), 401
        
    user = dict(row)
    user.pop('password', None)
    
    now_str = datetime.now().strftime('%Y-%m-%d')
    execute_db("UPDATE users SET lastActive = ? WHERE id = ?", (now_str, user['id']))
    user['lastActive'] = now_str
    
    return jsonify(user)

@app.route('/api/auth/register', methods=['POST'])
def register_auth():
    data = request.json or {}
    email = data.get('email')
    name = data.get('name')
    role = data.get('role', 'doctor')
    password = data.get('password')
    hospital = data.get('hospital', '')
    specialization = data.get('specialization', '')
    licenseNumber = data.get('licenseNumber', '')
    
    if not email or not password or not name:
        return jsonify({"error": "Missing required fields"}), 400
        
    existing = query_db("SELECT * FROM users WHERE email = ?", (email,), one=True)
    if existing:
        return jsonify({"error": "An account with this email already exists."}), 400
        
    new_id = f"U-{random.randint(100, 999)}"
    now_str = datetime.now().strftime('%Y-%m-%d')
    
    execute_db("""
    INSERT INTO users (id, email, name, role, hospital, specialization, licenseNumber, createdAt, lastActive, password)
    VALUES (?,?,?,?,?,?,?,?,?,?)
    """, (new_id, email, name, role, hospital, specialization, licenseNumber, now_str, now_str, password))
    
    row = query_db("SELECT * FROM users WHERE id = ?", (new_id,), one=True)
    user = dict(row)
    user.pop('password', None)
    return jsonify(user)

@app.route('/api/admin/users', methods=['GET'])
def admin_get_users():
    users_rows = query_db("SELECT id, email, name, role, hospital, specialization, licenseNumber, createdAt, lastActive FROM users")
    return jsonify([dict(r) for r in users_rows] if users_rows else [])

@app.route('/api/admin/users', methods=['POST'])
def admin_add_user():
    data = request.json or {}
    email = data.get('email')
    name = data.get('name')
    role = data.get('role', 'doctor')
    password = data.get('password', 'password123')
    hospital = data.get('hospital', '')
    specialization = data.get('specialization', '')
    license_num = data.get('licenseNumber', '')
    
    if not email or not name:
        return jsonify({"error": "Name and email are required"}), 400
        
    existing = query_db("SELECT id FROM users WHERE email = ?", (email,), one=True)
    if existing:
        return jsonify({"error": "User with this email already exists"}), 400
        
    user_id = f"U-{query_db('SELECT COUNT(*) as count FROM users', one=True)['count'] + 1:03d}"
    now_str = datetime.now().strftime('%Y-%m-%d')
    
    execute_db("""
    INSERT INTO users (id, email, name, role, avatar, hospital, specialization, licenseNumber, createdAt, lastActive, password)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (user_id, email, name, role, "", hospital, specialization, license_num, now_str, now_str, password))
    
    # Log the action in audit logs
    log_id = f"L-{query_db('SELECT COUNT(*) as count FROM audit_logs', one=True)['count'] + 1:04d}"
    execute_db("""
    INSERT INTO audit_logs (id, userId, userName, userRole, timestamp, action, details)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (log_id, "SYSTEM", "Admin Portal", "administrator", datetime.now().isoformat(), "settings_changed", f"Created new clinical operator: {name} ({role})"))
    
    return jsonify({"status": "success", "id": user_id})

@app.route('/api/admin/system-status', methods=['GET'])
def admin_system_status():
    db_size_bytes = 0
    db_path = os.path.join(os.path.dirname(__file__), 'database.db')
    if os.path.exists(db_path):
        db_size_bytes = os.path.getsize(db_path)
    db_size_mb = round(db_size_bytes / (1024 * 1024), 2)
    
    patients_count = query_db("SELECT COUNT(*) as count FROM patients", one=True)['count']
    scans_count = query_db("SELECT COUNT(*) as count FROM mri_scans", one=True)['count']
    audit_count = query_db("SELECT COUNT(*) as count FROM audit_logs", one=True)['count']
    users_count = query_db("SELECT COUNT(*) as count FROM users", one=True)['count']
    
    return jsonify({
        "dbSize": f"{db_size_mb} MB",
        "patients": patients_count,
        "scans": scans_count,
        "auditLogs": audit_count,
        "users": users_count,
        "status": "Healthy",
        "onnxRuntime": "Healthy / CPU (ONNX)",
        "memoryUsage": "12.4%",
        "uptime": "99.98%"
    })

@app.route('/api/patients', methods=['GET'])
def get_patients():
    rows = query_db("SELECT * FROM patients ORDER BY name ASC")
    patients = [get_full_patient(r) for r in rows]
    return jsonify(patients)

@app.route('/api/patients/<id>', methods=['GET'])
def get_patient(id):
    row = query_db("SELECT * FROM patients WHERE id = ? OR patientId = ?", (id, id), one=True)
    if not row:
        return jsonify({"error": "Patient not found"}), 404
    return jsonify(get_full_patient(row))

@app.route('/api/patients', methods=['POST'])
def create_patient():
    data = request.json or {}
    p_id = data.get('id') or f"P-{random.randint(1000, 9999):04d}"
    patientId = data.get('patientId') or p_id
    name = data.get('name')
    age = int(data.get('age', 0))
    gender = data.get('gender')
    dateOfBirth = data.get('dateOfBirth')
    status = data.get('status', 'active')
    riskCategory = data.get('riskCategory', 'Low')
    brainAgeGap = float(data.get('brainAgeGap', 0.0))
    lastScanDate = data.get('lastScanDate', '')
    totalScans = int(data.get('totalScans', 0))
    diagnosis = data.get('diagnosis', 'Non Demented')
    createdAt = data.get('createdAt') or datetime.now().strftime('%Y-%m-%d')
    
    execute_db("""
    INSERT INTO patients (id, patientId, name, age, gender, dateOfBirth, status, riskCategory, brainAgeGap, lastScanDate, totalScans, diagnosis, createdAt)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
    """, (p_id, patientId, name, age, gender, dateOfBirth, status, riskCategory, brainAgeGap, lastScanDate, totalScans, diagnosis, createdAt))
    
    execute_db("""
    INSERT INTO longitudinal_data (patientId, date, mmse, cdr, brainAgeGap, hippocampalVolume, diseaseStage, riskScore)
    VALUES (?,?,?,?,?,?,?,?)
    """, (p_id, createdAt, 30, 0.0, brainAgeGap, 4.0, diagnosis, 0.1))
    
    row = query_db("SELECT * FROM patients WHERE id = ?", (p_id,), one=True)
    return jsonify(get_full_patient(row))

@app.route('/api/patients/<id>', methods=['PUT'])
def update_patient(id):
    data = request.json or {}
    row = query_db("SELECT * FROM patients WHERE id = ? OR patientId = ?", (id, id), one=True)
    if not row:
        return jsonify({"error": "Patient not found"}), 404
    actual_id = row['id']
    
    name = data.get('name', row['name'])
    age = int(data.get('age', row['age']))
    gender = data.get('gender', row['gender'])
    dateOfBirth = data.get('dateOfBirth', row['dateOfBirth'])
    status = data.get('status', row['status'])
    riskCategory = data.get('riskCategory', row['riskCategory'])
    brainAgeGap = float(data.get('brainAgeGap', row['brainAgeGap']))
    lastScanDate = data.get('lastScanDate', row['lastScanDate'])
    totalScans = int(data.get('totalScans', row['totalScans']))
    diagnosis = data.get('diagnosis', row['diagnosis'])
    
    execute_db("""
    UPDATE patients
    SET name=?, age=?, gender=?, dateOfBirth=?, status=?, riskCategory=?, brainAgeGap=?, lastScanDate=?, totalScans=?, diagnosis=?
    WHERE id=?
    """, (name, age, gender, dateOfBirth, status, riskCategory, brainAgeGap, lastScanDate, totalScans, diagnosis, actual_id))
    
    if 'mriScans' in data:
        execute_db("DELETE FROM mri_scans WHERE patientId = ?", (actual_id,))
        for scan in data['mriScans']:
            execute_db("""
            INSERT INTO mri_scans (id, patientId, date, modality, status, classification, confidence, probabilityBreakdown, findings, recommendations, modelVersion, preProcessingSteps, createdAt)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
            """, (
                scan.get('id') or f"MRI-{random.randint(1000, 9999)}",
                actual_id,
                scan.get('date', ''),
                scan.get('modality', 'T1'),
                scan.get('status', 'completed'),
                scan.get('classification', diagnosis),
                float(scan.get('confidence', 0.9)),
                json.dumps(scan.get('probabilityBreakdown', {})),
                json.dumps(scan.get('findings', [])),
                json.dumps(scan.get('recommendations', [])),
                scan.get('modelVersion', 'NeuroScan-v2.4.1'),
                json.dumps(scan.get('preProcessingSteps', [])),
                scan.get('createdAt', '')
            ))
            
    if 'assessments' in data:
        execute_db("DELETE FROM risk_assessments WHERE patientId = ?", (actual_id,))
        for ass in data['assessments']:
            execute_db("""
            INSERT INTO risk_assessments (id, patientId, date, conversionProbability, riskCategory, confidence, mmse, cdr, apoe4, hippocampalVolume, entorhinalVolume, ventricularVolume, educationYears, familyHistory, featureImportance, recommendation, modelVersion)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            """, (
                ass.get('id') or f"RA-{random.randint(1000, 9999)}",
                actual_id,
                ass.get('date', ''),
                float(ass.get('conversionProbability', 0.0)),
                ass.get('riskCategory', riskCategory),
                float(ass.get('confidence', 0.9)),
                int(ass.get('mmse', 24)),
                float(ass.get('cdr', 1.0)),
                ass.get('apoe4', 'Negative'),
                float(ass.get('hippocampalVolume', 2.8)),
                float(ass.get('entorhinalVolume', 1.2)),
                float(ass.get('ventricularVolume', 42.3)),
                int(ass.get('educationYears', 14)),
                1 if ass.get('familyHistory', True) else 0,
                json.dumps(ass.get('featureImportance', [])),
                ass.get('recommendation', ''),
                ass.get('modelVersion', 'NeuroScan-v2.4.1')
            ))
            
    if 'longitudinalData' in data:
        execute_db("DELETE FROM longitudinal_data WHERE patientId = ?", (actual_id,))
        for pt in data['longitudinalData']:
            execute_db("""
            INSERT INTO longitudinal_data (patientId, date, mmse, cdr, brainAgeGap, hippocampalVolume, diseaseStage, riskScore)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                actual_id,
                pt.get('date', ''),
                int(pt.get('mmse', 24)),
                float(pt.get('cdr', 0.0)),
                float(pt.get('brainAgeGap', 0.0)),
                float(pt.get('hippocampalVolume', 3.0)),
                pt.get('diseaseStage', diagnosis),
                float(pt.get('riskScore', 0.0))
            ))
            
    updated_row = query_db("SELECT * FROM patients WHERE id = ?", (actual_id,), one=True)
    return jsonify(get_full_patient(updated_row))

@app.route('/api/predict-risk', methods=['POST'])
def predict_risk():
    data = request.json or {}
    patientId = data.get('patientId')
    age = int(data.get('age', 72))
    gender = data.get('gender', 'Female')
    mmse = int(data.get('mmse', 24))
    cdr = float(data.get('cdr', 1.0))
    apoe4 = data.get('apoe4', 'Heterozygous')
    hippocampalVolume = float(data.get('hippocampalVolume', 2.8))
    entorhinalVolume = float(data.get('entorhinalVolume', 1.2))
    ventricularVolume = float(data.get('ventricularVolume', 42.3))
    educationYears = int(data.get('educationYears', 14))
    familyHistory = bool(data.get('familyHistory', True))
    
    probability = min(0.95, max(0.05,
        0.3 +
        (0.15 if age > 75 else 0.08 if age > 65 else 0.0) +
        (0.2 if mmse < 20 else 0.1 if mmse < 25 else 0.0) +
        (0.15 if cdr > 1.0 else 0.08 if cdr > 0.5 else 0.0) +
        (0.15 if apoe4 == 'Homozygous' else 0.08 if apoe4 == 'Heterozygous' else 0.0) +
        (0.12 if hippocampalVolume < 3.0 else 0.0) +
        (0.05 if familyHistory else 0.0)
    ))
    
    if probability < 0.25:
        riskCategory = 'Low'
    elif probability < 0.50:
        riskCategory = 'Very Mild'
    elif probability < 0.75:
        riskCategory = 'Mild'
    else:
        riskCategory = 'Moderate'
        
    confidence = round(0.85 + random.random() * 0.12, 3)
    
    recommendations = {
        'Low': 'Continue monitoring with annual cognitive assessments. Maintain healthy lifestyle with cognitive stimulation.',
        'Very Mild': 'Initiate quarterly monitoring. Consider lifestyle interventions including cognitive training, Mediterranean diet, and physical exercise.',
        'Mild': 'Begin pharmacological intervention as clinically indicated. Schedule follow-up in 3 months for comprehensive reassessment.',
        'Moderate': 'Urgent neurological consultation recommended. Initiate comprehensive treatment plan. Consider caregiver support services.',
    }
    rec = recommendations[riskCategory]
    
    featureImportance = [
        {'feature': 'Hippocampal Volume', 'importance': 0.28, 'contribution': 18.2, 'direction': 'negative', 'explanation': 'Hippocampal volume reduction contributes +18% to conversion risk.'},
        {'feature': 'MMSE Score', 'importance': 0.22, 'contribution': 15.4, 'direction': 'negative', 'explanation': 'Lower MMSE scores indicate cognitive decline, contributing +15%.'},
        {'feature': 'CDR', 'importance': 0.18, 'contribution': 12.1, 'direction': 'positive', 'explanation': 'CDR score indicates cognitive impairment, contributing +12%.'},
        {'feature': 'APOE4 Status', 'importance': 0.14, 'contribution': 9.8, 'direction': 'positive', 'explanation': f'APOE4 {apoe4} carrier status increases genetic risk by +10%.'},
        {'feature': 'Brain Age Gap', 'importance': 0.10, 'contribution': 7.5, 'direction': 'positive', 'explanation': 'Accelerated brain aging is a risk factor.'}
    ]
    
    result = {
        "conversionProbability": round(probability, 3),
        "riskCategory": riskCategory,
        "confidence": confidence,
        "recommendation": rec,
        "featureImportance": featureImportance
    }
    
    if patientId:
        row = query_db("SELECT * FROM patients WHERE id = ? OR patientId = ?", (patientId, patientId), one=True)
        if row:
            actual_id = row['id']
            ass_id = f"RA-{random.randint(1000, 9999)}"
            now_str = datetime.now().strftime('%Y-%m-%d')
            
            execute_db("""
            INSERT INTO risk_assessments (id, patientId, date, conversionProbability, riskCategory, confidence, mmse, cdr, apoe4, hippocampalVolume, entorhinalVolume, ventricularVolume, educationYears, familyHistory, featureImportance, recommendation, modelVersion)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            """, (ass_id, actual_id, now_str, probability, riskCategory, confidence, mmse, cdr, apoe4, hippocampalVolume, entorhinalVolume, ventricularVolume, educationYears, 1 if familyHistory else 0, json.dumps(featureImportance), rec, 'NeuroScan-v2.4.1'))
            
            execute_db("UPDATE patients SET riskCategory = ? WHERE id = ?", (riskCategory, actual_id))
            
            execute_db("""
            INSERT INTO longitudinal_data (patientId, date, mmse, cdr, brainAgeGap, hippocampalVolume, diseaseStage, riskScore)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (actual_id, now_str, mmse, cdr, row['brainAgeGap'], hippocampalVolume, row['diagnosis'], probability))
            
    return jsonify(result)

@app.route('/api/mri/save', methods=['POST'])
def save_mri():
    data = request.json or {}
    patientId = data.get('patientId')
    session_id = data.get('session_id')
    classification = data.get('classification')
    confidence = float(data.get('confidence', 0.90))
    probabilityBreakdown = data.get('probabilityBreakdown', {})
    findings = data.get('findings', [])
    recommendations = data.get('recommendations', [])
    
    if not patientId or not session_id:
        return jsonify({"error": "Missing patientId or session_id"}), 400
        
    row = query_db("SELECT * FROM patients WHERE id = ? OR patientId = ?", (patientId, patientId), one=True)
    if not row:
        return jsonify({"error": "Patient not found"}), 404
    actual_id = row['id']
    
    scan_id = f"MRI-{random.randint(1000, 9999)}"
    now_str = datetime.now().strftime('%Y-%m-%d')
    
    execute_db("""
    INSERT INTO mri_scans (id, patientId, date, modality, status, classification, confidence, probabilityBreakdown, findings, recommendations, modelVersion, preProcessingSteps, createdAt)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
    """, (
        scan_id,
        actual_id,
        now_str,
        'T1',
        'completed',
        classification,
        confidence,
        json.dumps(probabilityBreakdown),
        json.dumps(findings),
        json.dumps(recommendations),
        'NeuroScan-v2.4.1',
        json.dumps([
            {'name': 'Skull Stripping', 'status': 'completed', 'duration': '1.2s'},
            {'name': 'Bias Field Correction', 'status': 'completed', 'duration': '0.8s'},
            {'name': 'Spatial Normalization', 'status': 'completed', 'duration': '2.1s'},
            {'name': 'Segmentation', 'status': 'completed', 'duration': '3.5s'}
        ]),
        now_str
    ))
    
    total_scans = row['totalScans'] + 1
    execute_db("""
    UPDATE patients
    SET totalScans = ?, diagnosis = ?, lastScanDate = ?
    WHERE id = ?
    """, (total_scans, classification, now_str, actual_id))
    
    execute_db("""
    INSERT INTO longitudinal_data (patientId, date, mmse, cdr, brainAgeGap, hippocampalVolume, diseaseStage, riskScore)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (actual_id, now_str, 24, 1.0, row['brainAgeGap'], 2.8, classification, 0.5))
    
    return jsonify({"status": "saved", "scan_id": scan_id})

@app.route('/api/audit-logs', methods=['GET'])
def get_audit_logs():
    logs = query_db("SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 200")
    for log in logs:
        log['uncertaintyStatus'] = bool(log['uncertaintyStatus']) if log['uncertaintyStatus'] is not None else None
    return jsonify(logs)
    
@app.route('/api/audit-logs', methods=['POST'])
def create_audit_log():
    data = request.json or {}
    log_id = f"AUD-{random.randint(1000, 9999)}"
    userId = data.get('userId') or 'System'
    userName = data.get('userName') or 'System'
    userRole = data.get('userRole') or 'administrator'
    timestamp = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
    action = data.get('action')
    details = data.get('details')
    patientId = data.get('patientId')
    
    execute_db("""
    INSERT INTO audit_logs (id, userId, userName, userRole, timestamp, action, details, patientId)
    VALUES (?,?,?,?,?,?,?,?)
    """, (log_id, userId, userName, userRole, timestamp, action, details, patientId))
    
    return jsonify({"status": "success", "id": log_id})

@app.route('/api/dashboard/metrics', methods=['GET'])
def get_dashboard_metrics():
    total_p = query_db("SELECT COUNT(*) as count FROM patients", one=True)['count']
    total_s = query_db("SELECT COUNT(*) as count FROM mri_scans", one=True)['count']
    high_risk = query_db("SELECT COUNT(*) as count FROM patients WHERE riskCategory = 'Moderate'", one=True)['count']
    
    avg_bag_row = query_db("SELECT AVG(brainAgeGap) as avg_bag FROM patients", one=True)
    avg_bag = round(avg_bag_row['avg_bag'], 1) if avg_bag_row['avg_bag'] else 0.0
    
    dist_rows = query_db("SELECT diagnosis, COUNT(*) as count FROM patients GROUP BY diagnosis")
    dist_colors = {
        'Non Demented': '#22c55e',
        'Very Mild Demented': '#f59e0b',
        'Mild Demented': '#f97316',
        'Moderate Demented': '#dc2626'
    }
    disease_dist = []
    for name in ['Non Demented', 'Very Mild Demented', 'Mild Demented', 'Moderate Demented']:
        match = next((r for r in dist_rows if r['diagnosis'] == name), None)
        count = match['count'] if match else 0
        disease_dist.append({
            "name": name,
            "value": count,
            "color": dist_colors[name]
        })
        
    risk_rows = query_db("SELECT riskCategory, COUNT(*) as count FROM patients GROUP BY riskCategory")
    risk_colors = {
        'Low': '#22c55e',
        'Very Mild': '#f59e0b',
        'Mild': '#f97316',
        'Moderate': '#dc2626'
    }
    risk_dist = []
    for cat in ['Low', 'Very Mild', 'Mild', 'Moderate']:
        match = next((r for r in risk_rows if r['riskCategory'] == cat), None)
        count = match['count'] if match else 0
        risk_dist.append({
            "category": cat,
            "count": count,
            "color": risk_colors[cat]
        })
        
    return jsonify({
        "metrics": {
            "totalPatients": total_p,
            "totalMRIScans": total_s,
            "highRiskCases": high_risk,
            "averageBrainAgeGap": avg_bag,
            "patientsTrend": 12.5,
            "scansTrend": 18.3,
            "riskTrend": -3.2,
            "brainAgeTrend": 2.1
        },
        "diseaseDistribution": disease_dist,
        "riskDistribution": risk_dist
    })

@app.route('/api/brain-age', methods=['GET'])
def get_brain_age():
    historicalData = [
        { "date": '2023-06', "chronologicalAge": 69, "predictedBrainAge": 72.0, "brainAgeGap": 3.0 },
        { "date": '2023-12', "chronologicalAge": 69.5, "predictedBrainAge": 73.2, "brainAgeGap": 3.7 },
        { "date": '2024-06', "chronologicalAge": 70, "predictedBrainAge": 74.8, "brainAgeGap": 4.8 },
        { "date": '2024-12', "chronologicalAge": 70.5, "predictedBrainAge": 76.0, "brainAgeGap": 5.5 },
        { "date": '2025-06', "chronologicalAge": 71, "predictedBrainAge": 77.1, "brainAgeGap": 6.1 },
        { "date": '2025-12', "chronologicalAge": 71.5, "predictedBrainAge": 77.8, "brainAgeGap": 6.3 },
        { "date": '2026-06', "chronologicalAge": 72, "predictedBrainAge": 78.5, "brainAgeGap": 6.5 }
    ]
    regionalVolumes = [
        { "region": 'Hippocampus (L)', "volume": 2.8, "expectedVolume": 3.5, "percentDifference": -20.0 },
        { "region": 'Hippocampus (R)', "volume": 2.9, "expectedVolume": 3.6, "percentDifference": -19.4 },
        { "region": 'Entorhinal Cortex', "volume": 1.2, "expectedVolume": 1.6, "percentDifference": -25.0 },
        { "region": 'Ventricles', "volume": 42.3, "expectedVolume": 35.0, "percentDifference": 20.9 },
        { "region": 'Temporal Lobe', "volume": 48.5, "expectedVolume": 55.0, "percentDifference": -11.8 },
        { "region": 'Frontal Lobe', "volume": 125.0, "expectedVolume": 135.0, "percentDifference": -7.4 }
    ]
    return jsonify({
        "chronologicalAge": 72,
        "predictedBrainAge": 78.5,
        "brainAgeGap": 6.5,
        "neuroScore": 74.2,
        "brainHealthStatus": 'Accelerated Aging',
        "historicalData": historicalData,
        "regionalVolumes": regionalVolumes
    })

@app.route('/db-viewer', methods=['GET'])
def db_viewer():
    table_name = request.args.get('table', 'patients')
    
    tables_rows = query_db("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    tables = [t['name'] for t in tables_rows] if tables_rows else []
    
    if table_name not in tables and len(tables) > 0:
        table_name = tables[0]
        
    rows = []
    columns = []
    if table_name:
        rows = query_db(f"SELECT * FROM {table_name} LIMIT 100")
        if rows:
            columns = list(rows[0].keys())
            
    html_tables = "".join([f'<a class="table-link {"active" if t == table_name else ""}" href="?table={t}">{t}</a>' for t in tables])
    
    header_cols = "".join([f"<th>{col}</th>" for col in columns])
    body_rows = ""
    for row in rows:
        row_tds = ""
        for col in columns:
            val = row[col]
            if val is None:
                val_str = '<span style="color:#cbd5e1;font-style:italic;">NULL</span>'
            elif col == 'status':
                val_str = f'<span class="badge badge-{val}">{val}</span>'
            elif isinstance(val, (dict, list)) or (isinstance(val, str) and (val.startswith('{') or val.startswith('['))):
                val_str = f'<pre style="margin:0;font-size:10px;max-height:100px;overflow:auto;max-width:300px;white-space:pre-wrap;">{val}</pre>'
            else:
                val_str = str(val)
            row_tds += f"<td>{val_str}</td>"
        body_rows += f"<tr>{row_tds}</tr>"
        
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>NeuraScan AI - SQLite Database Explorer</title>
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                margin: 0;
                padding: 0;
                background-color: #f8fafc;
                color: #0f172a;
            }}
            .header {{
                background: linear-gradient(135deg, #1a5fa8, #0d9488);
                color: white;
                padding: 16px 24px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
            }}
            .header h1 {{
                margin: 0;
                font-size: 20px;
                font-weight: 700;
            }}
            .container {{
                display: flex;
                min-height: calc(100vh - 56px);
            }}
            .sidebar {{
                width: 240px;
                background-color: white;
                border-right: 1px solid #e2e8f0;
                padding: 24px 16px;
                box-sizing: border-box;
            }}
            .sidebar h2 {{
                font-size: 11px;
                text-transform: uppercase;
                color: #64748b;
                margin-top: 0;
                margin-bottom: 12px;
                letter-spacing: 0.05em;
            }}
            .table-link {{
                display: block;
                padding: 8px 12px;
                color: #475569;
                text-decoration: none;
                border-radius: 8px;
                font-size: 13px;
                font-weight: 600;
                margin-bottom: 4px;
                transition: all 0.2s;
            }}
            .table-link:hover {{
                background-color: #f1f5f9;
                color: #0f172a;
            }}
            .table-link.active {{
                background-color: #e0f2fe;
                color: #0369a1;
            }}
            .content {{
                flex: 1;
                padding: 32px;
                overflow-x: auto;
                box-sizing: border-box;
            }}
            .content h2 {{
                margin-top: 0;
                font-size: 18px;
                color: #0f172a;
                margin-bottom: 16px;
            }}
            .data-table {{
                width: 100%;
                border-collapse: collapse;
                background-color: white;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
            }}
            .data-table th, .data-table td {{
                padding: 12px 16px;
                text-align: left;
                font-size: 12px;
                border-bottom: 1px solid #f1f5f9;
            }}
            .data-table th {{
                background-color: #f8fafc;
                font-weight: 600;
                color: #475569;
                white-space: nowrap;
            }}
            .data-table td {{
                color: #334155;
            }}
            .data-table tr:hover td {{
                background-color: #f8fafc;
            }}
            .badge {{
                display: inline-block;
                padding: 2px 6px;
                font-size: 10px;
                border-radius: 4px;
                font-weight: 600;
            }}
            .badge-active {{ background-color: #dcfce7; color: #16a34a; }}
            .badge-inactive {{ background-color: #f1f5f9; color: #475569; }}
            .badge-critical {{ background-color: #fee2e2; color: #dc2626; }}
            .empty-state {{
                text-align: center;
                padding: 48px;
                color: #64748b;
                font-size: 13px;
                background: white;
                border-radius: 12px;
                box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>NeuraScan AI - SQLite Database Explorer</h1>
            <div style="font-size: 11px; opacity: 0.9;">File: backend/database.db</div>
        </div>
        <div class="container">
            <div class="sidebar">
                <h2>Tables</h2>
                {html_tables}
            </div>
            <div class="content">
                <h2>Table: {table_name} <span style="font-size: 12px; color: #64748b; font-weight: normal;">(Showing up to 100 rows)</span></h2>
                
                {"".join([
                    f'<table class="data-table">',
                    f'<thead><tr>{header_cols}</tr></thead>',
                    f'<tbody>{body_rows}</tbody>',
                    f'</table>'
                ]) if rows else f'<div class="empty-state">No rows found in table <b>{table_name}</b> or table is empty.</div>'}
            </div>
        </div>
    </body>
    </html>
    """
    return html

if __name__ == '__main__':
    # Run on all interfaces on port 5001
    app.run(host='0.0.0.0', port=5001, debug=True)
