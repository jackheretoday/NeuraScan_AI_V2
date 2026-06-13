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
    await new Promise(resolve => setTimeout(resolve, 1500));
    set({ isLoading: false });
  },
}));
