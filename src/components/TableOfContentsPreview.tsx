'use client';

import { ListOrdered } from 'lucide-react';
import { TocItem } from '@/lib/types';

interface TableOfContentsPreviewProps {
  items: TocItem[];
}

export function TableOfContentsPreview({ items }: TableOfContentsPreviewProps) {
  if (!items || items.length === 0) {
    return (
      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-center">
        <ListOrdered className="w-5 h-5 text-slate-400 mx-auto mb-1" />
        <p className="text-xs text-slate-500">
          Belum ada heading (H1–H4) terdeteksi di konten artikel.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 uppercase tracking-wider">
        <ListOrdered className="w-4 h-4 text-[#465984]" />
        <span>Daftar Isi Otomatis ({items.length} Headings)</span>
      </div>

      <ul className="space-y-1 text-xs pt-1">
        {items.map((item, idx) => (
          <li
            key={`${item.id}-${idx}`}
            className="flex items-start gap-1.5 py-0.5 text-slate-600 hover:text-slate-900 transition-colors"
            style={{ paddingLeft: `${(item.level - 1) * 12}px` }}
          >
            <span className="text-[10px] font-mono px-1 py-0.2 bg-slate-100 rounded text-slate-500 border border-slate-200">
              H{item.level}
            </span>
            <span className="truncate">{item.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
