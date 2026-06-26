import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Brain, Cpu, Search, CheckCircle, AlertCircle,
  Download, RefreshCw, FileText, ArrowRight,
} from 'lucide-react';
import type { DiseaseClass } from '@/types';

const pipelineStages = [
  { id: 'upload', label: 'File Upload & Ingestion', description: 'Uploading MRI scan to processing pipeline' },
  { id: 'preprocess', label: 'MRI Pipeline Preprocessing', description: 'Skull stripping, bias field correction, normalization' },
  { id: 'classify', label: 'EfficientNet Dementia Staging', description: 'Running multi-class deep learning inference' },
  { id: 'xai', label: 'Grad-CAM Explainability Map', description: 'Computing activation map overlays for visual trust' }
];

const riskColors: Record<string, string> = {
  'Non Demented': 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/30',
  'Very Mild Demented': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/30',
  'Mild Demented': 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-900/30',
  'Moderate Demented': 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/30',
};

const textColors: Record<string, string> = {
  'Non Demented': 'text-emerald-500 dark:text-emerald-400',
  'Very Mild Demented': 'text-amber-500 dark:text-amber-400',
  'Mild Demented': 'text-orange-500 dark:text-orange-400',
  'Moderate Demented': 'text-rose-500 dark:text-rose-400',
};

const probabilityColors: Record<string, string> = {
  'Non Demented': '#10b981',      // Emerald 500
  'Very Mild Demented': '#f59e0b', // Amber 500
  'Mild Demented': '#f97316',      // Orange 500
  'Moderate Demented': '#f43f5e',  // Rose 500
};

export function DementiaDetection() {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'processing' | 'completed' | 'failed'>('idle');
  const [currentStage, setCurrentStage] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Results state
  const [preprocessedImages, setPreprocessedImages] = useState<Record<string, string> | null>(null);
  const [classification, setClassification] = useState<{
    diseaseClass: DiseaseClass;
    confidence: number;
    probabilityBreakdown: Record<string, number>;
    findings: string[];
    recommendations: string[];
  } | null>(null);
  const [gradCAMUrl, setGradCAMUrl] = useState<string | null>(null);
  const [gradcamOpacity, setGradcamOpacity] = useState(0.5);

  const startAnalysis = async (file: File) => {
    setSelectedFile(file);
    setStatus('processing');
    setErrorMsg('');
    setClassification(null);
    setPreprocessedImages(null);
    setGradCAMUrl(null);

    try {
      // 1. Upload scan
      setCurrentStage('upload');
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      if (!uploadRes.ok) throw new Error("Upload failed. Make sure your backend server is running.");
      const { session_id } = await uploadRes.json();

      // 2. Preprocess scan
      setCurrentStage('preprocess');
      const preprocessRes = await fetch('/api/preprocess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id })
      });
      if (!preprocessRes.ok) throw new Error("Image preprocessing failed.");
      const preprocessData = await preprocessRes.json();
      setPreprocessedImages(preprocessData.steps);

      // 3. Run Dementia Staging Classification
      setCurrentStage('classify');
      const classifyRes = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id })
      });
      if (!classifyRes.ok) throw new Error("Multi-class classification model failed to respond.");
      const classifyData = await classifyRes.json();
      setClassification({
        diseaseClass: classifyData.diseaseClass,
        confidence: classifyData.confidence,
        probabilityBreakdown: classifyData.probabilityBreakdown,
        findings: classifyData.findings,
        recommendations: classifyData.recommendations
      });

      // 4. Generate Explainability Map
      setCurrentStage('xai');
      const explainRes = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id })
      });
      if (!explainRes.ok) throw new Error("Explainability model failed.");
      const explainData = await explainRes.json();
      setGradCAMUrl(explainData.gradCAMUrl);

      setStatus('completed');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'An error occurred during analysis.');
      setStatus('failed');
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      startAnalysis(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      startAnalysis(file);
    }
  };

  const resetPage = () => {
    setSelectedFile(null);
    setStatus('idle');
    setCurrentStage('');
    setClassification(null);
    setPreprocessedImages(null);
    setGradCAMUrl(null);
    setErrorMsg('');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Dementia Detection</h1>
          <p className="text-sm text-text-secondary mt-1">One-click deep learning MRI scan classifier & hippocampal saliency mapping</p>
        </div>
        {status !== 'idle' && (
          <button onClick={resetPage} className="btn-secondary flex items-center gap-2">
            <RefreshCw size={14} /> New Scan
          </button>
        )}
      </motion.div>

      <AnimatePresence mode="wait">
        {/* IDLE / UPLOAD VIEW */}
        {status === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="medical-card p-10"
          >
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              className={`border-2 border-dashed rounded-2xl p-16 text-center transition-all ${
                dragOver ? 'border-medical-400 bg-medical-50/50 dark:bg-slate-900/50' : 'border-border hover:border-medical-300 hover:bg-surface-secondary'
              }`}
            >
              <div className="w-20 h-20 rounded-3xl bg-medical-50 dark:bg-slate-800 flex items-center justify-center mx-auto mb-6 shadow-sm border border-medical-100 dark:border-slate-700">
                <Upload size={32} className="text-medical-500" />
              </div>
              <h3 className="text-lg font-bold text-text-primary mb-2">Upload MRI Scan for Immediate Staging</h3>
              <p className="text-sm text-text-secondary mb-8 max-w-lg mx-auto">
                Drag and drop your patient's T1 axial MRI scan (supports DICOM, NIfTI, JPG, PNG). The system will strip the skull, normalize spacing, segment gray matter, and run our calibrated EfficientNet-B3 model.
              </p>

              <div className="flex flex-wrap justify-center gap-3 mb-8">
                {['DICOM (.dcm)', 'NIfTI (.nii/.nii.gz)', 'JPEG', 'PNG'].map((f) => (
                  <span key={f} className="badge badge-blue text-xs">{f}</span>
                ))}
              </div>

              <label className="btn-primary cursor-pointer inline-flex items-center gap-2">
                <Upload size={16} />
                Browse Files
                <input
                  type="file"
                  className="hidden"
                  accept=".dcm,.nii,.nii.gz,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          </motion.div>
        )}

        {/* PROCESSING / LOADING VIEW */}
        {status === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="medical-card p-10 flex flex-col md:flex-row gap-10 items-center justify-center min-h-[400px]"
          >
            {/* Left Column: Rotating Scanner */}
            <div className="relative w-44 h-44 flex items-center justify-center flex-shrink-0">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 border-4 border-medical-500/20 border-t-medical-500 rounded-full"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-2 border-2 border-teal-500/10 border-t-teal-500/60 rounded-full"
              />
              <Brain size={48} className="text-medical-500 animate-pulse" />
            </div>

            {/* Right Column: Steps Progress */}
            <div className="flex-1 max-w-md space-y-5">
              <h3 className="text-lg font-bold text-text-primary mb-2">Analyzing MRI Biomarkers...</h3>
              <div className="space-y-4">
                {pipelineStages.map((stage, idx) => {
                  const stageIndex = pipelineStages.findIndex(s => s.id === currentStage);
                  const isFinished = idx < stageIndex;
                  const isCurrent = stage.id === currentStage;
                  const isUpcoming = idx > stageIndex;

                  return (
                    <div key={stage.id} className="flex gap-4 items-start">
                      <div className="mt-1">
                        {isFinished ? (
                          <CheckCircle size={18} className="text-emerald-500" />
                        ) : isCurrent ? (
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="w-4.5 h-4.5 bg-medical-500 rounded-full flex items-center justify-center"
                          >
                            <span className="w-1.5 h-1.5 bg-white rounded-full" />
                          </motion.div>
                        ) : (
                          <div className="w-4.5 h-4.5 rounded-full border border-border bg-surface flex items-center justify-center" />
                        )}
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${isCurrent ? 'text-medical-600' : isFinished ? 'text-emerald-600' : 'text-text-tertiary'}`}>
                          {stage.label}
                        </p>
                        {isCurrent && (
                          <p className="text-xs text-text-secondary mt-0.5">{stage.description}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* FAILED / ERROR VIEW */}
        {status === 'failed' && (
          <motion.div
            key="failed"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="medical-card p-10 text-center space-y-6"
          >
            <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-2xl flex items-center justify-center mx-auto">
              <AlertCircle size={28} className="text-rose-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-text-primary">Pipeline Execution Failed</h3>
              <p className="text-sm text-text-secondary max-w-md mx-auto">{errorMsg}</p>
            </div>
            <div className="flex justify-center gap-3">
              <button onClick={resetPage} className="btn-primary">
                Try Again
              </button>
            </div>
          </motion.div>
        )}

        {/* COMPLETED / RESULTS VIEW */}
        {status === 'completed' && classification && (
          <motion.div
            key="completed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Top Row: Quick Staging and Diagnostic Summary */}
            <div className="grid md:grid-cols-3 gap-6">
              
              {/* Diagnosis Staging Card */}
              <div className="medical-card p-6 flex flex-col justify-between space-y-4">
                <div>
                  <span className="text-xs text-text-tertiary font-medium uppercase tracking-wider">AI Classification Staging</span>
                  <h3 className="metric-value mt-2 flex items-baseline gap-2">
                    <span className={textColors[classification.diseaseClass] || 'text-text-primary'}>
                      {classification.diseaseClass}
                    </span>
                  </h3>
                  <div className="mt-4">
                    <span className={`badge border ${riskColors[classification.diseaseClass] || 'badge-gray'}`}>
                      {classification.diseaseClass === 'Non Demented' ? 'Preserved Volume' : 'Atrophy Detected'}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-border space-y-2">
                  <div className="flex justify-between text-xs text-text-secondary">
                    <span>Inference Confidence</span>
                    <span className="font-bold">{(classification.confidence * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-150 dark:bg-slate-800 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${classification.confidence * 100}%` }}
                      transition={{ duration: 1 }}
                      className="h-full rounded-full bg-medical-500"
                    />
                  </div>
                </div>
              </div>

              {/* Probability Distribution */}
              <div className="medical-card p-6 md:col-span-2 space-y-4">
                <h3 className="card-title">Staging Softmax Probability Breakdown</h3>
                <div className="space-y-3 pt-2">
                  {Object.entries(classification.probabilityBreakdown).map(([cls, prob]) => (
                    <div key={cls}>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-text-secondary">{cls}</span>
                        <span style={{ color: probabilityColors[cls] }}>{(prob * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-1.5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${prob * 150}%` }} // Scale width for visually nice look
                          style={{
                            maxWidth: '100%',
                            width: `${prob * 100}%`,
                            backgroundColor: probabilityColors[cls],
                          }}
                          transition={{ duration: 0.8 }}
                          className="h-full rounded-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Middle Row: Explainability and Preprocessing Visualization */}
            <div className="grid lg:grid-cols-2 gap-6">
              
              {/* Grad-CAM Viewer */}
              <div className="medical-card p-6 space-y-4 flex flex-col items-center justify-between">
                <div className="w-full flex justify-between items-center">
                  <h3 className="card-title flex items-center gap-2">
                    <Brain size={16} className="text-medical-500" />
                    Grad-CAM Hippocampal Saliency Heatmap
                  </h3>
                  <span className="text-xs text-text-tertiary">11.55M Parameters (EfficientNet)</span>
                </div>

                <div className="relative w-full aspect-square max-w-[320px] bg-black border border-border rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
                  {/* Clean MRI Background */}
                  {preprocessedImages?.step3_normalized && (
                    <img
                      src={preprocessedImages.step3_normalized}
                      alt="Normalized MRI Scan"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}
                  {/* Heatmap Overlay */}
                  {gradCAMUrl && (
                    <img
                      src={gradCAMUrl}
                      alt="Grad-CAM Hotspots"
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ opacity: gradcamOpacity }}
                    />
                  )}
                </div>

                {/* Opacity Control */}
                <div className="w-full space-y-2 max-w-sm">
                  <div className="flex justify-between text-xs text-text-secondary font-medium">
                    <span>Anatomical MRI</span>
                    <span>Overlay Opacity: {(gradcamOpacity * 100).toFixed(0)}%</span>
                    <span>Grad-CAM Hotspots</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={gradcamOpacity}
                    onChange={(e) => setGradcamOpacity(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-gray-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-medical-500"
                  />
                </div>
              </div>

              {/* Preprocessing Pipeline Intermediate Outputs */}
              <div className="medical-card p-6 flex flex-col justify-between space-y-4">
                <h3 className="card-title flex items-center gap-2">
                  <Cpu size={16} className="text-medical-500" />
                  Preprocessed Intermediate Images
                </h3>

                <div className="grid grid-cols-2 gap-4 flex-1 items-center">
                  {[
                    { key: 'step0_original', label: 'Original Ingestion' },
                    { key: 'step1_stripped', label: 'Skull Stripped' },
                    { key: 'step2_corrected', label: 'Bias Field Corrected' },
                    { key: 'step4_segmented', label: 'Segmented Tissues' },
                  ].map((step) => (
                    <div key={step.key} className="bg-surface-secondary dark:bg-slate-800/40 p-3 border border-border rounded-xl flex flex-col items-center justify-between text-center space-y-2">
                      <span className="text-xs font-semibold text-text-secondary">{step.label}</span>
                      <div className="aspect-square w-full max-w-[120px] bg-black rounded-lg overflow-hidden border border-border/80 shadow-sm flex items-center justify-center">
                        {preprocessedImages?.[step.key] ? (
                          <img
                            src={preprocessedImages[step.key]}
                            alt={step.label}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-[10px] text-text-tertiary">Unavailable</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Bottom Row: Clinical Findings and Actions */}
            <div className="grid md:grid-cols-2 gap-6">
              
              {/* Findings */}
              <div className="medical-card p-6 space-y-4">
                <h3 className="card-title flex items-center gap-2">
                  <Search size={16} className="text-medical-500" />
                  AI Clinical Findings
                </h3>
                <ul className="space-y-3.5">
                  {classification.findings.map((finding, idx) => (
                    <li key={idx} className="flex gap-2.5 items-start text-sm text-text-secondary">
                      <span className="w-1.5 h-1.5 rounded-full bg-medical-500 mt-2 flex-shrink-0" />
                      <span>{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommendations */}
              <div className="medical-card p-6 space-y-4">
                <h3 className="card-title flex items-center gap-2">
                  <AlertCircle size={16} className="text-medical-500" />
                  Clinician Recommendations
                </h3>
                <ul className="space-y-3.5">
                  {classification.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex gap-2.5 items-start text-sm text-text-secondary">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-2 flex-shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>

            {/* Action Panel */}
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <button className="btn-primary" onClick={() => window.print()}>
                <Download size={16} /> Print Clinical Summary
              </button>
              <button className="btn-secondary flex items-center gap-2">
                <FileText size={16} /> Refer to Neurology Team
              </button>
              <button onClick={resetPage} className="btn-ghost flex items-center gap-2">
                <RefreshCw size={14} /> Analyze Another Scan
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
