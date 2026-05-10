import { ReactNode } from 'react';

interface Props {
  label: string;
  value: number | string;
  icon: ReactNode;
  color: string;
  bg: string;
  trend?: { value: string; up: boolean };
}

export default function StatCard({ label, value, icon, color, bg, trend }: Props) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-surface-500 font-medium">{label}</p>
          <p className="text-2xl font-bold text-surface-900 mt-1">{value}</p>
          {trend && (
            <p className={`text-xs font-semibold mt-1.5 flex items-center gap-1 ${trend.up ? 'text-success-600' : 'text-danger-600'}`}>
              <span>{trend.up ? '\u2191' : '\u2193'}</span> {trend.value}
            </p>
          )}
        </div>
        <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
          <span className={color}>{icon}</span>
        </div>
      </div>
    </div>
  );
}
