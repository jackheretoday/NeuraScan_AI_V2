import { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Brain, AlertTriangle, Clock, Activity, BarChart3, PieChart as PieIcon,
  Upload, CheckCircle2, Shield, ArrowUpRight, Zap, Info, ArrowRight, Eye, RefreshCw, AlertCircle, Printer, Settings
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell, AreaChart, Area, Legend, ComposedChart, Line
} from 'recharts';
import { KpiCard } from '@/components/ui/KpiCard';
import { InsightsPanel } from '@/components/layout/InsightsPanel';
import { usePatientStore } from '@/store/patientStore';
import {
  dashboardMetrics, diseaseDistribution, riskDistribution,
  monthlyTrends, conversionRiskTrends
} from '@/data/mockData';
import { getDiseaseColor } from '@/lib/utils';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-border rounded-xl p-3 shadow-lg text-xs">
        <p className="font-semibold text-text-primary mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }} className="font-medium">
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function Dashboard() {
  const [dashboardView, setDashboardView] = useState<'console' | 'clinic'>('console');
  const { patients, updatePatient } = usePatientStore();
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[0]?.id || 'ADNI-101-C');
  const [simulateUncertainty, setSimulateUncertainty] = useState<boolean>(false);
  const [mriViewMode, setMriViewMode] = useState<'original' | 'gradcam'>('original');

  const [metrics, setMetrics] = useState(dashboardMetrics);
  const [diseaseDist, setDiseaseDist] = useState(diseaseDistribution);
  const [riskDist, setRiskDist] = useState(riskDistribution);

  useEffect(() => {
    fetch('/api/dashboard/metrics')
      .then(res => res.json())
      .then(data => {
        if (data.metrics) setMetrics(data.metrics);
        if (data.diseaseDistribution) setDiseaseDist(data.diseaseDistribution);
        if (data.riskDistribution) setRiskDist(data.riskDistribution);
      })
      .catch(console.error);
  }, [patients]);

  useEffect(() => {
    if (patients.length > 0 && !patients.some(p => p.id === selectedPatientId)) {
      setSelectedPatientId(patients[0].id);
    }
  }, [patients, selectedPatientId]);

  // Dropzone states
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [ingestState, setIngestState] = useState<'idle' | 'loading' | 'completed'>('idle');
  const [ingestProgress, setIngestProgress] = useState<number>(0);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(-1);
  const [abhaIdInput, setAbhaIdInput] = useState<string>('');

  // Ablation Study Tab
  const [activeAblationTab, setActiveAblationTab] = useState<'clinical' | 'imaging' | 'multimodal'>('multimodal');

  // Dev Demo Drawer state
  const [isDemoDrawerOpen, setIsDemoDrawerOpen] = useState<boolean>(false);
  const [consoleTab, setConsoleTab] = useState<'mri' | 'risk' | 'brainage' | 'recommendations'>('mri');

  const activePatient = patients.find(p => p.id === selectedPatientId) || patients[0];

  const latestScan = activePatient?.mriScans && activePatient.mriScans.length > 0
    ? activePatient.mriScans[activePatient.mriScans.length - 1]
    : null;

  const latestAssessment = activePatient?.assessments && activePatient.assessments.length > 0
    ? activePatient.assessments[activePatient.assessments.length - 1]
    : null;

  // Determine Uncertainty Flag
  const isUncertain = simulateUncertainty || (latestScan ? latestScan.confidence < 0.85 : false);

  const pipelineSteps = [
    'Skull Stripping (T1 Atlas alignment)',
    'Bias Field Correction (N4 algorithm)',
    'Spatial Normalization (MNI-152 space)',
    'Tissue Segmentation (CSF, GM, WM)'
  ];

  // Sync ABHA ID and reset scanner on patient change
  useEffect(() => {
    if (!activePatient) return;
    const abhaMap: Record<string, string> = {
      'ADNI-101-C': '91-0428-1952-4731',
      'ADNI-102-C': '32-5819-1957-2284',
      'ADNI-201-S': '78-0115-1950-8819',
      'ADNI-202-S': '45-1105-1955-3012',
    };
    setAbhaIdInput(abhaMap[activePatient.id] || '12-3456-7890-1234');
    setUploadedFile(null);
    setIngestState('idle');
    setIngestProgress(0);
    setActiveStepIndex(-1);
  }, [selectedPatientId, activePatient?.id]);

  // Handle Drag-and-drop
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;
      const file = acceptedFiles[0];
      setUploadedFile(file.name);
      setIngestState('loading');
      setIngestProgress(0);
      setActiveStepIndex(0);
    },
    accept: {
      'image/*': ['.nii', '.nii.gz', '.dcm', '.png', '.jpg', '.jpeg']
    },
    multiple: false
  });

  // Preprocessing simulation progress
  useEffect(() => {
    let interval: any;
    if (ingestState === 'loading') {
      interval = setInterval(() => {
        setIngestProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIngestState('completed');
            setActiveStepIndex(4);
            return 100;
          }
          const nextProgress = prev + 5;
          const currentStep = Math.floor((nextProgress / 100) * pipelineSteps.length);
          setActiveStepIndex(Math.min(currentStep, pipelineSteps.length - 1));
          return nextProgress;
        });
      }, 120);
    }
    return () => clearInterval(interval);
  }, [ingestState]);

  if (!activePatient) return null;

  // Probability breakdown data for BarChart
  const probabilityData = latestScan
    ? [
        { name: 'Non Demented', probability: (latestScan.probabilityBreakdown['Non Demented'] || 0) * 100 },
        { name: 'Very Mild Demented', probability: (latestScan.probabilityBreakdown['Very Mild Demented'] || 0) * 100 },
        { name: 'Mild Demented', probability: (latestScan.probabilityBreakdown['Mild Demented'] || 0) * 100 },
        { name: 'Moderate Demented', probability: (latestScan.probabilityBreakdown['Moderate Demented'] || 0) * 100 },
      ]
    : [];

  // Conversion risk & CI
  const conversionProbability = latestAssessment ? latestAssessment.conversionProbability * 100 : 50;
  const ciText = latestAssessment?.id?.includes('101') ? '95% CI: [82.4% - 93.6%]'
    : latestAssessment?.id?.includes('102') ? '95% CI: [86.1% - 95.8%]'
    : latestAssessment?.id?.includes('201') ? '95% CI: [24.5% - 37.8%]'
    : latestAssessment?.id?.includes('202') ? '95% CI: [26.2% - 39.7%]'
    : `95% CI: [${(conversionProbability - 5.5).toFixed(1)}% - ${(conversionProbability + 4.8).toFixed(1)}%]`;

  // Semicircle gauge Recharts Pie data
  const gaugeData = [
    { value: conversionProbability, fill: conversionProbability > 70 ? '#dc2626' : conversionProbability > 40 ? '#f59e0b' : '#0d9488' },
    { value: 100 - conversionProbability, fill: '#f1f5f9' }
  ];

  // Feature weights for SHAP waterfall list
  const shapWeights = [
    {
      name: 'ApoE4 × HippVol',
      weight: activePatient.id.includes('101') || activePatient.id.includes('102') ? 14.2 : 1.5,
      type: 'positive',
      desc: 'Synergy of ApoE4 genetic risk and low hippocampal volume'
    },
    {
      name: 'MMSE × CDR-SB',
      weight: activePatient.id.includes('101') || activePatient.id.includes('102') ? 10.5 : -2.8,
      type: activePatient.id.includes('101') || activePatient.id.includes('102') ? 'positive' : 'negative',
      desc: 'Interaction between cognitive state and severity markers'
    },
    {
      name: 'Entorhinal Vol',
      weight: activePatient.id.includes('101') || activePatient.id.includes('102') ? 8.4 : -4.2,
      type: activePatient.id.includes('101') || activePatient.id.includes('102') ? 'positive' : 'negative',
      desc: 'Structural volume of the entorhinal cortex'
    },
    {
      name: 'Family History',
      weight: activePatient.id.includes('101') || activePatient.id.includes('102') ? 4.8 : 2.0,
      type: 'positive',
      desc: 'First-degree genetic clinical history'
    },
    {
      name: 'Education Years',
      weight: -3.5,
      type: 'negative',
      desc: 'Cognitive reserve and socioeconomic protective factor'
    }
  ];

  // Brain Age Gap calculation
  const chronologicalAge = activePatient.age;
  const brainAgeGap = activePatient.brainAgeGap;
  const predictedBrainAge = (chronologicalAge + brainAgeGap).toFixed(1);

  // Brain Age Gap formatting style
  const brainAgeStyle = brainAgeGap < 2
    ? { colorClass: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30', label: 'Stable Brain Ageing', desc: 'Gap < 2yr. Synaptic density and structural volumes correspond correctly to chronological age.' }
    : brainAgeGap <= 5
      ? { colorClass: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30', label: 'Mild Accelerated Ageing', desc: 'Gap 2-5yr. Indication of mild age-accelerated structural tissue loss. Monitor annually.' }
      : { colorClass: 'text-critical-600 dark:text-critical-400 bg-critical-50 dark:bg-critical-950/20 border-critical-200 dark:border-critical-900/30', label: 'ACCELERATED NEURODEGENERATION ALERT', desc: 'Gap > 5yr. Advanced cerebral tissue decay indicative of high risk of cognitive conversion.' };

  // Composed timeline data
  const timelineData = activePatient.longitudinalData.map((d) => ({
    ...d,
    formattedDate: new Date(d.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
  }));

  // Patient recommendation mapping
  const clinicalRecommendation = activePatient.riskCategory === 'Moderate'
    ? 'URGENT CLINICAL PATH: Refer to Neurology Specialist immediately. Initiate early intervention protocol (cognitive training, lifestyle covariates modifications). Schedule follow-up high-resolution 3T MRI scan in 90 days.'
    : activePatient.riskCategory === 'Very Mild'
      ? 'MONITORING CLINICAL PATH: Clinical surveillance advised. Schedule clinical cognitive evaluation and MMSE testing in 6 months, and repeat baseline MRI analysis in 12 months.'
      : 'STABLE CLINICAL PATH: Routine annual screening suggested. No immediate specialist intervention required. Maintain cardiovascular fitness and standard cognitive exercise regimens.';

  // Scenario override triggers
  const handleSeedScenario = (scenario: 'A' | 'B' | 'C') => {
    if (scenario === 'A') {
      updatePatient(activePatient.id, {
        brainAgeGap: 8.8,
        riskCategory: 'Moderate',
        diagnosis: 'Mild Demented',
        mriScans: [
          ...activePatient.mriScans.slice(0, -1),
          {
            ...activePatient.mriScans[activePatient.mriScans.length - 1],
            confidence: 0.72, // low confidence to trigger uncertainty flag!
            probabilityBreakdown: {
              'Non Demented': 0.05,
              'Very Mild Demented': 0.15,
              'Mild Demented': 0.72,
              'Moderate Demented': 0.08
            }
          }
        ],
        assessments: [
          ...activePatient.assessments.slice(0, -1),
          {
            ...activePatient.assessments[activePatient.assessments.length - 1],
            conversionProbability: 0.935,
            riskCategory: 'Moderate',
            confidence: 0.94,
            mmse: 17,
            cdr: 1.0
          }
        ],
        longitudinalData: [
          { date: '2024-05-10', mmse: 28, cdr: 0.5, brainAgeGap: 3.5, hippocampalVolume: 3.8, diseaseStage: 'Very Mild Demented', riskScore: 0.35 },
          { date: '2024-11-12', mmse: 26, cdr: 0.5, brainAgeGap: 4.8, hippocampalVolume: 3.2, diseaseStage: 'Very Mild Demented', riskScore: 0.52 },
          { date: '2025-05-14', mmse: 21, cdr: 1.0, brainAgeGap: 6.8, hippocampalVolume: 2.6, diseaseStage: 'Mild Demented', riskScore: 0.74 },
          { date: '2026-05-15', mmse: 17, cdr: 1.0, brainAgeGap: 8.8, hippocampalVolume: 1.9, diseaseStage: 'Mild Demented', riskScore: 0.935 },
        ]
      });
      setSimulateUncertainty(false); // Let patient metrics drive the uncertainty naturally
    } else if (scenario === 'B') {
      updatePatient(activePatient.id, {
        brainAgeGap: 0.5,
        riskCategory: 'Low',
        diagnosis: 'Non Demented',
        mriScans: [
          ...activePatient.mriScans.slice(0, -1),
          {
            ...activePatient.mriScans[activePatient.mriScans.length - 1],
            confidence: 0.95,
            probabilityBreakdown: {
              'Non Demented': 0.95,
              'Very Mild Demented': 0.03,
              'Mild Demented': 0.01,
              'Moderate Demented': 0.01
            }
          }
        ],
        assessments: [
          ...activePatient.assessments.slice(0, -1),
          {
            ...activePatient.assessments[activePatient.assessments.length - 1],
            conversionProbability: 0.182,
            riskCategory: 'Low',
            confidence: 0.96,
            mmse: 29,
            cdr: 0.0
          }
        ],
        longitudinalData: [
          { date: '2024-05-10', mmse: 28, cdr: 0.0, brainAgeGap: 0.4, hippocampalVolume: 3.5, diseaseStage: 'Non Demented', riskScore: 0.15 },
          { date: '2024-11-12', mmse: 29, cdr: 0.0, brainAgeGap: 0.5, hippocampalVolume: 3.5, diseaseStage: 'Non Demented', riskScore: 0.16 },
          { date: '2025-05-14', mmse: 28, cdr: 0.0, brainAgeGap: 0.5, hippocampalVolume: 3.4, diseaseStage: 'Non Demented', riskScore: 0.17 },
          { date: '2026-05-15', mmse: 29, cdr: 0.0, brainAgeGap: 0.5, hippocampalVolume: 3.5, diseaseStage: 'Non Demented', riskScore: 0.182 },
        ]
      });
      setSimulateUncertainty(false);
    } else if (scenario === 'C') {
      updatePatient(activePatient.id, {
        brainAgeGap: 11.2,
        riskCategory: 'Moderate',
        diagnosis: 'Moderate Demented',
        mriScans: [
          ...activePatient.mriScans.slice(0, -1),
          {
            ...activePatient.mriScans[activePatient.mriScans.length - 1],
            confidence: 0.998,
            probabilityBreakdown: {
              'Non Demented': 0.00,
              'Very Mild Demented': 0.00,
              'Mild Demented': 0.002,
              'Moderate Demented': 0.998
            }
          }
        ],
        assessments: [
          ...activePatient.assessments.slice(0, -1),
          {
            ...activePatient.assessments[activePatient.assessments.length - 1],
            conversionProbability: 0.985,
            riskCategory: 'Moderate',
            confidence: 0.99,
            mmse: 12,
            cdr: 2.0
          }
        ],
        longitudinalData: [
          { date: '2024-05-10', mmse: 22, cdr: 1.0, brainAgeGap: 6.2, hippocampalVolume: 2.8, diseaseStage: 'Mild Demented', riskScore: 0.72 },
          { date: '2024-11-12', mmse: 18, cdr: 1.0, brainAgeGap: 8.1, hippocampalVolume: 2.2, diseaseStage: 'Mild Demented', riskScore: 0.85 },
          { date: '2025-05-14', mmse: 15, cdr: 2.0, brainAgeGap: 9.8, hippocampalVolume: 1.8, diseaseStage: 'Moderate Demented', riskScore: 0.94 },
          { date: '2026-05-15', mmse: 12, cdr: 2.0, brainAgeGap: 11.2, hippocampalVolume: 1.4, diseaseStage: 'Moderate Demented', riskScore: 0.985 },
        ]
      });
      setSimulateUncertainty(false);
    }
    setIsDemoDrawerOpen(false);
  };

  return (
    <>
      {/* SCREEN LAYOUT (Hidden when printing) */}
      <div className="print:hidden grid xl:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="text-xl font-bold text-text-primary">Clinical Decision Support Console</h1>
              <p className="text-sm text-text-secondary mt-1">
                Deep multimodal predictive diagnostics and longitudinal brain monitoring
              </p>
            </motion.div>

            {/* Toggle between Patient Console and General Clinic Metrics */}
            <div className="flex bg-surface-tertiary p-1 rounded-lg border border-border self-start">
              <button
                onClick={() => setDashboardView('console')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  dashboardView === 'console'
                    ? 'bg-white text-text-primary shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Patient Console
              </button>
              <button
                onClick={() => setDashboardView('clinic')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  dashboardView === 'clinic'
                    ? 'bg-white text-text-primary shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Clinic Overview
              </button>
            </div>
          </div>

          {/* Active Patient Selector (Sticky Bar for Console) */}
          {dashboardView === 'console' && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-border p-4 rounded-xl shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0">
                  {activePatient.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-text-primary">{activePatient.name}</h2>
                  <p className="text-xs text-text-secondary mt-0.5">
                    ID: <span className="font-mono text-slate-700 font-semibold">{activePatient.id}</span> • {activePatient.age} yrs • {activePatient.gender} • Diagnosis: <span className="font-semibold text-medical-600">{activePatient.diagnosis}</span>
                  </p>
                </div>
              </div>
              
              <div className="flex items-center flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <label htmlFor="patient-select" className="text-xs font-semibold text-text-secondary whitespace-nowrap">Active Subject:</label>
                  <select
                    id="patient-select"
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    className="bg-surface border border-border rounded-lg px-3 py-1.5 text-xs font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-medical-500"
                  >
                    {patients.slice(0, 4).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.id})
                      </option>
                    ))}
                  </select>
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-text-secondary select-none">
                  <input
                    type="checkbox"
                    checked={simulateUncertainty}
                    onChange={(e) => setSimulateUncertainty(e.target.checked)}
                    className="rounded text-medical-600 focus:ring-medical-500 w-4 h-4 border-slate-300"
                  />
                  Simulate Low Confidence
                </label>
              </div>
            </motion.div>
          )}

          {/* Console View */}
          {dashboardView === 'console' ? (
            <div className="space-y-6">
              {/* Console Tab Selector */}
              <div className="flex flex-wrap border-b border-border bg-white dark:bg-slate-900 rounded-xl p-1 mb-2 shadow-sm border border-slate-100 dark:border-slate-800 max-w-4xl">
                {[
                  { id: 'mri' as const, label: 'MRI Imaging & Triage (M1/M2)', icon: Brain, color: '#1a5fa8' },
                  { id: 'risk' as const, label: 'MCI Conversion Risk (M3)', icon: Activity, color: '#0d9488' },
                  { id: 'brainage' as const, label: 'NeuroScore™ & Brain Age (M4)', icon: Clock, color: '#f59e0b' },
                  { id: 'recommendations' as const, label: 'Clinical Action Path', icon: Shield, color: '#dc2626' }
                ].map(tab => {
                  const TabIcon = tab.icon;
                  const isActive = consoleTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setConsoleTab(tab.id)}
                      className={`flex-1 min-w-[150px] flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-slate-100 shadow-sm border border-slate-200/50 dark:border-slate-800'
                          : 'text-text-secondary hover:text-text-primary hover:bg-slate-50/50 dark:hover:bg-slate-850/50'
                      }`}
                    >
                      <TabIcon size={14} style={{ color: isActive ? tab.color : '#64748b' }} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {consoleTab === 'mri' && (
                <div className="space-y-6">
                
                {/* PANEL 1: Enhanced Ingestion & Triage */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="medical-card p-5 relative overflow-hidden"
                >
                  {/* Low Confidence Amber Alert Header */}
                  {isUncertain && (
                    <div className="bg-amber-50 border-l-4 border-amber-500 text-amber-900 p-3 rounded-r-lg flex items-start gap-2.5 mb-4 shadow-sm">
                      <AlertTriangle size={18} className="text-amber-600 mt-0.5 flex-shrink-0 animate-bounce" />
                      <div>
                        <h4 className="font-bold text-xs uppercase tracking-wide">⚠ LOW CONFIDENCE PREDICTION — MANDATORY SPECIALIST REVIEW REQUIRED</h4>
                        <p className="text-[11px] text-amber-800 font-semibold mt-0.5">
                          Model classification confidence falls below the clinical safety threshold (85%). Ensure manual verification.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Brain size={16} className="text-medical-500" />
                      <h3 className="card-title">M1/M2: MRI Scan Ingestion & Diagnostic Triage</h3>
                    </div>
                    <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full font-bold text-slate-500">M1 & M2 Alignment</span>
                  </div>

                  {/* Dropzone & ABHA ID Row */}
                  <div className="grid sm:grid-cols-2 gap-4 mb-5">
                    <div>
                      <label className="block text-xs font-bold text-text-secondary mb-1.5">ABHA ID (Digital Health ID)</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={abhaIdInput}
                          onChange={(e) => setAbhaIdInput(e.target.value)}
                          placeholder="XX-XXXX-XXXX-XXXX"
                          className="w-full bg-surface-secondary border border-border rounded-lg pl-3 pr-8 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-medical-500 font-mono"
                        />
                        <Shield size={14} className="absolute right-2.5 top-2.5 text-emerald-500" />
                      </div>
                      <p className="text-[10px] text-text-tertiary mt-1">ABDM Health Repository Gateway verified</p>
                    </div>

                    {/* Dropzone area */}
                    <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-3 flex flex-col items-center justify-center transition-all cursor-pointer text-center ${
                      isDragActive ? 'border-medical-500 bg-medical-50/50' : 'border-border hover:border-medical-400 bg-surface-secondary'
                    }`}>
                      <input {...getInputProps()} />
                      <Upload size={18} className="text-text-tertiary mb-1.5" />
                      {uploadedFile ? (
                        <div className="w-full">
                          <p className="text-[10px] text-text-primary font-bold truncate max-w-[150px] mx-auto">{uploadedFile}</p>
                          <p className="text-[9px] text-emerald-600 font-bold mt-0.5">File registered</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-[10px] text-text-primary font-bold">Drag MRI slice or Click</p>
                          <p className="text-[9px] text-text-tertiary mt-0.5">Supports DICOM / NIfTI files</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pipeline Step loading indicator if loading */}
                  {ingestState === 'loading' && (
                    <div className="bg-slate-50 dark:bg-slate-900 border border-border p-3.5 rounded-lg mb-5 space-y-2.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-text-primary">
                        <span>Running CDSS Preprocessing Pipeline...</span>
                        <span>{ingestProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-medical-500 h-full transition-all duration-100" style={{ width: `${ingestProgress}%` }} />
                      </div>
                      <div className="space-y-1 text-[10px]">
                        {pipelineSteps.map((step, idx) => (
                          <div key={idx} className="flex items-center gap-2 font-medium">
                            {activeStepIndex > idx ? (
                              <CheckCircle2 size={12} className="text-emerald-500 flex-shrink-0" />
                            ) : activeStepIndex === idx ? (
                              <RefreshCw size={12} className="text-medical-500 animate-spin flex-shrink-0" />
                            ) : (
                              <span className="w-2.5 h-2.5 rounded-full border border-border flex-shrink-0" />
                            )}
                            <span className={activeStepIndex === idx ? 'text-medical-600 font-bold' : activeStepIndex > idx ? 'text-emerald-700' : 'text-text-tertiary'}>
                              {step}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Grid for probability chart and brain visualizer toggle */}
                  <div className="grid sm:grid-cols-5 gap-4 items-center">
                    
                    {/* Left Probability bars (3 cols) */}
                    <div className="sm:col-span-3 space-y-2">
                      <h4 className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">4-Class Dementia Probability</h4>
                      {latestScan ? (
                        <ResponsiveContainer width="100%" height={120}>
                          <BarChart data={probabilityData} layout="vertical" margin={{ top: 2, right: 10, left: -25, bottom: 2 }}>
                            <XAxis type="number" domain={[0, 100]} hide />
                            <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 9, fill: '#475569', fontWeight: 600 }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="probability" radius={[0, 4, 4, 0]} barSize={10}>
                              {probabilityData.map((entry, index) => {
                                const colors = ['#22c55e', '#f59e0b', '#f97316', '#dc2626'];
                                return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                              })}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="text-xs text-text-tertiary italic">No active scan profile.</p>
                      )}
                      {latestScan && (
                        <div className="flex items-center justify-between text-[10px] text-text-tertiary pt-1 border-t border-border-light font-medium">
                          <span>Model: {latestScan.modelVersion}</span>
                          <span>Confidence: <strong className={isUncertain ? 'text-amber-600' : 'text-emerald-600'}>{(latestScan.confidence * 100).toFixed(1)}%</strong></span>
                        </div>
                      )}
                    </div>

                    {/* Right MRI Display & Toggle (2 cols) */}
                    <div className="sm:col-span-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">MRI Display</h4>
                        
                        <div className="flex bg-slate-100 p-0.5 rounded-md border border-slate-200">
                          <button
                            onClick={() => setMriViewMode('original')}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all ${
                              mriViewMode === 'original' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            Scan
                          </button>
                          <button
                            onClick={() => setMriViewMode('gradcam')}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all ${
                              mriViewMode === 'gradcam' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            CAM
                          </button>
                        </div>
                      </div>

                      {/* SVG Brain Silhouette */}
                      <div className="relative bg-slate-950 rounded-lg p-1 border border-slate-850 flex items-center justify-center">
                        <svg viewBox="0 0 200 160" className="w-full h-28 text-slate-400">
                          <defs>
                            <radialGradient id="gradcamHippocampal" cx="50%" cy="50%" r="50%">
                              <stop offset="0%" stopColor="#dc2626" stopOpacity="0.9" />
                              <stop offset="40%" stopColor="#ea580c" stopOpacity="0.6" />
                              <stop offset="100%" stopColor="#dc2626" stopOpacity="0" />
                            </radialGradient>
                            <linearGradient id="gradcamCortical" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#eab308" stopOpacity="0.8" />
                              <stop offset="100%" stopColor="#ea580c" stopOpacity="0.1" />
                            </linearGradient>
                          </defs>

                          {/* Grid overlay */}
                          <g stroke="#1a1f2e" strokeWidth="0.5" strokeDasharray="3 3">
                            <line x1="20" y1="0" x2="20" y2="160" />
                            <line x1="60" y1="0" x2="60" y2="160" />
                            <line x1="100" y1="0" x2="100" y2="160" />
                            <line x1="140" y1="0" x2="140" y2="160" />
                            <line x1="180" y1="0" x2="180" y2="160" />
                            <line x1="0" y1="30" x2="200" y2="30" />
                            <line x1="0" y1="70" x2="200" y2="70" />
                            <line x1="0" y1="110" x2="200" y2="110" />
                          </g>

                          {/* Brain Silhouette Path */}
                          <path
                            d="M 100,20 C 130,20 165,30 175,60 C 185,80 180,110 165,120 C 155,125 145,115 135,115 C 125,115 120,135 105,140 C 90,145 85,135 80,130 C 75,135 70,135 65,130 C 55,130 50,120 45,115 C 35,115 25,110 20,95 C 15,80 15,60 35,35 C 55,15 75,20 100,20 Z"
                            fill="none"
                            stroke="#475569"
                            strokeWidth="2.5"
                          />

                          {/* Ventricles Outline */}
                          <path d="M 65,70 C 65,55 115,55 125,75 C 115,70 75,70 65,70 Z" fill="none" stroke="#1e293b" strokeWidth="2" />
                          
                          {/* Cerebellum Outline */}
                          <path d="M 135,115 C 145,115 165,120 165,135 C 165,145 145,145 135,135 Z" fill="none" stroke="#334155" strokeWidth="1.5" />
                          
                          {/* Brainstem Outline */}
                          <path d="M 105,140 L 105,160 M 115,135 L 115,160" stroke="#334155" strokeWidth="2.5" />

                          {/* Grad-CAM overlays */}
                          {mriViewMode === 'gradcam' && (
                            <g>
                              {/* Hippocampal heat spot (glowing red-orange) */}
                              <circle cx="102" cy="85" r="14" fill="url(#gradcamHippocampal)" className="animate-pulse" />
                              <circle cx="102" cy="85" r="5" fill="#dc2626" />
                              
                              {/* Cortical heat spot (glowing yellow) */}
                              <path d="M 50,45 C 60,35 75,25 90,25" fill="none" stroke="url(#gradcamCortical)" strokeWidth="6" strokeLinecap="round" className="animate-pulse" />
                              
                              {/* Visual pointers */}
                              <line x1="102" y1="85" x2="65" y2="105" stroke="#f87171" strokeWidth="0.8" strokeDasharray="2 2" />
                              <text x="50" y="115" fill="#ef4444" fontSize="7" fontWeight="bold">Hippocampus</text>

                              <line x1="75" y1="28" x2="55" y2="48" stroke="#fbbf24" strokeWidth="0.8" strokeDasharray="2 2" />
                              <text x="32" y="58" fill="#f59e0b" fontSize="7" fontWeight="bold">Cortex Attention</text>
                            </g>
                          )}
                        </svg>
                        
                        <div className="absolute bottom-1 right-2 text-[8px] text-text-tertiary font-mono">
                          {mriViewMode === 'original' ? 'Original T1 slice' : 'Saliency Heatmap'}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* PANEL 4: Longitudinal Trajectory Component */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="medical-card p-5"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Activity size={16} className="text-medical-500" />
                      <h3 className="card-title">M5: Multimodal Longitudinal Trajectory Tracker</h3>
                    </div>
                    <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full font-bold text-slate-500">M5 Alignment</span>
                  </div>

                  <div className="h-[210px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={timelineData} margin={{ top: 10, right: -5, left: -20, bottom: 5 }}>
                        <defs>
                          <linearGradient id="colorHippVol" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0d9488" stopOpacity="0.25"/>
                            <stop offset="95%" stopColor="#0d9488" stopOpacity="0"/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="formattedDate" tick={{ fontSize: 10, fill: '#475569', fontWeight: 500 }} />
                        
                        {/* Left Y-axis (MMSE score) */}
                        <YAxis
                          yAxisId="left"
                          domain={[10, 32]}
                          orientation="left"
                          tick={{ fontSize: 10, fill: '#1a5fa8', fontWeight: 600 }}
                          label={{ value: 'MMSE Score (0-30)', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: '#1a5fa8', fontWeight: 600 }, offset: 10 }}
                        />

                        {/* Right Y-axis (Hippocampal Volume) */}
                        <YAxis
                          yAxisId="right"
                          domain={[0, 4.5]}
                          orientation="right"
                          tick={{ fontSize: 10, fill: '#0d9488', fontWeight: 600 }}
                          label={{ value: 'Hippocampal Volume (cc)', angle: 90, position: 'insideRight', style: { fontSize: 10, fill: '#0d9488', fontWeight: 600 }, offset: 10 }}
                        />
                        
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 10 }} formatter={(value) => <span className="text-text-secondary font-medium">{value}</span>} />
                        
                        {/* Hippocampal Area Fill (Right Axis) */}
                        <Area
                          yAxisId="right"
                          type="monotone"
                          dataKey="hippocampalVolume"
                          name="Hippocampal Vol (cc)"
                          fill="url(#colorHippVol)"
                          stroke="#0d9488"
                          strokeWidth={2}
                        />

                        {/* MMSE Line (Left Axis) */}
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="mmse"
                          name="MMSE Score"
                          stroke="#1a5fa8"
                          strokeWidth={2.5}
                          dot={{ r: 5, stroke: '#1a5fa8', strokeWidth: 1.5, fill: '#ffffff' }}
                          activeDot={{ r: 7 }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-[10px] text-text-tertiary mt-2 italic text-center">
                    Composed timeline contrasts neurological tissue atrophy (area) with observable cognitive MMSE decline (line).
                  </p>
                </motion.div>
              </div>
              )}

              {consoleTab === 'risk' && (
                <div className="space-y-6">
                  {/* PANEL 2: MCI Conversion Predictor Widget */}
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                  className="medical-card p-5"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Activity size={16} className="text-medical-500" />
                      <h3 className="card-title">M3: MCI 24-Month Conversion Predictor</h3>
                    </div>
                    <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full font-bold text-slate-500">M3 Alignment</span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 items-center">
                    {/* Gauge container */}
                    <div className="relative flex flex-col items-center justify-center p-4 border border-border-light rounded-xl bg-surface-secondary h-44 overflow-hidden">
                      <svg viewBox="0 0 100 60" className="w-full h-24 text-slate-200">
                        {/* Background Arc */}
                        <path
                          d="M 14 50 A 36 36 0 0 1 86 50"
                          fill="none"
                          stroke="#e2e8f0"
                          strokeWidth="8"
                          strokeLinecap="round"
                        />
                        {/* Active Arc */}
                        {conversionProbability > 0 && (
                          <path
                            d="M 14 50 A 36 36 0 0 1 86 50"
                            fill="none"
                            stroke={conversionProbability > 70 ? '#dc2626' : conversionProbability > 40 ? '#f59e0b' : '#0d9488'}
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray="113.1"
                            strokeDashoffset={113.1 - (conversionProbability / 100) * 113.1}
                            className="transition-all duration-500 ease-out"
                          />
                        )}
                      </svg>
                      
                      {/* Center text overlay */}
                      <div className="absolute top-[48px] flex flex-col items-center text-center">
                        <span className="text-base font-black text-text-primary">{conversionProbability.toFixed(1)}%</span>
                        <span className="text-[8px] text-text-secondary font-bold uppercase tracking-wider">Conversion Risk</span>
                      </div>

                      {/* Bootstrap Confidence Interval Text */}
                      <div className="text-[9.5px] text-text-secondary font-bold font-mono mt-1 bg-white dark:bg-slate-900 border border-slate-200/50 px-2 py-0.5 rounded shadow-xs">
                        {ciText}
                      </div>
                    </div>

                    {/* SHAP Waterfall weights list */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <h4 className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Top 5 Feature SHAP Weights</h4>
                        <span title="Positive features increase risk (Critical Red), negative features protect (Clinical Green)" className="text-text-tertiary cursor-help flex items-center">
                          <Info size={11} />
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {shapWeights.map((w, idx) => (
                          <div key={idx} className="text-[10px] space-y-0.5">
                            <div className="flex items-center justify-between font-semibold text-text-primary">
                              <span>{w.name}</span>
                              <span className={w.weight > 0 ? 'text-critical-600' : 'text-emerald-600'}>
                                {w.weight > 0 ? `+${w.weight}%` : `${w.weight}%`}
                              </span>
                            </div>
                            
                            {/* Centered zero line bar representation */}
                            <div className="w-full h-2 bg-slate-100 rounded-full relative overflow-hidden flex items-center">
                              <div className="absolute left-1/2 w-0.5 h-full bg-slate-300 z-10" />
                              {w.weight > 0 ? (
                                <div
                                  className="h-full bg-critical-500 absolute left-1/2 rounded-r-full"
                                  style={{ width: `${Math.min(w.weight * 2.5, 50)}%` }}
                                />
                              ) : (
                                <div
                                  className="h-full bg-emerald-500 absolute right-1/2 rounded-l-full"
                                  style={{ width: `${Math.min(Math.abs(w.weight) * 2.5, 50)}%` }}
                                />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
              )}

              {consoleTab === 'brainage' && (
                <div className="space-y-6">
                  {/* PANEL 3: Brain Age Gap Tracker */}
                  <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="medical-card p-5"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-medical-500" />
                      <h3 className="card-title">M4: Structural Brain Age Gap Tracker</h3>
                    </div>
                    <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full font-bold text-slate-500">M4 Alignment</span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 border border-border-light rounded-xl p-3.5 bg-surface-secondary text-center items-center mb-4">
                    <div className="space-y-1">
                      <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">Chronological Age</p>
                      <p className="text-xl font-extrabold text-text-primary">{chronologicalAge} yrs</p>
                    </div>
                    
                    <div className="border-x border-border/60 space-y-1">
                      <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">Brain Age Gap</p>
                      <p className={`text-xl font-extrabold ${brainAgeGap >= 5 ? 'text-critical-600' : brainAgeGap >= 2 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {brainAgeGap > 0 ? `+${brainAgeGap.toFixed(1)}` : brainAgeGap.toFixed(1)} yrs
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">Predicted Brain Age</p>
                      <p className="text-xl font-extrabold text-text-primary">{predictedBrainAge} yrs</p>
                    </div>
                  </div>

                  {/* Conditional warning box */}
                  <div className={`border p-3 rounded-lg text-xs leading-relaxed ${brainAgeStyle.colorClass}`}>
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      <AlertCircle size={14} />
                      <span>{brainAgeStyle.label}</span>
                    </div>
                    <p className="text-[11px] font-medium">{brainAgeStyle.desc}</p>
                  </div>

                  {/* Visual Gap Meter Slider */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center justify-between text-[9px] text-text-tertiary font-bold">
                      <span>STABLE (-5yr to +2yr)</span>
                      <span>ELEVATED (+2yr to +5yr)</span>
                      <span>ACCELERATED (+5yr to +15yr)</span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-critical-500 relative flex items-center shadow-inner">
                      {/* Positioning Dot based on gap scale from -5 to +15 (range of 20) */}
                      <div
                        className="absolute w-4 h-4 rounded-full bg-white border-2 border-slate-950 shadow-md transform -translate-x-1/2 -translate-y-[0px] flex items-center justify-center cursor-pointer"
                        style={{ left: `${Math.max(0, Math.min(100, ((brainAgeGap + 5) / 20) * 100))}%` }}
                        title={`Gap: +${brainAgeGap.toFixed(1)} yrs`}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
              )}

              {consoleTab === 'recommendations' && (
                <div className="space-y-6">
                  {/* PANEL 5: Clinical Action & Tabbed Ablation Engine */}
                  <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="medical-card p-5"
                >
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="flex items-center gap-2">
                      <Shield size={16} className="text-medical-500" />
                      <h3 className="card-title">Clinical Recommendations & Model Ablation</h3>
                    </div>
                    <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full font-bold text-slate-500">Action & Ablation</span>
                  </div>

                  {/* Recommendation Box */}
                  <div className="bg-medical-50 dark:bg-slate-900/40 border border-medical-200 dark:border-medical-900/30 rounded-lg p-3.5 mb-4 shadow-sm relative">
                    <h4 className="text-[10px] font-bold text-medical-800 dark:text-medical-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Zap size={13} className="text-medical-600 animate-pulse" />
                      CDSS Automated Action Path
                    </h4>
                    <p className="text-xs font-semibold text-text-primary leading-relaxed mb-3">
                      {clinicalRecommendation}
                    </p>
                    
                    {/* Connect Generate PDF Clinical Report Button */}
                    <button
                      onClick={() => window.print()}
                      className="flex items-center gap-1.5 bg-medical-600 hover:bg-medical-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow transition-colors cursor-pointer"
                    >
                      <Printer size={13} />
                      Generate PDF Clinical Report
                    </button>
                  </div>

                  {/* Ablation tabs sub-panel */}
                  <div className="space-y-3">
                    <div className="flex border-b border-border">
                      {(['clinical', 'imaging', 'multimodal'] as const).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveAblationTab(tab)}
                          className={`flex-1 pb-2 text-[10px] font-extrabold uppercase tracking-wider text-center border-b-2 transition-all ${
                            activeAblationTab === tab
                              ? 'border-medical-500 text-medical-600'
                              : 'border-transparent text-text-tertiary hover:text-text-secondary'
                          }`}
                        >
                          {tab === 'clinical' ? 'Clinical-Only' : tab === 'imaging' ? 'Imaging-Only' : 'Full Multimodal'}
                        </button>
                      ))}
                    </div>

                    {/* Ablation comparison details */}
                    <div className="bg-surface-secondary border border-border-light rounded-lg p-3 space-y-2">
                      {activeAblationTab === 'clinical' && (
                        <div className="text-[11px] space-y-2">
                          <div className="flex justify-between items-center border-b border-border-light pb-1.5">
                            <span className="font-bold text-text-secondary">Input Matrix Features</span>
                            <span className="text-text-primary font-semibold">MMSE, CDR-SB, APOE4 status, Family Hist, Demographics</span>
                          </div>
                          <div className="flex justify-between items-center border-b border-border-light pb-1.5">
                            <span className="font-bold text-text-secondary">Model AUROC</span>
                            <span className="text-text-primary font-extrabold">0.812 (95% CI: [0.791 - 0.833])</span>
                          </div>
                          <div className="flex justify-between items-center border-b border-border-light pb-1.5">
                            <span className="font-bold text-text-secondary">Inference Latency</span>
                            <span className="text-emerald-600 font-extrabold">&lt; 0.1 sec</span>
                          </div>
                          <p className="text-[10px] text-text-tertiary leading-normal italic">
                            Summary: Accessible, low-cost baseline screening. Subject to practitioner evaluation differences and patient cognitive test compliance.
                          </p>
                        </div>
                      )}

                      {activeAblationTab === 'imaging' && (
                        <div className="text-[11px] space-y-2">
                          <div className="flex justify-between items-center border-b border-border-light pb-1.5">
                            <span className="font-bold text-text-secondary">Input Matrix Features</span>
                            <span className="text-text-primary font-semibold">T1 MRI (Hippocampal/Entorhinal Thickness & Ventricular Volume)</span>
                          </div>
                          <div className="flex justify-between items-center border-b border-border-light pb-1.5">
                            <span className="font-bold text-text-secondary">Model AUROC</span>
                            <span className="text-text-primary font-extrabold">0.875 (95% CI: [0.852 - 0.898])</span>
                          </div>
                          <div className="flex justify-between items-center border-b border-border-light pb-1.5">
                            <span className="font-bold text-text-secondary">Inference Latency</span>
                            <span className="text-text-primary font-semibold">~3.5 sec (GPU Batch)</span>
                          </div>
                          <p className="text-[10px] text-text-tertiary leading-normal italic">
                            Summary: Highly objective anatomical biomarker. Captures early cortical thinning prior to measurable cognitive scale declination.
                          </p>
                        </div>
                      )}

                      {activeAblationTab === 'multimodal' && (
                        <div className="text-[11px] space-y-2">
                          <div className="flex justify-between items-center border-b border-border-light pb-1.5">
                            <span className="font-bold text-text-secondary">Input Matrix Features</span>
                            <span className="text-medical-600 font-extrabold">Combined Clinical Scores + Cognitive Scales + MRI Volumetrics</span>
                          </div>
                          <div className="flex justify-between items-center border-b border-border-light pb-1.5">
                            <span className="font-bold text-text-secondary">Model AUROC (Full Matrix)</span>
                            <span className="text-medical-600 font-extrabold">0.948 (95% CI: [0.931 - 0.965])</span>
                          </div>
                          <div className="flex justify-between items-center border-b border-border-light pb-1.5">
                            <span className="font-bold text-text-secondary">Inference Latency</span>
                            <span className="text-text-primary font-semibold">~4.2 sec (Full Pipeline)</span>
                          </div>
                          <p className="text-[10px] text-text-tertiary leading-normal italic">
                            Summary: State-of-the-art predictive CDSS. Cross-attention layers fuse morphological MRI features with MMSE scores to eliminate false positives.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
              )}

            </div>
          ) : (
            /* Original Clinic-Wide Overview View */
            <div className="space-y-6">
              {/* Charts Row 1 */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Disease Distribution */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="medical-card p-5"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <PieIcon size={16} className="text-medical-500" />
                    <h3 className="card-title">Disease Distribution</h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <ResponsiveContainer width="60%" height={200}>
                      <RePieChart>
                        <Pie
                          data={diseaseDist}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {diseaseDist.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getDiseaseColor(entry.name)} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </RePieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2">
                      {diseaseDist.map((d) => (
                        <div key={d.name} className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getDiseaseColor(d.name) }} />
                          <span className="text-xs text-text-secondary">{d.name}</span>
                          <span className="text-xs font-semibold text-text-primary ml-auto">{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Risk Distribution */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="medical-card p-5"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 size={16} className="text-medical-500" />
                    <h3 className="card-title">Risk Distribution</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={riskDist}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#475569' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#475569' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={40}>
                        {riskDist.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>
              </div>

              {/* Charts Row 2 */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Monthly Analysis Trend */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="medical-card p-5"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Activity size={16} className="text-medical-500" />
                    <h3 className="card-title">Monthly Analysis Trend</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#475569' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#475569' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="scans"
                        stroke="#1a5fa8"
                        fill="#1a5fa8"
                        fillOpacity={0.1}
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="predictions"
                        stroke="#0d9488"
                        fill="#0d9488"
                        fillOpacity={0.1}
                        strokeWidth={2}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: 11 }}
                        formatter={(value) => <span className="text-text-secondary">{value}</span>}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </motion.div>

                {/* Conversion Risk Trend */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="medical-card p-5"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 size={16} className="text-medical-500" />
                    <h3 className="card-title">Conversion Risk Trend</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={conversionRiskTrends} barGap={2}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#475569' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#475569' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="low" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="veryMild" stackId="a" fill="#f59e0b" />
                      <Bar dataKey="mild" stackId="a" fill="#f97316" />
                      <Bar dataKey="moderate" stackId="a" fill="#dc2626" radius={[4, 4, 0, 0]} />
                      <Legend
                        wrapperStyle={{ fontSize: 10 }}
                        formatter={(value) => <span className="text-text-secondary">{value}</span>}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>
              </div>
            </div>
          )}
        </div>

        {/* Right Insights Panel */}
        <div className="hidden xl:block">
          <InsightsPanel />
        </div>
      </div>

      {/* PRINT-OPTIMIZED REPORT EXPORTER LAYER (Visible ONLY when printing) */}
      <div className="hidden print:block bg-white text-slate-900 p-8 font-sans text-xs min-h-screen">
        
        {/* Report Header block */}
        <div className="border-b-2 border-slate-900 pb-3.5 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-base font-extrabold uppercase tracking-tight">NeuroScan AI CDSS Report</h1>
              <p className="text-[10px] text-slate-500">Clinical Decision Support System • High-Dimensional Biomarkers</p>
            </div>
            <div className="text-right text-[10px]">
              <p className="font-bold">DATE: {new Date().toLocaleDateString('en-US')}</p>
              <p className="text-slate-500">System Version: NeuroScan-v2.4.1</p>
            </div>
          </div>
          
          {/* Permanent bold red disclaimer warning if Uncertainty Gate is triggered */}
          {isUncertain ? (
            <div className="mt-4 bg-red-50 border-2 border-red-600 text-red-950 p-2.5 text-center rounded font-black text-xs uppercase">
              MANDATORY SPECIALIST REVIEW REQ — LOW CONFIDENCE INFERENCE
            </div>
          ) : (
            <div className="mt-4 bg-slate-50 border border-slate-350 text-slate-800 p-2 text-center rounded font-bold text-[10px] uppercase">
              Clinical decision verification complete — Prediction metrics verified
            </div>
          )}
        </div>

        {/* Demographic Metadata Grid */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 border border-slate-300 p-4 rounded-lg bg-slate-50/50 mb-6 font-semibold">
          <p>Patient ID: <span className="font-mono font-bold text-slate-900">{activePatient.id}</span></p>
          <p>ABHA ID: <span className="font-mono font-bold text-slate-900">{abhaIdInput}</span></p>
          <p>Triage Diagnosis: <span className="font-bold text-slate-900">{activePatient.diagnosis}</span></p>
          <p>Age / Gender: <span className="font-bold text-slate-900">{activePatient.age} yrs / {activePatient.gender}</span></p>
          <p>Clinical Status: <span className="font-bold text-slate-900">{activePatient.status.toUpperCase()}</span></p>
          <p>Scan Assessment Date: <span className="font-bold text-slate-900">{latestScan ? latestScan.date : 'N/A'}</span></p>
        </div>

        {/* Diagnostic Triage & GradCAM Saliency */}
        <div className="grid grid-cols-3 gap-6 mb-6 pb-6 border-b border-slate-200">
          <div className="col-span-2 space-y-2.5">
            <h2 className="text-xs font-bold border-b border-slate-400 pb-1 uppercase tracking-wide">1. Classifier & Preprocessing Details</h2>
            <p className="text-[11px] leading-relaxed text-slate-600">
              Anatomical T1-weighted MRI structural scan parsed via the NeuroScan-v2.0-EfficientNetB3 pipeline. Preprocessing pipelines skull stripping, N4 bias field correction, MNI-152 space normalization, and multi-class volumetric segmentations completed successfully.
            </p>
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-slate-800">4-Class Dementia Probability Breakdown:</p>
              {probabilityData.map((d, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <span className="text-slate-600">{d.name}</span>
                  <span className="font-bold text-slate-900">{d.probability.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Saliency print placeholder brain outline */}
          <div className="border border-slate-300 p-2.5 rounded flex flex-col items-center justify-center text-center">
            <p className="text-[9px] font-bold text-slate-500 uppercase mb-2">Grad-CAM ROI Overlay</p>
            <svg viewBox="0 0 200 160" className="w-28 h-20 stroke-slate-950 fill-none">
              <path d="M 100,20 C 130,20 165,30 175,60 C 185,80 180,110 165,120 C 155,125 145,115 135,115 C 125,115 120,135 105,140 C 90,145 85,135 80,130 C 75,135 70,135 65,130 C 55,130 50,120 45,115 C 35,115 25,110 20,95 C 15,80 15,60 35,35 C 55,15 75,20 100,20 Z" strokeWidth="1.5" />
              <circle cx="102" cy="85" r="14" fill="#000000" fillOpacity="0.15" stroke="#000000" strokeWidth="1" strokeDasharray="2 2" />
              <text x="102" y="88" fill="#000000" fontSize="8" fontWeight="bold" textAnchor="middle">CAM</text>
            </svg>
            <p className="text-[7px] text-slate-500 mt-2">Hippocampal attention active</p>
          </div>
        </div>

        {/* MCI Predictor & Brain Age calculations */}
        <div className="grid grid-cols-2 gap-6 mb-6 pb-6 border-b border-slate-200">
          <div className="border border-slate-300 p-3.5 rounded-lg bg-slate-50/50">
            <h2 className="text-xs font-bold border-b border-slate-400 pb-1 uppercase tracking-wide mb-2">2. MCI Conversion Prediction Matrix</h2>
            <div className="flex justify-between items-center text-xs font-bold mb-1">
              <span className="text-slate-600">24-Month Risk Score:</span>
              <span className="text-sm font-extrabold text-slate-900">{conversionProbability.toFixed(1)}%</span>
            </div>
            <p className="text-xs font-mono font-bold text-slate-700 mb-3">{ciText}</p>
            
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Primary SHAP Feature Weights:</p>
            <table className="w-full text-[10px] text-left">
              <thead>
                <tr className="border-b border-slate-300 text-slate-500 font-bold">
                  <th className="py-0.5">Feature</th>
                  <th className="py-0.5 text-right">Contribution</th>
                </tr>
              </thead>
              <tbody>
                {shapWeights.map((w, idx) => (
                  <tr key={idx} className="border-b border-slate-100 text-slate-700">
                    <td className="py-0.5">{w.name}</td>
                    <td className="py-0.5 text-right font-bold">
                      {w.weight > 0 ? `+${w.weight}%` : `${w.weight}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border border-slate-300 p-3.5 rounded-lg flex flex-col justify-between bg-slate-50/50">
            <div>
              <h2 className="text-xs font-bold border-b border-slate-400 pb-1 uppercase tracking-wide mb-2.5">3. Brain Age Tracker Biomarker</h2>
              <div className="space-y-2 text-xs text-slate-700">
                <div className="flex justify-between">
                  <span>Chronological Patient Age:</span>
                  <span className="font-bold text-slate-900">{chronologicalAge} yrs</span>
                </div>
                <div className="flex justify-between">
                  <span>Predicted Morphological Brain Age:</span>
                  <span className="font-bold text-slate-900">{predictedBrainAge} yrs</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 font-extrabold text-slate-900">
                  <span>Structural Brain Age Gap:</span>
                  <span>{brainAgeGap > 0 ? `+${brainAgeGap.toFixed(1)}` : brainAgeGap.toFixed(1)} yrs</span>
                </div>
              </div>
            </div>

            <div className="p-2 bg-white rounded border border-slate-200 text-[10px] mt-4 leading-relaxed text-slate-600">
              <p className="font-bold text-slate-800">Biomarker Interpretation:</p>
              <p>{brainAgeStyle.desc}</p>
            </div>
          </div>
        </div>

        {/* Clinical Action Recommendation Box */}
        <div className="border-2 border-slate-400 p-4 rounded-lg bg-slate-50 mb-12">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">4. Clinical Recommendations & Directives</h2>
          <p className="text-xs font-semibold leading-relaxed text-slate-950">
            {clinicalRecommendation}
          </p>
        </div>

        {/* Regulatory disclaimer in footer */}
        <div className="border-t border-slate-300 pt-4 text-center text-[9px] text-slate-400 font-mono">
          FOR RESEARCH USE ONLY. NOT FOR CLINICAL DIAGNOSIS. Powered by NeuroScan AI v2.
        </div>
      </div>

      {/* DEVELOPER SCENARIO OVERRIDE DRAWER (Lives only on dashboard screen) */}
      <div className="print:hidden">
        {/* Toggle Gear button */}
        <button
          onClick={() => setIsDemoDrawerOpen(!isDemoDrawerOpen)}
          className="fixed bottom-6 right-6 z-50 p-3 bg-slate-900 hover:bg-slate-800 text-white rounded-full shadow-lg cursor-pointer transition-transform hover:scale-105 border border-slate-800"
          title="Demo Controller Console"
        >
          <Settings size={20} className={isDemoDrawerOpen ? 'rotate-90 transition-transform' : 'transition-transform'} />
        </button>

        <AnimatePresence>
          {isDemoDrawerOpen && (
            <>
              {/* Overlay Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsDemoDrawerOpen(false)}
                className="fixed inset-0 bg-black z-40"
              />

              {/* Slide-over drawer panel */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed right-0 top-0 bottom-0 w-80 bg-slate-950 text-white z-50 p-6 shadow-2xl border-l border-slate-800 flex flex-col justify-between"
              >
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                      <Zap size={14} />
                      Demo Control Center
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Seed specific clinical scenarios directly into the Zustand patient store instantly.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Scenario A button */}
                    <button
                      onClick={() => handleSeedScenario('A')}
                      className="w-full text-left p-3.5 bg-slate-900 hover:bg-slate-850 rounded-xl border border-slate-800 hover:border-red-900 transition-all group cursor-pointer"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-red-400">Scenario A</span>
                        <span className="text-[9px] bg-red-950/50 text-red-400 border border-red-900/30 px-1.5 py-0.2 rounded font-mono font-bold">Uncertainty Alert</span>
                      </div>
                      <p className="text-xs font-bold">High-Risk MCI Converter</p>
                      <p className="text-[10px] text-slate-450 mt-1 leading-normal">
                        Seeds a 93.5% risk, a +8.8 yr Brain Age Gap, cognitive MMSE decay, and triggers the Low Confidence alert banner.
                      </p>
                    </button>

                    {/* Scenario B button */}
                    <button
                      onClick={() => handleSeedScenario('B')}
                      className="w-full text-left p-3.5 bg-slate-900 hover:bg-slate-850 rounded-xl border border-slate-800 hover:border-emerald-900 transition-all group cursor-pointer"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-emerald-400">Scenario B</span>
                        <span className="text-[9px] bg-emerald-950/50 text-emerald-400 border border-emerald-900/30 px-1.5 py-0.2 rounded font-mono font-bold">Stable Bounds</span>
                      </div>
                      <p className="text-xs font-bold">Stable MCI Profile</p>
                      <p className="text-[10px] text-slate-450 mt-1 leading-normal">
                        Seeds an 18.2% risk, flat longitudinal tracks, and a minimal 0.5 yr Brain Age Gap with verified status.
                      </p>
                    </button>

                    {/* Scenario C button */}
                    <button
                      onClick={() => handleSeedScenario('C')}
                      className="w-full text-left p-3.5 bg-slate-900 hover:bg-slate-850 rounded-xl border border-slate-800 hover:border-blue-900 transition-all group cursor-pointer"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-blue-400">Scenario C</span>
                        <span className="text-[9px] bg-blue-950/50 text-blue-400 border border-blue-900/30 px-1.5 py-0.2 rounded font-mono font-bold">Precision</span>
                      </div>
                      <p className="text-xs font-bold">Moderate Dementia Standard</p>
                      <p className="text-[10px] text-slate-450 mt-1 leading-normal">
                        Seeds a 99.8% confidence Moderate Dementia curve to showcase baseline precision.
                      </p>
                    </button>
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-4 flex flex-col gap-2">
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                    <span>Subject ID: {activePatient.id}</span>
                    <span>Status: Active</span>
                  </div>
                  <button
                    onClick={() => setIsDemoDrawerOpen(false)}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-2 rounded-lg transition-colors cursor-pointer"
                  >
                    Close Demo Panel
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
