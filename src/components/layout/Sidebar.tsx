import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Brain, Activity, Clock, Users, TrendingUp,
  FileText, Shield, Settings, LogOut, ChevronLeft,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user, logout } = useAuthStore();

  const navItems = user?.role === 'administrator' ? [
    { icon: LayoutDashboard, label: 'Admin Console', path: '/dashboard', status: 'Core', color: 'teal' },
    { icon: Shield, label: 'Audit Trail Logs', path: '/dashboard/audit', status: 'Complete', color: 'teal' },
  ] : [
    { icon: LayoutDashboard, label: 'Doctor Console', path: '/dashboard', status: 'Core', color: 'teal' },
    { icon: Brain, label: 'Dementia Detection', path: '/dashboard/dementia-detect', status: 'Complete', color: 'teal' },
    { icon: Brain, label: 'Pipeline Analysis', path: '/dashboard/mri', status: 'Complete', color: 'teal' },
    { icon: Activity, label: 'MCI Conversion Predictor', path: '/dashboard/prediction', status: 'Todo', color: 'blue' },
    { icon: Clock, label: 'Brain Age Tracker', path: '/dashboard/brain-age', status: 'New', color: 'purple' },
    { icon: Shield, label: 'Audit Trail Logs', path: '/dashboard/audit', status: 'Complete', color: 'teal' },
  ];

  return (
    <motion.aside
      initial={{ width: collapsed ? 72 : 260 }}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="h-screen bg-white border-r border-border flex flex-col fixed left-0 top-0 z-30"
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-border">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 shadow-sm bg-white p-0.5 border border-slate-200">
            <img src="/images/efcd965e-9531-4d5a-be6a-9e7247020349.jpg" alt="Logo" className="w-full h-full object-cover rounded-md" />
          </div>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center font-black text-sm text-text-primary tracking-tight font-sans"
            >
              <span>NEUROSCAN</span>
              <span className="text-teal-500 font-extrabold ml-0.5">+</span>
            </motion.div>
          )}
        </div>
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-surface-tertiary text-text-tertiary hover:text-text-primary transition-colors"
        >
          <ChevronLeft size={16} className={`transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `relative nav-item ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-2' : ''}`
            }
            title={collapsed ? item.label : undefined}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <item.icon size={20} className="flex-shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </div>

            {/* Expanded status chip badge */}
            {!collapsed && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold tracking-wide flex-shrink-0 border ${
                item.color === 'teal' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/30' :
                item.color === 'blue' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/30' :
                'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900/30'
              }`}>
                {item.status}
              </span>
            )}

            {/* Collapsed status dot indicator */}
            {collapsed && (
              <span className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ring-2 ring-white dark:ring-slate-900 ${
                item.color === 'teal' ? 'bg-emerald-500' :
                item.color === 'blue' ? 'bg-blue-500' :
                'bg-purple-500'
              }`} />
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      {!collapsed && (
        <div className="px-3 py-4 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-medical-100 flex items-center justify-center">
              <span className="text-xs font-bold text-medical-700">
                {user?.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary truncate">{user?.name}</p>
              <p className="text-xs text-text-tertiary capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="nav-item w-full mt-1"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </motion.aside>
  );
}
