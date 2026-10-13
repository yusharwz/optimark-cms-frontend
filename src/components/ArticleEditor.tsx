'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Save,
  Send,
  Eye,
  Calendar,
  Upload,
  Link as LinkIcon,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Bold,
  Italic,
  List,
  ListOrdered as ListNumbers,
  Quote,
  Clock,
  Sparkles,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
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

  // Basic Fields
  const [title, setTitle] = useState(initialData?.title || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || '');
  const [content, setContent] = useState(initialData?.content || '');

  // SEO Fields
  const [metaTitle, setMetaTitle] = useState(initialData?.metaTitle || '');
  const [metaDescription, setMetaDescription] = useState(initialData?.metaDescription || '');
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
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED' | 'SCHEDULED'>(
    initialData?.status === 'SCHEDULED' ? 'SCHEDULED' : initialData?.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT'
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
    // Fetch categories and people for select dropdowns
    Promise.all([api.getCategories(), api.getPeople()])
      .then(([catList, peopleList]) => {
        setCategories(catList);
        setPeople(peopleList);
      })
      .catch((err) => console.error('Failed to load taxonomy:', err));
  }, []);

  // Auto slug generation from title if empty
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!initialData && (!slug || slug === '')) {
      const autoSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setSlug(autoSlug);
    }
  };

  // Helper: insert Markdown text into content
  const insertFormatting = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('article-content-area') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selection = content.substring(start, end);
    const replacement = `${prefix}${selection || 'Teks'}${suffix}`;

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + replacement.length - suffix.length);
    }, 50);
  };

  // Upload Cover Image via Cloudflare R2 Backend
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      setMessage(null);
      const res = await api.uploadMedia(file, coverImageAlt || title || file.name, true);
      setCoverImageUrl(res.url);
      if (!coverImageAlt) {
        setCoverImageAlt(res.altText || title);
      }
      setMessage({ type: 'success', text: 'Gambar berhasil diupload dan dikonversi ke WebP di Cloudflare R2.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Gagal mengunggah gambar' });
    } finally {
      setUploadingImage(false);
    }
  };

  // Client-side quick Table of Contents detector
  const extractClientToc = (rawContent: string): TocItem[] => {
    if (!rawContent) return [];
    const lines = rawContent.split('\n');
    const items: TocItem[] = [];
    for (const line of lines) {
      const match = line.trim().match(/^(#{1,4})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].replace(/[*_`]/g, '').trim();
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        items.push({ id, level, text });
      }
    }
    return items;
  };

  const detectedToc = extractClientToc(content);

  // Submit Handler
  const handleSubmit = async (publishDirectly = false) => {
    if (!title.trim()) {
      setMessage({ type: 'error', text: 'Judul artikel wajib diisi.' });
      return;
    }
    if (!content.trim()) {
      setMessage({ type: 'error', text: 'Konten artikel wajib diisi.' });
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage(null);

      const finalStatus = publishDirectly ? 'PUBLISHED' : status;
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const payload: Partial<Article> = {
        title,
        slug: slug.trim() || undefined,
        excerpt: excerpt.trim() || undefined,
        content,
        metaTitle: metaTitle.trim() || undefined,
        metaDescription: metaDescription.trim() || undefined,
        canonicalUrl: canonicalUrl.trim() || undefined,
        coverImageUrl: coverImageUrl.trim() || undefined,
        coverImageAlt: coverImageAlt.trim() || undefined,
        tags,
        status: finalStatus,
        featured,
        categoryId: categoryId || undefined,
        authorId: authorId || undefined,
        reviewerId: reviewerId || undefined,
        scheduledAt: finalStatus === 'SCHEDULED' && scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
        publishedAt: finalStatus === 'PUBLISHED' ? new Date().toISOString() : undefined,
      };

      if (initialData?.id) {
        await api.updateArticle(initialData.id, payload);
        setMessage({ type: 'success', text: 'Artikel berhasil diperbarui.' });
      } else {
        const created = await api.createArticle(payload);
        setMessage({ type: 'success', text: 'Artikel berhasil disimpan!' });
        router.push(`/articles/${created.id}`);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Gagal menyimpan artikel.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Top Banner & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/articles"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Daftar Artikel</span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-sm transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-slate-500" />
            <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Draft'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#465984] hover:bg-[#38486d] text-white text-xs font-medium shadow-sm transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>Publish Sekarang</span>
          </button>
        </div>
      </div>

      {/* Alert Notification */}
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-xs ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Grid: Left Editor & Right SEO Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Editor */}
        <div className="lg:col-span-8 space-y-6">
          {/* Article Title Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Judul Artikel (H1 Utama)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Misal: Panduan Lengkap Strategi SEO Berbasis AI untuk 2026"
                className="w-full text-xl font-bold text-slate-900 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#465984] transition"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Custom Slug / URL</span>
                  {initialData?.slug && initialData.slug !== slug && (
                    <span className="text-[11px] text-amber-600 lowercase font-normal">
                      *301 redirect otomatis dibuat
                    </span>
                  )}
                </label>
                <div className="flex rounded-xl border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-[#465984]">
                  <span className="bg-slate-50 px-3 py-2 text-xs text-slate-400 select-none flex items-center border-r border-slate-200">
                    /blog/
                  </span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="panduan-seo-ai-2026"
                    className="w-full px-3 py-2 text-xs text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Ringkasan / Excerpt
                </label>
                <input
                  type="text"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Ringkasan singkat artikel untuk preview feed dan meta fallback"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#465984]"
                />
              </div>
            </div>
          </div>

          {/* Content Writing Area with Formatting Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Tab Header & Toolbar */}
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setActiveTab('write')}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    activeTab === 'write' ? 'bg-[#465984] text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tulis Markdown
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                    activeTab === 'preview' ? 'bg-[#465984] text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview Visual</span>
                </button>
              </div>

              {activeTab === 'write' && (
                <div className="flex flex-wrap items-center gap-1 text-slate-700">
                  <button
                    type="button"
                    title="Heading 2"
                    onClick={() => insertFormatting('\n## ')}
                    className="p-1.5 rounded hover:bg-slate-200 text-slate-700 text-xs flex items-center"
                  >
                    <Heading2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    title="Heading 3"
                    onClick={() => insertFormatting('\n### ')}
                    className="p-1.5 rounded hover:bg-slate-200 text-slate-700 text-xs flex items-center"
                  >
                    <Heading3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    title="Heading 4"
                    onClick={() => insertFormatting('\n#### ')}
                    className="p-1.5 rounded hover:bg-slate-200 text-slate-700 text-xs flex items-center"
                  >
                    <Heading4 className="w-4 h-4" />
                  </button>
                  <div className="h-4 w-[1px] bg-slate-300 mx-1" />
                  <button
                    type="button"
                    title="Tebal (Bold)"
                    onClick={() => insertFormatting('**', '**')}
                    className="p-1.5 rounded hover:bg-slate-200 text-slate-700"
                  >
                    <Bold className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    title="Miring (Italic)"
                    onClick={() => insertFormatting('*', '*')}
                    className="p-1.5 rounded hover:bg-slate-200 text-slate-700"
                  >
                    <Italic className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    title="Internal / External Link"
                    onClick={() => insertFormatting('[Teks Link](', ')') }
                    className="p-1.5 rounded hover:bg-slate-200 text-slate-700"
                  >
                    <LinkIcon className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    title="Kutipan (Quote)"
                    onClick={() => insertFormatting('\n> ')}
                    className="p-1.5 rounded hover:bg-slate-200 text-slate-700"
                  >
                    <Quote className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    title="Daftar Bullet"
                    onClick={() => insertFormatting('\n- ')}
                    className="p-1.5 rounded hover:bg-slate-200 text-slate-700"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    title="Daftar Angka"
                    onClick={() => insertFormatting('\n1. ')}
                    className="p-1.5 rounded hover:bg-slate-200 text-slate-700"
                  >
                    <ListNumbers className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Editor Area */}
            {activeTab === 'write' ? (
              <textarea
                id="article-content-area"
                rows={22}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Tulis artikel di sini menggunakan Markdown atau teks terstruktur... Gunakan ## untuk Subheading H2, ### untuk H3, dan #### untuk H4."
                className="w-full p-6 text-sm font-mono text-slate-800 leading-relaxed focus:outline-none resize-y"
              />
            ) : (
              <div className="p-8 prose prose-slate max-w-none min-h-[400px]">
                <h1 className="text-2xl font-bold text-slate-900 mb-4">{title || 'Judul Artikel'}</h1>
                {coverImageUrl && (
                  <div className="my-4 rounded-xl overflow-hidden border border-slate-200 max-h-80 relative">
                    <img src={coverImageUrl} alt={coverImageAlt || title} className="w-full object-cover" />
                  </div>
                )}
                <div className="whitespace-pre-wrap text-sm text-slate-800 leading-relaxed">
                  {content || 'Belum ada konten ditulis.'}
                </div>
              </div>
            )}

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-4">
                <span>{content.split(/\s+/).filter(Boolean).length} kata</span>
                <span>{detectedToc.length} heading terdeteksi</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Est. Baca: {Math.max(1, Math.ceil(content.split(/\s+/).filter(Boolean).length / 200))} menit</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): SEO & Publishing Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          {/* Status & Schedule Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Status & Publikasi
              </span>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  status === 'PUBLISHED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : status === 'SCHEDULED'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {status}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-slate-50 border border-slate-100">
                <input
                  type="radio"
                  name="status_choice"
                  checked={status === 'DRAFT'}
                  onChange={() => setStatus('DRAFT')}
                  className="text-[#465984] focus:ring-[#465984]"
                />
                <span className="text-slate-700 font-medium">Simpan sebagai Draft</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-slate-50 border border-slate-100">
                <input
                  type="radio"
                  name="status_choice"
                  checked={status === 'PUBLISHED'}
                  onChange={() => setStatus('PUBLISHED')}
                  className="text-[#465984] focus:ring-[#465984]"
                />
                <span className="text-slate-700 font-medium">Publish Sekarang</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-slate-50 border border-slate-100">
                <input
                  type="radio"
                  name="status_choice"
                  checked={status === 'SCHEDULED'}
                  onChange={() => setStatus('SCHEDULED')}
                  className="text-[#465984] focus:ring-[#465984]"
                />
                <span className="text-slate-700 font-medium">Jadwalkan Publish</span>
              </label>

              {status === 'SCHEDULED' && (
                <div className="pt-2">
                  <label className="block text-[11px] text-slate-500 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#465984]" />
                    <span>Waktu Tayang Otomatis:</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984]"
                  />
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-center gap-2 text-xs cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="rounded text-[#465984] focus:ring-[#465984]"
                />
                <span>Jadikan Artikel Unggulan (Featured)</span>
              </label>
            </div>
          </div>

          {/* Featured Image & WebP Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
              Featured Image & Alt Text
            </span>

            {coverImageUrl ? (
              <div className="space-y-2">
                <div className="rounded-xl overflow-hidden border border-slate-200 relative aspect-video bg-slate-100">
                  <img src={coverImageUrl} alt={coverImageAlt || title} className="w-full h-full object-cover" />
                </div>
                <button
                  type="button"
                  onClick={() => setCoverImageUrl('')}
                  className="text-[11px] text-rose-600 hover:underline"
                >
                  Hapus / Ganti Gambar
                </button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-slate-200 hover:border-[#465984] rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition bg-slate-50/50">
                <Upload className="w-6 h-6 text-slate-400 mb-2" />
                <span className="text-xs font-medium text-slate-700">
                  {uploadingImage ? 'Mengunggah ke R2...' : 'Upload Featured Image'}
                </span>
                <span className="text-[11px] text-slate-400 mt-1">Otomatis konversi ke WebP di Cloudflare R2</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="hidden"
                />
              </label>
            )}

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Image Alt Text (SEO Crucial)
              </label>
              <input
                type="text"
                value={coverImageAlt}
                onChange={(e) => setCoverImageAlt(e.target.value)}
                placeholder="Deskripsi gambar untuk Google Image Search"
                className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984]"
              />
            </div>
          </div>

          {/* SEO Metadata Form */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
              Pengaturan Meta SEO
            </span>

            {/* Meta Title */}
            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <label className="font-medium text-slate-600">Meta Title</label>
                <span
                  className={
                    metaTitle.length > 60
                      ? 'text-rose-500 font-semibold'
                      : 'text-slate-400'
                  }
                >
                  {metaTitle.length}/60
                </span>
              </div>
              <input
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder={title || 'Judul meta untuk Google SERP'}
                className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984]"
              />
            </div>

            {/* Meta Description */}
            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <label className="font-medium text-slate-600">Meta Description</label>
                <span
                  className={
                    metaDescription.length > 160
                      ? 'text-rose-500 font-semibold'
                      : 'text-slate-400'
                  }
                >
                  {metaDescription.length}/160
                </span>
              </div>
              <textarea
                rows={3}
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder={excerpt || 'Deskripsi meta yang muncul di hasil pencarian'}
                className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984]"
              />
            </div>

            {/* Canonical URL */}
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Canonical URL (Opsional)
              </label>
              <input
                type="text"
                value={canonicalUrl}
                onChange={(e) => setCanonicalUrl(e.target.value)}
                placeholder="https://optimark.ai/blog/slug-asli"
                className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984]"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Tags (Pisahkan dengan koma)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="SEO, Content Marketing, AI"
                className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984]"
              />
            </div>
          </div>

          {/* E-E-A-T & Taxonomy Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
              E-E-A-T & Taksonomi
            </span>

            {/* Category */}
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Kategori Topik</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984] bg-white"
              >
                <option value="">Pilih Kategori...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Author */}
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Penulis (Author)</label>
              <select
                value={authorId}
                onChange={(e) => setAuthorId(e.target.value)}
                className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984] bg-white"
              >
                <option value="">Pilih Penulis...</option>
                {people
                  .filter((p) => p.type === 'AUTHOR' || p.type === 'BOTH')
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.role})
                    </option>
                  ))}
              </select>
            </div>

            {/* Reviewer */}
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Reviewer (E-E-A-T Expert)</label>
              <select
                value={reviewerId}
                onChange={(e) => setReviewerId(e.target.value)}
                className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984] bg-white"
              >
                <option value="">Tidak ada reviewer khusus</option>
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

          {/* Live Google SERP Snippet Preview */}
          <GoogleSerpPreview
            title={title}
            metaTitle={metaTitle}
            metaDescription={metaDescription}
            slug={slug}
          />

          {/* Table of Contents Preview */}
          <TableOfContentsPreview items={detectedToc} />
        </div>
      </div>
    </div>
  );
}
