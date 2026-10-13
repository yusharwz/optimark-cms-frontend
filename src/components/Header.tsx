'use client';

import { CheckVerified01 } from '@untitledui/icons';

interface HeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function Header({ title, description, actions }: HeaderProps) {
  return (
    <header className="h-16 border-b border-[#eaecf0] bg-white px-8 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h1 className="text-base font-semibold text-[#181d27] leading-tight flex items-center gap-2">
          {title}
        </h1>
        {description && (
          <p className="text-xs text-[#535862] mt-0.5">{description}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {actions}
        <div className="h-4 w-[1px] bg-[#e9eaeb] mx-1" />
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#f2f5f9] text-[#465984] text-xs font-semibold border border-[#c6d2e6]">
          <CheckVerified01 className="size-3.5 text-[#465984]" />
          <span>SEO Engine Active</span>
        </div>
      </div>
    </header>
  );
}
