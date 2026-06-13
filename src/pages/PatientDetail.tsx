import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, User, Brain, Activity, TrendingUp, FileText, Shield,
  Calendar, Phone, MapPin, Download, Mail,
} from 'lucide-react';
import { usePatientStore } from '@/store/patientStore';
import { RiskBadge, StatusBadge, Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const tabs = [
  { id: 'overview', label: 'Overview', icon: User },
  { id: 'mri', label: 'MRI History', icon: Brain },
  { id: 'risk', label: 'Risk Assessments', icon: Activity },
  { id: 'longitudinal', label: 'Progression', icon: TrendingUp },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'audit', label: 'Audit History', icon: Shield },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-border rounded-xl p-3 shadow-lg text-xs">
        <p className="font-semibold text-text-primary mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }} className="font-medium">{p.name}: {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

export function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { patients, getPatientById } = usePatientStore();
  const [activeTab, setActiveTab] = useState('overview');

  const patient = getPatientById(id || '');

  if (!patient) {
    return (
      <div className="text-center py-20">
        <p className="text-text-secondary">Patient not found</p>
        <button onClick={() => navigate('/dashboard/patients')} className="btn-primary mt-4">
          Back to Patients
        </button>
      </div>
    );
  }

  const sortedLongitudinal = [...patient.longitudinalData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Back Button & Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <button
          onClick={() => navigate('/dashboard/patients')}
          className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary mb-3"
        >
          <ArrowLeft size={16} /> Back to Patients
        </button>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-medical-100 flex items-center justify-center">
              <span className="text-xl font-bold text-medical-600">
                {patient.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-text-primary">{patient.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-text-secondary">{patient.patientId}</span>
                <span className="text-text-tertiary">·</span>
                <StatusBadge status={patient.status} />
                <span className="text-text-tertiary">·</span>
                <RiskBadge category={patient.riskCategory} />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary"><Download size={16} /> Export</button>
          </div>
        </div>
      </motion.div>

      {/* Demo Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Age / Gender', value: `${patient.age} yrs / ${patient.gender}` },
          { label: 'Diagnosis', value: patient.diagnosis },
          { label: 'Brain Age Gap', value: `${patient.brainAgeGap > 0 ? '+' : ''}${patient.brainAgeGap} yrs` },
          { label: 'Total Scans', value: patient.totalScans.toString() },
        ].map((info, i) => (
          <motion.div
            key={info.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="medical-card p-3"
          >
            <p className="text-xs text-text-secondary">{info.label}</p>
            <p className="text-sm font-bold text-text-primary mt-1">{info.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-0 -mb-px">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab flex items-center gap-2 ${
                activeTab === tab.id ? 'active' : ''
              }`}
            >
              <tab.icon size={14} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-[400px]"
      >
        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="medical-card p-6">
              <h3 className="card-title mb-4">Patient Information</h3>
              <div className="space-y-3">
                {[
                  { icon: User, label: 'Full Name', value: patient.name },
                  { icon: Calendar, label: 'Date of Birth', value: formatDate(patient.dateOfBirth) },
                  { icon: Phone, label: 'Contact', value: '+91 98765 43210' },
                  { icon: Mail, label: 'Email', value: `${patient.name.toLowerCase().replace(' ', '.')}@email.com` },
                  { icon: MapPin, label: 'Location', value: 'New Delhi, India' },
                ].map((info, i) => (
                  <div key={info.label} className="flex items-center gap-3">
                    <info.icon size={16} className="text-text-tertiary" />
                    <div className="flex-1">
                      <p className="text-xs text-text-secondary">{info.label}</p>
                      <p className="text-sm font-medium text-text-primary">{info.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="medical-card p-6">
              <h3 className="card-title mb-4">Recent Scans</h3>
              <div className="space-y-3">
                {patient.mriScans.slice(-5).reverse().map(scan => (
                  <div key={scan.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-text-primary">{scan.modality} MRI</p>
                      <p className="text-xs text-text-tertiary">{formatDate(scan.date)}</p>
                    </div>
                    <Badge variant={
                      scan.classification === 'Non Demented' ? 'green' :
                      scan.classification === 'Very Mild Demented' ? 'yellow' :
                      scan.classification === 'Mild Demented' ? 'orange' : 'red'
                    }>
                      {scan.classification}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MRI History */}
        {activeTab === 'mri' && (
          <div className="medical-card p-6">
            <h3 className="card-title mb-4">MRI Scan History</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-xs font-semibold text-text-secondary">Date</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-text-secondary">Modality</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-text-secondary">Classification</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-text-secondary">Confidence</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-text-secondary">Model</th>
                  </tr>
                </thead>
                <tbody>
                  {patient.mriScans.slice().reverse().map(scan => (
                    <tr key={scan.id} className="border-b border-border-light">
                      <td className="py-2.5 px-3 text-sm text-text-secondary">{formatDate(scan.date)}</td>
                      <td className="py-2.5 px-3 text-sm font-medium text-text-primary">{scan.modality}</td>
                      <td className="py-2.5 px-3">
                        <Badge variant={
                          scan.classification === 'Non Demented' ? 'green' :
                          scan.classification === 'Very Mild Demented' ? 'yellow' :
                          scan.classification === 'Mild Demented' ? 'orange' : 'red'
                        }>
                          {scan.classification}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-sm font-semibold text-text-primary">
                        {(scan.confidence * 100).toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-3 text-xs text-text-tertiary font-mono">{scan.modelVersion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Risk Assessments */}
        {activeTab === 'risk' && (
          <div className="grid lg:grid-cols-2 gap-6">
            {patient.assessments.slice().reverse().map(ra => (
              <div key={ra.id} className="medical-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-text-secondary">{formatDate(ra.date)}</span>
                  <RiskBadge category={ra.riskCategory} />
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { label: 'Conversion Risk', value: `${(ra.conversionProbability * 100).toFixed(0)}%` },
                    { label: 'Confidence', value: `${(ra.confidence * 100).toFixed(0)}%` },
                    { label: 'MMSE', value: ra.mmse.toString() },
                    { label: 'CDR', value: ra.cdr.toString() },
                    { label: 'APOE4', value: ra.apoe4 },
                    { label: 'Education', value: `${ra.educationYears}yrs` },
                  ].map(item => (
                    <div key={item.label}>
                      <p className="text-[10px] text-text-tertiary">{item.label}</p>
                      <p className="text-sm font-bold text-text-primary">{item.value}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">{ra.recommendation}</p>
              </div>
            ))}
          </div>
        )}

        {/* Longitudinal */}
        {activeTab === 'longitudinal' && (
          <div className="space-y-6">
            <div className="medical-card p-6">
              <h3 className="card-title mb-4">MMSE & CDR Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={sortedLongitudinal}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#475569' }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#475569' }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#475569' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area yAxisId="left" type="monotone" dataKey="mmse" stroke="#1a5fa8" fill="#1a5fa8" fillOpacity={0.1} strokeWidth={2} name="MMSE" />
                  <Area yAxisId="right" type="monotone" dataKey="cdr" stroke="#dc2626" fill="#dc2626" fillOpacity={0.1} strokeWidth={2} name="CDR" />
                  <Legend
                    wrapperStyle={{ fontSize: 11 }}
                    formatter={(value) => <span className="text-text-secondary">{value}</span>}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="medical-card p-6">
              <h3 className="card-title mb-4">Brain Age Gap & Hippocampal Volume</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={sortedLongitudinal}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#475569' }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#475569' }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#475569' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area yAxisId="left" type="monotone" dataKey="brainAgeGap" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} strokeWidth={2} name="Brain Age Gap" />
                  <Area yAxisId="right" type="monotone" dataKey="hippocampalVolume" stroke="#0d9488" fill="#0d9488" fillOpacity={0.1} strokeWidth={2} name="Hippocampal Vol." />
                  <Legend
                    wrapperStyle={{ fontSize: 11 }}
                    formatter={(value) => <span className="text-text-secondary">{value}</span>}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Reports */}
        {activeTab === 'reports' && (
          <div className="medical-card p-6">
            <h3 className="card-title mb-4">Generated Reports</h3>
            <div className="text-center py-12">
              <FileText size={48} className="text-text-tertiary mx-auto mb-3" />
              <p className="text-sm text-text-secondary">No reports generated yet. Run an analysis to generate a clinical report.</p>
            </div>
          </div>
        )}

        {/* Audit */}
        {activeTab === 'audit' && (
          <div className="medical-card p-6">
            <h3 className="card-title mb-4">Audit History</h3>
            <div className="text-center py-12">
              <Shield size={48} className="text-text-tertiary mx-auto mb-3" />
              <p className="text-sm text-text-secondary">Audit log for this patient will appear here.</p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
