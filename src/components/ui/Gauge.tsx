interface GaugeProps {
  value: number;
  maxValue?: number;
  minValue?: number;
  label: string;
  threshold?: { low: number; medium: number; high: number };
  unit?: string;
  size?: number;
}

export function Gauge({
  value,
  maxValue = 100,
  minValue = 0,
  label,
  threshold = { low: 33, medium: 66, high: 100 },
  unit = '%',
  size = 160,
}: GaugeProps) {
  const percentage = ((value - minValue) / (maxValue - minValue)) * 100;
  const clampedPercentage = Math.min(100, Math.max(0, percentage));
  const angle = (clampedPercentage / 100) * 180;

  const getColor = () => {
    if (clampedPercentage <= threshold.low) return '#22c55e';
    if (clampedPercentage <= threshold.medium) return '#f59e0b';
    if (clampedPercentage <= threshold.high) return '#f97316';
    return '#dc2626';
  };

  const color = getColor();
  const radius = (size - 20) / 2;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (clampedPercentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + 20} viewBox={`0 0 ${size} ${size / 2 + 20}`}>
        <path
          d={`M 10 ${size / 2 + 10} A ${radius} ${radius} 0 0 1 ${size - 10} ${size / 2 + 10}`}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d={`M 10 ${size / 2 + 10} A ${radius} ${radius} 0 0 1 ${size - 10} ${size / 2 + 10}`}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
        <text
          x={size / 2}
          y={size / 2 + 5}
          textAnchor="middle"
          fill="#0f172a"
          fontSize="28"
          fontWeight="800"
          fontFamily="inherit"
        >
          {value}{unit}
        </text>
        <text
          x={size / 2}
          y={size / 2 + 20}
          textAnchor="middle"
          fill="#475569"
          fontSize="11"
          fontWeight="500"
          fontFamily="inherit"
        >
          {label}
        </text>
      </svg>
    </div>
  );
}

interface ThermometerProps {
  value: number;
  maxValue?: number;
  label: string;
  unit?: string;
}

export function RiskThermometer({ value, maxValue = 100, label, unit = '%' }: ThermometerProps) {
  const percentage = Math.min(100, Math.max(0, (value / maxValue) * 100));

  const getColor = () => {
    if (percentage <= 25) return '#22c55e';
    if (percentage <= 50) return '#f59e0b';
    if (percentage <= 75) return '#f97316';
    return '#dc2626';
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-6 h-40 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="absolute bottom-0 w-full rounded-full transition-all duration-1000"
          style={{
            height: `${percentage}%`,
            background: `linear-gradient(to top, ${getColor()}, ${getColor()}88)`,
          }}
        />
        <div className="absolute top-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white border-2 border-gray-200" />
      </div>
      <div>
        <p className="text-2xl font-bold" style={{ color: getColor() }}>
          {value}{unit}
        </p>
        <p className="text-xs text-text-secondary mt-1">{label}</p>
      </div>
    </div>
  );
}
