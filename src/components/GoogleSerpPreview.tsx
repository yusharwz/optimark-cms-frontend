'use client';

import { Globe } from 'lucide-react';

interface GoogleSerpPreviewProps {
  title: string;
  metaTitle?: string;
  metaDescription?: string;
  slug: string;
}

export function GoogleSerpPreview({
  title,
  metaTitle,
  metaDescription,
  slug,
}: GoogleSerpPreviewProps) {
  const displayTitle = metaTitle || title || 'Judul Halaman Belum Ditentukan';
  const displayDesc =
    metaDescription ||
    'Tambahkan meta description agar Googlebot dan calon pengunjung memahami ringkasan artikel ini dengan cepat.';
  const displayUrl = `https://optimark.ai > blog > ${slug || 'judul-artikel-baru'}`;

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-[#465984]" />
          Preview Google Search SERP
        </span>
        <span className="text-[11px] text-slate-400">Desktop Snippet</span>
      </div>

      <div className="pt-1 font-sans">
        {/* Breadcrumb URL */}
        <div className="text-[12px] text-slate-700 truncate leading-snug flex items-center gap-1">
          <span className="w-4 h-4 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] text-slate-600 font-bold">
            O
          </span>
          <span className="truncate">{displayUrl}</span>
        </div>

        {/* Title */}
        <div className="text-[17px] text-[#1a0dab] hover:underline cursor-pointer font-medium leading-normal line-clamp-1 mt-0.5">
          {displayTitle}
        </div>

        {/* Snippet Description */}
        <div className="text-[13px] text-[#4d5156] line-clamp-2 leading-relaxed mt-1">
          {displayDesc}
        </div>
      </div>
    </div>
  );
}
