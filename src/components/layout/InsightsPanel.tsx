import { motion } from 'framer-motion';
import { Brain, AlertTriangle, TrendingUp, Clock, ArrowRight } from 'lucide-react';
import { usePatientStore } from '@/store/patientStore';
import { useNavigate } from 'react-router-dom';
import { formatDate, getRiskColor } from '@/lib/utils';

export function InsightsPanel() {
  const { patients } = usePatientStore();
  const navigate = useNavigate();
  const highRiskPatients = patients.filter(p => p.riskCategory === 'Moderate').slice(0, 5);
  const recentScans = [...patients].sort((a, b) => new Date(b.lastScanDate).getTime() - new Date(a.lastScanDate).getTime()).slice(0, 5);

  return (
    <div className="space-y-4">
      {/* AI Summary */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="medical-card p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <Brain size={16} className="text-medical-500" />
          <h3 className="text-sm font-semibold">AI Insights</h3>
        </div>
        <div className="space-y-2">
          <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-50">
            <AlertTriangle size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-800">
              {patients.filter(p => p.riskCategory === 'Moderate').length} high-risk patients require immediate review.
            </p>
          </div>
          <div className="flex items-start gap-2 p-2 rounded-lg bg-blue-50">
            <TrendingUp size={14} className="text-medical-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-medical-800">
              Average brain age gap increased by 2.1% this quarter.
            </p>
          </div>
          <div className="flex items-start gap-2 p-2 rounded-lg bg-green-50">
            <Clock size={14} className="text-green-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-green-800">
              {patients.filter(p => p.status === 'active').length} patients on active monitoring schedule.
            </p>
          </div>
        </div>
      </motion.div>

      {/* High Risk Patients */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="medical-card p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-critical-700">High Risk Patients</h3>
          <button onClick={() => navigate('/dashboard/patients')} className="text-xs text-medical-600 hover:text-medical-700 font-medium flex items-center gap-1">
            View All <ArrowRight size={12} />
          </button>
        </div>
        <div className="space-y-2">
          {highRiskPatients.map((p, i) => (
            <button
              key={p.id}
              onClick={() => navigate(`/dashboard/patients/${p.id}`)}
              className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-red-50 transition-colors text-left"
            >
              <div>
                <p className="text-sm font-medium text-text-primary">{p.name}</p>
                <p className="text-xs text-text-tertiary">{p.age}yrs · {p.gender}</p>
              </div>
              <span className="text-xs font-semibold text-critical-600">
                {p.riskCategory}
              </span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="medical-card p-4"
      >
        <h3 className="text-sm font-semibold mb-3">Recent Scans</h3>
        <div className="space-y-2">
          {recentScans.map((p) => (
            <div key={p.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
              <div>
                <p className="text-sm font-medium text-text-primary">{p.name}</p>
                <p className="text-xs text-text-tertiary">{formatDate(p.lastScanDate)}</p>
              </div>
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: getRiskColor(p.riskCategory) }}
              />
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
