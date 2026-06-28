import os
import torch
import torch.nn as nn
import numpy as np
from PIL import Image, ImageOps, ImageFilter
import cv2
import timm
from torchvision import transforms

# Patch torch.load to bypass weights_only default in PyTorch 2.6
orig_torch_load = torch.load
def patched_torch_load(*args, **kwargs):
    kwargs['weights_only'] = False
    return orig_torch_load(*args, **kwargs)
torch.load = patched_torch_load

# Global variables for model
model = None
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def find_model_file():
    # 1. Search in BASE_DIR directly
    for name in ["best_model.zip", "best_model.pth", "best_model.pt", "final_model.pth", "final_model.pt"]:
        p = os.path.join(BASE_DIR, name)
        if os.path.exists(p):
            return p
            
    # 2. Search under BASE_DIR/Models recursively
    models_dir = os.path.join(BASE_DIR, "Models")
    if os.path.exists(models_dir):
        for root, dirs, files in os.walk(models_dir):
            for name in ["best_model.pth", "final_model.pth", "best_model.zip", "best_model.pt", "final_model.pt"]:
                if name in files:
                    return os.path.join(root, name)
                    
    # 3. Fallback to general walk under BASE_DIR
    for root, dirs, files in os.walk(BASE_DIR):
        for name in ["best_model.pth", "final_model.pth", "best_model.zip", "best_model.pt", "final_model.pt"]:
            if name in files:
                return os.path.join(root, name)
                
    return None

# Disease classes mapping from model labels to frontend labels
CLASS_MAP = {
    'NonDemented': 'Non Demented',
    'VeryMildDemented': 'Very Mild Demented',
    'MildDemented': 'Mild Demented',
    'ModerateDemented': 'Moderate Demented'
}

# The vocabulary order of classes from the checkpoint
CLASSES = ['MildDemented', 'ModerateDemented', 'NonDemented', 'VeryMildDemented']

class DementiaNet(nn.Module):
    def __init__(self):
        super().__init__()
        # timm efficientnet_b3 with num_classes=0 returns the 1536-dimensional feature map
        self.backbone = timm.create_model('efficientnet_b3', pretrained=False, num_classes=0)
        self.head = nn.Sequential(
            nn.Linear(1536, 512),
            nn.BatchNorm1d(512),
            nn.ReLU(inplace=True),
            nn.Dropout(0.3),
            nn.Linear(512, 128),
            nn.BatchNorm1d(128),
            nn.ReLU(inplace=True),
            nn.Dropout(0.3),
            nn.Linear(128, 4)
        )

    def forward(self, x):
        features = self.backbone(x)
        out = self.head(features)
        return out

def get_model():
    global model
    if model is None:
        path = find_model_file()
        if path is None:
            raise FileNotFoundError(
                f"Model file not found. Please place your model file ('best_model.pth', 'final_model.pth', etc.) in: {BASE_DIR}"
            )
        print(f"Loading PyTorch DementiaNet model from checkpoint: {path}...")
        model = DementiaNet()
        checkpoint = torch.load(path, map_location='cpu')
        if isinstance(checkpoint, dict) and 'model' in checkpoint:
            model.load_state_dict(checkpoint['model'])
        else:
            model.load_state_dict(checkpoint)
        model.eval()
        print("Model loaded successfully.")
    return model

def load_mri_to_pil(file_path):
    """Loads DICOM, NIfTI, JPG or PNG to a standard PIL Grayscale Image."""
    ext = os.path.splitext(file_path)[1].lower()
    
    if ext == '.dcm':
        import pydicom
        ds = pydicom.dcmread(file_path)
        pixel_array = ds.pixel_array.astype(float)
        # Normalize to 0-255
        pixel_array = (pixel_array - np.min(pixel_array)) / (np.max(pixel_array) - np.min(pixel_array) + 1e-8) * 255.0
        img = Image.fromarray(pixel_array.astype(np.uint8)).convert('L')
        return img
        
    elif ext in ['.nii', '.gz']:
        import nibabel as nib
        nii_img = nib.load(file_path)
        data = nii_img.get_fdata()
        # NIfTI volumes can be 3D. Extract middle slice along the axial direction (usually 3rd axis)
        if len(data.shape) == 3:
            mid_slice = data.shape[2] // 2
            slice_data = data[:, :, mid_slice].astype(float)
        elif len(data.shape) == 4:
            mid_slice = data.shape[2] // 2
            slice_data = data[:, :, mid_slice, 0].astype(float)
        else:
            slice_data = data.astype(float)
            
        # Rotate image to stand upright (usually NIfTI needs 90 deg rotation)
        slice_data = np.rot90(slice_data)
        # Normalize to 0-255
        slice_data = (slice_data - np.min(slice_data)) / (np.max(slice_data) - np.min(slice_data) + 1e-8) * 255.0
        img = Image.fromarray(slice_data.astype(np.uint8)).convert('L')
        return img
        
    else:
        # Standard image (JPG, PNG)
        img = Image.open(file_path).convert('L')
        return img

def run_preprocessing_pipeline(input_path, session_dir):
    """
    Runs the 4 preprocessing steps and saves intermediate images:
    1. Skull Stripping: Removes the skull bone by applying a central ellipse mask.
    2. Bias Field Correction: Enhances contrast using CLAHE/Histogram Equalization.
    3. Spatial Normalization: Standardizes scale and aligns.
    4. Segmentation: Color maps white matter, gray matter, and CSF.
    """
    os.makedirs(session_dir, exist_ok=True)
    
    # Load original image
    orig_img = load_mri_to_pil(input_path)
    orig_path = os.path.join(session_dir, "step0_original.png")
    orig_img.save(orig_path)
    
    # 1. Skull Stripping (Elliptical mask to zero out background/skull)
    w, h = orig_img.size
    mask = np.zeros((h, w), dtype=np.uint8)
    # Draw central ellipse representing the brain boundary
    cv2.ellipse(mask, (w//2, h//2), (int(w*0.42), int(h*0.46)), 0, 0, 360, 255, -1)
    # Apply blur to mask for smooth transition
    mask_pil = Image.fromarray(mask).filter(ImageFilter.GaussianBlur(5))
    
    skull_stripped = Image.new('L', (w, h), 0)
    skull_stripped.paste(orig_img, mask=mask_pil)
    stripped_path = os.path.join(session_dir, "step1_stripped.png")
    skull_stripped.save(stripped_path)
    
    # 2. Bias Field Correction (Histogram Equalization to normalize intensity gradients)
    equalized = ImageOps.equalize(skull_stripped)
    # Blend equalized and stripped for natural look
    bias_corrected = Image.blend(skull_stripped, equalized, 0.4)
    corrected_path = os.path.join(session_dir, "step2_corrected.png")
    bias_corrected.save(corrected_path)
    
    # 3. Spatial Normalization (Resize to standard 224x224 for ResNet/EfficientNet)
    normalized = bias_corrected.resize((224, 224), Image.Resampling.LANCZOS)
    normalized_path = os.path.join(session_dir, "step3_normalized.png")
    normalized.save(normalized_path)
    
    # 4. Segmentation (Group tissue types by color-mapping thresholds)
    np_norm = np.array(normalized)
    seg_color = np.zeros((224, 224, 3), dtype=np.uint8)
    
    # Thresholds: CSF (dark/low), Gray Matter (mid), White Matter (bright/high)
    # Exclude background (intensity < 10)
    brain_mask = np_norm > 15
    
    csf_mask = brain_mask & (np_norm <= 70)
    gm_mask = brain_mask & (np_norm > 70) & (np_norm <= 150)
    wm_mask = brain_mask & (np_norm > 150)
    
    # Apply distinctive medical colors:
    # CSF = Blue (0, 100, 255)
    seg_color[csf_mask] = [0, 100, 255]
    # Gray Matter = Green (0, 200, 100)
    seg_color[gm_mask] = [0, 200, 100]
    # White Matter = Red/Orange (255, 100, 0)
    seg_color[wm_mask] = [255, 100, 0]
    
    # Overlay segmentation on the grayscale normalized image (opacity 40%)
    norm_rgb = np.stack([np_norm]*3, axis=-1)
    seg_overlay = cv2.addWeighted(norm_rgb, 0.6, seg_color, 0.4, 0)
    
    segmented_img = Image.fromarray(seg_overlay)
    segmented_path = os.path.join(session_dir, "step4_segmented.png")
    segmented_img.save(segmented_path)
    
    static_root = os.path.dirname(os.path.dirname(session_dir))
    return {
        "step0_original": "/static/" + os.path.relpath(orig_path, start=static_root).replace('\\', '/'),
        "step1_stripped": "/static/" + os.path.relpath(stripped_path, start=static_root).replace('\\', '/'),
        "step2_corrected": "/static/" + os.path.relpath(corrected_path, start=static_root).replace('\\', '/'),
        "step3_normalized": "/static/" + os.path.relpath(normalized_path, start=static_root).replace('\\', '/'),
        "step4_segmented": "/static/" + os.path.relpath(segmented_path, start=static_root).replace('\\', '/')
    }

def get_findings_and_recommendations(disease_class):
    """Returns clinical findings and recommendations tailored to the predicted class."""
    if disease_class == 'Non Demented':
        return [
            'Brain volumes appear normal for age, with no sign of accelerated cortical thinning.',
            'Ventricles and sulci show normal proportions; no significant ex-vacuo enlargement.',
            'Bilateral hippocampal formations display preserved volume and structure.',
            'No focal neurodegenerative patterns or regional atrophy detected.'
        ], [
            'Maintain regular physical exercise and cognitive stimulation.',
            'Follow up with annual routine clinical cognitive screening.',
            'Adhere to a brain-healthy diet (e.g., Mediterranean diet).',
            'Manage cardiovascular risk factors to protect long-term vascular brain health.'
        ]
    elif disease_class == 'Very Mild Demented':
        return [
            'Subtle, early volume loss noted in the bilateral entorhinal cortex and hippocampus.',
            'Mild ventricular enlargement, slightly exceeding normal age-matched thresholds.',
            'Minimal cortical thinning, primarily in the superior temporal sulcus.',
            'No evidence of major subcortical vascular lesions or microbleeds.'
        ], [
            'Correlate findings with objective neuropsychological testing (e.g., MMSE, MoCA).',
            'Recommend a repeat MRI in 12 months to monitor structural change rates.',
            'Engage in targeted cognitive training and regular social interaction.',
            'Evaluate sleep quality and modify lifestyle risk factors aggressively.'
        ]
    elif disease_class == 'Mild Demented':
        return [
            'Moderate bilateral hippocampal atrophy observed, prominent in the left hemisphere.',
            'Symmetrical ventricular expansion consistent with early stage neurodegeneration.',
            'Noticeable cortical thinning in temporal and parietal association cortices.',
            'Mild widening of cerebral sulci, indicating diffuse volume loss.'
        ], [
            'Schedule diagnostic consultation with a neurologist or memory clinic.',
            'Initiate baseline cognitive assessment and discuss pharmacological options if indicated.',
            'Establish a regular follow-up MRI schedule every 6-9 months to track disease velocity.',
            'Incorporate family support services and cognitive rehabilitation programs.'
        ]
    else:  # Moderate Demented
        return [
            'Severe bilateral hippocampal atrophy with significant loss of gray-white matter boundaries.',
            'Pronounced ventricular enlargement (hydrocephalus ex-vacuo) and sulcal widening.',
            'Widespread cortical thinning across frontal, temporal, and parietal lobes.',
            'Significant thinning of the corpus callosum and diffuse cerebral volume reduction.'
        ], [
            'Urgent evaluation by a specialist team for a comprehensive care plan.',
            'Initiate appropriate medical and supportive therapies for dementia management.',
            'Assess patient safety, daily living needs, and establish care assistance.',
            'Conduct regular neurological check-ups and discuss advance care directives.'
        ]

def generate_gradcam_overlay(session_dir, predicted_idx):
    """
    Computes Grad-CAM for the predicted class using PyTorch.
    We hook the final convolutional block of the EfficientNet backbone: backbone.conv_head
    """
    norm_img_path = os.path.join(session_dir, "step3_normalized.png")
    if not os.path.exists(norm_img_path):
        raise FileNotFoundError("Normalized image must be generated first")
        
    net = get_model()
    net.eval()
    
    # Preprocess image to tensor
    img = Image.open(norm_img_path).convert('RGB')
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225]
        )
    ])
    x = transform(img).unsqueeze(0)
    x.requires_grad_ = True
    
    # Define hooks
    features = []
    gradients = []
    
    target_layer = net.backbone.conv_head
    
    def forward_hook(module, input, output):
        features.append(output)
        
    def backward_hook(module, grad_input, grad_output):
        gradients.append(grad_output[0])
        
    handle_forward = target_layer.register_forward_hook(forward_hook)
    handle_backward = target_layer.register_full_backward_hook(backward_hook)
    
    # Forward pass
    output = net(x)
    
    # Zero gradients
    net.zero_grad()
    
    # Target class score
    class_score = output[0][predicted_idx]
    class_score.backward()
    
    # Remove hooks
    handle_forward.remove()
    handle_backward.remove()
    
    # Extract features and gradients
    act = features[0].detach().cpu().numpy()[0]          # (C, H, W)
    grad = gradients[0].detach().cpu().numpy()[0]        # (C, H, W)
    
    # Global average pooling of gradients
    weights = np.mean(grad, axis=(1, 2))                  # (C,)
    
    # Weighted combination of activation maps
    cam = np.zeros(act.shape[1:], dtype=np.float32)       # (H, W)
    for i, w in enumerate(weights):
        cam += w * act[i]
        
    # Apply ReLU
    cam = np.maximum(cam, 0)
    
    # Normalize to 0-1
    cam = (cam - np.min(cam)) / (np.max(cam) - np.min(cam) + 1e-8)
    
    # Resize to original image size (224x224)
    cam = cv2.resize(cam, (224, 224))
    
    # Generate heatmap
    heatmap = cv2.applyColorMap(np.uint8(255 * cam), cv2.COLORMAP_JET)
    heatmap = cv2.cvtColor(heatmap, cv2.COLOR_BGR2RGB)
    
    # Load normalized image as RGB
    orig_rgb = cv2.imread(norm_img_path)
    orig_rgb = cv2.cvtColor(orig_rgb, cv2.COLOR_BGR2RGB)
    orig_rgb = cv2.resize(orig_rgb, (224, 224))
    
    # Superimpose heatmap
    overlay = cv2.addWeighted(orig_rgb, 0.5, heatmap, 0.5, 0)
    
    # Save output
    overlay_path = os.path.join(session_dir, "gradcam_overlay.png")
    Image.fromarray(overlay).save(overlay_path)
    
    static_root = os.path.dirname(os.path.dirname(session_dir))
    return "/static/" + os.path.relpath(overlay_path, start=static_root).replace('\\', '/')
