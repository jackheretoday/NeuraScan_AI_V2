import { Search, Bell, Moon, Sun } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useState } from 'react';
import { motion } from 'framer-motion';

export function TopNav() {
  const { user } = useAuthStore();
  const { resolvedTheme, toggleTheme } = useThemeStore();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="h-16 bg-white border-b border-border flex items-center justify-between px-6 sticky top-0 z-20">
      {/* Search */}
      <div className="relative max-w-md w-full">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
        <input
          type="text"
          placeholder="Search patients, scans, reports..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-field pl-10 h-9 text-sm"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <kbd className="hidden sm:inline-flex text-[10px] px-1.5 py-0.5 rounded bg-surface-tertiary text-text-tertiary font-mono">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-surface-tertiary text-text-tertiary hover:text-text-primary transition-colors"
          title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button className="relative p-2 rounded-lg hover:bg-surface-tertiary text-text-tertiary hover:text-text-primary transition-colors">
          <Bell size={18} />
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-1.5 right-1.5 w-2 h-2 bg-critical-500 rounded-full"
          />
        </button>

        <div className="h-6 w-px bg-border mx-1" />

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-text-primary">{user?.name}</p>
            <p className="text-xs text-text-tertiary">{user?.hospital}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-medical-500 to-teal-500 flex items-center justify-center">
            <span className="text-xs font-bold text-white">
              {user?.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
