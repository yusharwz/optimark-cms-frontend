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
    Promise.all([api.getCategories(), api.getPeople()])
      .then(([catList, peopleList]) => {
        setCategories(catList);
        setPeople(peopleList);
      })
      .catch((err) => console.error('Failed to load taxonomy:', err));
  }, []);

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
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#535862] hover:text-[#181d27] transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          <span>Kembali ke Daftar Artikel</span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#d5d7da] bg-white hover:bg-[#f9fafb] text-[#344054] text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Save01 className="size-4 text-[#717680]" />
            <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Draft'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#465984] hover:bg-[#3f5077] text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Send01 className="size-4 text-white" />
            <span>Publish Sekarang</span>
          </button>
        </div>
      </div>

      {/* Alert Notification */}
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-xs font-medium ${
            message.type === 'success'
              ? 'bg-[#ecfdf3] text-[#079455] border border-[#abefc6]'
              : 'bg-[#fef3f2] text-[#d92d20] border border-[#fecdca]'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="size-4 text-[#079455] shrink-0" />
          ) : (
            <AlertCircle className="size-4 text-[#d92d20] shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Grid: Left Editor & Right SEO Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Editor */}
        <div className="lg:col-span-8 space-y-6">
          {/* Article Title Card */}
          <div className="bg-white p-6 rounded-2xl border border-[#eaecf0] shadow-xs space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#344054] uppercase tracking-wider mb-1.5">
                Judul Artikel (H1 Utama)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Misal: Panduan Lengkap Strategi SEO Berbasis AI untuk 2026"
                className="w-full text-xl font-bold text-[#181d27] border border-[#d5d7da] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#465984] transition"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#344054] uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Custom Slug / URL</span>
                  {initialData?.slug && initialData.slug !== slug && (
                    <span className="text-[11px] text-[#dc6803] font-medium lowercase">
                      *301 redirect otomatis dibuat
                    </span>
                  )}
                </label>
                <div className="flex rounded-xl border border-[#d5d7da] overflow-hidden focus-within:ring-2 focus-within:ring-[#465984]">
                  <span className="bg-[#f9fafb] px-3 py-2 text-xs text-[#717680] select-none flex items-center border-r border-[#d5d7da] font-mono">
                    /blog/
                  </span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="panduan-seo-ai-2026"
                    className="w-full px-3 py-2 text-xs text-[#181d27] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#344054] uppercase tracking-wider mb-1.5">
                  Ringkasan / Excerpt
                </label>
                <input
                  type="text"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Ringkasan singkat artikel untuk preview feed dan meta fallback"
                  className="w-full px-3 py-2 border border-[#d5d7da] rounded-xl text-xs text-[#181d27] focus:outline-none focus:ring-2 focus:ring-[#465984]"
                />
              </div>
            </div>
          </div>

          {/* Content Writing Area with Formatting Bar */}
          <div className="bg-white rounded-2xl border border-[#eaecf0] shadow-xs overflow-hidden">
            {/* Tab Header & Toolbar */}
            <div className="p-3 bg-[#fafafa] border-b border-[#eaecf0] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-[#eaecf0] text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab('write')}
                  className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                    activeTab === 'write' ? 'bg-[#465984] text-white shadow-xs' : 'text-[#535862] hover:text-[#181d27]'
                  }`}
                >
                  Tulis Markdown
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'preview' ? 'bg-[#465984] text-white shadow-xs' : 'text-[#535862] hover:text-[#181d27]'
                  }`}
                >
                  <Eye className="size-3.5" />
                  <span>Preview Visual</span>
                </button>
              </div>

              {activeTab === 'write' && (
                <div className="flex flex-wrap items-center gap-1 text-[#344054]">
                  <button
                    type="button"
                    title="Heading 2"
                    onClick={() => insertFormatting('\n## ')}
                    className="px-2 py-1 rounded hover:bg-[#f2f4f7] text-xs font-bold text-[#344054] cursor-pointer"
                  >
                    H2
                  </button>
                  <button
                    type="button"
                    title="Heading 3"
                    onClick={() => insertFormatting('\n### ')}
                    className="px-2 py-1 rounded hover:bg-[#f2f4f7] text-xs font-bold text-[#344054] cursor-pointer"
                  >
                    H3
                  </button>
                  <button
                    type="button"
                    title="Heading 4"
                    onClick={() => insertFormatting('\n#### ')}
                    className="px-2 py-1 rounded hover:bg-[#f2f4f7] text-xs font-bold text-[#344054] cursor-pointer"
                  >
                    H4
                  </button>
                  <div className="h-4 w-[1px] bg-[#d5d7da] mx-1" />
                  <button
                    type="button"
                    title="Tebal (Bold)"
                    onClick={() => insertFormatting('**', '**')}
                    className="p-1.5 rounded hover:bg-[#f2f4f7] text-[#344054] cursor-pointer"
                  >
                    <Bold01 className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Miring (Italic)"
                    onClick={() => insertFormatting('*', '*')}
                    className="p-1.5 rounded hover:bg-[#f2f4f7] text-[#344054] cursor-pointer"
                  >
                    <Italic01 className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Internal / External Link"
                    onClick={() => insertFormatting('[Teks Link](', ')')}
                    className="p-1.5 rounded hover:bg-[#f2f4f7] text-[#344054] cursor-pointer"
                  >
                    <Link01 className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Kutipan (Quote)"
                    onClick={() => insertFormatting('\n> ')}
                    className="px-2 py-1 rounded hover:bg-[#f2f4f7] text-xs font-bold text-[#344054] cursor-pointer"
                  >
                    “
                  </button>
                  <button
                    type="button"
                    title="Daftar Bullet"
                    onClick={() => insertFormatting('\n- ')}
                    className="p-1.5 rounded hover:bg-[#f2f4f7] text-[#344054] cursor-pointer"
                  >
                    <List className="size-3.5" />
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
                className="w-full p-6 text-sm font-mono text-[#181d27] leading-relaxed focus:outline-none resize-y"
              />
            ) : (
              <div className="p-8 prose prose-slate max-w-none min-h-[400px]">
                <h1 className="text-2xl font-bold text-[#181d27] mb-4">{title || 'Judul Artikel'}</h1>
                {coverImageUrl && (
                  <div className="my-4 rounded-xl overflow-hidden border border-[#eaecf0] max-h-80 relative">
                    <img src={coverImageUrl} alt={coverImageAlt || title} className="w-full object-cover" />
                  </div>
                )}
                <div className="whitespace-pre-wrap text-sm text-[#344054] leading-relaxed">
                  {content || 'Belum ada konten ditulis.'}
                </div>
              </div>
            )}

            <div className="p-3 bg-[#fafafa] border-t border-[#eaecf0] flex items-center justify-between text-xs text-[#717680]">
              <div className="flex items-center gap-4">
                <span>{content.split(/\s+/).filter(Boolean).length} kata</span>
                <span>{detectedToc.length} heading terdeteksi</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="size-3.5 text-[#717680]" />
                <span>Est. Baca: {Math.max(1, Math.ceil(content.split(/\s+/).filter(Boolean).length / 200))} menit</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): SEO & Publishing Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          {/* Status & Schedule Card */}
          <div className="bg-white p-5 rounded-2xl border border-[#eaecf0] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#344054] uppercase tracking-wider">
                Status & Publikasi
              </span>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  status === 'PUBLISHED'
                    ? 'bg-[#ecfdf3] text-[#079455] border border-[#abefc6]'
                    : status === 'SCHEDULED'
                    ? 'bg-[#fffaeb] text-[#dc6803] border border-[#fedf89]'
                    : 'bg-[#f2f5f9] text-[#465984] border border-[#c6d2e6]'
                }`}
              >
                {status}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-lg hover:bg-[#f9fafb] border border-[#f2f4f7]">
                <input
                  type="radio"
                  name="status_choice"
                  checked={status === 'DRAFT'}
                  onChange={() => setStatus('DRAFT')}
                  className="text-[#465984] focus:ring-[#465984]"
                />
                <span className="text-[#344054] font-medium">Simpan sebagai Draft</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-lg hover:bg-[#f9fafb] border border-[#f2f4f7]">
                <input
                  type="radio"
                  name="status_choice"
                  checked={status === 'PUBLISHED'}
                  onChange={() => setStatus('PUBLISHED')}
                  className="text-[#465984] focus:ring-[#465984]"
                />
                <span className="text-[#344054] font-medium">Publish Sekarang</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-lg hover:bg-[#f9fafb] border border-[#f2f4f7]">
                <input
                  type="radio"
                  name="status_choice"
                  checked={status === 'SCHEDULED'}
                  onChange={() => setStatus('SCHEDULED')}
                  className="text-[#465984] focus:ring-[#465984]"
                />
                <span className="text-[#344054] font-medium">Jadwalkan Publish</span>
              </label>

              {status === 'SCHEDULED' && (
                <div className="pt-2">
                  <label className="block text-[11px] text-[#535862] mb-1 flex items-center gap-1 font-medium">
                    <Calendar className="size-3.5 text-[#465984]" />
                    <span>Waktu Tayang Otomatis:</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full text-xs p-2 border border-[#d5d7da] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984] text-[#181d27]"
                  />
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-[#f2f4f7]">
              <label className="flex items-center gap-2 text-xs cursor-pointer text-[#344054] font-medium">
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
          <div className="bg-white p-5 rounded-2xl border border-[#eaecf0] shadow-xs space-y-3">
            <span className="text-xs font-semibold text-[#344054] uppercase tracking-wider block">
              Featured Image & Alt Text
            </span>

            {coverImageUrl ? (
              <div className="space-y-2">
                <div className="rounded-xl overflow-hidden border border-[#eaecf0] relative aspect-video bg-[#f9fafb]">
                  <img src={coverImageUrl} alt={coverImageAlt || title} className="w-full h-full object-cover" />
                </div>
                <button
                  type="button"
                  onClick={() => setCoverImageUrl('')}
                  className="text-[11px] text-[#d92d20] hover:underline cursor-pointer"
                >
                  Hapus / Ganti Gambar
                </button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-[#eaecf0] hover:border-[#465984] rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition bg-[#fcfcfd]">
                <Upload01 className="size-6 text-[#717680] mb-2" />
                <span className="text-xs font-semibold text-[#344054]">
                  {uploadingImage ? 'Mengunggah ke R2...' : 'Upload Featured Image'}
                </span>
                <span className="text-[11px] text-[#717680] mt-1">Otomatis konversi ke WebP di Cloudflare R2</span>
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
              <label className="block text-[11px] font-semibold text-[#535862] mb-1">
                Image Alt Text (SEO Crucial)
              </label>
              <input
                type="text"
                value={coverImageAlt}
                onChange={(e) => setCoverImageAlt(e.target.value)}
                placeholder="Deskripsi gambar untuk Google Image Search"
                className="w-full text-xs p-2 border border-[#d5d7da] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984] text-[#181d27]"
              />
            </div>
          </div>

          {/* SEO Metadata Form */}
          <div className="bg-white p-5 rounded-2xl border border-[#eaecf0] shadow-xs space-y-4">
            <span className="text-xs font-semibold text-[#344054] uppercase tracking-wider block">
              Pengaturan Meta SEO
            </span>

            {/* Meta Title */}
            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <label className="font-semibold text-[#535862]">Meta Title</label>
                <span
                  className={
                    metaTitle.length > 60
                      ? 'text-[#d92d20] font-semibold'
                      : 'text-[#717680]'
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
                className="w-full text-xs p-2 border border-[#d5d7da] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984] text-[#181d27]"
              />
            </div>

            {/* Meta Description */}
            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <label className="font-semibold text-[#535862]">Meta Description</label>
                <span
                  className={
                    metaDescription.length > 160
                      ? 'text-[#d92d20] font-semibold'
                      : 'text-[#717680]'
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
                className="w-full text-xs p-2 border border-[#d5d7da] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984] text-[#181d27]"
              />
            </div>

            {/* Canonical URL */}
            <div>
              <label className="block text-[11px] font-semibold text-[#535862] mb-1">
                Canonical URL (Opsional)
              </label>
              <input
                type="text"
                value={canonicalUrl}
                onChange={(e) => setCanonicalUrl(e.target.value)}
                placeholder="https://optimark.ai/blog/slug-asli"
                className="w-full text-xs p-2 border border-[#d5d7da] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984] text-[#181d27]"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-[11px] font-semibold text-[#535862] mb-1">
                Tags (Pisahkan dengan koma)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="SEO, Content Marketing, AI"
                className="w-full text-xs p-2 border border-[#d5d7da] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984] text-[#181d27]"
              />
            </div>
          </div>

          {/* E-E-A-T & Taxonomy Card */}
          <div className="bg-white p-5 rounded-2xl border border-[#eaecf0] shadow-xs space-y-4">
            <span className="text-xs font-semibold text-[#344054] uppercase tracking-wider block">
              E-E-A-T & Taksonomi
            </span>

            {/* Category */}
            <div>
              <label className="block text-[11px] font-semibold text-[#535862] mb-1">Kategori Topik</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full text-xs p-2 border border-[#d5d7da] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984] bg-white text-[#181d27]"
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
              <label className="block text-[11px] font-semibold text-[#535862] mb-1">Penulis (Author)</label>
              <select
                value={authorId}
                onChange={(e) => setAuthorId(e.target.value)}
                className="w-full text-xs p-2 border border-[#d5d7da] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984] bg-white text-[#181d27]"
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
              <label className="block text-[11px] font-semibold text-[#535862] mb-1">Reviewer (E-E-A-T Expert)</label>
              <select
                value={reviewerId}
                onChange={(e) => setReviewerId(e.target.value)}
                className="w-full text-xs p-2 border border-[#d5d7da] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984] bg-white text-[#181d27]"
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
