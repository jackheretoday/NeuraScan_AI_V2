import { create } from 'zustand';
import type { Patient, RiskCategory } from '@/types';
import { mockPatients } from '@/data/mockData';

interface PatientFilters {
  search: string;
  riskCategory: RiskCategory | 'All';
  status: string;
  ageRange: [number, number];
}

interface PatientState {
  patients: Patient[];
  selectedPatient: Patient | null;
  filters: PatientFilters;
  isLoading: boolean;
  setSelectedPatient: (patient: Patient | null) => void;
  setFilters: (filters: Partial<PatientFilters>) => void;
  getFilteredPatients: () => Patient[];
  getPatientById: (id: string) => Patient | undefined;
  updatePatient: (id: string, updatedFields: Partial<Patient>) => void;
}

export const usePatientStore = create<PatientState>((set, get) => ({
  patients: mockPatients,
  selectedPatient: null,
  isLoading: false,
  filters: {
    search: '',
    riskCategory: 'All',
    status: 'All',
    ageRange: [0, 120],
  },

  setSelectedPatient: (patient) => set({ selectedPatient: patient }),

  setFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters },
  })),

  getFilteredPatients: () => {
    const { patients, filters } = get();
    return patients.filter(p => {
      if (filters.search && !p.name.toLowerCase().includes(filters.search.toLowerCase()) && !p.patientId.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      if (filters.riskCategory !== 'All' && p.riskCategory !== filters.riskCategory) return false;
      if (filters.status !== 'All' && p.status !== filters.status) return false;
      if (p.age < filters.ageRange[0] || p.age > filters.ageRange[1]) return false;
      return true;
    });
  },

  getPatientById: (id) => {
    return get().patients.find(p => p.id === id || p.patientId === id);
  },

  updatePatient: (id, updatedFields) => set((state) => {
    const updatedPatients = state.patients.map((p) => {
      if (p.id === id || p.patientId === id) {
        return { ...p, ...updatedFields };
      }
      return p;
    });

    const updatedSelected = state.selectedPatient && (state.selectedPatient.id === id || state.selectedPatient.patientId === id)
      ? { ...state.selectedPatient, ...updatedFields }
      : state.selectedPatient;

    return {
      patients: updatedPatients,
      selectedPatient: updatedSelected
    };
  }),
}));
