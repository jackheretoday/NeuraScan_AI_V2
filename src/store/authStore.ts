import { create } from 'zustand';
import type { User } from '@/types';
import { mockUsers } from '@/data/mockData';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; role: User['role'] }) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const user = mockUsers.find(u => u.email === email);
      if (!user || password.length < 6) {
        throw new Error('Invalid email or password. Please try again.');
      }
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (mockUsers.find(u => u.email === data.email)) {
        throw new Error('An account with this email already exists.');
      }
      const newUser: User = {
        id: `U-${String(mockUsers.length + 1).padStart(3, '0')}`,
        email: data.email,
        name: data.name,
        role: data.role,
        createdAt: new Date().toISOString().split('T')[0],
        lastActive: new Date().toISOString().split('T')[0],
      };
      mockUsers.push(newUser);
      set({ user: newUser, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  logout: () => {
    set({ user: null, isAuthenticated: false });
  },

  clearError: () => set({ error: null }),
}));
