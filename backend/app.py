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

if __name__ == '__main__':
    # Run on all interfaces on port 5001
    app.run(host='0.0.0.0', port=5001, debug=True)
