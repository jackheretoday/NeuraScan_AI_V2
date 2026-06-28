import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Search, Download } from 'lucide-react';
import { mockAuditLogs } from '@/data/mockData';
import { formatDateTime } from '@/lib/utils';
import type { AuditAction, RiskCategory, AuditEntry } from '@/types';

const actionLabels: Record<AuditAction, string> = {
  analysis: 'Analysis',
  prediction: 'Prediction',
  report_generated: 'Report Generated',
  report_downloaded: 'Report Downloaded',
  patient_viewed: 'Patient Viewed',
  settings_changed: 'Settings Changed',
  login: 'Login',
  logout: 'Logout',
};

export function AuditLogs() {
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState<string>('All');
  const [filterRisk, setFilterRisk] = useState<RiskCategory | 'All'>('All');
  const [filterUncertainty, setFilterUncertainty] = useState<string>('All');
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);

  useEffect(() => {
    fetch('/api/audit-logs')
      .then(res => res.json())
      .then(data => setAuditLogs(data))
      .catch(console.error);
  }, []);

  const filteredLogs = auditLogs.filter(log => {
    // Search filter: Operator, Details, or Target Profile (ABHA ID)
    if (search) {
      const matchName = log.userName.toLowerCase().includes(search.toLowerCase());
      const matchDetails = log.details.toLowerCase().includes(search.toLowerCase());
      const matchAbha = log.abhaId && log.abhaId.toLowerCase().includes(search.toLowerCase());
      if (!matchName && !matchDetails && !matchAbha) return false;
    }
    
    if (filterAction !== 'All' && log.action !== filterAction) return false;
    if (filterRisk !== 'All' && log.riskCategory !== filterRisk) return false;
    
    // Uncertainty Filter
    if (filterUncertainty !== 'All') {
      const isUncertain = log.uncertaintyStatus === true;
      if (filterUncertainty === 'Uncertain' && !isUncertain) return false;
      if (filterUncertainty === 'Verified' && isUncertain) return false;
    }

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold text-text-primary">HIPAA Compliance Audit Trail</h1>
        <p className="text-sm text-text-secondary mt-1">
          Comprehensive, immutable audit logs tracking operator access, model hashes, classification confidence, and patient privacy gateways.
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Events Checked', value: auditLogs.length, icon: Shield, color: '#1a5fa8' },
          { label: 'Model Analyses', value: auditLogs.filter(l => l.action === 'analysis').length, icon: Shield, color: '#0d9488' },
          { label: 'Low Confidence Flags', value: auditLogs.filter(l => l.uncertaintyStatus === true).length, icon: Shield, color: '#dc2626' },
          { label: 'IP Nodes Registered', value: Array.from(new Set(auditLogs.map(l => l.ipAddress))).length, icon: Shield, color: '#f59e0b' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="medical-card p-4"
          >
            <div className="flex items-center gap-2 mb-1">
              <stat.icon size={14} style={{ color: stat.color }} />
              <span className="text-xs text-text-secondary">{stat.label}</span>
            </div>
            <p className="text-xl font-extrabold" style={{ color: stat.color }}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="medical-card p-4"
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search by operator, details, or ABHA ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-surface-secondary border border-border rounded-lg pl-10 pr-4 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-medical-500 w-full h-9"
            />
          </div>
          
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="bg-surface border border-border rounded-lg px-3 py-1.5 text-xs font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-medical-500 h-9"
          >
            <option value="All">All Action Types</option>
            {Object.entries(actionLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value as RiskCategory | 'All')}
            className="bg-surface border border-border rounded-lg px-3 py-1.5 text-xs font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-medical-500 h-9"
          >
            <option value="All">All Risk Categories</option>
            <option value="Low">Low Risk</option>
            <option value="Very Mild">Very Mild Risk</option>
            <option value="Mild">Mild Risk</option>
            <option value="Moderate">Moderate Risk</option>
          </select>

          <select
            value={filterUncertainty}
            onChange={(e) => setFilterUncertainty(e.target.value)}
            className="bg-surface border border-border rounded-lg px-3 py-1.5 text-xs font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-medical-500 h-9"
          >
            <option value="All">All Confidence Levels</option>
            <option value="Uncertain">Low Confidence Alerts</option>
            <option value="Verified">Verified Predictions</option>
          </select>

          <button className="flex items-center gap-1.5 bg-surface hover:bg-slate-50 border border-border text-text-secondary font-bold text-xs px-3 py-2 rounded-lg h-9 ml-auto transition-colors">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </motion.div>

      {/* High-density logs table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="medical-card overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-slate-50/70">
                <th className="py-3 px-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Timestamp</th>
                <th className="py-3 px-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Target Profile (ABHA ID)</th>
                <th className="py-3 px-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Operator</th>
                <th className="py-3 px-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Action Performed</th>
                <th className="py-3 px-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Model Hash</th>
                <th className="py-3 px-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Confidence</th>
                <th className="py-3 px-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Uncertainty Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log, i) => (
                <motion.tr
                  key={log.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.003, 0.25) }}
                  className="border-b border-border-light hover:bg-slate-50/35 transition-colors"
                >
                  {/* Timestamp - font-mono enforced */}
                  <td className="py-3 px-4 text-xs text-text-secondary font-mono">{formatDateTime(log.timestamp)}</td>
                  
                  {/* Target Profile ABHA ID - font-mono enforced */}
                  <td className="py-3 px-4 text-xs text-text-primary font-mono font-bold">
                    {log.abhaId ? (
                      <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                        {log.abhaId}
                      </span>
                    ) : (
                      <span className="text-text-tertiary italic">None</span>
                    )}
                  </td>
                  
                  {/* Operator */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-text-primary">{log.userName}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold tracking-wide uppercase border ${
                        log.userRole === 'doctor' ? 'bg-blue-50 text-blue-750 border-blue-200' : 'bg-red-50 text-red-750 border-red-200'
                      }`}>
                        {log.userRole}
                      </span>
                    </div>
                  </td>
                  
                  {/* Action Performed */}
                  <td className="py-3 px-4">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-extrabold tracking-wide uppercase border ${
                      log.action === 'analysis' ? 'bg-purple-55 text-purple-750 border-purple-200' :
                      log.action === 'prediction' ? 'bg-indigo-55 text-indigo-750 border-indigo-200' :
                      log.action.includes('report') ? 'bg-emerald-55 text-emerald-750 border-emerald-200' :
                      'bg-slate-50 text-slate-750 border-slate-250'
                    }`}>
                      {actionLabels[log.action] || log.action}
                    </span>
                  </td>
                  
                  {/* Model Hash String - font-mono enforced */}
                  <td className="py-3 px-4 text-xs text-slate-600 font-mono">
                    {log.modelHash || <span className="text-text-tertiary">—</span>}
                  </td>
                  
                  {/* Model Confidence - font-mono enforced */}
                  <td className="py-3 px-4 text-xs font-mono font-bold">
                    {log.confidence !== undefined ? (
                      <span className={log.confidence < 0.85 ? 'text-amber-600' : 'text-emerald-600'}>
                        {(log.confidence * 100).toFixed(0)}%
                      </span>
                    ) : (
                      <span className="text-text-tertiary">—</span>
                    )}
                  </td>
                  
                  {/* Uncertainty status - font-mono enforced */}
                  <td className="py-3 px-4 text-xs font-mono font-semibold">
                    {log.confidence !== undefined ? (
                      log.confidence < 0.85 ? (
                        <span className="text-amber-700 bg-amber-50 border border-amber-250 px-2 py-0.5 rounded-full font-bold">
                          ⚠️ LOW CONFIDENCE
                        </span>
                      ) : (
                        <span className="text-emerald-700 bg-emerald-50 border border-emerald-250 px-2 py-0.5 rounded-full font-bold">
                          ✓ VERIFIED
                        </span>
                      )
                    ) : (
                      <span className="text-text-tertiary">—</span>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
