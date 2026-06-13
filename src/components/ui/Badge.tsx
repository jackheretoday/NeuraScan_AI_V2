import type { RiskCategory } from '@/types';
import { getRiskBgClass } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'green' | 'yellow' | 'orange' | 'red' | 'blue' | 'gray';
  className?: string;
}

export function Badge({ children, variant = 'gray', className = '' }: BadgeProps) {
  const variantClasses: Record<string, string> = {
    green: 'badge-green',
    yellow: 'badge-yellow',
    orange: 'badge-orange',
    red: 'badge-red',
    blue: 'badge-blue',
    gray: 'badge-gray',
  };

  return (
    <span className={`badge ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}

export function RiskBadge({ category }: { category: RiskCategory }) {
  const colors: Record<RiskCategory, { bg: string; text: string }> = {
    'Low': { bg: 'bg-green-100', text: 'text-green-800' },
    'Very Mild': { bg: 'bg-amber-100', text: 'text-amber-800' },
    'Mild': { bg: 'bg-orange-100', text: 'text-orange-800' },
    'Moderate': { bg: 'bg-red-100', text: 'text-red-800' },
  };

  const c = colors[category];
  return (
    <span className={`badge ${c.bg} ${c.text}`}>
      {category}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; dot: string }> = {
    active: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' },
    inactive: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
    critical: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' },
    pending: { bg: 'bg-amber-100', text: 'text-amber-800', dot: 'bg-amber-500' },
    completed: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' },
    failed: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' },
    processing: { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500' },
  };

  const c = config[status] || config.inactive;
  return (
    <span className={`inline-flex items-center gap-1.5 badge ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
