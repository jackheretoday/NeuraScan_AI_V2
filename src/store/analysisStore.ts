import { create } from 'zustand';
import type { DiseaseClass, PreprocessingStep } from '@/types';

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  url: string;
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

export const useAnalysisStore = create<AnalysisState>((set) => ({
  currentStep: 'ingestion',
  uploadedFile: null,
  preprocessingSteps: defaultPreprocessingSteps,
  isProcessing: false,
  classificationResult: null,
  gradCAMUrl: null,
  findings: [],
  recommendations: [],

  setCurrentStep: (step) => set({ currentStep: step }),

  setUploadedFile: (file) => set({ uploadedFile: file }),

  runPreprocessing: async () => {
    set({ isProcessing: true });
    const steps = [...defaultPreprocessingSteps];
    for (let i = 0; i < steps.length; i++) {
      steps[i] = { ...steps[i], status: 'running' };
      set({ preprocessingSteps: [...steps] });
      await new Promise(resolve => setTimeout(resolve, 800));
      steps[i] = { ...steps[i], status: 'completed', duration: `${(Math.random() * 3 + 0.5).toFixed(1)}s` };
      set({ preprocessingSteps: [...steps] });
    }
    set({ isProcessing: false, currentStep: 'classification' });
  },

  runClassification: async () => {
    set({ isProcessing: true });
    await new Promise(resolve => setTimeout(resolve, 2000));
    set({
      isProcessing: false,
      classificationResult: {
        diseaseClass: 'Very Mild Demented',
        confidence: 0.921,
        probabilityBreakdown: {
          'Non Demented': 0.032,
          'Very Mild Demented': 0.921,
          'Mild Demented': 0.041,
          'Moderate Demented': 0.006,
        },
      },
      findings: [
        'Mild bilateral hippocampal atrophy observed, more prominent in the left hemisphere',
        'Ventricular enlargement consistent with early neurodegenerative changes',
        'Cortical thinning in temporal and parietal regions detected',
        'No evidence of vascular lesions or microbleeds',
      ],
      recommendations: [
        'Correlate findings with clinical cognitive assessment (MMSE/MoCA)',
        'Follow-up MRI recommended in 6 months to assess progression',
        'Consider referral to memory clinic for comprehensive evaluation',
        'Initiate lifestyle interventions: cognitive training, Mediterranean diet',
      ],
      currentStep: 'xai',
    });
  },

  runExplainability: async () => {
    set({ isProcessing: true });
    await new Promise(resolve => setTimeout(resolve, 1500));
    set({
      isProcessing: false,
      gradCAMUrl: '/gradcam/result.png',
    });
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
  }),
}));
