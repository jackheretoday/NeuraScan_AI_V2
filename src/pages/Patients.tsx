import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search, Filter, Users, ArrowUpDown, Eye, MoreHorizontal,
} from 'lucide-react';
import { usePatientStore } from '@/store/patientStore';
import { RiskBadge, StatusBadge } from '@/components/ui/Badge';
import { formatDate, getRiskColor } from '@/lib/utils';
import type { RiskCategory } from '@/types';

const riskFilters: (RiskCategory | 'All')[] = ['All', 'Low', 'Very Mild', 'Mild', 'Moderate'];

export function Patients() {
  const navigate = useNavigate();
  const { filters, setFilters, getFilteredPatients, setSelectedPatient } = usePatientStore();
  const [sortField, setSortField] = useState<string>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const filteredPatients = getFilteredPatients();

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sortedPatients = [...filteredPatients].sort((a, b) => {
    const aVal = a[sortField as keyof typeof a];
    const bVal = b[sortField as keyof typeof b];
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    }
    return 0;
  });

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold text-text-primary">Patient Management</h1>
        <p className="text-sm text-text-secondary mt-1">View and manage all patients in the NeuroScan system</p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="medical-card p-4"
      >
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search by name or patient ID..."
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
              className="input-field pl-10 h-9 text-sm"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={14} className="text-text-tertiary" />
            {riskFilters.map(r => (
              <button
                key={r}
                onClick={() => setFilters({ riskCategory: r })}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  filters.riskCategory === r
                    ? 'bg-medical-500 text-white'
                    : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <div className="text-xs text-text-tertiary ml-auto">
            {filteredPatients.length} patients
          </div>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="medical-card overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-gray-50/50">
                {[
                  { key: 'patientId', label: 'Patient ID' },
                  { key: 'name', label: 'Name' },
                  { key: 'age', label: 'Age' },
                  { key: 'status', label: 'Status' },
                  { key: 'riskCategory', label: 'Risk' },
                  { key: 'brainAgeGap', label: 'Brain Age Gap' },
                  { key: 'lastScanDate', label: 'Last Scan' },
                  { key: 'totalScans', label: 'Scans' },
                  { key: '', label: 'Actions' },
                ].map(col => (
                  <th
                    key={col.key}
                    onClick={() => col.key && handleSort(col.key)}
                    className="text-left py-3 px-4 text-xs font-semibold text-text-secondary cursor-pointer hover:text-text-primary"
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {col.key === sortField && <ArrowUpDown size={12} />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedPatients.map((patient, i) => (
                <motion.tr
                  key={patient.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="border-b border-border-light hover:bg-medical-50/30 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedPatient(patient);
                    navigate(`/dashboard/patients/${patient.id}`);
                  }}
                >
                  <td className="py-3 px-4 text-sm font-mono text-text-secondary">{patient.patientId}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-medical-100 flex items-center justify-center">
                        <span className="text-xs font-bold text-medical-600">
                          {patient.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-text-primary">{patient.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-text-secondary">{patient.age}</td>
                  <td className="py-3 px-4"><StatusBadge status={patient.status} /></td>
                  <td className="py-3 px-4"><RiskBadge category={patient.riskCategory} /></td>
                  <td className="py-3 px-4">
                    <span className={`text-sm font-semibold ${patient.brainAgeGap > 5 ? 'text-red-600' : patient.brainAgeGap > 2 ? 'text-amber-600' : 'text-green-600'}`}>
                      {patient.brainAgeGap > 0 ? '+' : ''}{patient.brainAgeGap}yrs
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-text-secondary">{formatDate(patient.lastScanDate)}</td>
                  <td className="py-3 px-4 text-sm text-text-secondary">{patient.totalScans}</td>
                  <td className="py-3 px-4">
                    <button className="p-1.5 rounded-lg hover:bg-gray-100 text-text-tertiary hover:text-text-primary">
                      <Eye size={16} />
                    </button>
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
