import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  trend?: number;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: string;
  delay?: number;
}

export function KpiCard({ title, value, trend, subtitle, icon, color = '#1a5fa8', delay = 0 }: KpiCardProps) {
  const isPositive = trend ? trend >= 0 : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className="medical-card p-5"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="metric-label">{title}</p>
          <p className="metric-value mt-1" style={{ color }}>
            {value}
          </p>
          {trend !== undefined && (
            <div className="flex items-center gap-1.5 mt-2">
              {isPositive ? (
                <TrendingUp size={14} className="text-clinical-600" />
              ) : (
                <TrendingDown size={14} className="text-critical-600" />
              )}
              <span className={`text-xs font-semibold ${isPositive ? 'text-clinical-600' : 'text-critical-600'}`}>
                {isPositive ? '+' : ''}{trend}%
              </span>
              {subtitle && <span className="text-xs text-text-tertiary ml-1">{subtitle}</span>}
            </div>
          )}
        </div>
        {icon && (
          <div className="p-3 rounded-xl" style={{ background: `${color}10`, color }}>
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  );
}
