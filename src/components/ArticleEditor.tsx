'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save01,
  Send01,
  Calendar,
  Archive,
  Eye,
  CheckCircle,
  AlertCircle,
  Globe01,
  Upload01,
  Zap,
  HelpCircle,
  Trash01,
} from '@untitledui/icons';
import { Article, Category, Person } from '@/lib/types';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { RichTextEditor } from './RichTextEditor';
import { ArticlePreviewModal } from './ArticlePreviewModal';

interface ArticleEditorProps {
  initialData?: Article | null;
}

type PublishOption = 'DRAFT' | 'PUBLISHED' | 'SCHEDULED' | 'ARCHIVED' | 'DRAFT_REVISION';

export function ArticleEditor({ initialData }: ArticleEditorProps) {
  const router = useRouter();
  const { user } = useAuth();

  // Active language locale tab (Indonesian primary, English secondary)
  const [activeLocale, setActiveLocale] = useState<'id' | 'en'>('id');

  // Preview modal toggle
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // Unsaved changes confirmation modal
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  // Localized field states
  const initialId = initialData?.translations?.find((t) => t.locale === 'id');
  const initialEn = initialData?.translations?.find((t) => t.locale === 'en');

  const [titleId, setTitleId] = useState(initialId?.title || initialData?.title || '');
  const [excerptId, setExcerptId] = useState(initialId?.excerpt || initialData?.excerpt || '');
  const [contentId, setContentId] = useState(initialId?.content || initialData?.content || '');
  const [metaTitleId, setMetaTitleId] = useState(initialId?.metaTitle || initialData?.metaTitle || '');
  const [metaDescriptionId, setMetaDescriptionId] = useState(
    initialId?.metaDescription || initialData?.metaDescription || ''
  );

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

  // Publication Status Selection
  const [currentStatus, setCurrentStatus] = useState<PublishOption>(
    initialData ? initialData.status : 'DRAFT'
  );
  const isCurrentlyPublished = currentStatus === 'PUBLISHED';
  const [selectedStatus, setSelectedStatus] = useState<PublishOption>(
    initialData ? initialData.status : 'DRAFT'
  );
  const [scheduledAt, setScheduledAt] = useState(
    initialData?.scheduledAt ? new Date(initialData.scheduledAt).toISOString().slice(0, 16) : ''
  );

  // Options & Meta Lists
  const [categories, setCategories] = useState<Category[]>([]);
  const [people, setPeople] = useState<Person[]>([]);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load Categories & People
  useEffect(() => {
    Promise.all([api.getCategories(), api.getPeople()])
      .then(([catList, peopleList]) => {
        setCategories(catList);
        setPeople(peopleList);

        // Intelligent Author Selection:
        // On new article: default to currently logged-in author if user is an author
        // On edit article: strictly preserve initialData.authorId
        if (!initialData) {
          if (user?.personId) {
            const authorPerson = peopleList.find(
              (p) => p.id === user.personId && (p.type === 'AUTHOR' || p.type === 'BOTH')
            );
            if (authorPerson) {
              setAuthorId(authorPerson.id);
            }
          }
        }
      })
      .catch((err) => console.error('Failed to load taxonomy:', err));
  }, [initialData, user]);

  // Form baseline snapshot for reliable isDirty tracking
  const currentSnapshot = JSON.stringify({
    titleId,
    excerptId,
    contentId,
    slug,
    coverImageUrl,
    categoryId,
    authorId,
    selectedStatus,
    titleEn,
    excerptEn,
    contentEn,
    metaTitleId,
    metaDescriptionId,
    metaTitleEn,
    metaDescriptionEn,
  });

  const [baselineSnapshot, setBaselineSnapshot] = useState<string>('');

  useEffect(() => {
    // Initialize baseline snapshot once taxonomy and initialData are settled
    if (!baselineSnapshot) {
      setBaselineSnapshot(currentSnapshot);
    }
  }, [currentSnapshot, baselineSnapshot]);

  // Check if form is dirty (unsaved changes)
  const isDirty = useMemo(() => {
    if (!baselineSnapshot) {
      if (!initialData) {
        return Boolean(titleId || excerptId || contentId || slug || coverImageUrl);
      }
      return false;
    }
    return currentSnapshot !== baselineSnapshot;
  }, [baselineSnapshot, currentSnapshot, initialData, titleId, excerptId, contentId, slug, coverImageUrl]);

  // Native beforeunload window guard on reload / close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Intercept browser back navigation (popstate)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.history.pushState({ page: 'article-editor' }, '', window.location.href);

    const handlePopState = () => {
      if (isDirty) {
        window.history.pushState({ page: 'article-editor' }, '', window.location.href);
        setPendingNavigation('/articles');
        setShowUnsavedModal(true);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isDirty]);

  // Intercept back navigation
  const handleBackClick = () => {
    if (isDirty) {
      setPendingNavigation('/articles');
      setShowUnsavedModal(true);
    } else {
      router.push('/articles');
    }
  };

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

  // Image Upload Handler to Cloudflare R2
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const targetSlug = slug || currentTitle || file.name;
      const media = await api.uploadMedia(file, coverImageAlt || currentTitle || 'Cover Image', true, targetSlug);
      setCoverImageUrl(media.url);
      setMessage({ type: 'success', text: 'Gambar berhasil diunggah ke storage Cloudflare R2!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Gagal mengunggah gambar' });
    } finally {
      setUploadingImage(false);
    }
  };

  // Mandatory fields validation for PUBLISH & SCHEDULE
  const validateMandatoryFields = (): string[] => {
    const missing: string[] = [];
    if (!titleId.trim() && !titleEn.trim()) missing.push('Judul Artikel');
    if (!slug.trim()) missing.push('Slug URL');
    if (!categoryId) missing.push('Kategori Blog');
    if (!authorId) missing.push('Penulis (Author)');
    if (!coverImageUrl.trim()) missing.push('Gambar Sampul (Cover Image)');
    if (!excerptId.trim() && !excerptEn.trim()) missing.push('Ringkasan / Excerpt');
    if (!contentId.trim() && !contentEn.trim()) missing.push('Isi Konten Artikel');
    if (selectedStatus === 'SCHEDULED' && !scheduledAt) missing.push('Waktu Jadwal Publikasi');
    return missing;
  };

  // Submit action logic
  const handleSubmit = async (overrideStatus?: PublishOption) => {
    const targetStatus = overrideStatus || selectedStatus;

    // Enforce mandatory fields for PUBLISHED & SCHEDULED
    if (targetStatus === 'PUBLISHED' || targetStatus === 'SCHEDULED') {
      const missingFields = validateMandatoryFields();
      if (missingFields.length > 0) {
        setMessage({
          type: 'error',
          text: `Kolom wajib belum lengkap untuk publikasi: ${missingFields.join(', ')}. Harap lengkapi sebelum mempublikasikan artikel.`,
        });
        return;
      }
    } else {
      // For DRAFT, require minimal title or content
      if (!titleId.trim() && !titleEn.trim()) {
        setMessage({
          type: 'error',
          text: 'Harap isi minimal Judul Artikel untuk menyimpan draft!',
        });
        return;
      }
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const tagsArray = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      // Handle Dual Draft Mechanism
      const isRevision = targetStatus === 'DRAFT_REVISION';
      const effectiveStatus = isRevision
        ? 'PUBLISHED'
        : (targetStatus as 'DRAFT' | 'PUBLISHED' | 'SCHEDULED' | 'ARCHIVED');

      const payload: any = {
        title: titleId || titleEn,
        slug: slug.trim() || undefined,
        excerpt: excerptId || excerptEn || undefined,
        content: contentId || contentEn || '',
        metaTitle: metaTitleId || metaTitleEn || undefined,
        metaDescription: metaDescriptionId || metaDescriptionEn || undefined,
        canonicalUrl: canonicalUrl || undefined,
        coverImageUrl: coverImageUrl || undefined,
        coverImageAlt: coverImageAlt || undefined,
        tags: tagsArray,
        status: effectiveStatus,
        featured,
        categoryId: categoryId || undefined,
        authorId: authorId || undefined,
        reviewerId: reviewerId || undefined,
        scheduledAt: targetStatus === 'SCHEDULED' && scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
        saveAsRevision: isRevision,
        translations: {
          id: {
            title: titleId,
            excerpt: excerptId,
            content: contentId,
            metaTitle: metaTitleId,
            metaDescription: metaDescriptionId,
          },
          en: {
            title: titleEn,
            excerpt: excerptEn,
            content: contentEn,
            metaTitle: metaTitleEn,
            metaDescription: metaDescriptionEn,
          },
        },
      };

      if (initialData) {
        await api.updateArticle(initialData.id, payload);
        setBaselineSnapshot(currentSnapshot);
        if (isRevision) {
          setMessage({
            type: 'success',
            text: 'Draf revisi berhasil disimpan! Versi tayang di landing page tetap aktif dengan konten lama hingga Anda mempublikasikan revisi ini.',
          });
        } else {
          setCurrentStatus(effectiveStatus);
          setSelectedStatus(effectiveStatus);
          setMessage({
            type: 'success',
            text: `Artikel berhasil diperbarui sebagai ${effectiveStatus}!`,
          });
        }
      } else {
        const created = await api.createArticle(payload);
        setBaselineSnapshot(currentSnapshot);
        setCurrentStatus(effectiveStatus);
        setSelectedStatus(effectiveStatus);
        setMessage({
          type: 'success',
          text: `Artikel baru berhasil dibuat dengan status ${effectiveStatus}!`,
        });
        setTimeout(() => {
          router.push(`/articles/${created.id}`);
        }, 800);
      }
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Gagal menyimpan artikel. Periksa koneksi dan data.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dynamic button label and styling based on selected status
  const actionButtonConfig = useMemo(() => {
    switch (selectedStatus) {
      case 'DRAFT':
        return {
          label: initialData ? 'Simpan Draft' : 'Simpan Sebagai Draft',
          icon: Save01,
          className: 'bg-white border border-[#d5d7da] hover:bg-[#f8f9fa] text-[#344054]',
        };
      case 'DRAFT_REVISION':
        return {
          label: 'Simpan Draf Revisi',
          icon: Save01,
          className: 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs',
        };
      case 'PUBLISHED':
        return {
          label: currentStatus === 'PUBLISHED' ? 'Perbarui Publikasi' : 'Publikasikan Sekarang',
          icon: Send01,
          className: 'bg-[#465984] hover:bg-[#38476a] text-white shadow-xs',
        };
      case 'SCHEDULED':
        return {
          label: 'Jadwalkan Publikasi',
          icon: Calendar,
          className: 'bg-purple-600 hover:bg-purple-700 text-white shadow-xs',
        };
      case 'ARCHIVED':
        return {
          label: 'Tarik & Arsipkan Artikel',
          icon: Archive,
          className: 'bg-slate-700 hover:bg-slate-800 text-white shadow-xs',
        };
    }
  }, [selectedStatus, initialData]);

  // Selected Author and Category objects for Preview Modal
  const currentCategoryObj = useMemo(
    () => categories.find((c) => c.id === categoryId) || null,
    [categories, categoryId]
  );
  const currentAuthorObj = useMemo(
    () => people.find((p) => p.id === authorId) || null,
    [people, authorId]
  );
  const currentReviewerObj = useMemo(
    () => people.find((p) => p.id === reviewerId) || null,
    [people, reviewerId]
  );

  const hasIdContent = Boolean(titleId || contentId);
  const hasEnContent = Boolean(titleEn || contentEn);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24">
      {/* Top Header & Dynamic Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#eaecf0] shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBackClick}
            className="p-2 rounded-lg border border-[#d5d7da] hover:bg-[#f8f9fa] text-[#535862] transition-colors"
            title="Kembali ke Daftar Artikel"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#181d27] tracking-tight">
                {initialData ? 'Edit Artikel' : 'Tulis Artikel Baru'}
              </h1>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold transition-colors ${
                  currentStatus === 'PUBLISHED'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : currentStatus === 'SCHEDULED'
                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                    : currentStatus === 'ARCHIVED'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-[#f8f9fa] text-[#535862] border border-[#d5d7da]'
                }`}
              >
                {currentStatus}
              </span>
            </div>
            <p className="text-xs text-[#535862] mt-0.5">
              Atur konten, dwi-bahasa (ID & EN), metadata SEO, dan status publikasi.
            </p>
          </div>
        </div>

        {/* Right Action Cluster */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Full Live Blog Preview Button */}
          <button
            type="button"
            onClick={() => setIsPreviewModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-[#d5d7da] bg-white text-[#344054] hover:bg-[#f8f9fa] shadow-2xs transition-colors"
            title="Buka Pratinjau Tampilan Web Lengkap"
          >
            <Eye className="size-4 text-[#465984]" />
            <span>Pratinjau Web Lengkap</span>
          </button>

          {/* Publication Status Selector Dropdown */}
          <div className="flex items-center">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as PublishOption)}
              className="px-3 py-2 text-xs font-semibold border border-[#cbd5e1] rounded-lg shadow-xs focus:ring-2 focus:ring-[#465984] focus:outline-hidden bg-white text-[#1e293b]"
            >
              {isCurrentlyPublished ? (
                <>
                  <option value="PUBLISHED">PUBLISHED (Perbarui Langsung)</option>
                  <option value="DRAFT_REVISION">DRAFT (Simpan Revisi, Web Tetap Tayang)</option>
                  <option value="ARCHIVED">ARCHIVED (Tarik dari Web / Sembunyikan)</option>
                  <option value="SCHEDULED">SCHEDULED (Jadwalkan)</option>
                </>
              ) : (
                <>
                  <option value="DRAFT">DRAFT (Simpan Draf)</option>
                  <option value="PUBLISHED">PUBLISHED (Tayang Sekarang)</option>
                  <option value="SCHEDULED">SCHEDULED (Jadwalkan)</option>
                </>
              )}
            </select>
          </div>

          {/* Dynamic Action Button */}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSubmit()}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all disabled:opacity-50 ${actionButtonConfig.className}`}
          >
            <actionButtonConfig.icon className="size-4" />
            <span>{isSubmitting ? 'Menyimpan...' : actionButtonConfig.label}</span>
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
        {/* Left Column: Language Tabs + Content WYSIWYG Editor (8 Cols) */}
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
                  <span className="text-[10px] text-[#98a2b3] italic">(Kosong)</span>
                )}
              </button>
            </div>
          </div>

          {/* Article Title Input */}
          <div className="bg-white p-5 rounded-xl border border-[#eaecf0] shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-[#344054]">
                Judul Artikel ({activeLocale.toUpperCase()}){' '}
                <span className="text-red-500">*wajib</span>
              </label>
              <span className="text-xs text-[#717680]">{currentTitle.length} karakter</span>
            </div>
            <input
              type="text"
              value={currentTitle}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder={
                activeLocale === 'id'
                  ? 'Contoh: 7 Strategi Riset Keyword untuk Bisnis Lokal di Era AI'
                  : 'Example: 7 Keyword Research Strategies for Local Business in AI Era'
              }
              className="w-full px-4 py-3 text-lg font-bold border border-[#d5d7da] rounded-lg shadow-xs focus:ring-2 focus:ring-[#465984] focus:outline-hidden text-[#181d27] placeholder:text-[#98a2b3]"
            />
          </div>

          {/* Article Excerpt Input */}
          <div className="bg-white p-5 rounded-xl border border-[#eaecf0] shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-[#344054]">
                Ringkasan Eksekutif (Excerpt){' '}
                <span className="text-red-500">*wajib untuk publikasi</span>
              </label>
              <span className="text-xs text-[#717680]">{currentExcerpt.length} karakter</span>
            </div>
            <textarea
              rows={3}
              value={currentExcerpt}
              onChange={(e) => handleExcerptChange(e.target.value)}
              placeholder="Ringkasan singkat 2-3 kalimat yang memikat pembaca di feed blog dan feed sosial..."
              className="w-full px-3.5 py-2.5 text-sm border border-[#d5d7da] rounded-lg shadow-xs focus:ring-2 focus:ring-[#465984] focus:outline-hidden text-[#181d27]"
            />
          </div>

          {/* WYSIWYG Rich Text Content Editor (Gambar 2 Visual Implementation) */}
          <div className="bg-white p-5 rounded-xl border border-[#eaecf0] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-[#344054]">
                Isi Konten Artikel ({activeLocale.toUpperCase()}){' '}
                <span className="text-red-500">*wajib untuk publikasi</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(true)}
                  className="text-xs text-[#465984] hover:underline font-semibold flex items-center gap-1"
                >
                  <Eye className="size-3.5" />
                  Pratinjau Web
                </button>
              </div>
            </div>

            {/* Visual Editor rendering clean visual output without raw markdown characters */}
            <RichTextEditor
              value={currentContent}
              onChange={handleContentChange}
              minHeight="420px"
            />
          </div>

          {/* SEO Meta Box */}
          <div className="bg-white p-5 rounded-xl border border-[#eaecf0] shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#eaecf0] pb-3">
              <div className="flex items-center gap-2">
                <Zap className="size-4 text-[#465984]" />
                <h3 className="text-sm font-semibold text-[#181d27]">
                  Metadata SEO & SERP ({activeLocale.toUpperCase()})
                </h3>
              </div>
              <span className="text-xs text-[#717680]">Pratinjau Googlebot Snippet</span>
            </div>

            <div className="bg-[#f8f9fa] p-4 rounded-lg border border-[#eaecf0] space-y-1">
              <div className="text-xs text-[#1a0dab] font-medium truncate">
                https://optimark.ai/{activeLocale === 'en' ? 'en/' : ''}blog/{slug || 'judul-artikel'}
              </div>
              <div className="text-base text-[#1a0dab] hover:underline font-semibold truncate cursor-pointer">
                {currentMetaTitle || currentTitle || 'Judul Halaman di Hasil Pencarian'}
              </div>
              <div className="text-xs text-[#4d5156] line-clamp-2 leading-relaxed">
                {currentMetaDesc || currentExcerpt || 'Deskripsi meta ringkas yang menarik klik calon pembaca...'}
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-medium text-[#535862]">Meta Title</label>
                  <span className={currentMetaTitle.length > 60 ? 'text-amber-600' : 'text-[#717680]'}>
                    {currentMetaTitle.length}/60 karakter
                  </span>
                </div>
                <input
                  type="text"
                  value={currentMetaTitle}
                  onChange={(e) => handleMetaTitleChange(e.target.value)}
                  placeholder="Gunakan keyword utama di 60 karakter pertama..."
                  className="w-full px-3 py-2 text-sm border border-[#d5d7da] rounded-lg shadow-xs focus:ring-2 focus:ring-[#465984]"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-medium text-[#535862]">Meta Description</label>
                  <span className={currentMetaDesc.length > 160 ? 'text-amber-600' : 'text-[#717680]'}>
                    {currentMetaDesc.length}/160 karakter
                  </span>
                </div>
                <textarea
                  rows={2}
                  value={currentMetaDesc}
                  onChange={(e) => handleMetaDescChange(e.target.value)}
                  placeholder="Deskripsi menarik dengan call-to-action untuk CTR optimal..."
                  className="w-full px-3 py-2 text-sm border border-[#d5d7da] rounded-lg shadow-xs focus:ring-2 focus:ring-[#465984]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Taxonomy, E-E-A-T, Media, Settings (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* URL Slug Setting */}
          <div className="bg-white p-5 rounded-xl border border-[#eaecf0] shadow-xs space-y-4">
            <h3 className="text-sm font-semibold text-[#181d27] border-b border-[#eaecf0] pb-3">
              Parameter URL & Slug
            </h3>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#344054]">
                Slug URL <span className="text-red-500">*wajib</span>
              </label>
              <div className="flex rounded-lg shadow-xs">
                <span className="inline-flex items-center px-2.5 rounded-l-lg border border-r-0 border-[#d5d7da] bg-[#f8f9fa] text-[#717680] text-xs font-mono">
                  /blog/
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, ''))}
                  placeholder="riset-keyword-lokal"
                  className="flex-1 min-w-0 block w-full px-3 py-2 text-xs font-mono border border-[#d5d7da] rounded-r-lg focus:ring-2 focus:ring-[#465984]"
                />
              </div>
            </div>

            {selectedStatus === 'SCHEDULED' && (
              <div className="space-y-1.5 bg-purple-50 p-3 rounded-lg border border-purple-200">
                <label className="block text-xs font-semibold text-purple-900 flex items-center gap-1.5">
                  <Calendar className="size-3.5" />
                  Jadwal Waktu Rilis Otomatis <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-purple-300 rounded shadow-xs focus:ring-2 focus:ring-[#465984] bg-white"
                />
              </div>
            )}

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
              <label className="block text-xs font-semibold text-[#344054]">
                Kategori Blog <span className="text-red-500">*wajib</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#d5d7da] rounded-lg shadow-xs focus:ring-2 focus:ring-[#465984] bg-white text-[#181d27]"
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
              <label className="block text-xs font-semibold text-[#344054]">
                Penulis (Author) <span className="text-red-500">*wajib</span>
              </label>
              <select
                value={authorId}
                onChange={(e) => setAuthorId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#d5d7da] rounded-lg shadow-xs focus:ring-2 focus:ring-[#465984] bg-white text-[#181d27]"
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
              <p className="text-[11px] text-[#717680]">
                Otomatis mengaitkan persona penulis login untuk artikel baru, mempertahankan penulis artikel lama saat diedit.
              </p>
            </div>

            {/* Reviewer Select */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#535862]">
                Editorial Reviewer (E-E-A-T Opsional)
              </label>
              <select
                value={reviewerId}
                onChange={(e) => setReviewerId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#d5d7da] rounded-lg shadow-xs focus:ring-2 focus:ring-[#465984] bg-white text-[#181d27]"
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
              Gambar Sampul (Cover Image) <span className="text-red-500">*wajib</span>
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
                  Hapus / Ganti Gambar
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
                      accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="sr-only"
                    />
                  </label>{' '}
                  atau seret ke sini
                </div>
                <p className="text-[11px] text-[#717680]">Storage Cloudflare R2 • Otomatis WebP &amp; Max 5MB</p>
                {uploadingImage && (
                  <p className="text-xs text-[#465984] font-medium animate-pulse">
                    Mengunggah ke Cloudflare R2...
                  </p>
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

      {/* Full Real Blog Article Preview Modal */}
      <ArticlePreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        title={currentTitle}
        excerpt={currentExcerpt}
        content={currentContent}
        coverImageUrl={coverImageUrl}
        category={currentCategoryObj}
        author={currentAuthorObj}
        reviewer={currentReviewerObj}
        tags={tagsInput.split(',').map((t) => t.trim()).filter(Boolean)}
      />

      {/* Unsaved Changes Confirmation Modal (Requirement 6) */}
      {showUnsavedModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-[#eaecf0] shadow-2xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="p-2 bg-amber-50 rounded-xl border border-amber-200">
                <AlertCircle className="size-6" />
              </div>
              <h3 className="font-bold text-base text-[#181d27]">Perubahan Belum Disimpan</h3>
            </div>

            <p className="text-xs text-[#535862] leading-relaxed">
              Anda memiliki teks atau parameter yang belum disimpan. Jika keluar sekarang, perubahan ini akan hilang. Apa yang ingin Anda lakukan?
            </p>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={async () => {
                  setShowUnsavedModal(false);
                  await handleSubmit('DRAFT');
                  router.push(pendingNavigation || '/articles');
                }}
                className="w-full py-2.5 px-4 bg-[#465984] hover:bg-[#38476a] text-white text-xs font-bold rounded-lg transition"
              >
                Simpan Draft & Keluar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUnsavedModal(false);
                  router.push(pendingNavigation || '/articles');
                }}
                className="w-full py-2.5 px-4 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold rounded-lg transition"
              >
                Buang Perubahan & Keluar
              </button>
              <button
                type="button"
                onClick={() => setShowUnsavedModal(false)}
                className="w-full py-2 px-4 text-xs font-medium text-[#717680] hover:text-[#181d27] transition"
              >
                Batal / Lanjut Mengedit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
