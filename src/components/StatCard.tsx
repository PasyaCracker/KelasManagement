import { ReactNode } from 'react';

interface Props {
  label: string;
  value: number | string;
  icon: ReactNode;
  color: string;
  bg: string;
}

export default function StatCard({ label, value, icon, color, bg }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex items-center gap-4">
      <div className={`w-14 h-14 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
        <span className={color}>{icon}</span>
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}
