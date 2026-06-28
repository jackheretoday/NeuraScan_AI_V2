import { create } from 'zustand';
import type { PredictionInput, RiskCategory, FeatureImportance } from '@/types';
import { defaultPredictionInput } from '@/data/mockData';
import { usePatientStore } from './patientStore';

interface PredictionResult {
  conversionProbability: number;
  riskCategory: RiskCategory;
  confidence: number;
  recommendation: string;
  featureImportance: FeatureImportance[];
}

interface PredictionState {
  input: PredictionInput & { patientId?: string };
  result: PredictionResult | null;
  isPredicting: boolean;
  setInput: (input: Partial<PredictionInput & { patientId?: string }>) => void;
  runPrediction: () => Promise<void>;
  reset: () => void;
}

export const usePredictionStore = create<PredictionState>((set, get) => ({
  input: defaultPredictionInput,
  result: null,
  isPredicting: false,

  setInput: (input) => set((state) => ({
    input: { ...state.input, ...input },
  })),

  runPrediction: async () => {
    set({ isPredicting: true });
    
    try {
      const { input } = get();
      const res = await fetch('/api/predict-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      });
      if (!res.ok) throw new Error('Prediction API failed');
      const result = await res.json();
      
      set({
        result,
        isPredicting: false,
      });

      // Refresh patients list if linked to a patient to show the new assessment
      if (input.patientId) {
        await usePatientStore.getState().fetchPatients();
      }
    } catch (err) {
      console.error(err);
      set({ isPredicting: false });
    }
  },

  reset: () => set({
    input: defaultPredictionInput,
    result: null,
    isPredicting: false,
  }),
}));
