'use client';

import { AlignLeft } from '@untitledui/icons';
import { TocItem } from '@/lib/types';

interface TableOfContentsPreviewProps {
  items?: TocItem[];
  content?: string;
}

export function TableOfContentsPreview({ items, content }: TableOfContentsPreviewProps) {
  let displayItems = items || [];
  if (content && (!items || items.length === 0)) {
    const headings: TocItem[] = [];
    const lines = content.split('\n');
    for (const line of lines) {
      const match = line.match(/^(#{1,4})\s+(.+)$/);
      if (match) {
        headings.push({
          id: match[2].toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          level: match[1].length,
          text: match[2].trim(),
        });
      }
    }
    displayItems = headings;
  }

  if (!displayItems || displayItems.length === 0) {
    return (
      <div className="p-4 rounded-xl border border-[#eaecf0] bg-[#fafafa] text-center">
        <AlignLeft className="size-5 text-[#a4a7ae] mx-auto mb-1" />
        <p className="text-xs text-[#717680]">
          Belum ada heading (H1–H4) terdeteksi di konten artikel.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-xl border border-[#eaecf0] shadow-xs space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold text-[#344054] uppercase tracking-wider">
        <AlignLeft className="size-4 text-[#465984]" />
        <span>Daftar Isi Otomatis ({displayItems.length} Headings)</span>
      </div>

      <ul className="space-y-1 text-xs pt-1">
        {displayItems.map((item, idx) => (
          <li
            key={`${item.id}-${idx}`}
            className="flex items-start gap-1.5 py-0.5 text-[#535862] hover:text-[#181d27] transition-colors"
            style={{ paddingLeft: `${(item.level - 1) * 12}px` }}
          >
            <span className="text-[10px] font-mono px-1 py-0.5 bg-[#f2f4f7] rounded text-[#717680] border border-[#eaecf0]">
              H{item.level}
            </span>
            <span className="truncate">{item.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
