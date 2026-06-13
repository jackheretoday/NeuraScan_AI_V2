import { create } from 'zustand';
import type { ThemeMode } from '@/types';

interface ThemeState {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(resolved: 'light' | 'dark') {
  if (resolved === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

function loadTheme(): ThemeMode {
  try {
    const stored = localStorage.getItem('neuroscan-theme');
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch {}
  return 'light';
}

function resolveAndApply(theme: ThemeMode) {
  const resolved = theme === 'system' ? getSystemTheme() : theme;
  applyTheme(resolved);
  return resolved;
}

export const useThemeStore = create<ThemeState>((set, get) => {
  // Initialize
  const initialTheme = loadTheme();
  const initialResolved = resolveAndApply(initialTheme);

  // Listen for system preference changes
  if (typeof window !== 'undefined') {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      const { theme } = get();
      if (theme === 'system') {
        const resolved = resolveAndApply('system');
        set({ resolvedTheme: resolved });
      }
    });
  }

  return {
    theme: initialTheme,
    resolvedTheme: initialResolved,

    setTheme: (theme: ThemeMode) => {
      try {
        localStorage.setItem('neuroscan-theme', theme);
      } catch {}
      const resolved = resolveAndApply(theme);
      set({ theme, resolvedTheme: resolved });
    },

    toggleTheme: () => {
      const { resolvedTheme } = get();
      const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
      get().setTheme(newTheme);
    },
  };
});
