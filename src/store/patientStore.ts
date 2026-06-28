import { create } from 'zustand';
import type { Patient, RiskCategory } from '@/types';

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
  fetchPatients: () => Promise<void>;
  updatePatient: (id: string, updatedFields: Partial<Patient>) => Promise<void>;
  addPatient: (patientData: Partial<Patient>) => Promise<void>;
}

export const usePatientStore = create<PatientState>((set, get) => ({
  patients: [],
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

  fetchPatients: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/patients');
      if (!res.ok) throw new Error('Failed to fetch patients');
      const data = await res.json();
      set({ patients: data, isLoading: false });
    } catch (err) {
      console.error(err);
      set({ isLoading: false });
    }
  },

  updatePatient: async (id, updatedFields) => {
    try {
      const res = await fetch(`/api/patients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields)
      });
      if (!res.ok) throw new Error('Failed to update patient');
      const updatedPatient = await res.json();
      
      set((state) => {
        const updatedPatients = state.patients.map((p) => {
          if (p.id === id || p.patientId === id) {
            return updatedPatient;
          }
          return p;
        });

        const updatedSelected = state.selectedPatient && (state.selectedPatient.id === id || state.selectedPatient.patientId === id)
          ? updatedPatient
          : state.selectedPatient;

        return {
          patients: updatedPatients,
          selectedPatient: updatedSelected
        };
      });
    } catch (err) {
      console.error(err);
    }
  },

  addPatient: async (patientData) => {
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patientData)
      });
      if (!res.ok) throw new Error('Failed to create patient');
      const newPatient = await res.json();
      set((state) => ({
        patients: [...state.patients, newPatient]
      }));
    } catch (err) {
      console.error(err);
    }
  }
}));

// Load patients immediately
usePatientStore.getState().fetchPatients();
