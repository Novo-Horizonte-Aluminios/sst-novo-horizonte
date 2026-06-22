import React from 'react';

type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'default';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  danger: 'bg-rose-50 text-rose-700 border border-rose-200',
  warning: 'bg-amber-50 text-amber-700 border border-amber-200',
  info: 'bg-sky-50 text-sky-700 border border-sky-200',
  default: 'bg-slate-100 text-slate-600 border border-slate-200',
};

export default function Badge({ children, variant = 'default' }: BadgeProps) {
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-mono font-bold uppercase ${variantClasses[variant]}`}>
      {children}
    </span>
  );
}
