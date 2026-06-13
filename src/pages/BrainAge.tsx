import { motion } from 'framer-motion';
import {
  Clock, Brain, TrendingUp, AlertTriangle, Activity, BarChart3,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend,
} from 'recharts';
import { useBrainAgeStore } from '@/store/brainAgeStore';
import { Gauge } from '@/components/ui/Gauge';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-border rounded-xl p-3 shadow-lg text-xs">
        <p className="font-semibold text-text-primary mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }} className="font-medium">{p.name}: {p.value}yrs</p>
        ))}
      </div>
    );
  }
  return null;
};

export function BrainAge() {
  const { data } = useBrainAgeStore();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold text-text-primary">Brain Age Estimation</h1>
        <p className="text-sm text-text-secondary mt-1">NeuroScore™ — Quantifying accelerated brain aging through deep learning</p>
      </motion.div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Chronological Age', value: `${data.chronologicalAge}`, icon: Clock, color: '#1a5fa8', desc: 'years' },
          { label: 'Predicted Brain Age', value: `${data.predictedBrainAge}`, icon: Brain, color: '#0d9488', desc: 'years' },
          { label: 'Brain Age Gap', value: `+${data.brainAgeGap}`, icon: TrendingUp, color: data.brainAgeGap > 5 ? '#dc2626' : '#f59e0b', desc: 'years' },
          { label: 'NeuroScore™', value: data.neuroScore, icon: Activity, color: data.neuroScore > 80 ? '#22c55e' : '#f59e0b', desc: 'out of 100' },
          { label: 'Brain Health', value: data.brainHealthStatus, icon: AlertTriangle, color: data.brainHealthStatus === 'Normal' ? '#22c55e' : '#f59e0b', desc: 'status' },
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
            <p className="text-xl font-extrabold" style={{ color: metric.color }}>
              {metric.value}
            </p>
            <p className="text-[10px] text-text-tertiary">{metric.desc}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-6">
        {/* Brain Age Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="medical-card p-6"
        >
          <h3 className="card-title mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-medical-500" />
            Brain Age Trend
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.historicalData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#475569' }} />
              <YAxis tick={{ fontSize: 11, fill: '#475569' }} domain={['auto', 'auto']} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="chronologicalAge"
                stroke="#1a5fa8"
                fill="#1a5fa8"
                fillOpacity={0.05}
                strokeWidth={2}
                name="Chronological Age"
              />
              <Area
                type="monotone"
                dataKey="predictedBrainAge"
                stroke="#f97316"
                fill="#f97316"
                fillOpacity={0.05}
                strokeWidth={2}
                name="Predicted Brain Age"
              />
              <Legend
                wrapperStyle={{ fontSize: 11 }}
                formatter={(value) => <span className="text-text-secondary">{value}</span>}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Brain Age Gauge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="medical-card p-6 flex flex-col items-center justify-center"
        >
          <Gauge
            value={data.brainAgeGap}
            maxValue={15}
            minValue={-5}
            label="Brain Age Gap"
            unit="yrs"
            threshold={{ low: 2, medium: 5, high: 10 }}
            size={200}
          />
          <div className="mt-4 text-center">
            <p className="text-xs text-text-secondary">Brain Health Status</p>
            <p className={`text-sm font-bold mt-1 ${data.brainHealthStatus === 'Normal' ? 'text-green-600' :
                data.brainHealthStatus === 'At Risk' ? 'text-amber-600' :
                  'text-red-600'
              }`}>
              {data.brainHealthStatus}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Regional Volumes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="medical-card p-6"
      >
        <h3 className="card-title mb-4 flex items-center gap-2">
          <BarChart3 size={16} className="text-medical-500" />
          Regional Brain Volumes
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data.regionalVolumes} layout="vertical" barSize={20}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: '#475569' }} />
            <YAxis type="category" dataKey="region" tick={{ fontSize: 11, fill: '#475569' }} width={130} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="volume" fill="#1a5fa8" radius={[0, 6, 6, 0]} name="Current Volume" />
            <Bar dataKey="expectedVolume" fill="#94a3b8" radius={[0, 6, 6, 0]} name="Expected Volume" />
            <Legend
              wrapperStyle={{ fontSize: 11 }}
              formatter={(value) => <span className="text-text-secondary">{value}</span>}
            />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
