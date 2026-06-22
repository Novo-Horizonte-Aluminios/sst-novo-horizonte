import React, { type ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  variant?: 'default' | 'danger' | 'warning' | 'success';
  onClick?: () => void;
}

const variantStyles = {
  default: { icon: 'bg-brand-primary/10 text-brand-primary', value: 'text-slate-900' },
  danger: { icon: 'bg-rose-50 text-rose-700', value: 'text-rose-600' },
  warning: { icon: 'bg-amber-50 text-amber-600', value: 'text-amber-600' },
  success: { icon: 'bg-emerald-50 text-emerald-600', value: 'text-emerald-600' },
};

export default function StatCard({ label, value, icon, variant = 'default', onClick }: StatCardProps) {
  const styles = variantStyles[variant];

  return (
    <div
      onClick={onClick}
      className={`bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-all duration-200 ${
        onClick ? 'hover:shadow-md hover:border-brand-primary/30 cursor-pointer hover:-translate-y-0.5' : ''
      }`}
    >
      <div className="flex justify-between items-start">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
        <div className={`p-2 rounded-xl ${styles.icon}`}>{icon}</div>
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className={`text-2xl font-black tracking-tight ${styles.value}`}>{value}</span>
      </div>
    </div>
  );
}
