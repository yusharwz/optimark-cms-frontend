'use client';

import { Sparkles } from 'lucide-react';

interface HeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function Header({ title, description, actions }: HeaderProps) {
  return (
    <header className="h-16 border-b border-slate-200 bg-white px-8 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h1 className="text-lg font-semibold text-slate-900 leading-tight flex items-center gap-2">
          {title}
        </h1>
        {description && (
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {actions}
        <div className="h-4 w-[1px] bg-slate-200 mx-1" />
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
          <Sparkles className="w-3.5 h-3.5 text-[#465984]" />
          <span>SEO Engine Active</span>
        </div>
      </div>
    </header>
  );
}
