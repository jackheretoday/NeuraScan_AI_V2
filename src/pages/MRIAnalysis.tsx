import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Cpu, Brain, Search, CheckCircle, ArrowRight,
  AlertCircle, Download, Save, UserRound, FileText,
} from 'lucide-react';
import { useAnalysisStore } from '@/store/analysisStore';
import { useState } from 'react';
import { StatusBadge, RiskBadge } from '@/components/ui/Badge';
import { useNavigate } from 'react-router-dom';
import type { DiseaseClass } from '@/types';

const pipelineSteps = [
  { id: 'ingestion', icon: Upload, label: 'File Ingestion', description: 'Upload DICOM, NIfTI, or standard image formats' },
  { id: 'preprocessing', icon: Cpu, label: 'Pipeline Preprocessing', description: 'Skull stripping, bias correction, normalization' },
  { id: 'classification', icon: Brain, label: 'Multi-Class Dementia Staging Classification', description: 'Deep learning disease classification' },
  { id: 'xai', icon: Search, label: 'XAI Matrix Mapping', description: 'Grad-CAM and SHAP visualization' },
];

export function MRIAnalysis() {
  const store = useAnalysisStore();
  const navigate = useNavigate();
  const [dragOver, setDragOver] = useState(false);
  const [gradcamOpacity, setGradcamOpacity] = useState(0.5);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      store.setUploadedFile({
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file),
        rawFile: file,
      });
    }
  };

  const probabilityColors: Record<DiseaseClass, string> = {
    'Non Demented': '#22c55e',
    'Very Mild Demented': '#f59e0b',
    'Mild Demented': '#f97316',
    'Moderate Demented': '#dc2626',
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold text-text-primary">MRI Analysis</h1>
        <p className="text-sm text-text-secondary mt-1">Multi-step pipeline for dementia classification and explainability</p>
      </motion.div>

      {/* Pipeline Steps */}
      <div className="flex items-center gap-2 bg-white p-4 rounded-xl border border-border">
        {pipelineSteps.map((step, i) => {
          const StepIcon = step.icon;
          const isActive = store.currentStep === step.id;
          const isCompleted = pipelineSteps.findIndex(s => s.id === store.currentStep) > i;
          return (
            <div key={step.id} className="flex items-center gap-2 flex-1">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${isActive ? 'bg-medical-500 text-white shadow-md' :
                  isCompleted ? 'bg-green-50 text-green-700' :
                    'bg-gray-50 text-text-tertiary'
                }`}>
                {isCompleted ? <CheckCircle size={14} /> : <StepIcon size={14} />}
                <span className="hidden sm:inline">{step.label}</span>
              </div>
              {i < pipelineSteps.length - 1 && (
                <div className={`flex-1 h-px ${isCompleted ? 'bg-green-300' : 'bg-border'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        {/* Upload Step */}
        {store.currentStep === 'ingestion' && (
          <motion.div
            key="ingestion"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="medical-card p-8"
          >
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${dragOver ? 'border-medical-400 bg-medical-50' : 'border-border hover:border-medical-300 hover:bg-gray-50'
                }`}
            >
              <div className="w-16 h-16 rounded-2xl bg-medical-50 flex items-center justify-center mx-auto mb-4">
                <Upload size={28} className="text-medical-500" />
              </div>
              <h3 className="text-lg font-bold text-text-primary mb-2">Upload MRI Scan</h3>
              <p className="text-sm text-text-secondary mb-6 max-w-md mx-auto">
                Drag and drop your MRI file here, or click to browse. Supports DICOM, NIfTI (.nii), JPG, PNG.
              </p>

              <div className="flex flex-wrap justify-center gap-3 mb-6">
                {['DICOM (.dcm)', 'NIfTI (.nii/.nii.gz)', 'JPEG', 'PNG'].map(f => (
                  <span key={f} className="badge badge-blue text-xs">{f}</span>
                ))}
              </div>

              <div className="flex justify-center gap-3">
                <label className="btn-primary cursor-pointer">
                  <Upload size={16} />
                  Browse Files
                  <input
                    type="file"
                    className="hidden"
                    accept=".dcm,.nii,.nii.gz,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        store.setUploadedFile({
                          name: file.name,
                          size: file.size,
                          type: file.type,
                          url: URL.createObjectURL(file),
                          rawFile: file,
                        });
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            {store.uploadedFile && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 rounded-xl bg-medical-50 border border-medical-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText size={20} className="text-medical-500" />
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{store.uploadedFile.name}</p>
                      <p className="text-xs text-text-tertiary">{(store.uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button
                    onClick={() => store.runPreprocessing()}
                    className="btn-primary"
                  >
                    Start Preprocessing <ArrowRight size={16} />
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Preprocessing Step */}
        {store.currentStep === 'preprocessing' && (
          <motion.div
            key="preprocessing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="medical-card p-8"
          >
            <h3 className="text-lg font-bold text-text-primary mb-6">Preprocessing Pipeline</h3>
            <div className="space-y-4">
              {store.preprocessingSteps.map((step, i) => (
                <motion.div
                  key={step.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center justify-between p-4 rounded-xl bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step.status === 'completed' ? 'bg-green-100' :
                        step.status === 'running' ? 'bg-blue-100' :
                          step.status === 'failed' ? 'bg-red-100' : 'bg-gray-100'
                      }`}>
                      {step.status === 'completed' ? (
                        <CheckCircle size={16} className="text-green-600" />
                      ) : step.status === 'running' ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"
                        />
                      ) : (
                        <Cpu size={16} className={step.status === 'failed' ? 'text-red-500' : 'text-text-tertiary'} />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{step.name}</p>
                      {step.duration && <p className="text-xs text-text-tertiary">{step.duration}</p>}
                    </div>
                  </div>
                  <StatusBadge status={step.status} />
                </motion.div>
              ))}
            </div>

            {store.preprocessedImages && (
              <div className="mt-8 border-t border-border pt-6">
                <h4 className="text-sm font-semibold text-text-primary mb-4">Pipeline Preprocessing Visualization Output</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {[
                    { key: 'step0_original', label: 'Original MRI' },
                    { key: 'step1_stripped', label: 'Skull Stripped' },
                    { key: 'step2_corrected', label: 'Bias Corrected' },
                    { key: 'step3_normalized', label: 'Normalized' },
                    { key: 'step4_segmented', label: 'Segmented' },
                  ].map(stepImg => {
                    const imgUrl = store.preprocessedImages?.[stepImg.key];
                    return (
                      <div key={stepImg.key} className="p-2 bg-gray-50 border border-border rounded-xl text-center space-y-2">
                        <span className="text-[10px] font-medium text-text-secondary">{stepImg.label}</span>
                        <div className="aspect-square bg-black rounded-lg overflow-hidden border border-border flex items-center justify-center">
                          {imgUrl ? (
                            <img src={imgUrl} alt={stepImg.label} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[10px] text-text-tertiary">Processing...</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {store.preprocessingSteps.every(s => s.status === 'completed') && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6"
              >
                <button onClick={() => store.runClassification()} className="btn-primary">
                  Run Classification <ArrowRight size={16} />
                </button>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Classification Step */}
        {store.currentStep === 'classification' && (
          <motion.div
            key="classification"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="medical-card p-8"
          >
            {store.isProcessing ? (
              <div className="text-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="w-12 h-12 border-4 border-medical-500 border-t-transparent rounded-full mx-auto mb-4"
                />
                <h3 className="text-lg font-bold text-text-primary mb-2">Classifying...</h3>
                <p className="text-sm text-text-secondary">Running deep learning inference on MRI data</p>
              </div>
            ) : store.classificationResult ? (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-bold text-text-primary mb-2">Classification Complete</h3>
                  <p className="text-sm text-text-secondary">AI analysis results for the uploaded MRI scan</p>
                </div>

                {/* Main Prediction Card */}
                <div className="max-w-lg mx-auto">
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="p-6 rounded-2xl text-white text-center"
                    style={{ background: `linear-gradient(135deg, ${probabilityColors[store.classificationResult.diseaseClass]}, ${probabilityColors[store.classificationResult.diseaseClass]}dd)` }}
                  >
                    <p className="text-xs font-medium opacity-80 mb-2">Predicted Diagnosis</p>
                    <h2 className="text-2xl font-extrabold mb-2">{store.classificationResult.diseaseClass}</h2>
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <span className="text-3xl font-black">{(store.classificationResult.confidence * 100).toFixed(1)}%</span>
                      <span className="text-xs opacity-70">Confidence</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${store.classificationResult.confidence * 100}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="h-full rounded-full bg-white"
                      />
                    </div>
                  </motion.div>
                </div>

                {/* Probability Breakdown */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {(Object.entries(store.classificationResult.probabilityBreakdown) as [DiseaseClass, number][]).map(([cls, prob]) => (
                    <div key={cls} className="p-4 rounded-xl bg-gray-50">
                      <p className="text-xs text-text-secondary mb-1">{cls}</p>
                      <p className="text-lg font-bold" style={{ color: probabilityColors[cls] }}>
                        {(prob * 100).toFixed(1)}%
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${prob * 100}%` }}
                          transition={{ duration: 0.8, delay: 0.3 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: probabilityColors[cls] }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-center gap-3">
                  <button onClick={() => store.runExplainability()} className="btn-primary">
                    View Explainability <Search size={16} />
                  </button>
                  <button onClick={() => navigate('/dashboard/reports')} className="btn-secondary">
                    <FileText size={16} /> Generate Report
                  </button>
                </div>
              </div>
            ) : null}
          </motion.div>
        )}

        {/* Explainability Step */}
        {store.currentStep === 'xai' && (
          <motion.div
            key="xai"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="grid md:grid-cols-3 gap-6">
              {/* Grad-CAM Viewer Card */}
              <div className="medical-card p-6 md:col-span-1 flex flex-col items-center justify-center space-y-4">
                <h3 className="card-title flex items-center gap-2 self-start">
                  <Brain size={16} className="text-medical-500" />
                  Grad-CAM Saliency Map
                </h3>
                <div className="relative w-full aspect-square max-w-[260px] border border-border rounded-2xl overflow-hidden bg-black shadow-inner flex items-center justify-center">
                  {/* Grayscale MRI Background */}
                  <img
                    src={store.preprocessedImages?.step3_normalized}
                    alt="Normalized Scan"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  {/* Heatmap Overlay */}
                  {store.gradCAMUrl && (
                    <img
                      src={store.gradCAMUrl}
                      alt="Grad-CAM Activation"
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ opacity: gradcamOpacity }}
                    />
                  )}
                </div>
                
                {/* Opacity Control */}
                <div className="w-full space-y-1 px-2">
                  <div className="flex justify-between text-xs text-text-secondary font-medium">
                    <span>Clean MRI</span>
                    <span>Overlay Opacity: {(gradcamOpacity * 100).toFixed(0)}%</span>
                    <span>Grad-CAM</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={gradcamOpacity}
                    onChange={(e) => setGradcamOpacity(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-medical-500"
                  />
                </div>
              </div>

              {/* Findings & Recommendations */}
              <div className="md:col-span-2 space-y-6">
                <div className="medical-card p-6">
                  <h3 className="card-title mb-4 flex items-center gap-2">
                    <Search size={16} className="text-medical-500" />
                    AI Findings
                  </h3>
                  <ul className="space-y-3">
                    {store.findings.map((finding, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-start gap-2 text-sm text-text-secondary"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-medical-400 mt-1.5 flex-shrink-0" />
                        {finding}
                      </motion.li>
                    ))}
                  </ul>
                </div>

                <div className="medical-card p-6">
                  <h3 className="card-title mb-4 flex items-center gap-2">
                    <AlertCircle size={16} className="text-medical-500" />
                    Clinical Recommendations
                  </h3>
                  <ul className="space-y-3">
                    {store.recommendations.map((rec, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-start gap-2 text-sm text-text-secondary"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 flex-shrink-0" />
                        {rec}
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap justify-center gap-3">
              <button className="btn-primary">
                <Download size={16} /> Download Report
              </button>
              <button className="btn-secondary">
                <Save size={16} /> Save Analysis
              </button>
              <button className="btn-ghost">
                <UserRound size={16} /> Refer Specialist
              </button>
              <button onClick={() => store.reset()} className="btn-ghost">
                New Analysis
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
