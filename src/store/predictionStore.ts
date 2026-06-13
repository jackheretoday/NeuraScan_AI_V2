import { create } from 'zustand';
import type { PredictionInput, RiskCategory, FeatureImportance } from '@/types';
import { defaultPredictionInput } from '@/data/mockData';

interface PredictionResult {
  conversionProbability: number;
  riskCategory: RiskCategory;
  confidence: number;
  recommendation: string;
  featureImportance: FeatureImportance[];
}

interface PredictionState {
  input: PredictionInput;
  result: PredictionResult | null;
  isPredicting: boolean;
  setInput: (input: Partial<PredictionInput>) => void;
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
    await new Promise(resolve => setTimeout(resolve, 2000));

    const { input } = get();
    const probability = Math.min(0.95, Math.max(0.05,
      0.3 +
      (input.age > 75 ? 0.15 : input.age > 65 ? 0.08 : 0) +
      (input.mmse < 20 ? 0.2 : input.mmse < 25 ? 0.1 : 0) +
      (input.cdr > 1 ? 0.15 : input.cdr > 0.5 ? 0.08 : 0) +
      (input.apoe4 === 'Homozygous' ? 0.15 : input.apoe4 === 'Heterozygous' ? 0.08 : 0) +
      (input.hippocampalVolume < 3.0 ? 0.12 : 0) +
      (input.familyHistory ? 0.05 : 0)
    ));

    let riskCategory: RiskCategory;
    if (probability < 0.25) riskCategory = 'Low';
    else if (probability < 0.50) riskCategory = 'Very Mild';
    else if (probability < 0.75) riskCategory = 'Mild';
    else riskCategory = 'Moderate';

    const featureImportance: FeatureImportance[] = [
      {
        feature: 'Hippocampal Volume',
        importance: 0.28,
        contribution: 18.2,
        direction: 'negative',
        explanation: 'Hippocampal volume reduction contributes +18% to conversion risk. The hippocampus is critical for memory formation.',
      },
      {
        feature: 'MMSE Score',
        importance: 0.22,
        contribution: 15.4,
        direction: 'negative',
        explanation: 'Lower MMSE scores indicate cognitive decline, contributing +15% to risk. MMSE below 24 suggests impairment.',
      },
      {
        feature: 'CDR',
        importance: 0.18,
        contribution: 12.1,
        direction: 'positive',
        explanation: 'CDR score of 1.0 indicates mild dementia, contributing +12% to conversion risk.',
      },
      {
        feature: 'APOE4 Status',
        importance: 0.14,
        contribution: 9.8,
        direction: 'positive',
        explanation: 'APOE4 heterozygous carrier status increases genetic risk by +10%.',
      },
      {
        feature: 'Brain Age Gap',
        importance: 0.10,
        contribution: 7.5,
        direction: 'positive',
        explanation: 'Accelerated brain aging (6.5 years above chronological age) contributes +8% to risk.',
      },
      {
        feature: 'Education',
        importance: 0.05,
        contribution: -3.2,
        direction: 'negative',
        explanation: '14 years of education provides cognitive reserve, reducing risk by -3%.',
      },
      {
        feature: 'Family History',
        importance: 0.03,
        contribution: 2.1,
        direction: 'positive',
        explanation: 'Positive family history contributes +2% to conversion risk.',
      },
    ];

    const recommendations: Record<RiskCategory, string> = {
      'Low': 'Continue monitoring with annual cognitive assessments. Maintain healthy lifestyle with cognitive stimulation.',
      'Very Mild': 'Initiate quarterly monitoring. Consider lifestyle interventions including cognitive training, Mediterranean diet, and physical exercise.',
      'Mild': 'Begin pharmacological intervention as clinically indicated. Schedule follow-up in 3 months for comprehensive reassessment.',
      'Moderate': 'Urgent neurological consultation recommended. Initiate comprehensive treatment plan. Consider caregiver support services.',
    };

    set({
      result: {
        conversionProbability: parseFloat(probability.toFixed(3)),
        riskCategory,
        confidence: parseFloat((0.85 + Math.random() * 0.12).toFixed(3)),
        recommendation: recommendations[riskCategory],
        featureImportance,
      },
      isPredicting: false,
    });
  },

  reset: () => set({
    input: defaultPredictionInput,
    result: null,
    isPredicting: false,
  }),
}));
