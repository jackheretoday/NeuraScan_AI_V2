// ============================================================
// Core Types for NeuroScan AI 2.0
// ============================================================

export type UserRole = 'doctor' | 'researcher' | 'administrator';

export type DiseaseClass = 'Non Demented' | 'Very Mild Demented' | 'Mild Demented' | 'Moderate Demented';

export type RiskCategory = 'Low' | 'Very Mild' | 'Mild' | 'Moderate';

export type Gender = 'Male' | 'Female';

export type APOE4Status = 'Negative' | 'Heterozygous' | 'Homozygous';

export type ScanStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type ScanModality = 'T1' | 'T2' | 'FLAIR' | 'DWI' | 'fMRI';

export type AuditAction = 'analysis' | 'prediction' | 'report_generated' | 'report_downloaded' | 'patient_viewed' | 'settings_changed' | 'login' | 'logout';

export type ThemeMode = 'light' | 'dark' | 'system';

export type ReportFormat = 'pdf' | 'csv';

// ============================================================
// User
// ============================================================

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  hospital?: string;
  specialization?: string;
  licenseNumber?: string;
  createdAt: string;
  lastActive: string;
}

// ============================================================
// Patient
// ============================================================

export interface Patient {
  id: string;
  patientId: string;
  name: string;
  age: number;
  gender: Gender;
  dateOfBirth: string;
  status: 'active' | 'inactive' | 'critical';
  riskCategory: RiskCategory;
  brainAgeGap: number;
  lastScanDate: string;
  totalScans: number;
  diagnosis: DiseaseClass;
  mriScans: MRIScan[];
  assessments: RiskAssessment[];
  longitudinalData: LongitudinalDataPoint[];
  reports: ClinicalReport[];
  auditEntries: AuditEntry[];
  createdAt: string;
}

// ============================================================
// MRI
// ============================================================

export interface MRIScan {
  id: string;
  patientId: string;
  date: string;
  modality: ScanModality;
  status: ScanStatus;
  classification?: DiseaseClass;
  confidence: number;
  probabilityBreakdown: Record<DiseaseClass, number>;
  gradCAMUrl?: string;
  imageUrl?: string;
  findings: string[];
  recommendations: string[];
  modelVersion: string;
  preProcessingSteps: PreprocessingStep[];
  createdAt: string;
}

export interface PreprocessingStep {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  duration?: string;
}

// ============================================================
// Risk Assessment
// ============================================================

export interface RiskAssessment {
  id: string;
  patientId: string;
  date: string;
  conversionProbability: number;
  riskCategory: RiskCategory;
  confidence: number;
  mmse: number;
  cdr: number;
  apoe4: APOE4Status;
  hippocampalVolume: number;
  entorhinalVolume: number;
  ventricularVolume: number;
  educationYears: number;
  familyHistory: boolean;
  featureImportance: FeatureImportance[];
  recommendation: string;
  modelVersion: string;
}

export interface FeatureImportance {
  feature: string;
  importance: number;
  contribution: number;
  direction: 'positive' | 'negative';
  explanation: string;
}

// ============================================================
// Brain Age
// ============================================================

export interface BrainAgeData {
  chronologicalAge: number;
  predictedBrainAge: number;
  brainAgeGap: number;
  neuroScore: number;
  brainHealthStatus: 'Normal' | 'At Risk' | 'Accelerated Aging' | 'Critical';
  historicalData: BrainAgeHistoricalPoint[];
  regionalVolumes: RegionalVolume[];
}

export interface BrainAgeHistoricalPoint {
  date: string;
  chronologicalAge: number;
  predictedBrainAge: number;
  brainAgeGap: number;
}

export interface RegionalVolume {
  region: string;
  volume: number;
  expectedVolume: number;
  percentDifference: number;
}

// ============================================================
// Longitudinal
// ============================================================

export interface LongitudinalDataPoint {
  date: string;
  mmse: number;
  cdr: number;
  brainAgeGap: number;
  hippocampalVolume: number;
  diseaseStage: DiseaseClass;
  riskScore: number;
}

export interface LongitudinalProjection {
  date: string;
  mmse: number;
  cdr: number;
  confidenceLower: number;
  confidenceUpper: number;
}

// ============================================================
// Clinical Report
// ============================================================

export interface ClinicalReport {
  id: string;
  patientId: string;
  title: string;
  date: string;
  type: 'analysis' | 'prediction' | 'longitudinal' | 'combined';
  status: 'draft' | 'final' | 'archived';
  generatedBy: string;
  findings: ReportSection[];
  recommendations: string[];
  disclaimer: string;
  pdfUrl?: string;
}

export interface ReportSection {
  title: string;
  content: string;
  type: 'text' | 'table' | 'chart' | 'image';
  data?: unknown;
}

// ============================================================
// Audit
// ============================================================

export interface AuditEntry {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  timestamp: string;
  action: AuditAction;
  details: string;
  patientId?: string;
  modelVersion?: string;
  riskCategory?: RiskCategory;
  ipAddress?: string;
  abhaId?: string;
  modelHash?: string;
  confidence?: number;
  uncertaintyStatus?: boolean;
}

// ============================================================
// Dashboard
// ============================================================

export interface DashboardMetrics {
  totalPatients: number;
  totalMRIScans: number;
  highRiskCases: number;
  averageBrainAgeGap: number;
  patientsTrend: number;
  scansTrend: number;
  riskTrend: number;
  brainAgeTrend: number;
}

export interface DiseaseDistribution {
  name: DiseaseClass;
  value: number;
  color: string;
}

export interface RiskDistribution {
  category: RiskCategory;
  count: number;
  color: string;
}

export interface MonthlyTrend {
  month: string;
  scans: number;
  predictions: number;
}

export interface ConversionRiskTrend {
  month: string;
  low: number;
  veryMild: number;
  mild: number;
  moderate: number;
}

// ============================================================
// Feature / Landing
// ============================================================

export interface Feature {
  id: string;
  icon: string;
  title: string;
  description: string;
  clinicalBenefit: string;
}

export interface CompetitorComparison {
  feature: string;
  neuroscan: boolean | string;
  qynapse: boolean | string;
  icobrain: boolean | string;
  neuroshield: boolean | string;
  symri: boolean | string;
}

// ============================================================
// Prediction Input
// ============================================================

export interface PredictionInput {
  age: number;
  gender: Gender;
  mmse: number;
  cdr: number;
  apoe4: APOE4Status;
  hippocampalVolume: number;
  entorhinalVolume: number;
  ventricularVolume: number;
  educationYears: number;
  familyHistory: boolean;
}

// ============================================================
// Settings
// ============================================================

export interface UserSettings {
  notifications: {
    emailAlerts: boolean;
    criticalResults: boolean;
    weeklyDigest: boolean;
    reportReady: boolean;
  };
  theme: ThemeMode;
  modelThresholds: {
    confidenceThreshold: number;
    riskHighThreshold: number;
    riskMildThreshold: number;
  };
  reportSettings: {
    includeGradCAM: boolean;
    includeSHAP: boolean;
    includeRecommendations: boolean;
    autoGenerate: boolean;
  };
  security: {
    twoFactorEnabled: boolean;
    sessionTimeout: number;
    auditLogging: boolean;
  };
}
