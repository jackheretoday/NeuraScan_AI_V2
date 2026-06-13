import type {
  Patient, DiseaseClass, RiskCategory, Feature, CompetitorComparison,
  DashboardMetrics, DiseaseDistribution, RiskDistribution, MonthlyTrend,
  ConversionRiskTrend, User, AuditEntry, ClinicalReport, BrainAgeData,
  PredictionInput, FeatureImportance, APOE4Status, Gender, LongitudinalDataPoint
} from '@/types';

// ============================================================
// Helper Functions
// ============================================================

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min: number, max: number, decimals = 1) => parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
const randomDate = (start: string, end: string) => {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  return new Date(s + Math.random() * (e - s)).toISOString().split('T')[0];
};
const pick = <T,>(arr: T[]): T => arr[randomInt(0, arr.length - 1)];

const riskColors: Record<RiskCategory, string> = {
  'Low': '#22c55e',
  'Very Mild': '#f59e0b',
  'Mild': '#f97316',
  'Moderate': '#dc2626',
};

const diseaseClasses: DiseaseClass[] = ['Non Demented', 'Very Mild Demented', 'Mild Demented', 'Moderate Demented'];
const riskCategories: RiskCategory[] = ['Low', 'Very Mild', 'Mild', 'Moderate'];
const genders: Gender[] = ['Male', 'Female'];
const apoe4Statuses: APOE4Status[] = ['Negative', 'Heterozygous', 'Homozygous'];

const firstNames = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan', 'Ananya', 'Priya', 'Riya', 'Aisha', 'Neha', 'Diya', 'Kavya', 'Sara', 'Maya', 'Isha'];
const lastNames = ['Sharma', 'Patel', 'Singh', 'Verma', 'Gupta', 'Kumar', 'Reddy', 'Joshi', 'Mehta', 'Nair', 'Rao', 'Das', 'Bose', 'Sen', 'Chopra'];

// ============================================================
// Generate 100 Patients
// ============================================================

const generatePatients = (count: number): Patient[] => {
  const patients: Patient[] = [];

  for (let i = 1; i <= count; i++) {
    const age = randomInt(55, 90);
    const gender = pick(genders);
    const riskCategory = pick(riskCategories);
    const diagnosis = pick(diseaseClasses);
    const brainAgeGap = randomFloat(-8, 15, 1);
    const scanCount = randomInt(1, 12);
    const status = riskCategory === 'Moderate' ? 'critical' : Math.random() > 0.2 ? 'active' : 'inactive';

    const scans = Array.from({ length: scanCount }, (_, si) => ({
      id: `MRI-${i}-${si + 1}`,
      patientId: `P-${String(i).padStart(4, '0')}`,
      date: randomDate('2023-01-01', '2026-06-01'),
      modality: pick(['T1', 'T2', 'FLAIR', 'DWI', 'fMRI'] as const),
      status: 'completed' as const,
      classification: diagnosis,
      confidence: randomFloat(0.78, 0.99, 2),
      probabilityBreakdown: {
        'Non Demented': randomFloat(0.01, 0.7, 2),
        'Very Mild Demented': randomFloat(0.01, 0.7, 2),
        'Mild Demented': randomFloat(0.01, 0.7, 2),
        'Moderate Demented': randomFloat(0.01, 0.7, 2),
      },
      gradCAMUrl: `/gradcam/${i}-${si + 1}.png`,
      imageUrl: `/mri/${i}-${si + 1}.jpg`,
      findings: [
        'Mild hippocampal atrophy observed',
        'Ventricular enlargement noted',
        'Cortical thinning in temporal regions',
      ],
      recommendations: [
        'Follow-up MRI recommended in 6 months',
        'Neurological consultation advised',
        'Consider cognitive assessment',
      ],
      modelVersion: 'NeuroScan-v2.4.1',
      preProcessingSteps: [
        { name: 'Skull Stripping', status: 'completed' as const, duration: '1.2s' },
        { name: 'Bias Field Correction', status: 'completed' as const, duration: '0.8s' },
        { name: 'Spatial Normalization', status: 'completed' as const, duration: '2.1s' },
        { name: 'Segmentation', status: 'completed' as const, duration: '3.5s' },
      ],
      createdAt: randomDate('2023-01-01', '2026-06-01'),
    }));

    const assessments = Array.from({ length: Math.min(scanCount, randomInt(1, 5)) }, (_, ai) => {
      const features: FeatureImportance[] = [
        {
          feature: 'Hippocampal Volume',
          importance: randomFloat(0.15, 0.35, 2),
          contribution: randomFloat(10, 25, 1),
          direction: 'negative',
          explanation: 'Hippocampal volume reduction contributes to conversion risk.',
        },
        {
          feature: 'MMSE Score',
          importance: randomFloat(0.1, 0.25, 2),
          contribution: randomFloat(8, 20, 1),
          direction: 'negative',
          explanation: 'Lower MMSE scores indicate cognitive decline.',
        },
        {
          feature: 'CDR',
          importance: randomFloat(0.1, 0.2, 2),
          contribution: randomFloat(5, 15, 1),
          direction: 'positive',
          explanation: 'Higher CDR score correlates with disease severity.',
        },
        {
          feature: 'Brain Age Gap',
          importance: randomFloat(0.08, 0.18, 2),
          contribution: randomFloat(5, 12, 1),
          direction: 'positive',
          explanation: 'Accelerated brain aging is a risk factor.',
        },
        {
          feature: 'APOE4 Status',
          importance: randomFloat(0.05, 0.15, 2),
          contribution: randomFloat(3, 10, 1),
          direction: 'positive',
          explanation: 'APOE4 carrier status increases genetic risk.',
        },
      ];

      return {
        id: `RA-${i}-${ai + 1}`,
        patientId: `P-${String(i).padStart(4, '0')}`,
        date: randomDate('2023-06-01', '2026-06-01'),
        conversionProbability: randomFloat(0.05, 0.95, 2),
        riskCategory: pick(riskCategories),
        confidence: randomFloat(0.75, 0.98, 2),
        mmse: randomInt(18, 30),
        cdr: randomFloat(0, 3, 1),
        apoe4: pick(apoe4Statuses),
        hippocampalVolume: randomFloat(2.0, 4.5, 2),
        entorhinalVolume: randomFloat(0.8, 2.0, 2),
        ventricularVolume: randomFloat(15, 50, 1),
        educationYears: randomInt(8, 20),
        familyHistory: Math.random() > 0.7,
        featureImportance: features,
        recommendation: pick([
          'Continue monitoring with quarterly assessments.',
          'Consider initiating cholinesterase inhibitor therapy.',
          'Refer to neurology specialist for comprehensive evaluation.',
          'Lifestyle interventions recommended including cognitive training.',
          'Schedule follow-up MRI in 3 months.',
          'Patient shows stable cognition; continue annual monitoring.',
        ]),
        modelVersion: 'NeuroScan-v2.4.1',
      };
    });

    const longitudinalData: LongitudinalDataPoint[] = Array.from({ length: Math.min(scanCount, 8) }, (_, li) => ({
      date: randomDate('2023-01-01', '2026-06-01'),
      mmse: randomInt(18, 30),
      cdr: randomFloat(0, 3, 1),
      brainAgeGap: randomFloat(-5, 12, 1),
      hippocampalVolume: randomFloat(2.0, 4.5, 2),
      diseaseStage: pick(diseaseClasses),
      riskScore: randomFloat(0.1, 0.95, 2),
    }));

    patients.push({
      id: `P-${String(i).padStart(4, '0')}`,
      patientId: `P-${String(i).padStart(4, '0')}`,
      name: `${pick(firstNames)} ${pick(lastNames)}`,
      age,
      gender,
      dateOfBirth: `${new Date().getFullYear() - age}-${String(randomInt(1, 12)).padStart(2, '0')}-${String(randomInt(1, 28)).padStart(2, '0')}`,
      status,
      riskCategory,
      brainAgeGap,
      lastScanDate: scans[scans.length - 1]?.date || '2026-01-01',
      totalScans: scanCount,
      diagnosis,
      mriScans: scans,
      assessments,
      longitudinalData,
      reports: [],
      auditEntries: [],
      createdAt: scans[0]?.createdAt || '2023-01-01',
    });
  }

  return patients;
};

const adniSubjects: Patient[] = [
  {
    id: 'ADNI-101-C',
    patientId: 'ADNI-101-C',
    name: 'Arthur Pendelton',
    age: 74,
    gender: 'Male',
    dateOfBirth: '1952-03-12',
    status: 'active',
    riskCategory: 'Moderate',
    brainAgeGap: 8.4,
    lastScanDate: '2026-05-15',
    totalScans: 4,
    diagnosis: 'Mild Demented',
    mriScans: [
      {
        id: 'MRI-ADNI-101-C-1',
        patientId: 'ADNI-101-C',
        date: '2024-05-10',
        modality: 'T1',
        status: 'completed',
        classification: 'Very Mild Demented',
        confidence: 0.82,
        probabilityBreakdown: { 'Non Demented': 0.15, 'Very Mild Demented': 0.82, 'Mild Demented': 0.02, 'Moderate Demented': 0.01 },
        findings: ['Slight ventricular enlargement', 'Normal cortical thickness'],
        recommendations: ['Follow-up scan in 6 months', 'Clinical cognitive assessment'],
        modelVersion: 'NeuroScan-v2.4.1',
        preProcessingSteps: [
          { name: 'Skull Stripping', status: 'completed', duration: '1.0s' },
          { name: 'Bias Field Correction', status: 'completed', duration: '0.7s' },
          { name: 'Spatial Normalization', status: 'completed', duration: '1.9s' },
          { name: 'Segmentation', status: 'completed', duration: '3.1s' },
        ],
        createdAt: '2024-05-10',
      },
      {
        id: 'MRI-ADNI-101-C-4',
        patientId: 'ADNI-101-C',
        date: '2026-05-15',
        modality: 'T1',
        status: 'completed',
        classification: 'Mild Demented',
        confidence: 0.91,
        probabilityBreakdown: { 'Non Demented': 0.01, 'Very Mild Demented': 0.08, 'Mild Demented': 0.91, 'Moderate Demented': 0.00 },
        findings: ['Significant bilateral hippocampal atrophy', 'Marked cortical thinning'],
        recommendations: ['Urgent neurological consultation', 'Initiate cognitive therapy'],
        modelVersion: 'NeuroScan-v2.4.1',
        preProcessingSteps: [
          { name: 'Skull Stripping', status: 'completed', duration: '1.1s' },
          { name: 'Bias Field Correction', status: 'completed', duration: '0.8s' },
          { name: 'Spatial Normalization', status: 'completed', duration: '2.0s' },
          { name: 'Segmentation', status: 'completed', duration: '3.3s' },
        ],
        createdAt: '2026-05-15',
      }
    ],
    assessments: [
      {
        id: 'RA-ADNI-101-C-1',
        patientId: 'ADNI-101-C',
        date: '2024-05-10',
        conversionProbability: 0.35,
        riskCategory: 'Very Mild',
        confidence: 0.88,
        mmse: 28,
        cdr: 0.5,
        apoe4: 'Heterozygous',
        hippocampalVolume: 3.6,
        entorhinalVolume: 1.5,
        ventricularVolume: 25.4,
        educationYears: 16,
        familyHistory: true,
        featureImportance: [
          { feature: 'Hippocampal Volume', importance: 0.28, contribution: 10.2, direction: 'negative', explanation: 'Reduced volume increases risk.' },
          { feature: 'MMSE Score', importance: 0.22, contribution: 8.4, direction: 'negative', explanation: 'Early cognitive decline.' }
        ],
        recommendation: 'Monitor regularly',
        modelVersion: 'NeuroScan-v2.4.1'
      },
      {
        id: 'RA-ADNI-101-C-4',
        patientId: 'ADNI-101-C',
        date: '2026-05-15',
        conversionProbability: 0.88,
        riskCategory: 'Moderate',
        confidence: 0.94,
        mmse: 20,
        cdr: 1.0,
        apoe4: 'Heterozygous',
        hippocampalVolume: 2.4,
        entorhinalVolume: 0.9,
        ventricularVolume: 42.1,
        educationYears: 16,
        familyHistory: true,
        featureImportance: [
          { feature: 'Hippocampal Volume', importance: 0.35, contribution: 22.4, direction: 'negative', explanation: 'Severe hippocampal loss.' },
          { feature: 'MMSE Score', importance: 0.26, contribution: 18.1, direction: 'negative', explanation: 'Cognitive decline below threshold.' }
        ],
        recommendation: 'Pharmacological intervention recommended',
        modelVersion: 'NeuroScan-v2.4.1'
      }
    ],
    longitudinalData: [
      { date: '2024-05-10', mmse: 28, cdr: 0.5, brainAgeGap: 4.2, hippocampalVolume: 3.6, diseaseStage: 'Very Mild Demented', riskScore: 0.35 },
      { date: '2024-11-12', mmse: 26, cdr: 0.5, brainAgeGap: 5.8, hippocampalVolume: 3.2, diseaseStage: 'Very Mild Demented', riskScore: 0.52 },
      { date: '2025-05-14', mmse: 23, cdr: 1.0, brainAgeGap: 7.2, hippocampalVolume: 2.8, diseaseStage: 'Mild Demented', riskScore: 0.74 },
      { date: '2026-05-15', mmse: 20, cdr: 1.0, brainAgeGap: 8.4, hippocampalVolume: 2.4, diseaseStage: 'Mild Demented', riskScore: 0.88 },
    ],
    reports: [],
    auditEntries: [],
    createdAt: '2024-05-10',
  },
  {
    id: 'ADNI-102-C',
    patientId: 'ADNI-102-C',
    name: 'Eleanor Vance',
    age: 69,
    gender: 'Female',
    dateOfBirth: '1957-08-22',
    status: 'active',
    riskCategory: 'Moderate',
    brainAgeGap: 9.2,
    lastScanDate: '2026-06-01',
    totalScans: 4,
    diagnosis: 'Mild Demented',
    mriScans: [
      {
        id: 'MRI-ADNI-102-C-1',
        patientId: 'ADNI-102-C',
        date: '2024-06-05',
        modality: 'T1',
        status: 'completed',
        classification: 'Very Mild Demented',
        confidence: 0.85,
        probabilityBreakdown: { 'Non Demented': 0.10, 'Very Mild Demented': 0.85, 'Mild Demented': 0.03, 'Moderate Demented': 0.02 },
        findings: ['Early hippocampal loss', 'Ventricles within normal range'],
        recommendations: ['Follow-up in 6 months', 'Clinical evaluation'],
        modelVersion: 'NeuroScan-v2.4.1',
        preProcessingSteps: [
          { name: 'Skull Stripping', status: 'completed', duration: '1.1s' },
          { name: 'Bias Field Correction', status: 'completed', duration: '0.6s' },
          { name: 'Spatial Normalization', status: 'completed', duration: '2.0s' },
          { name: 'Segmentation', status: 'completed', duration: '3.2s' },
        ],
        createdAt: '2024-06-05',
      },
      {
        id: 'MRI-ADNI-102-C-4',
        patientId: 'ADNI-102-C',
        date: '2026-06-01',
        modality: 'T1',
        status: 'completed',
        classification: 'Mild Demented',
        confidence: 0.93,
        probabilityBreakdown: { 'Non Demented': 0.01, 'Very Mild Demented': 0.06, 'Mild Demented': 0.93, 'Moderate Demented': 0.00 },
        findings: ['Severe cortical atrophy in temporal and parietal regions', 'Enlarged ventricles'],
        recommendations: ['Clinical intervention recommended', 'Refer to neurology clinic'],
        modelVersion: 'NeuroScan-v2.4.1',
        preProcessingSteps: [
          { name: 'Skull Stripping', status: 'completed', duration: '1.2s' },
          { name: 'Bias Field Correction', status: 'completed', duration: '0.7s' },
          { name: 'Spatial Normalization', status: 'completed', duration: '2.2s' },
          { name: 'Segmentation', status: 'completed', duration: '3.5s' },
        ],
        createdAt: '2026-06-01',
      }
    ],
    assessments: [
      {
        id: 'RA-ADNI-102-C-1',
        patientId: 'ADNI-102-C',
        date: '2024-06-05',
        conversionProbability: 0.42,
        riskCategory: 'Very Mild',
        confidence: 0.87,
        mmse: 27,
        cdr: 0.5,
        apoe4: 'Homozygous',
        hippocampalVolume: 3.4,
        entorhinalVolume: 1.3,
        ventricularVolume: 22.8,
        educationYears: 14,
        familyHistory: false,
        featureImportance: [
          { feature: 'Hippocampal Volume', importance: 0.28, contribution: 11.4, direction: 'negative', explanation: 'Mild hippocampal loss.' }
        ],
        recommendation: 'Monitor cognitive trends closely',
        modelVersion: 'NeuroScan-v2.4.1'
      },
      {
        id: 'RA-ADNI-102-C-4',
        patientId: 'ADNI-102-C',
        date: '2026-06-01',
        conversionProbability: 0.91,
        riskCategory: 'Moderate',
        confidence: 0.95,
        mmse: 18,
        cdr: 1.0,
        apoe4: 'Homozygous',
        hippocampalVolume: 2.1,
        entorhinalVolume: 0.7,
        ventricularVolume: 39.5,
        educationYears: 14,
        familyHistory: false,
        featureImportance: [
          { feature: 'Hippocampal Volume', importance: 0.32, contribution: 24.5, direction: 'negative', explanation: 'Accelerated volume reduction.' },
          { feature: 'APOE4 Status', importance: 0.18, contribution: 12.0, direction: 'positive', explanation: 'Homozygous carrier status.' }
        ],
        recommendation: 'Immediate clinical review suggested',
        modelVersion: 'NeuroScan-v2.4.1'
      }
    ],
    longitudinalData: [
      { date: '2024-06-05', mmse: 27, cdr: 0.5, brainAgeGap: 3.8, hippocampalVolume: 3.4, diseaseStage: 'Very Mild Demented', riskScore: 0.42 },
      { date: '2024-12-08', mmse: 25, cdr: 0.5, brainAgeGap: 5.4, hippocampalVolume: 3.0, diseaseStage: 'Very Mild Demented', riskScore: 0.58 },
      { date: '2025-06-04', mmse: 22, cdr: 1.0, brainAgeGap: 7.5, hippocampalVolume: 2.6, diseaseStage: 'Mild Demented', riskScore: 0.79 },
      { date: '2026-06-01', mmse: 18, cdr: 1.0, brainAgeGap: 9.2, hippocampalVolume: 2.1, diseaseStage: 'Mild Demented', riskScore: 0.91 },
    ],
    reports: [],
    auditEntries: [],
    createdAt: '2024-06-05',
  },
  {
    id: 'ADNI-201-S',
    patientId: 'ADNI-201-S',
    name: 'Robert Chen',
    age: 76,
    gender: 'Male',
    dateOfBirth: '1950-01-15',
    status: 'active',
    riskCategory: 'Very Mild',
    brainAgeGap: 4.1,
    lastScanDate: '2026-04-20',
    totalScans: 4,
    diagnosis: 'Very Mild Demented',
    mriScans: [
      {
        id: 'MRI-ADNI-201-S-1',
        patientId: 'ADNI-201-S',
        date: '2024-04-18',
        modality: 'T1',
        status: 'completed',
        classification: 'Very Mild Demented',
        confidence: 0.79,
        probabilityBreakdown: { 'Non Demented': 0.18, 'Very Mild Demented': 0.79, 'Mild Demented': 0.02, 'Moderate Demented': 0.01 },
        findings: ['Stable baseline volumes', 'Minor ventricular prominent spaces'],
        recommendations: ['Routine annual scan', 'Maintain cognitive activity'],
        modelVersion: 'NeuroScan-v2.4.1',
        preProcessingSteps: [
          { name: 'Skull Stripping', status: 'completed', duration: '1.0s' },
          { name: 'Bias Field Correction', status: 'completed', duration: '0.8s' },
          { name: 'Spatial Normalization', status: 'completed', duration: '2.1s' },
          { name: 'Segmentation', status: 'completed', duration: '3.4s' },
        ],
        createdAt: '2024-04-18',
      },
      {
        id: 'MRI-ADNI-201-S-4',
        patientId: 'ADNI-201-S',
        date: '2026-04-20',
        modality: 'T1',
        status: 'completed',
        classification: 'Very Mild Demented',
        confidence: 0.81,
        probabilityBreakdown: { 'Non Demented': 0.16, 'Very Mild Demented': 0.81, 'Mild Demented': 0.02, 'Moderate Demented': 0.01 },
        findings: ['No significant changes from previous baseline MRI', 'Hippocampal volume remains stable'],
        recommendations: ['Continue monitoring on standard schedule'],
        modelVersion: 'NeuroScan-v2.4.1',
        preProcessingSteps: [
          { name: 'Skull Stripping', status: 'completed', duration: '0.9s' },
          { name: 'Bias Field Correction', status: 'completed', duration: '0.7s' },
          { name: 'Spatial Normalization', status: 'completed', duration: '2.0s' },
          { name: 'Segmentation', status: 'completed', duration: '3.2s' },
        ],
        createdAt: '2026-04-20',
      }
    ],
    assessments: [
      {
        id: 'RA-ADNI-201-S-1',
        patientId: 'ADNI-201-S',
        date: '2024-04-18',
        conversionProbability: 0.32,
        riskCategory: 'Very Mild',
        confidence: 0.89,
        mmse: 26,
        cdr: 0.5,
        apoe4: 'Negative',
        hippocampalVolume: 3.1,
        entorhinalVolume: 1.4,
        ventricularVolume: 31.2,
        educationYears: 18,
        familyHistory: false,
        featureImportance: [
          { feature: 'Hippocampal Volume', importance: 0.25, contribution: 5.1, direction: 'negative', explanation: 'Stable volume.' }
        ],
        recommendation: 'Annual screening recommended',
        modelVersion: 'NeuroScan-v2.4.1'
      },
      {
        id: 'RA-ADNI-201-S-4',
        patientId: 'ADNI-201-S',
        date: '2026-04-20',
        conversionProbability: 0.31,
        riskCategory: 'Very Mild',
        confidence: 0.90,
        mmse: 26,
        cdr: 0.5,
        apoe4: 'Negative',
        hippocampalVolume: 3.1,
        entorhinalVolume: 1.4,
        ventricularVolume: 31.5,
        educationYears: 18,
        familyHistory: false,
        featureImportance: [
          { feature: 'Hippocampal Volume', importance: 0.25, contribution: 5.0, direction: 'negative', explanation: 'Stable volume.' }
        ],
        recommendation: 'Stable parameters. Continue monitoring.',
        modelVersion: 'NeuroScan-v2.4.1'
      }
    ],
    longitudinalData: [
      { date: '2024-04-18', mmse: 26, cdr: 0.5, brainAgeGap: 4.0, hippocampalVolume: 3.1, diseaseStage: 'Very Mild Demented', riskScore: 0.32 },
      { date: '2024-10-20', mmse: 27, cdr: 0.5, brainAgeGap: 3.9, hippocampalVolume: 3.1, diseaseStage: 'Very Mild Demented', riskScore: 0.30 },
      { date: '2025-04-22', mmse: 26, cdr: 0.5, brainAgeGap: 4.2, hippocampalVolume: 3.0, diseaseStage: 'Very Mild Demented', riskScore: 0.33 },
      { date: '2026-04-20', mmse: 26, cdr: 0.5, brainAgeGap: 4.1, hippocampalVolume: 3.1, diseaseStage: 'Very Mild Demented', riskScore: 0.31 },
    ],
    reports: [],
    auditEntries: [],
    createdAt: '2024-04-18',
  },
  {
    id: 'ADNI-202-S',
    patientId: 'ADNI-202-S',
    name: 'Margaret Thompson',
    age: 71,
    gender: 'Female',
    dateOfBirth: '1955-11-05',
    status: 'active',
    riskCategory: 'Very Mild',
    brainAgeGap: 2.5,
    lastScanDate: '2026-05-01',
    totalScans: 4,
    diagnosis: 'Very Mild Demented',
    mriScans: [
      {
        id: 'MRI-ADNI-202-S-1',
        patientId: 'ADNI-202-S',
        date: '2024-05-02',
        modality: 'T1',
        status: 'completed',
        classification: 'Very Mild Demented',
        confidence: 0.83,
        probabilityBreakdown: { 'Non Demented': 0.14, 'Very Mild Demented': 0.83, 'Mild Demented': 0.02, 'Moderate Demented': 0.01 },
        findings: ['Stable baseline brain volume', 'Mild temporal lobe asymmetry'],
        recommendations: ['Standard screening follow-up'],
        modelVersion: 'NeuroScan-v2.4.1',
        preProcessingSteps: [
          { name: 'Skull Stripping', status: 'completed', duration: '1.0s' },
          { name: 'Bias Field Correction', status: 'completed', duration: '0.7s' },
          { name: 'Spatial Normalization', status: 'completed', duration: '1.9s' },
          { name: 'Segmentation', status: 'completed', duration: '3.1s' },
        ],
        createdAt: '2024-05-02',
      },
      {
        id: 'MRI-ADNI-202-S-4',
        patientId: 'ADNI-202-S',
        date: '2026-05-01',
        modality: 'T1',
        status: 'completed',
        classification: 'Very Mild Demented',
        confidence: 0.84,
        probabilityBreakdown: { 'Non Demented': 0.13, 'Very Mild Demented': 0.84, 'Mild Demented': 0.02, 'Moderate Demented': 0.01 },
        findings: ['Stable temporal structure, no significant progression'],
        recommendations: ['Annual clinical reassessment'],
        modelVersion: 'NeuroScan-v2.4.1',
        preProcessingSteps: [
          { name: 'Skull Stripping', status: 'completed', duration: '1.1s' },
          { name: 'Bias Field Correction', status: 'completed', duration: '0.8s' },
          { name: 'Spatial Normalization', status: 'completed', duration: '2.1s' },
          { name: 'Segmentation', status: 'completed', duration: '3.3s' },
        ],
        createdAt: '2026-05-01',
      }
    ],
    assessments: [
      {
        id: 'RA-ADNI-202-S-1',
        patientId: 'ADNI-202-S',
        date: '2024-05-02',
        conversionProbability: 0.34,
        riskCategory: 'Very Mild',
        confidence: 0.91,
        mmse: 25,
        cdr: 0.5,
        apoe4: 'Negative',
        hippocampalVolume: 3.3,
        entorhinalVolume: 1.4,
        ventricularVolume: 29.8,
        educationYears: 12,
        familyHistory: true,
        featureImportance: [
          { feature: 'Hippocampal Volume', importance: 0.24, contribution: 4.8, direction: 'negative', explanation: 'Stable volume.' }
        ],
        recommendation: 'Annual review suggested',
        modelVersion: 'NeuroScan-v2.4.1'
      },
      {
        id: 'RA-ADNI-202-S-4',
        patientId: 'ADNI-202-S',
        date: '2026-05-01',
        conversionProbability: 0.33,
        riskCategory: 'Very Mild',
        confidence: 0.92,
        mmse: 25,
        cdr: 0.5,
        apoe4: 'Negative',
        hippocampalVolume: 3.3,
        entorhinalVolume: 1.4,
        ventricularVolume: 30.1,
        educationYears: 12,
        familyHistory: true,
        featureImportance: [
          { feature: 'Hippocampal Volume', importance: 0.24, contribution: 4.7, direction: 'negative', explanation: 'Stable volume.' }
        ],
        recommendation: 'Parameters are stable. Maintain monitoring.',
        modelVersion: 'NeuroScan-v2.4.1'
      }
    ],
    longitudinalData: [
      { date: '2024-05-02', mmse: 25, cdr: 0.5, brainAgeGap: 2.6, hippocampalVolume: 3.3, diseaseStage: 'Very Mild Demented', riskScore: 0.34 },
      { date: '2024-11-05', mmse: 25, cdr: 0.5, brainAgeGap: 2.5, hippocampalVolume: 3.3, diseaseStage: 'Very Mild Demented', riskScore: 0.35 },
      { date: '2025-05-01', mmse: 26, cdr: 0.5, brainAgeGap: 2.4, hippocampalVolume: 3.4, diseaseStage: 'Very Mild Demented', riskScore: 0.32 },
      { date: '2026-05-01', mmse: 25, cdr: 0.5, brainAgeGap: 2.5, hippocampalVolume: 3.3, diseaseStage: 'Very Mild Demented', riskScore: 0.33 },
    ],
    reports: [],
    auditEntries: [],
    createdAt: '2024-05-02',
  }
];

export const mockPatients = [...adniSubjects, ...generatePatients(96)];

// ============================================================
// Users
// ============================================================

export const mockUsers: User[] = [
  {
    id: 'U-001',
    email: 'dr.sharma@neuroscan.ai',
    name: 'Dr. Aarav Sharma',
    role: 'doctor',
    avatar: '',
    hospital: 'All India Institute of Medical Sciences',
    specialization: 'Neurology',
    licenseNumber: 'MCI-2021-45892',
    createdAt: '2023-01-15',
    lastActive: '2026-06-10',
  },
  {
    id: 'U-002',
    email: 'research.patel@neuroscan.ai',
    name: 'Dr. Priya Patel',
    role: 'researcher',
    avatar: '',
    hospital: 'NIMHANS',
    specialization: 'Cognitive Neuroscience',
    createdAt: '2023-03-20',
    lastActive: '2026-06-09',
  },
  {
    id: 'U-003',
    email: 'admin@neuroscan.ai',
    name: 'Rahul Verma',
    role: 'administrator',
    avatar: '',
    hospital: 'NeuroScan AI',
    createdAt: '2023-01-01',
    lastActive: '2026-06-10',
  },
];

// ============================================================
// Dashboard Metrics
// ============================================================

export const dashboardMetrics: DashboardMetrics = {
  totalPatients: mockPatients.length,
  totalMRIScans: mockPatients.reduce((sum, p) => sum + p.totalScans, 0),
  highRiskCases: mockPatients.filter(p => p.riskCategory === 'Moderate').length,
  averageBrainAgeGap: parseFloat((mockPatients.reduce((sum, p) => sum + p.brainAgeGap, 0) / mockPatients.length).toFixed(1)),
  patientsTrend: 12.5,
  scansTrend: 18.3,
  riskTrend: -3.2,
  brainAgeTrend: 2.1,
};

// ============================================================
// Disease Distribution
// ============================================================

export const diseaseDistribution: DiseaseDistribution[] = [
  { name: 'Non Demented', value: mockPatients.filter(p => p.diagnosis === 'Non Demented').length, color: '#22c55e' },
  { name: 'Very Mild Demented', value: mockPatients.filter(p => p.diagnosis === 'Very Mild Demented').length, color: '#f59e0b' },
  { name: 'Mild Demented', value: mockPatients.filter(p => p.diagnosis === 'Mild Demented').length, color: '#f97316' },
  { name: 'Moderate Demented', value: mockPatients.filter(p => p.diagnosis === 'Moderate Demented').length, color: '#dc2626' },
];

export const riskDistribution: RiskDistribution[] = riskCategories.map(cat => ({
  category: cat,
  count: mockPatients.filter(p => p.riskCategory === cat).length,
  color: riskColors[cat],
}));

export const monthlyTrends: MonthlyTrend[] = [
  { month: 'Jan', scans: 45, predictions: 32 },
  { month: 'Feb', scans: 52, predictions: 38 },
  { month: 'Mar', scans: 48, predictions: 41 },
  { month: 'Apr', scans: 61, predictions: 45 },
  { month: 'May', scans: 55, predictions: 50 },
  { month: 'Jun', scans: 58, predictions: 48 },
  { month: 'Jul', scans: 63, predictions: 52 },
  { month: 'Aug', scans: 59, predictions: 55 },
  { month: 'Sep', scans: 67, predictions: 58 },
  { month: 'Oct', scans: 72, predictions: 62 },
  { month: 'Nov', scans: 68, predictions: 60 },
  { month: 'Dec', scans: 75, predictions: 65 },
];

export const conversionRiskTrends: ConversionRiskTrend[] = [
  { month: 'Jan', low: 45, veryMild: 28, mild: 18, moderate: 9 },
  { month: 'Feb', low: 42, veryMild: 30, mild: 20, moderate: 8 },
  { month: 'Mar', low: 40, veryMild: 32, mild: 19, moderate: 9 },
  { month: 'Apr', low: 38, veryMild: 33, mild: 21, moderate: 8 },
  { month: 'May', low: 36, veryMild: 34, mild: 20, moderate: 10 },
  { month: 'Jun', low: 35, veryMild: 33, mild: 22, moderate: 10 },
  { month: 'Jul', low: 33, veryMild: 34, mild: 23, moderate: 10 },
  { month: 'Aug', low: 32, veryMild: 33, mild: 24, moderate: 11 },
  { month: 'Sep', low: 30, veryMild: 35, mild: 23, moderate: 12 },
  { month: 'Oct', low: 29, veryMild: 34, mild: 24, moderate: 13 },
  { month: 'Nov', low: 28, veryMild: 34, mild: 25, moderate: 13 },
  { month: 'Dec', low: 27, veryMild: 33, mild: 26, moderate: 14 },
];

// ============================================================
// Brain Age Mock Data
// ============================================================

export const mockBrainAgeData: BrainAgeData = {
  chronologicalAge: 72,
  predictedBrainAge: 78.5,
  brainAgeGap: 6.5,
  neuroScore: 74.2,
  brainHealthStatus: 'Accelerated Aging',
  historicalData: [
    { date: '2023-06', chronologicalAge: 69, predictedBrainAge: 72.0, brainAgeGap: 3.0 },
    { date: '2023-12', chronologicalAge: 69.5, predictedBrainAge: 73.2, brainAgeGap: 3.7 },
    { date: '2024-06', chronologicalAge: 70, predictedBrainAge: 74.8, brainAgeGap: 4.8 },
    { date: '2024-12', chronologicalAge: 70.5, predictedBrainAge: 76.0, brainAgeGap: 5.5 },
    { date: '2025-06', chronologicalAge: 71, predictedBrainAge: 77.1, brainAgeGap: 6.1 },
    { date: '2025-12', chronologicalAge: 71.5, predictedBrainAge: 77.8, brainAgeGap: 6.3 },
    { date: '2026-06', chronologicalAge: 72, predictedBrainAge: 78.5, brainAgeGap: 6.5 },
  ],
  regionalVolumes: [
    { region: 'Hippocampus (L)', volume: 2.8, expectedVolume: 3.5, percentDifference: -20.0 },
    { region: 'Hippocampus (R)', volume: 2.9, expectedVolume: 3.6, percentDifference: -19.4 },
    { region: 'Entorhinal Cortex', volume: 1.2, expectedVolume: 1.6, percentDifference: -25.0 },
    { region: 'Ventricles', volume: 42.3, expectedVolume: 35.0, percentDifference: 20.9 },
    { region: 'Temporal Lobe', volume: 48.5, expectedVolume: 55.0, percentDifference: -11.8 },
    { region: 'Frontal Lobe', volume: 125.0, expectedVolume: 135.0, percentDifference: -7.4 },
  ],
};

// ============================================================
// Features / Landing Page
// ============================================================

export const features: Feature[] = [
  {
    id: '1',
    icon: 'Brain',
    title: 'MRI Disease Classification',
    description: 'Multi-class classification of dementia stages from structural MRI scans using deep convolutional neural networks.',
    clinicalBenefit: 'Achieves 94.2% accuracy in distinguishing between Non-Demented, Very Mild, Mild, and Moderate stages.',
  },
  {
    id: '2',
    icon: 'Activity',
    title: 'MCI Conversion Prediction',
    description: 'Predicts 24-month conversion risk from Mild Cognitive Impairment to Alzheimer\'s disease using multimodal biomarkers.',
    clinicalBenefit: 'Enables early intervention strategies, potentially delaying disease progression by 12-18 months.',
  },
  {
    id: '3',
    icon: 'Clock',
    title: 'Brain Age Estimation',
    description: 'Estimates brain-predicted age from MRI morphology to quantify accelerated brain aging beyond chronological age.',
    clinicalBenefit: 'Provides a NeuroScore™ to track brain health and detect pathological aging 3-5 years before clinical symptoms.',
  },
  {
    id: '4',
    icon: 'TrendingUp',
    title: 'Longitudinal Monitoring',
    description: 'Tracks disease progression over time with automated measurement of cognitive scores, brain volumes, and risk trajectories.',
    clinicalBenefit: 'Reduces manual follow-up workload by 60% while providing quantitative progression metrics for treatment planning.',
  },
  {
    id: '5',
    icon: 'Search',
    title: 'Explainable AI (XAI)',
    description: 'SHAP and Grad-CAM visualizations highlight which brain regions and biomarkers drive each prediction.',
    clinicalBenefit: 'Builds clinician trust by providing evidence-based explanations aligned with neurological knowledge.',
  },
  {
    id: '6',
    icon: 'FileText',
    title: 'Clinical Reporting',
    description: 'Auto-generates comprehensive clinical reports compliant with radiology reporting standards (RSNA/IHE).',
    clinicalBenefit: 'Reduces reporting time by 70% while ensuring consistent, regulatory-compliant documentation.',
  },
  {
    id: '7',
    icon: 'Monitor',
    title: 'DICOM / PACS Integration',
    description: 'Seamlessly integrates with existing hospital infrastructure through DICOM, FHIR, and HL7 standards.',
    clinicalBenefit: 'Deploys within existing PACS workflow — no additional hardware or IT overhead required.',
  },
  {
    id: '8',
    icon: 'Shield',
    title: 'Audit Logging & Compliance',
    description: 'Comprehensive audit trail for every prediction, access, and data modification with HIPAA/GDPR compliance.',
    clinicalBenefit: 'Satisfies regulatory requirements for clinical decision support systems (FDA, CE, CDSCO).',
  },
];

// ============================================================
// Competitor Comparison
// ============================================================

export const competitorComparison: CompetitorComparison[] = [
  { feature: 'Brain Age Estimation', neuroscan: '✓ Included', qynapse: '✓', icobrain: '✓', neuroshield: '✗', symri: '✓' },
  { feature: 'MCI Conversion Prediction', neuroscan: '✓ Advanced AI', qynapse: '✗', icobrain: 'Basic', neuroshield: '✗', symri: '✗' },
  { feature: 'Explainable AI (SHAP/GradCAM)', neuroscan: '✓ Included', qynapse: '✗', icobrain: '✗', neuroshield: '✗', symri: '✗' },
  { feature: 'Longitudinal Tracking', neuroscan: '✓ Auto-tracked', qynapse: 'Manual', icobrain: '✓', neuroshield: '✗', symri: '✗' },
  { feature: 'Standard MRI Support', neuroscan: '✓ DICOM/NIfTI', qynapse: 'DICOM', icobrain: 'DICOM', neuroshield: 'DICOM', symri: 'DICOM' },
  { feature: 'Clinical Reporting', neuroscan: '✓ Auto-generated', qynapse: '✓', icobrain: '✓', neuroshield: 'Basic', symri: '✓' },
  { feature: 'Risk Stratification', neuroscan: '✓ Multi-modal', qynapse: '✓', icobrain: 'Basic', neuroshield: 'Basic', symri: '✗' },
  { feature: 'Cost Accessibility', neuroscan: 'Pay-per-scan', qynapse: '$$$$$', icobrain: '$$$$', neuroshield: '$$$', symri: '$$$' },
];

// ============================================================
// Audit Logs
// ============================================================

export const generateAuditLogs = (count: number): AuditEntry[] => {
  const abhaMap: Record<string, string> = {
    'ADNI-101-C': '91-0428-1952-4731',
    'ADNI-102-C': '32-5819-1957-2284',
    'ADNI-201-S': '78-0115-1950-8819',
    'ADNI-202-S': '45-1105-1955-3012',
  };

  return Array.from({ length: count }, (_, i) => {
    const isModelAction = i % 2 === 0;
    const patId = i % 3 === 0 ? `ADNI-${101 + (i % 2)}-${i % 6 === 0 ? 'C' : 'S'}` : undefined;
    const displayPatientId = patId || `P-${String(100 + (i % 900)).padStart(4, '0')}`;
    const abhaId = abhaMap[displayPatientId] || `91-${String(1000 + (i % 9000))}-${String(1000 + (i % 9000))}-${String(1000 + (i % 9000))}`;
    
    const confidence = isModelAction ? parseFloat((0.72 + (i % 28) * 0.01).toFixed(2)) : undefined;
    const modelHash = isModelAction 
      ? (i % 4 === 0 ? 'NeuroScan-v2.0-EfficientNetB3' : 'NeuroScan-v2.4-Transformer')
      : undefined;
    const uncertaintyStatus = confidence !== undefined ? confidence < 0.85 : undefined;

    return {
      id: `AUD-${String(i + 1).padStart(4, '0')}`,
      userId: pick(mockUsers.map(u => u.id)),
      userName: pick(mockUsers.map(u => u.name)),
      userRole: pick(mockUsers.map(u => u.role)),
      timestamp: randomDate('2025-01-01', '2026-06-10') + 'T' + `${String(randomInt(0, 23)).padStart(2, '0')}:${String(randomInt(0, 59)).padStart(2, '0')}:${String(randomInt(0, 59)).padStart(2, '0')}Z`,
      action: pick(['analysis', 'prediction', 'report_generated', 'report_downloaded', 'patient_viewed', 'settings_changed', 'login', 'logout'] as const),
      details: pick([
        'MRI analysis completed for patient',
        'Risk prediction generated for patient',
        'Clinical report generated',
        'Report downloaded in PDF format',
        'Patient profile viewed',
        'Model threshold settings updated',
        'User logged in',
        'User logged out',
      ]),
      patientId: patId || (i % 3 === 0 ? `P-${String(randomInt(1, 100)).padStart(4, '0')}` : undefined),
      modelVersion: i % 4 === 0 ? 'NeuroScan-v2.4.1' : undefined,
      riskCategory: i % 5 === 0 ? pick(riskCategories) : undefined,
      ipAddress: `192.168.${randomInt(1, 255)}.${randomInt(1, 255)}`,
      abhaId: i % 3 === 0 ? abhaId : undefined,
      modelHash,
      confidence,
      uncertaintyStatus,
    };
  });
};

export const mockAuditLogs = generateAuditLogs(200);

// ============================================================
// Prediction Input Defaults
// ============================================================

export const defaultPredictionInput: PredictionInput = {
  age: 72,
  gender: 'Female',
  mmse: 24,
  cdr: 1,
  apoe4: 'Heterozygous',
  hippocampalVolume: 2.8,
  entorhinalVolume: 1.2,
  ventricularVolume: 42.3,
  educationYears: 14,
  familyHistory: true,
};
