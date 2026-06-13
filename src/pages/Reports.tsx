import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, Download, Printer, FileSpreadsheet,
  Brain, Activity, Clock, User, Shield, ChevronRight,
} from 'lucide-react';
import { usePatientStore } from '@/store/patientStore';
import { RiskBadge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';

export function Reports() {
  const { patients } = usePatientStore();
  const [selectedPatient, setSelectedPatient] = useState(patients[0]);
  const [reportType, setReportType] = useState<'analysis' | 'prediction' | 'longitudinal' | 'combined'>('combined');

  if (!selectedPatient) return null;

  const latestScan = selectedPatient.mriScans[selectedPatient.mriScans.length - 1];
  const latestAssessment = selectedPatient.assessments[selectedPatient.assessments.length - 1];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold text-text-primary">Report Generation</h1>
        <p className="text-sm text-text-secondary mt-1">Generate enterprise-grade clinical reports with AI findings</p>
      </motion.div>

      <div className="grid lg:grid-cols-[300px_1fr] gap-6">
        {/* Left Panel - Patient Selection & Report Config */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          {/* Patient Select */}
          <div className="medical-card p-4">
            <h3 className="text-sm font-semibold mb-3">Select Patient</h3>
            <select
              value={selectedPatient.id}
              onChange={(e) => setSelectedPatient(patients.find(p => p.id === e.target.value) || patients[0])}
              className="input-field"
            >
              {patients.slice(0, 20).map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.patientId})</option>
              ))}
            </select>
          </div>

          {/* Report Type */}
          <div className="medical-card p-4">
            <h3 className="text-sm font-semibold mb-3">Report Type</h3>
            <div className="space-y-2">
              {([
                { id: 'analysis' as const, label: 'MRI Analysis', icon: Brain },
                { id: 'prediction' as const, label: 'Risk Prediction', icon: Activity },
                { id: 'longitudinal' as const, label: 'Longitudinal', icon: Clock },
                { id: 'combined' as const, label: 'Full Clinical', icon: FileText },
              ]).map(type => (
                <button
                  key={type.id}
                  onClick={() => setReportType(type.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-xs font-semibold transition-colors ${reportType === type.id
                      ? 'bg-medical-500 text-white'
                      : 'bg-gray-50 text-text-secondary hover:bg-gray-100'
                    }`}
                >
                  <type.icon size={16} />
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="medical-card p-4 space-y-2">
            <button className="btn-primary w-full justify-center">
              <Download size={16} /> Export PDF
            </button>
            <button className="btn-secondary w-full justify-center">
              <FileSpreadsheet size={16} /> Export CSV
            </button>
            <button className="btn-ghost w-full justify-center">
              <Printer size={16} /> Print
            </button>
          </div>
        </motion.div>

        {/* Report Preview */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="medical-card overflow-hidden"
        >
          {/* Report Header */}
          <div className="p-8 border-b border-border bg-gradient-to-r from-medical-50 to-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-text-primary">Neurological Assessment Report</h2>
                <p className="text-sm text-text-secondary">Generated on {formatDate(new Date().toISOString())}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-medical-600 flex items-center justify-center">
                <Brain size={24} className="text-white" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-medical-600 bg-medical-50 px-3 py-1.5 rounded-full inline-flex">
              <Shield size={12} />
              <span className="font-semibold">AI-Assisted Clinical Decision Support · Not for autonomous diagnosis</span>
            </div>
          </div>

          {/* Report Content */}
          <div className="p-8 space-y-8">
            {/* Patient Info */}
            <section>
              <h3 className="card-title flex items-center gap-2 mb-4">
                <User size={16} className="text-medical-500" />
                Patient Information
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Name', value: selectedPatient.name },
                  { label: 'Patient ID', value: selectedPatient.patientId },
                  { label: 'Age / Gender', value: `${selectedPatient.age} years / ${selectedPatient.gender}` },
                  { label: 'Risk Category', value: selectedPatient.riskCategory },
                ].map(info => (
                  <div key={info.label}>
                    <p className="text-xs text-text-tertiary">{info.label}</p>
                    <p className="text-sm font-semibold text-text-primary mt-0.5">{info.value}</p>
                  </div>
                ))}
              </div>
            </section>

            <div className="divider" />

            {/* MRI Findings */}
            {latestScan && (
              <section>
                <h3 className="card-title flex items-center gap-2 mb-4">
                  <Brain size={16} className="text-medical-500" />
                  MRI Findings
                </h3>
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-text-primary">Classification</p>
                      <p className="text-xs text-text-secondary">{latestScan.modality} · {formatDate(latestScan.date)}</p>
                    </div>
                    <div className="text-right">
                      <RiskBadge category={selectedPatient.riskCategory} />
                      <p className="text-xs text-text-tertiary mt-1">Model: {latestScan.modelVersion}</p>
                    </div>
                  </div>
                  <ul className="space-y-1">
                    {latestScan.findings.map((f, i) => (
                      <li key={i} className="text-xs text-text-secondary flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full bg-medical-400 mt-1.5 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )}

            <div className="divider" />

            {/* Brain Age */}
            <section>
              <h3 className="card-title flex items-center gap-2 mb-4">
                <Clock size={16} className="text-medical-500" />
                Brain Age Analysis
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Chronological Age', value: `${selectedPatient.age} years` },
                  { label: 'Brain Age Gap', value: `${selectedPatient.brainAgeGap > 0 ? '+' : ''}${selectedPatient.brainAgeGap} years`, color: selectedPatient.brainAgeGap > 5 ? 'text-red-600' : 'text-amber-600' },
                  { label: 'NeuroScore™', value: `${Math.max(0, 100 - Math.abs(selectedPatient.brainAgeGap) * 5)}/100` },
                ].map(item => (
                  <div key={item.label} className="p-3 rounded-xl bg-gray-50">
                    <p className="text-xs text-text-tertiary">{item.label}</p>
                    <p className={`text-sm font-bold text-text-primary mt-1 ${item.color || ''}`}>{item.value}</p>
                  </div>
                ))}
              </div>
            </section>

            <div className="divider" />

            {/* MCI Prediction */}
            {latestAssessment && (
              <section>
                <h3 className="card-title flex items-center gap-2 mb-4">
                  <Activity size={16} className="text-medical-500" />
                  MCI Conversion Prediction
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {[
                    { label: 'Conversion Risk', value: `${(latestAssessment.conversionProbability * 100).toFixed(1)}%` },
                    { label: 'Confidence', value: `${(latestAssessment.confidence * 100).toFixed(1)}%` },
                    { label: 'MMSE', value: latestAssessment.mmse.toString() },
                    { label: 'CDR', value: latestAssessment.cdr.toString() },
                  ].map(item => (
                    <div key={item.label} className="p-3 rounded-xl bg-gray-50">
                      <p className="text-xs text-text-tertiary">{item.label}</p>
                      <p className="text-sm font-bold text-text-primary mt-1">{item.value}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">{latestAssessment.recommendation}</p>
              </section>
            )}

            <div className="divider" />

            {/* Recommendations */}
            {latestScan && (
              <section>
                <h3 className="card-title mb-4">Clinical Recommendations</h3>
                <ul className="space-y-2">
                  {latestScan.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                      <ChevronRight size={14} className="text-medical-400 mt-0.5 flex-shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Disclaimer */}
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
              <p className="text-xs text-amber-800 font-medium">
                Medical Disclaimer: This report is generated by an AI-assisted Clinical Decision Support System (CDSS).
                All findings should be reviewed by a qualified healthcare professional. This is not a substitute for
                professional medical judgment. NeuroScan AI 2.0 is an assistive tool and does not provide autonomous diagnoses.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
