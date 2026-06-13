import { motion } from 'framer-motion';
import { TrendingUp, Brain, Activity, Clock, AlertTriangle } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from 'recharts';
import { usePatientStore } from '@/store/patientStore';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-border rounded-xl p-3 shadow-lg text-xs">
        <p className="font-semibold text-text-primary mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }} className="font-medium">{p.name}: {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

export function Longitudinal() {
  const { patients } = usePatientStore();
  const highRisk = patients.filter(p => p.riskCategory === 'Moderate').length;
  const monitoredPatients = patients.filter(p => p.status === 'active').length;
  const avgMMSE = patients.reduce((s, p) => s + (p.assessments[0]?.mmse || 24), 0) / patients.length;
  const avgCDR = patients.reduce((s, p) => s + (p.assessments[0]?.cdr || 0.5), 0) / patients.length;

  // Aggregate longitudinal data across all patients
  const aggregatedData = patients.slice(0, 30).flatMap(p => p.longitudinalData);
  const monthlyAverages = aggregatedData.reduce((acc: any, point) => {
    const month = point.date.slice(0, 7);
    if (!acc[month]) acc[month] = { mmse: 0, cdr: 0, brainAgeGap: 0, count: 0 };
    acc[month].mmse += point.mmse;
    acc[month].cdr += point.cdr;
    acc[month].brainAgeGap += point.brainAgeGap;
    acc[month].count++;
    return acc;
  }, {});

  const chartData = Object.entries(monthlyAverages).map(([month, data]: [string, any]) => ({
    month,
    mmse: parseFloat((data.mmse / data.count).toFixed(1)),
    cdr: parseFloat((data.cdr / data.count).toFixed(2)),
    brainAgeGap: parseFloat((data.brainAgeGap / data.count).toFixed(1)),
  })).sort((a, b) => a.month.localeCompare(b.month));

  const topPatientsForTrend = patients.slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold text-text-primary">Longitudinal Monitoring</h1>
        <p className="text-sm text-text-secondary mt-1">Track disease progression and cognitive decline over time across your patient population</p>
      </motion.div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Patients', value: monitoredPatients, icon: Activity, color: '#22c55e' },
          { label: 'High Risk', value: highRisk, icon: AlertTriangle, color: '#dc2626' },
          { label: 'Avg MMSE', value: avgMMSE.toFixed(1), icon: Brain, color: '#1a5fa8' },
          { label: 'Avg CDR', value: avgCDR.toFixed(2), icon: Clock, color: '#f59e0b' },
        ].map((metric, i) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="medical-card p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <metric.icon size={14} style={{ color: metric.color }} />
              <span className="text-xs text-text-secondary">{metric.label}</span>
            </div>
            <p className="text-2xl font-extrabold" style={{ color: metric.color }}>{metric.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Population Trends */}
      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="medical-card p-6"
        >
          <h3 className="card-title mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-medical-500" />
            Cognitive Score Trends (Population Average)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#475569' }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#475569' }} domain={[0, 30]} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#475569' }} domain={[0, 3]} />
              <Tooltip content={<CustomTooltip />} />
              <Line yAxisId="left" type="monotone" dataKey="mmse" stroke="#1a5fa8" strokeWidth={2} dot={false} name="Avg MMSE" />
              <Line yAxisId="right" type="monotone" dataKey="cdr" stroke="#dc2626" strokeWidth={2} dot={false} name="Avg CDR" />
              <Legend
                wrapperStyle={{ fontSize: 11 }}
                formatter={(value) => <span className="text-text-secondary">{value}</span>}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="medical-card p-6"
        >
          <h3 className="card-title mb-4 flex items-center gap-2">
            <Brain size={16} className="text-medical-500" />
            Brain Age Gap Trend
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#475569' }} />
              <YAxis tick={{ fontSize: 11, fill: '#475569' }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="brainAgeGap" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} strokeWidth={2} name="Avg Brain Age Gap" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Individual Patient Trends */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="medical-card p-6"
      >
        <h3 className="card-title mb-4 flex items-center gap-2">
          <Activity size={16} className="text-medical-500" />
          Individual Progression Summary
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 text-xs font-semibold text-text-secondary">Patient</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-text-secondary">Disease Stage</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-text-secondary">MMSE Trend</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-text-secondary">CDR Trend</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-text-secondary">Brain Age Gap</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-text-secondary">Risk Score</th>
              </tr>
            </thead>
            <tbody>
              {topPatientsForTrend.map((p, i) => {
                const latest = p.longitudinalData[p.longitudinalData.length - 1];
                const first = p.longitudinalData[0];
                const mmseTrend = latest && first ? latest.mmse - first.mmse : 0;
                const cdrTrend = latest && first ? latest.cdr - first.cdr : 0;
                return (
                  <tr key={p.id} className="border-b border-border-light">
                    <td className="py-2.5 px-3">
                      <span className="text-sm font-medium text-text-primary">{p.name}</span>
                    </td>
                    <td className="py-2.5 px-3 text-sm text-text-secondary">{p.diagnosis}</td>
                    <td className="py-2.5 px-3">
                      <span className={`text-sm font-semibold ${mmseTrend < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {mmseTrend > 0 ? '+' : ''}{mmseTrend.toFixed(1)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`text-sm font-semibold ${cdrTrend > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {cdrTrend > 0 ? '+' : ''}{cdrTrend.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`text-sm font-semibold ${(latest?.brainAgeGap || 0) > 5 ? 'text-red-600' : 'text-amber-600'}`}>
                        {latest?.brainAgeGap.toFixed(1)}yrs
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`text-sm font-semibold ${(latest?.riskScore || 0) > 0.7 ? 'text-red-600' : (latest?.riskScore || 0) > 0.4 ? 'text-amber-600' : 'text-green-600'}`}>
                        {((latest?.riskScore || 0) * 100).toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Risk Evolution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="medical-card p-6"
      >
        <h3 className="card-title mb-4 flex items-center gap-2">
          <AlertTriangle size={16} className="text-medical-500" />
          Risk Category Evolution
        </h3>
        <div className="grid grid-cols-4 gap-3">
          {(['Low', 'Very Mild', 'Mild', 'Moderate'] as const).map(cat => {
            const count = patients.filter(p => p.riskCategory === cat).length;
            const color = cat === 'Low' ? '#22c55e' : cat === 'Very Mild' ? '#f59e0b' : cat === 'Mild' ? '#f97316' : '#dc2626';
            return (
              <div key={cat} className="text-center p-4 rounded-xl bg-gray-50">
                <div className="w-3 h-3 rounded-full mx-auto mb-2" style={{ backgroundColor: color }} />
                <p className="text-lg font-extrabold" style={{ color }}>{count}</p>
                <p className="text-xs text-text-secondary">{cat}</p>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
