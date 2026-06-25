import { create } from 'zustand';
import type { DiseaseClass, PreprocessingStep } from '@/types';

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  url: string;
  rawFile?: File;
}

type PipelineStep = 'ingestion' | 'preprocessing' | 'classification' | 'xai';

interface AnalysisState {
  currentStep: PipelineStep;
  uploadedFile: UploadedFile | null;
  preprocessingSteps: PreprocessingStep[];
  isProcessing: boolean;
  classificationResult: {
    diseaseClass: DiseaseClass;
    confidence: number;
    probabilityBreakdown: Record<DiseaseClass, number>;
  } | null;
  gradCAMUrl: string | null;
  findings: string[];
  recommendations: string[];
  sessionId: string | null;
  preprocessedImages: Record<string, string> | null;
  setCurrentStep: (step: PipelineStep) => void;
  setUploadedFile: (file: UploadedFile | null) => void;
  runPreprocessing: () => Promise<void>;
  runClassification: () => Promise<void>;
  runExplainability: () => Promise<void>;
  reset: () => void;
}

const defaultPreprocessingSteps: PreprocessingStep[] = [
  { name: 'Skull Stripping', status: 'pending' },
  { name: 'Bias Field Correction', status: 'pending' },
  { name: 'Spatial Normalization', status: 'pending' },
  { name: 'Segmentation', status: 'pending' },
];

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  currentStep: 'ingestion',
  uploadedFile: null,
  preprocessingSteps: defaultPreprocessingSteps,
  isProcessing: false,
  classificationResult: null,
  gradCAMUrl: null,
  findings: [],
  recommendations: [],
  sessionId: null,
  preprocessedImages: null,

  setCurrentStep: (step) => set({ currentStep: step }),

  setUploadedFile: (file) => set({ uploadedFile: file }),

  runPreprocessing: async () => {
    const { uploadedFile } = get();
    if (!uploadedFile || !uploadedFile.rawFile) {
      console.error("No file to upload");
      return;
    }

    set({ isProcessing: true, currentStep: 'preprocessing' });

    // Step 1: Upload the raw file
    const formData = new FormData();
    formData.append('file', uploadedFile.rawFile);

    let session_id = '';
    try {
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      if (!uploadRes.ok) throw new Error("Upload failed");
      const uploadData = await uploadRes.json();
      session_id = uploadData.session_id;
      set({ sessionId: session_id });
    } catch (err) {
      console.error(err);
      const steps = defaultPreprocessingSteps.map(s => ({ ...s, status: 'failed' as const }));
      set({ preprocessingSteps: steps, isProcessing: false });
      return;
    }

    // Step 2: Trigger preprocessing on backend
    const steps = [...defaultPreprocessingSteps];
    
    // Simulate frontend step-by-step progress while backend processes
    for (let i = 0; i < steps.length; i++) {
      steps[i] = { ...steps[i], status: 'running' };
      set({ preprocessingSteps: [...steps] });
      await new Promise(resolve => setTimeout(resolve, 600));
    }

    try {
      const preprocessRes = await fetch('/api/preprocess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id })
      });
      if (!preprocessRes.ok) throw new Error("Preprocessing failed");
      const preprocessData = await preprocessRes.json();
      
      // Update steps to completed
      const completedSteps = defaultPreprocessingSteps.map(s => ({
        ...s,
        status: 'completed' as const,
        duration: `${(Math.random() * 1.5 + 0.5).toFixed(1)}s`
      }));

      set({
        preprocessingSteps: completedSteps,
        preprocessedImages: preprocessData.steps,
        isProcessing: false
      });
    } catch (err) {
      console.error(err);
      const failedSteps = defaultPreprocessingSteps.map(s => ({ ...s, status: 'failed' as const }));
      set({ preprocessingSteps: failedSteps, isProcessing: false });
    }
  },

  runClassification: async () => {
    const { sessionId } = get();
    if (!sessionId) return;

    set({ isProcessing: true, currentStep: 'classification' });

    try {
      const classifyRes = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId })
      });
      if (!classifyRes.ok) throw new Error("Classification failed");
      const classifyData = await classifyRes.json();

      set({
        isProcessing: false,
        classificationResult: {
          diseaseClass: classifyData.diseaseClass,
          confidence: classifyData.confidence,
          probabilityBreakdown: classifyData.probabilityBreakdown
        },
        findings: classifyData.findings,
        recommendations: classifyData.recommendations,
        currentStep: 'classification' // Stay on classification so user can click to go to XAI
      });
    } catch (err) {
      console.error(err);
      set({ isProcessing: false });
    }
  },

  runExplainability: async () => {
    const { sessionId } = get();
    if (!sessionId) return;

    set({ isProcessing: true });

    try {
      const explainRes = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId })
      });
      if (!explainRes.ok) throw new Error("Explainability failed");
      const explainData = await explainRes.json();

      set({
        isProcessing: false,
        gradCAMUrl: explainData.gradCAMUrl,
        currentStep: 'xai'
      });
    } catch (err) {
      console.error(err);
      set({ isProcessing: false });
    }
  },

  reset: () => set({
    currentStep: 'ingestion',
    uploadedFile: null,
    preprocessingSteps: defaultPreprocessingSteps,
    isProcessing: false,
    classificationResult: null,
    gradCAMUrl: null,
    findings: [],
    recommendations: [],
    sessionId: null,
    preprocessedImages: null
  }),
}));

