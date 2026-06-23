import React, { type ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

export default function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm gap-4">
      <div>
        <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">{title}</h2>
        {subtitle && <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-3 shrink-0">{children}</div>}
    </div>
  );
}
