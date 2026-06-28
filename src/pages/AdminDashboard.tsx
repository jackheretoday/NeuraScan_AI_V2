import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Cpu, HardDrive, UserPlus, Database,
  RefreshCw, Key, ShieldCheck, Mail, Hospital
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

interface SystemStatus {
  dbSize: string;
  patients: number;
  scans: number;
  auditLogs: number;
  users: number;
  status: string;
  onnxRuntime: string;
  memoryUsage: string;
  uptime: string;
}

interface UserOperator {
  id: string;
  name: string;
  email: string;
  role: string;
  hospital: string;
  specialization: string;
  licenseNumber: string;
  createdAt: string;
  lastActive: string;
}

export function AdminDashboard() {
  const { user: currentAdmin } = useAuthStore();
  const [users, setUsers] = useState<UserOperator[]>([]);
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'operators' | 'db_explorer'>('operators');

  // Add User Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('doctor');
  const [hospital, setHospital] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const fetchAdminData = async () => {
    try {
      const [usersRes, statusRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/system-status')
      ]);
      if (usersRes.ok && statusRes.ok) {
        const usersData = await usersRes.json();
        const statusData = await statusRes.json();
        setUsers(usersData);
        setStatus(statusData);
      }
    } catch (err) {
      console.error("Error fetching admin data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!name || !email || !password) {
      setFormError('Name, email, and password are required.');
      return;
    }

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          hospital,
          specialization,
          licenseNumber
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to add operator.');
        return;
      }

      setFormSuccess(`Successfully created clinical operator: ${name}`);
      setName('');
      setEmail('');
      setPassword('');
      setHospital('');
      setSpecialization('');
      setLicenseNumber('');
      fetchAdminData();
    } catch (err) {
      console.error(err);
      setFormError('Failed to establish network connection.');
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'administrator': return 'System Admin';
      case 'doctor': return 'Doctor (Clinician)';
      case 'researcher': return 'Researcher';
      default: return role;
    }
  };

  if (isLoading || !status) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw size={24} className="text-medical-600 animate-spin" />
          <span className="text-xs font-semibold text-text-secondary">Loading Admin Console...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold text-text-primary">System Administration Console</h1>
        <p className="text-sm text-text-secondary mt-1">
          Monitor system diagnostics, manage credentialed clinical operators, and inspect live database tables.
        </p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Database Footprint', value: status.dbSize, sub: 'SQLite storage size', icon: HardDrive, color: '#1a5fa8' },
          { label: 'Registered Patients', value: status.patients, sub: 'Active medical folders', icon: Users, color: '#0d9488' },
          { label: 'Ingested MRI Scans', value: status.scans, sub: 'Persisted segmentation maps', icon: Database, color: '#f59e0b' },
          { label: 'Audit Trail Records', value: status.auditLogs, sub: 'HIPAA access log count', icon: ShieldCheck, color: '#dc2626' },
        ].map((card, idx) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="medical-card p-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <card.icon size={14} style={{ color: card.color }} />
                <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">{card.label}</span>
              </div>
              <p className="text-xl font-extrabold" style={{ color: card.color }}>{card.value}</p>
            </div>
            <p className="text-[10px] text-text-tertiary font-semibold mt-2">{card.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* System Integrity & Diagnostics */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="medical-card p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="card-title flex items-center gap-2">
            <Cpu size={16} className="text-medical-500" />
            System Health & Inference Environment
          </h3>
          <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
            All Systems Operational
          </span>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold">
          <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200/50 dark:border-slate-800">
            <p className="text-[10px] text-text-tertiary mb-1">Model Inference Engine</p>
            <p className="text-text-primary font-bold">{status.onnxRuntime}</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200/50 dark:border-slate-800">
            <p className="text-[10px] text-text-tertiary mb-1">Active Memory Footprint</p>
            <p className="text-text-primary font-bold">{status.memoryUsage}</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200/50 dark:border-slate-800">
            <p className="text-[10px] text-text-tertiary mb-1">Database Health Check</p>
            <p className="text-emerald-600 font-bold">Connected ({status.status})</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200/50 dark:border-slate-800">
            <p className="text-[10px] text-text-tertiary mb-1">Uptime Record</p>
            <p className="text-text-primary font-bold">{status.uptime}</p>
          </div>
        </div>
      </motion.div>

      {/* Tabs Selector */}
      <div className="flex border-b border-border bg-white dark:bg-slate-900 rounded-xl p-1 shadow-sm border border-slate-100 dark:border-slate-800 max-w-sm">
        <button
          onClick={() => setActiveTab('operators')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'operators'
              ? 'bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm border border-slate-200/50 dark:border-slate-700'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-50/50'
          }`}
        >
          <Users size={14} className={activeTab === 'operators' ? 'text-medical-600' : 'text-slate-500'} />
          <span>Operators & Users</span>
        </button>
        <button
          onClick={() => setActiveTab('db_explorer')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'db_explorer'
              ? 'bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm border border-slate-200/50 dark:border-slate-700'
              : 'text-text-secondary hover:text-text-primary hover:bg-slate-50/50'
          }`}
        >
          <Database size={14} className={activeTab === 'db_explorer' ? 'text-teal-600' : 'text-slate-500'} />
          <span>Database Browser</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'operators' ? (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* User List Table */}
          <div className="lg:col-span-2 space-y-4">
            <div className="medical-card p-5">
              <h3 className="card-title mb-4 flex items-center gap-2">
                <Users size={16} className="text-medical-500" />
                Credentialed Clinical Operators
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-semibold">
                  <thead>
                    <tr className="border-b border-border text-text-tertiary">
                      <th className="py-2.5">Operator Name</th>
                      <th className="py-2.5">Email</th>
                      <th className="py-2.5">Access Role</th>
                      <th className="py-2.5">Hospital Affiliation</th>
                      <th className="py-2.5">Last Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="border-b border-border/40 hover:bg-slate-50/50 dark:hover:bg-slate-950/20 text-text-primary">
                        <td className="py-3 font-bold">{u.name}</td>
                        <td className="py-3 font-mono text-text-secondary">{u.email}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.role === 'administrator' ? 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400' :
                            u.role === 'doctor' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' :
                            'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400'
                          }`}>
                            {getRoleLabel(u.role)}
                          </span>
                        </td>
                        <td className="py-3 text-text-secondary">{u.hospital || 'N/A'}</td>
                        <td className="py-3 text-text-tertiary font-mono">{u.lastActive || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Add Operator Form Card */}
          <div className="space-y-4">
            <div className="medical-card p-5">
              <h3 className="card-title mb-4 flex items-center gap-2">
                <Users size={16} className="text-medical-500" />
                Add Clinical Operator
              </h3>
              
              <form onSubmit={handleAddUser} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] text-text-secondary uppercase tracking-wider font-bold">Operator Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Rohan Mehta"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-text-secondary uppercase tracking-wider font-bold">Clinical Email Address</label>
                  <div className="relative">
                    <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. rohan.mehta@neuroscan.ai"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-text-secondary uppercase tracking-wider font-bold">Secret Access Code (Password)</label>
                  <div className="relative">
                    <Key size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-field pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-text-secondary uppercase tracking-wider font-bold">Authorization Level</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="input-field"
                  >
                    <option value="doctor">Doctor (Clinician)</option>
                    <option value="researcher">Researcher</option>
                    <option value="administrator">System Administrator</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-text-secondary uppercase tracking-wider font-bold">Hospital/Institution</label>
                  <div className="relative">
                    <Hospital size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. AIIMS Delhi"
                      value={hospital}
                      onChange={(e) => setHospital(e.target.value)}
                      className="input-field pl-9"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] text-text-secondary uppercase tracking-wider font-bold">Specialization</label>
                    <input
                      type="text"
                      placeholder="e.g. Neurology"
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-text-secondary uppercase tracking-wider font-bold">Medical License #</label>
                    <input
                      type="text"
                      placeholder="e.g. LIC-90045"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      className="input-field"
                    />
                  </div>
                </div>

                {formError && (
                  <p className="text-[11px] text-critical-600 font-bold bg-critical-50 border border-critical-250 p-2 rounded">
                    {formError}
                  </p>
                )}

                {formSuccess && (
                  <p className="text-[11px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-250 p-2 rounded">
                    {formSuccess}
                  </p>
                )}

                <button type="submit" className="btn-primary w-full py-2 flex items-center justify-center gap-1.5 font-extrabold text-xs shadow-md mt-2">
                  <UserPlus size={14} /> Add Authorized Operator
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : (
        /* Database Browser Tab */
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="medical-card p-0 overflow-hidden border border-border-light h-[650px]"
        >
          <iframe
            src="/db-viewer"
            className="w-full h-full border-none"
            title="Embedded SQLite Database Explorer"
          />
        </motion.div>
      )}
    </div>
  );
}
