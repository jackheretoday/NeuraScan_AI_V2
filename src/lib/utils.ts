import type { RiskCategory } from '@/types';

export function getRiskColor(category: RiskCategory): string {
  const colors: Record<RiskCategory, string> = {
    'Low': '#22c55e',
    'Very Mild': '#f59e0b',
    'Mild': '#f97316',
    'Moderate': '#dc2626',
  };
  return colors[category];
}

export function getRiskBgClass(category: RiskCategory): string {
  const classes: Record<RiskCategory, string> = {
    'Low': 'bg-green-50 text-green-700 border-green-200',
    'Very Mild': 'bg-amber-50 text-amber-700 border-amber-200',
    'Mild': 'bg-orange-50 text-orange-700 border-orange-200',
    'Moderate': 'bg-red-50 text-red-700 border-red-200',
  };
  return classes[category];
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: '#22c55e',
    inactive: '#94a3b8',
    critical: '#dc2626',
    pending: '#f59e0b',
    completed: '#22c55e',
    failed: '#dc2626',
  };
  return colors[status] || '#94a3b8';
}

export function formatNumber(num: number): string {
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toLocaleString();
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getDiseaseColor(disease: string): string {
  const colors: Record<string, string> = {
    'Non Demented': '#22c55e',
    'Very Mild Demented': '#f59e0b',
    'Mild Demented': '#f97316',
    'Moderate Demented': '#dc2626',
  };
  return colors[disease] || '#94a3b8';
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
