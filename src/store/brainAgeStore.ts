import { create } from 'zustand';
import type { BrainAgeData } from '@/types';
import { mockBrainAgeData } from '@/data/mockData';

interface BrainAgeState {
  data: BrainAgeData;
  isLoading: boolean;
  refreshData: () => Promise<void>;
}

export const useBrainAgeStore = create<BrainAgeState>((set) => ({
  data: mockBrainAgeData,
  isLoading: false,

  refreshData: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/brain-age');
      if (!res.ok) throw new Error('Failed to fetch brain age data');
      const data = await res.json();
      set({ data, isLoading: false });
    } catch (err) {
      console.error(err);
      set({ isLoading: false });
    }
  },
}));

// Load immediately on file execution
useBrainAgeStore.getState().refreshData();
