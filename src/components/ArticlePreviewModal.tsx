'use client';

import React from 'react';
import Image from 'next/image';
import {
  XClose,
  Share01,
  Calendar,
  Clock,
  CheckCircle,
  Copy01,
} from '@untitledui/icons';
import { Category, Person } from '@/lib/types';

interface ArticlePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  category?: Category | null;
  author?: Person | null;
  reviewer?: Person | null;
  readMinutes?: number;
  publishedAt?: string;
  tags?: string[];
}

export function ArticlePreviewModal({
  isOpen,
  onClose,
  title,
  excerpt,
  content,
  coverImageUrl,
  category,
  author,
  reviewer,
  readMinutes = 5,
  publishedAt,
  tags = [],
}: ArticlePreviewModalProps) {
  if (!isOpen) return null;

  // Extract simple headings for TOC
  const headings = content
    .split('\n')
    .filter((line) => line.trim().startsWith('#'))
    .map((line) => {
      const match = line.trim().match(/^(#{1,3})\s+(.+)$/);
      if (!match) return null;
      return {
        level: match[1].length,
        text: match[2].replace(/[*_`]/g, ''),
      };
    })
    .filter(Boolean) as { level: number; text: string }[];

  const formattedDate = publishedAt
    ? new Date(publishedAt).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex justify-center p-2 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-[#eaecf0] overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Top bar simulating browser navigation */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#f8fafc] border-b border-[#eaecf0] shrink-0">
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-red-400 inline-block" />
            <span className="size-3 rounded-full bg-amber-400 inline-block" />
            <span className="size-3 rounded-full bg-green-400 inline-block" />
            <span className="text-xs font-semibold text-[#535862] ml-2 px-2.5 py-0.5 bg-white border border-[#d5d7da] rounded-md font-mono truncate max-w-sm">
              https://optimark.ai/blog/{category?.slug || 'topik'}/pratinjau
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-[#717680] font-medium hidden sm:inline">
              Simulasi Pratinjau Web Publik
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#535862] hover:bg-[#eaecf0] transition"
              title="Tutup Pratinjau"
            >
              <XClose className="size-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Preview Canvas */}
        <div className="overflow-y-auto p-6 sm:p-12 space-y-8 bg-white">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs text-[#535862]">
            <span>Beranda</span>
            <span>/</span>
            <span>Blog</span>
            <span>/</span>
            <span className="font-semibold text-[#181d27]">
              {category?.name || 'Kategori Artikel'}
            </span>
          </div>

          {/* Header Section */}
          <div className="space-y-4 max-w-3xl">
            {category && (
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#ecfdf5] text-[#065f46] border border-[#a7f3d0]">
                {category.name}
              </span>
            )}

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#181d27] leading-[1.15]">
              {title || 'Judul Artikel Anda Ditampilkan di Sini'}
            </h1>

            <p className="text-lg text-[#535862] leading-relaxed">
              {excerpt ||
                'Ringkasan eksekutif dan cuplikan artikel yang memikat pembaca akan tampil tepat di bawah judul utama ini.'}
            </p>

            {/* Author Meta Row */}
            <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-[#f2f4f7] text-xs text-[#535862]">
              {author && (
                <div className="flex items-center gap-2.5">
                  <div className="relative size-10 rounded-full overflow-hidden bg-[#e2e8f0] border border-[#cbd5e1] shrink-0">
                    {author.avatarUrl ? (
                      <Image
                        src={author.avatarUrl}
                        alt={author.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-[#465984]">
                        {author.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-[#181d27] flex items-center gap-1">
                      <span>{author.name}</span>
                      <CheckCircle className="size-3.5 text-blue-600 fill-blue-50" />
                    </div>
                    <div className="text-[11px] text-[#717680]">{author.role}</div>
                  </div>
                </div>
              )}

              {reviewer && (
                <div className="flex items-center gap-2 pl-4 border-l border-[#eaecf0]">
                  <div className="relative size-8 rounded-full overflow-hidden bg-[#e2e8f0] border border-[#cbd5e1] shrink-0">
                    {reviewer.avatarUrl ? (
                      <Image
                        src={reviewer.avatarUrl}
                        alt={reviewer.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-[#465984]">
                        {reviewer.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-[10px] text-[#717680]">Ditinjau oleh</div>
                    <div className="font-semibold text-[#181d27]">{reviewer.name}</div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 ml-auto text-[11px] text-[#717680]">
                <div className="flex items-center gap-1.5">
                  <Calendar className="size-3.5" />
                  <span>{formattedDate}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="size-3.5" />
                  <span>~{readMinutes} menit baca</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cover Image Banner */}
          {coverImageUrl ? (
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-[#eaecf0] shadow-xs">
              <Image
                src={coverImageUrl}
                alt={title}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ) : (
            <div className="aspect-video w-full rounded-2xl bg-[#f2f4f7] border-2 border-dashed border-[#d5d7da] flex flex-col items-center justify-center text-[#717680] text-sm">
              <span>Cover Image Banner (16:9)</span>
            </div>
          )}

          {/* 2-Column Article Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
            {/* Main Article Body */}
            <div className="lg:col-span-8 space-y-6">
              <div
                className="prose prose-slate max-w-none text-[#1e293b] leading-relaxed text-base"
                dangerouslySetInnerHTML={{
                  __html: content
                    .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold mt-6 mb-2 text-[#181d27]">$1</h3>')
                    .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-8 mb-3 text-[#181d27] border-b pb-2 border-[#f2f4f7]">$1</h2>')
                    .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-extrabold mt-8 mb-4 text-[#181d27]">$1</h1>')
                    .replace(/^\> (.*$)/gim, '<blockquote class="border-l-4 border-[#465984] pl-4 py-1 italic bg-[#f8fafc] text-[#475467] rounded-r-lg my-4">$1</blockquote>')
                    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
                    .replace(/\n\n/gim, '</p><p class="my-4 text-[#334155] leading-relaxed">'),
                }}
              />

              {/* Tags */}
              {tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-6 border-t border-[#eaecf0]">
                  <span className="text-xs font-semibold text-[#535862]">Tag Terkait:</span>
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-md text-xs font-medium bg-[#f2f4f7] text-[#344054]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Social Share Bar */}
              <div className="p-4 bg-[#f8fafc] rounded-xl border border-[#eaecf0] flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#344054]">
                  <Share01 className="size-4 text-[#465984]" />
                  <span>Bagikan Artikel Ini:</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    className="px-2.5 py-1.5 rounded-lg bg-white border border-[#d5d7da] hover:bg-[#f9fafb] text-[#344054] font-medium flex items-center gap-1.5"
                  >
                    <Copy01 className="size-3.5" />
                    <span>Salin Tautan</span>
                  </button>
                </div>
              </div>

              {/* Author Bio Card */}
              {author && (
                <div className="p-6 bg-[#f8fafc] rounded-2xl border border-[#eaecf0] flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="relative size-16 rounded-full overflow-hidden bg-[#e2e8f0] border border-[#cbd5e1] shrink-0">
                    {author.avatarUrl ? (
                      <Image
                        src={author.avatarUrl}
                        alt={author.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-lg text-[#465984]">
                        {author.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs uppercase tracking-wider font-semibold text-[#717680]">
                      Tentang Penulis
                    </div>
                    <div className="font-bold text-base text-[#181d27]">
                      {author.name}
                    </div>
                    <div className="text-xs font-medium text-[#465984]">
                      {author.role}
                    </div>
                    {author.bio && (
                      <p className="text-xs text-[#535862] leading-relaxed pt-1">
                        {author.bio}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Sidebar (Table of Contents) */}
            <div className="lg:col-span-4 space-y-6">
              <div className="sticky top-6 p-5 bg-[#f8fafc] rounded-2xl border border-[#eaecf0] space-y-4">
                <div className="font-bold text-sm text-[#181d27] uppercase tracking-wide">
                  Daftar Isi Artikel
                </div>
                {headings.length > 0 ? (
                  <ul className="space-y-2 text-xs">
                    {headings.map((h, i) => (
                      <li
                        key={i}
                        className={`text-[#535862] hover:text-[#181d27] transition flex items-start gap-2 ${
                          h.level === 3 ? 'pl-4 text-[11px]' : 'font-medium'
                        }`}
                      >
                        <span className="text-[#98a2b3]">•</span>
                        <span>{h.text}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-xs text-[#98a2b3] italic">
                    Gunakan heading H2 atau H3 di editor agar daftar isi terisi otomatis.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
