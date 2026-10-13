'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save01,
  Send01,
  Eye,
  Calendar,
  Upload01,
  Link01,
  Bold01,
  Italic01,
  List,
  Clock,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Globe01,
} from '@untitledui/icons';
import { api } from '@/lib/api';
import { Article, Category, Person, TocItem } from '@/lib/types';
import { GoogleSerpPreview } from './GoogleSerpPreview';
import { TableOfContentsPreview } from './TableOfContentsPreview';
import Link from 'next/link';

interface ArticleEditorProps {
  initialData?: Article;
}

export function ArticleEditor({ initialData }: ArticleEditorProps) {
  const router = useRouter();

  // Translations Extraction from initialData
  const initialId = initialData?.translations?.find((t) => t.locale === 'id');
  const initialEn = initialData?.translations?.find((t) => t.locale === 'en');

  // Active locale tab ('id' | 'en')
  const [activeLocale, setActiveLocale] = useState<'id' | 'en'>('id');

  // ID Locale Fields
  const [titleId, setTitleId] = useState(initialId?.title || initialData?.title || '');
  const [excerptId, setExcerptId] = useState(initialId?.excerpt || initialData?.excerpt || '');
  const [contentId, setContentId] = useState(initialId?.content || initialData?.content || '');
  const [metaTitleId, setMetaTitleId] = useState(initialId?.metaTitle || initialData?.metaTitle || '');
  const [metaDescriptionId, setMetaDescriptionId] = useState(initialId?.metaDescription || initialData?.metaDescription || '');

  // EN Locale Fields
  const [titleEn, setTitleEn] = useState(initialEn?.title || '');
  const [excerptEn, setExcerptEn] = useState(initialEn?.excerpt || '');
  const [contentEn, setContentEn] = useState(initialEn?.content || '');
  const [metaTitleEn, setMetaTitleEn] = useState(initialEn?.metaTitle || '');
  const [metaDescriptionEn, setMetaDescriptionEn] = useState(initialEn?.metaDescription || '');

  // Shared Core Fields
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [canonicalUrl, setCanonicalUrl] = useState(initialData?.canonicalUrl || '');
  const [coverImageUrl, setCoverImageUrl] = useState(initialData?.coverImageUrl || '');
  const [coverImageAlt, setCoverImageAlt] = useState(initialData?.coverImageAlt || '');
  const [tagsInput, setTagsInput] = useState(initialData?.tags?.join(', ') || '');

  // Relations & E-E-A-T
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || '');
  const [authorId, setAuthorId] = useState(initialData?.authorId || '');
  const [reviewerId, setReviewerId] = useState(initialData?.reviewerId || '');
  const [featured, setFeatured] = useState(initialData?.featured || false);

  // Status & Publishing
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED' | 'SCHEDULED' | 'ARCHIVED'>(
    initialData?.status || 'DRAFT'
  );
  const [scheduledAt, setScheduledAt] = useState(
    initialData?.scheduledAt ? new Date(initialData.scheduledAt).toISOString().slice(0, 16) : ''
  );

  // Options & Meta Lists
  const [categories, setCategories] = useState<Category[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    Promise.all([api.getCategories(), api.getPeople()])
      .then(([catList, peopleList]) => {
        setCategories(catList);
        setPeople(peopleList);
      })
      .catch((err) => console.error('Failed to load taxonomy:', err));
  }, []);

  // Current values based on activeLocale
  const currentTitle = activeLocale === 'id' ? titleId : titleEn;
  const currentExcerpt = activeLocale === 'id' ? excerptId : excerptEn;
  const currentContent = activeLocale === 'id' ? contentId : contentEn;
  const currentMetaTitle = activeLocale === 'id' ? metaTitleId : metaTitleEn;
  const currentMetaDesc = activeLocale === 'id' ? metaDescriptionId : metaDescriptionEn;

  const handleTitleChange = (val: string) => {
    if (activeLocale === 'id') {
      setTitleId(val);
      if (!initialData && (!slug || slug === '')) {
        const autoSlug = val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '');
        setSlug(autoSlug);
      }
    } else {
      setTitleEn(val);
    }
  };

  const handleExcerptChange = (val: string) => {
    if (activeLocale === 'id') setExcerptId(val);
    else setExcerptEn(val);
  };

  const handleContentChange = (val: string) => {
    if (activeLocale === 'id') setContentId(val);
    else setContentEn(val);
  };

  const handleMetaTitleChange = (val: string) => {
    if (activeLocale === 'id') setMetaTitleId(val);
    else setMetaTitleEn(val);
  };

  const handleMetaDescChange = (val: string) => {
    if (activeLocale === 'id') setMetaDescriptionId(val);
    else setMetaDescriptionEn(val);
  };

  const insertFormatting = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('article-content-area') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selection = currentContent.substring(start, end);
    const replacement = `${prefix}${selection || 'Teks'}${suffix}`;

    const newContent = currentContent.substring(0, start) + replacement + currentContent.substring(end);
    handleContentChange(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  // Image Upload Handler to Cloudflare R2
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const media = await api.uploadMedia(file, coverImageAlt || currentTitle || 'Cover Image');
      setCoverImageUrl(media.url);
      setMessage({ type: 'success', text: 'Gambar berhasil diunggah ke storage Cloudflare R2!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Gagal mengunggah gambar' });
    } finally {
      setUploadingImage(false);
    }
  };

  // Save / Publish submit logic
  const handleSubmit = async (targetStatus?: 'DRAFT' | 'PUBLISHED') => {
    const finalStatus = targetStatus || status;

    if (!titleId && !titleEn) {
      setMessage({ type: 'error', text: 'Judul artikel wajib diisi (minimal Bahasa Indonesia)!' });
      return;
    }

    if (!slug) {
      setMessage({ type: 'error', text: 'Slug URL wajib diisi!' });
      return;
    }

    const cleanSlug = slug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    setIsSubmitting(true);
    setMessage(null);

    const tags = tagsInput
      ? tagsInput.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    const payload = {
      title: titleId || titleEn,
      slug: cleanSlug,
      excerpt: excerptId || excerptEn || undefined,
      content: contentId || contentEn,
      metaTitle: metaTitleId || metaTitleEn || undefined,
      metaDescription: metaDescriptionId || metaDescriptionEn || undefined,
      canonicalUrl: canonicalUrl || undefined,
      coverImageUrl: coverImageUrl || undefined,
      coverImageAlt: coverImageAlt || undefined,
      tags,
      categoryId: categoryId || undefined,
      authorId: authorId || undefined,
      reviewerId: reviewerId || undefined,
      featured,
      status: finalStatus,
      scheduledAt: finalStatus === 'SCHEDULED' && scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      translations: {
        id: {
          title: titleId || titleEn,
          excerpt: excerptId || excerptEn || undefined,
          content: contentId || contentEn,
          metaTitle: metaTitleId || metaTitleEn || undefined,
          metaDescription: metaDescriptionId || metaDescriptionEn || undefined,
        },
        en: {
          title: titleEn || titleId,
          excerpt: excerptEn || excerptId || undefined,
          content: contentEn || contentId,
          metaTitle: metaTitleEn || metaTitleId || undefined,
          metaDescription: metaDescriptionEn || metaDescriptionId || undefined,
        },
      },
    };

    try {
      if (initialData?.id) {
        await api.updateArticle(initialData.id, payload);
        setMessage({
          type: 'success',
          text: 'Artikel berhasil diperbarui & disinkronkan ke Landing Page serta Sitemap XML!',
        });
      } else {
        const created = await api.createArticle(payload);
        setMessage({
          type: 'success',
          text: 'Artikel baru berhasil dibuat & disinkronkan ke Landing Page serta Sitemap XML!',
        });
        setTimeout(() => router.push(`/articles/${created.id}`), 1200);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Gagal menyimpan artikel' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reading time & word count for active locale
  const wordCount = currentContent.trim() ? currentContent.trim().split(/\s+/).length : 0;
  const readMinutes = Math.max(1, Math.ceil(wordCount / 200));

  // Validation status for languages
  const hasIdContent = Boolean(titleId.trim() && contentId.trim());
  const hasEnContent = Boolean(titleEn.trim() && contentEn.trim());

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-[#eaecf0]">
        <div className="flex items-center gap-3">
          <Link
            href="/articles"
            className="p-2 text-[#535862] hover:text-[#181d27] hover:bg-[#f8f9fa] rounded-lg transition-colors border border-[#d5d7da]"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-[#181d27]">
                {initialData ? 'Edit Artikel Blog' : 'Tulis Artikel Baru'}
              </h1>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                  status === 'PUBLISHED'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : status === 'SCHEDULED'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : status === 'ARCHIVED'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-[#f8f9fa] text-[#535862] border border-[#d5d7da]'
                }`}
              >
                {status}
              </span>
            </div>
            <p className="text-xs text-[#535862] mt-0.5">
              Kelola konten dwibahasa (ID & EN), E-E-A-T persona, dan sinkronisasi sitemap XML otomatis.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          {initialData?.contentUpdatedAt && (
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-[#535862] bg-[#f8f9fa] border border-[#eaecf0] px-3 py-1.5 rounded-lg">
              <Clock className="size-3.5 text-[#717680]" />
              <span>
                Lastmod:{' '}
                <strong className="text-[#181d27]">
                  {new Date(initialData.contentUpdatedAt).toLocaleString('id-ID', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </strong>
              </span>
            </div>
          )}

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSubmit('DRAFT')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-[#414651] bg-white border border-[#d5d7da] hover:bg-[#f8f9fa] rounded-lg shadow-xs transition-colors disabled:opacity-50"
          >
            <Save01 className="size-4 text-[#535862]" />
            Simpan Draft
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSubmit('PUBLISHED')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#465984] hover:bg-[#38476a] rounded-lg shadow-xs transition-colors disabled:opacity-50"
          >
            <Send01 className="size-4" />
            {status === 'PUBLISHED' ? 'Update & Sync' : 'Publish Sekarang'}
          </button>
        </div>
      </div>

      {/* Alert Notification */}
      {message && (
        <div
          className={`p-4 rounded-xl flex items-start gap-3 border ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="size-5 shrink-0 text-emerald-600 mt-0.5" />
          ) : (
            <AlertCircle className="size-5 shrink-0 text-red-600 mt-0.5" />
          )}
          <div className="text-sm font-medium leading-relaxed">{message.text}</div>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Language Tabs + Content Editor (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Language Selector Header */}
          <div className="bg-white p-4 rounded-xl border border-[#eaecf0] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#535862] uppercase tracking-wider flex items-center gap-1.5">
                <Globe01 className="size-4 text-[#465984]" />
                Bahasa Konten
              </span>
              <span className="text-xs text-[#717680]">• Pilih tab untuk mengedit copy lokal</span>
            </div>

            <div className="flex items-center gap-2 bg-[#f8f9fa] p-1 rounded-lg border border-[#eaecf0]">
              <button
                type="button"
                onClick={() => setActiveLocale('id')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                  activeLocale === 'id'
                    ? 'bg-white text-[#181d27] shadow-xs font-semibold'
                    : 'text-[#535862] hover:text-[#181d27]'
                }`}
              >
                <span>🇮🇩</span>
                <span>Bahasa Indonesia</span>
                {hasIdContent && (
                  <span className="size-1.5 rounded-full bg-emerald-500 ml-0.5" title="Konten ID Terisi" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveLocale('en')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                  activeLocale === 'en'
                    ? 'bg-white text-[#181d27] shadow-xs font-semibold'
                    : 'text-[#535862] hover:text-[#181d27]'
                }`}
              >
                <span>🇬🇧</span>
                <span>English</span>
                {hasEnContent ? (
                  <span className="size-1.5 rounded-full bg-emerald-500 ml-0.5" title="Konten EN Terisi" />
                ) : (
                  <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 rounded font-normal">
                    Draft
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Title Input */}
          <div className="bg-white p-5 rounded-xl border border-[#eaecf0] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-[#181d27]">
                Judul Artikel ({activeLocale === 'id' ? 'Bahasa Indonesia' : 'English'}) <span className="text-red-500">*</span>
              </label>
              <span className="text-xs text-[#717680]">
                {currentTitle.length} karakter
              </span>
            </div>
            <input
              type="text"
              value={currentTitle}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder={
                activeLocale === 'id'
                  ? 'Contoh: Panduan Riset Keyword SEO untuk Bisnis Lokal 2026'
                  : 'Example: Local Business Keyword Research Guide for 2026'
              }
              className="w-full px-3.5 py-2.5 text-base font-medium border border-[#d5d7da] rounded-lg shadow-xs focus:ring-2 focus:ring-[#465984] focus:outline-hidden"
            />

            {/* Excerpt Input */}
            <div className="pt-2 space-y-1.5">
              <label className="block text-xs font-medium text-[#535862]">
                Ringkasan Artikel (Excerpt)
              </label>
              <textarea
                rows={2}
                value={currentExcerpt}
                onChange={(e) => handleExcerptChange(e.target.value)}
                placeholder={
                  activeLocale === 'id'
                    ? 'Ringkasan singkat 1-2 kalimat untuk kartu artikel blog dan cuplikan media sosial...'
                    : 'Short 1-2 sentence excerpt for blog cards and social previews...'
                }
                className="w-full px-3.5 py-2 text-sm border border-[#d5d7da] rounded-lg shadow-xs focus:ring-2 focus:ring-[#465984] focus:outline-hidden"
              />
            </div>
          </div>

          {/* Markdown Content Editor */}
          <div className="bg-white rounded-xl border border-[#eaecf0] shadow-xs overflow-hidden">
            {/* Editor Toolbar & Tab Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 border-b border-[#eaecf0] bg-[#fafafa]">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => insertFormatting('## ')}
                  title="Heading 2"
                  className="p-1.5 text-[#535862] hover:text-[#181d27] hover:bg-[#eaecf0] rounded font-bold text-xs"
                >
                  H2
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('### ')}
                  title="Heading 3"
                  className="p-1.5 text-[#535862] hover:text-[#181d27] hover:bg-[#eaecf0] rounded font-bold text-xs"
                >
                  H3
                </button>
                <div className="w-px h-4 bg-[#d5d7da] mx-1" />
                <button
                  type="button"
                  onClick={() => insertFormatting('**', '**')}
                  title="Bold"
                  className="p-1.5 text-[#535862] hover:text-[#181d27] hover:bg-[#eaecf0] rounded"
                >
                  <Bold01 className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('*', '*')}
                  title="Italic"
                  className="p-1.5 text-[#535862] hover:text-[#181d27] hover:bg-[#eaecf0] rounded"
                >
                  <Italic01 className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('- ')}
                  title="Bullet List"
                  className="p-1.5 text-[#535862] hover:text-[#181d27] hover:bg-[#eaecf0] rounded"
                >
                  <List className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('> ')}
                  title="Quote Block"
                  className="p-1.5 text-[#535862] hover:text-[#181d27] hover:bg-[#eaecf0] rounded font-serif italic text-sm"
                >
                  &quot;&quot;
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('> **Catatan:** ')}
                  title="Callout Box"
                  className="p-1.5 text-[#535862] hover:text-[#181d27] hover:bg-[#eaecf0] rounded text-xs font-medium"
                >
                  Callout
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('[Tautan](', ')')}
                  title="Link"
                  className="p-1.5 text-[#535862] hover:text-[#181d27] hover:bg-[#eaecf0] rounded"
                >
                  <Link01 className="size-4" />
                </button>
              </div>

              {/* Write vs Preview Toggle */}
              <div className="flex items-center gap-1 bg-[#eaecf0] p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setActiveTab('write')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    activeTab === 'write' ? 'bg-white text-[#181d27] shadow-xs' : 'text-[#535862]'
                  }`}
                >
                  Tulis Markdown
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    activeTab === 'preview' ? 'bg-white text-[#181d27] shadow-xs' : 'text-[#535862]'
                  }`}
                >
                  <Eye className="size-3.5 inline mr-1" />
                  Pratinjau
                </button>
              </div>
            </div>

            {/* Editor Area */}
            {activeTab === 'write' ? (
              <textarea
                id="article-content-area"
                rows={18}
                value={currentContent}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder={
                  activeLocale === 'id'
                    ? 'Tulis isi artikel dalam format Markdown...\nGunakan ## untuk Sub-judul (H2) dan ### untuk H3 agar otomatis membentuk Daftar Isi.'
                    : 'Write article content in Markdown format...\nUse ## for Headings (H2) and ### for H3 to auto-generate the Table of Contents.'
                }
                className="w-full p-4 text-sm font-mono leading-relaxed border-0 focus:ring-0 focus:outline-hidden resize-y"
              />
            ) : (
              <div className="p-6 prose prose-slate max-w-none min-h-[380px]">
                {currentContent.trim() ? (
                  <div className="space-y-4">
                    {currentContent.split('\n\n').map((paragraph, idx) => {
                      if (paragraph.startsWith('### ')) {
                        return (
                          <h3 key={idx} className="text-lg font-bold text-[#181d27] mt-4 mb-2">
                            {paragraph.replace(/^###\s+/, '')}
                          </h3>
                        );
                      }
                      if (paragraph.startsWith('## ')) {
                        return (
                          <h2 key={idx} className="text-xl font-bold text-[#181d27] mt-6 mb-3 pb-1 border-b border-[#eaecf0]">
                            {paragraph.replace(/^##\s+/, '')}
                          </h2>
                        );
                      }
                      if (paragraph.startsWith('> ')) {
                        return (
                          <blockquote key={idx} className="border-l-4 border-[#465984] pl-4 py-1 italic text-[#535862] bg-[#f8f9fa] rounded-r">
                            {paragraph.replace(/^>\s+/, '')}
                          </blockquote>
                        );
                      }
                      return (
                        <p key={idx} className="text-sm text-[#414651] leading-relaxed">
                          {paragraph}
                        </p>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-[#717680] italic">Belum ada konten untuk ditampilkan.</p>
                )}
              </div>
            )}

            {/* Editor Footer Stats */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#f8f9fa] border-t border-[#eaecf0] text-xs text-[#717680]">
              <div className="flex items-center gap-3">
                <span>{wordCount} kata</span>
                <span>•</span>
                <span>~{readMinutes} menit baca</span>
                <span>•</span>
                <span>Bahasa: <strong>{activeLocale.toUpperCase()}</strong></span>
              </div>
              <span className="text-[11px]">Format: Markdown H1-H4 & Callout didukung</span>
            </div>
          </div>

          {/* SEO Metadata Box */}
          <div className="bg-white p-5 rounded-xl border border-[#eaecf0] shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#eaecf0] pb-3">
              <h3 className="text-sm font-semibold text-[#181d27] flex items-center gap-2">
                <Globe01 className="size-4 text-[#465984]" />
                Pengaturan SEO & Cuplikan Google ({activeLocale.toUpperCase()})
              </h3>
              <span className="text-xs text-[#717680]">Optimasi Meta Search</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#535862] mb-1">
                  Meta Title ({activeLocale.toUpperCase()})
                </label>
                <input
                  type="text"
                  value={currentMetaTitle}
                  onChange={(e) => handleMetaTitleChange(e.target.value)}
                  placeholder={currentTitle || 'Judul artikel untuk Google Search...'}
                  className="w-full px-3 py-2 text-sm border border-[#d5d7da] rounded-lg shadow-xs focus:ring-2 focus:ring-[#465984] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#535862] mb-1">
                  Meta Description ({activeLocale.toUpperCase()})
                </label>
                <textarea
                  rows={3}
                  value={currentMetaDesc}
                  onChange={(e) => handleMetaDescChange(e.target.value)}
                  placeholder={currentExcerpt || 'Deskripsi singkat 150-160 karakter untuk hasil pencarian...'}
                  className="w-full px-3 py-2 text-sm border border-[#d5d7da] rounded-lg shadow-xs focus:ring-2 focus:ring-[#465984] focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Taxonomy, Media, E-E-A-T, & Live SERP (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Live Google Search Preview (Interactive) */}
          <GoogleSerpPreview
            title={currentTitle}
            metaTitle={currentMetaTitle}
            metaDescription={currentMetaDesc}
            slug={activeLocale === 'en' ? `en/blog/${slug}` : slug}
          />

          {/* Live Table of Contents Preview */}
          <TableOfContentsPreview content={currentContent} />

          {/* URL & Publishing Settings Box */}
          <div className="bg-white p-5 rounded-xl border border-[#eaecf0] shadow-xs space-y-4">
            <h3 className="text-sm font-semibold text-[#181d27] border-b border-[#eaecf0] pb-3">
              Parameter Publikasi & URL
            </h3>

            {/* Slug URL */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#535862]">
                Slug URL (Kebab-case Lowercase) <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center">
                <span className="text-xs text-[#717680] bg-[#f8f9fa] border border-r-0 border-[#d5d7da] px-2.5 py-2 rounded-l-lg select-none">
                  /blog/
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) =>
                    setSlug(
                      e.target.value
                        .toLowerCase()
                        .replace(/\s+/g, '-')
                        .replace(/[^a-z0-9-]/g, '')
                    )
                  }
                  placeholder="panduan-seo-ai-2026"
                  className="w-full px-3 py-2 text-sm border border-[#d5d7da] rounded-r-lg shadow-xs focus:ring-2 focus:ring-[#465984] focus:outline-hidden"
                />
              </div>
              <p className="text-[11px] text-[#717680]">
                Wajib unik. Jangan gunakan spasi atau karakter khusus.
              </p>
            </div>

            {/* Status Select */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#535862]">Status Publikasi</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 text-sm border border-[#d5d7da] rounded-lg shadow-xs focus:ring-2 focus:ring-[#465984] focus:outline-hidden bg-white"
              >
                <option value="DRAFT">DRAFT (Disembunyikan dari Sitemap)</option>
                <option value="PUBLISHED">PUBLISHED (Aktif di Sitemap & Landing)</option>
                <option value="SCHEDULED">SCHEDULED (Jadwalkan Rilis Otomatis)</option>
                <option value="ARCHIVED">ARCHIVED (Diarsipkan / Keluar Sitemap)</option>
              </select>
            </div>

            {/* Schedule Input if SCHEDULED */}
            {status === 'SCHEDULED' && (
              <div className="space-y-1.5 bg-blue-50/50 p-3 rounded-lg border border-blue-200">
                <label className="block text-xs font-medium text-blue-900 flex items-center gap-1.5">
                  <Calendar className="size-3.5" />
                  Jadwal Waktu Rilis Otomatis
                </label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-blue-300 rounded shadow-xs focus:ring-2 focus:ring-[#465984] bg-white"
                />
              </div>
            )}

            {/* Featured Checkbox */}
            <div className="pt-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="featured-article-toggle"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="size-4 text-[#465984] rounded border-[#d5d7da] focus:ring-[#465984]"
              />
              <label htmlFor="featured-article-toggle" className="text-xs font-medium text-[#181d27]">
                Jadikan Artikel Unggulan (Featured Post)
              </label>
            </div>
          </div>

          {/* E-E-A-T Taxonomy & Authors */}
          <div className="bg-white p-5 rounded-xl border border-[#eaecf0] shadow-xs space-y-4">
            <h3 className="text-sm font-semibold text-[#181d27] border-b border-[#eaecf0] pb-3">
              Kategori & E-E-A-T Persona
            </h3>

            {/* Category Select */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#535862]">Kategori Blog</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#d5d7da] rounded-lg shadow-xs focus:ring-2 focus:ring-[#465984] focus:outline-hidden bg-white"
              >
                <option value="">Pilih Kategori...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Author Select */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#535862]">Penulis (Author)</label>
              <select
                value={authorId}
                onChange={(e) => setAuthorId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#d5d7da] rounded-lg shadow-xs focus:ring-2 focus:ring-[#465984] focus:outline-hidden bg-white"
              >
                <option value="">Pilih Penulis E-E-A-T...</option>
                {people
                  .filter((p) => p.type === 'AUTHOR' || p.type === 'BOTH')
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.role})
                    </option>
                  ))}
              </select>
            </div>

            {/* Reviewer Select */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#535862]">
                Editorial Reviewer (E-E-A-T)
              </label>
              <select
                value={reviewerId}
                onChange={(e) => setReviewerId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#d5d7da] rounded-lg shadow-xs focus:ring-2 focus:ring-[#465984] focus:outline-hidden bg-white"
              >
                <option value="">Pilih Reviewer (Opsional)...</option>
                {people
                  .filter((p) => p.type === 'REVIEWER' || p.type === 'BOTH')
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.role})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Cover Media & Cloudflare R2 Upload */}
          <div className="bg-white p-5 rounded-xl border border-[#eaecf0] shadow-xs space-y-4">
            <h3 className="text-sm font-semibold text-[#181d27] border-b border-[#eaecf0] pb-3">
              Gambar Sampul (Cover Image)
            </h3>

            {coverImageUrl ? (
              <div className="space-y-3">
                <div className="relative aspect-video rounded-lg overflow-hidden border border-[#eaecf0] bg-slate-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={coverImageUrl}
                    alt={coverImageAlt || 'Cover'}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setCoverImageUrl('')}
                  className="text-xs text-red-600 hover:text-red-700 font-medium"
                >
                  Hapus Gambar
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-[#d5d7da] hover:border-[#465984] rounded-lg p-6 text-center space-y-2 transition-colors">
                <Upload01 className="size-8 mx-auto text-[#717680]" />
                <div className="text-xs text-[#535862]">
                  <label className="text-[#465984] font-semibold hover:underline cursor-pointer">
                    <span>Pilih file gambar</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="sr-only"
                    />
                  </label>{' '}
                  atau seret ke sini
                </div>
                <p className="text-[11px] text-[#717680]">PNG, JPG, WebP hingga 10MB</p>
                {uploadingImage && (
                  <p className="text-xs text-[#465984] font-medium animate-pulse">Mengunggah ke Cloudflare R2...</p>
                )}
              </div>
            )}

            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-medium text-[#535862]">Cover Image Alt Text</label>
              <input
                type="text"
                value={coverImageAlt}
                onChange={(e) => setCoverImageAlt(e.target.value)}
                placeholder="Deskripsi gambar untuk aksesibilitas dan SEO gambar Google..."
                className="w-full px-3 py-2 text-xs border border-[#d5d7da] rounded-lg shadow-xs focus:ring-2 focus:ring-[#465984]"
              />
            </div>
          </div>

          {/* Tags & Canonical Box */}
          <div className="bg-white p-5 rounded-xl border border-[#eaecf0] shadow-xs space-y-4">
            <h3 className="text-sm font-semibold text-[#181d27] border-b border-[#eaecf0] pb-3">
              Tags & Canonical URL
            </h3>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#535862]">Tags (Pisahkan koma)</label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="SEO, Keyword Research, UMKM, Googlebot"
                className="w-full px-3 py-2 text-xs border border-[#d5d7da] rounded-lg shadow-xs focus:ring-2 focus:ring-[#465984]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#535862]">Canonical URL (Opsional)</label>
              <input
                type="url"
                value={canonicalUrl}
                onChange={(e) => setCanonicalUrl(e.target.value)}
                placeholder="https://optimark.ai/blog/..."
                className="w-full px-3 py-2 text-xs border border-[#d5d7da] rounded-lg shadow-xs focus:ring-2 focus:ring-[#465984]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
