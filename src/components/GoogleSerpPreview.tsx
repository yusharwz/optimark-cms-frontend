'use client';

import Image from 'next/image';
import { Globe01 } from '@untitledui/icons';

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
    <div className="bg-white p-4 rounded-xl border border-[#eaecf0] shadow-xs space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#535862] uppercase tracking-wider flex items-center gap-1.5">
          <Globe01 className="size-3.5 text-[#465984]" />
          Preview Google Search SERP
        </span>
        <span className="text-[11px] text-[#717680]">Desktop Snippet</span>
      </div>

      <div className="pt-1 font-sans">
        {/* Breadcrumb URL with Real Optimark Logo */}
        <div className="text-[12px] text-[#424751] truncate leading-snug flex items-center gap-1.5">
          <Image
            src="/assets/optimark-logo.svg"
            alt="Optimark"
            width={16}
            height={16}
            className="shrink-0"
          />
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
