'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  File06,
  Plus,
  SearchLg,
  CheckCircle,
  Clock,
  Edit01,
  Trash01,
  Send01,
  Globe01,
  Eye,
} from '@untitledui/icons';
import { api, getLandingUrl } from '@/lib/api';
import { Article, ArticleStatus } from '@/lib/types';
import { Header } from '@/components/Header';
import { formatDate } from '@/lib/utils';
import { TablePagination } from '@/components/TablePagination';

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ArticleStatus | ''>('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(25);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchArticles = async (targetPage = page, querySearch = debouncedSearch, targetLimit = limit) => {
    try {
      setLoading(true);
      const res = await api.getArticles({
        search: querySearch || undefined,
        status: statusFilter || undefined,
        page: targetPage,
        limit: targetLimit,
      });
      setArticles(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages || Math.ceil(res.total / targetLimit) || 1);
    } catch (err) {
      console.error('Failed to fetch articles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles(page, debouncedSearch, limit);
  }, [page, statusFilter, debouncedSearch, limit]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedSearch(search);
    setPage(1);
  };

  const handlePublishNow = async (id: string) => {
    if (!confirm('Publish artikel ini sekarang ke publik?')) return;
    try {
      await api.publishArticle(id);
      fetchArticles();
    } catch (err: any) {
      alert(err.message || 'Gagal mempublish artikel');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus artikel ini?')) return;
    try {
      await api.deleteArticle(id);
      fetchArticles();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus artikel');
    }
  };

  const publishedCount = articles.filter((a) => a.status === 'PUBLISHED').length;
  const scheduledCount = articles.filter((a) => a.status === 'SCHEDULED').length;
  const draftCount = articles.filter((a) => a.status === 'DRAFT').length;

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#f8fafc]">
      <Header
        title="Daftar Artikel SEO"
        description="Kelola dan publikasikan artikel untuk mendominasi Google organic search."
        actions={
          <Link
            href="/articles/new"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#465984] hover:bg-[#3f5077] text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="size-3.5 text-white" />
            <span>Tulis Artikel</span>
          </Link>
        }
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 w-full flex-1">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-[#eaecf0] shadow-xs">
            <span className="text-[11px] font-semibold text-[#717680] uppercase tracking-wider block">
              Total Konten
            </span>
            <div className="text-2xl font-bold text-[#181d27] mt-1">{total}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-[#eaecf0] shadow-xs">
            <span className="text-[11px] font-semibold text-[#079455] uppercase tracking-wider block">
              Tayang (Published)
            </span>
            <div className="text-2xl font-bold text-[#079455] mt-1">{publishedCount}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-[#eaecf0] shadow-xs">
            <span className="text-[11px] font-semibold text-[#dc6803] uppercase tracking-wider block">
              Terjadwal (Scheduled)
            </span>
            <div className="text-2xl font-bold text-[#dc6803] mt-1">{scheduledCount}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-[#eaecf0] shadow-xs">
            <span className="text-[11px] font-semibold text-[#717680] uppercase tracking-wider block">
              Draft
            </span>
            <div className="text-2xl font-bold text-[#535862] mt-1">{draftCount}</div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-[#eaecf0] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 flex-wrap overflow-x-auto pb-1 md:pb-0">
            <button
              type="button"
              onClick={() => setStatusFilter('')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                statusFilter === ''
                  ? 'bg-[#181d27] text-white shadow-xs'
                  : 'bg-[#f9fafb] text-[#535862] hover:bg-[#f2f4f7]'
              }`}
            >
              Semua ({total})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('PUBLISHED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                statusFilter === 'PUBLISHED'
                  ? 'bg-[#079455] text-white shadow-xs'
                  : 'bg-[#ecfdf3] text-[#079455] hover:bg-[#d1fadf]'
              }`}
            >
              Published
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('SCHEDULED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                statusFilter === 'SCHEDULED'
                  ? 'bg-[#dc6803] text-white shadow-xs'
                  : 'bg-[#fffaeb] text-[#dc6803] hover:bg-[#fef0c7]'
              }`}
            >
              Scheduled
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('DRAFT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                statusFilter === 'DRAFT'
                  ? 'bg-[#465984] text-white shadow-xs'
                  : 'bg-[#f2f5f9] text-[#465984] hover:bg-[#e2e8f2]'
              }`}
            >
              Draft
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ARCHIVED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                statusFilter === 'ARCHIVED'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              Archived
            </button>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <SearchLg className="size-4 text-[#717680] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari judul atau slug..."
                className="pl-9 pr-3 py-1.5 text-xs bg-white border border-[#d5d7da] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984] text-[#181d27] w-full"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 bg-[#f9fafb] hover:bg-[#f2f4f7] text-[#424751] text-xs font-semibold rounded-lg border border-[#d5d7da] transition cursor-pointer shrink-0"
            >
              Cari
            </button>
          </form>
        </div>

        {/* Articles Table */}
        <div className="bg-white rounded-xl border border-[#eaecf0] shadow-xs overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse text-xs min-w-[760px]">
            <thead>
              <tr className="bg-[#fafafa] border-b border-[#eaecf0] text-[#717680] font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Artikel & Slug</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">E-E-A-T Team</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Tanggal Tayang</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f2f4f7]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#717680]">
                    Memuat data artikel...
                  </td>
                </tr>
              ) : articles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#717680]">
                    <File06 className="size-8 mx-auto mb-2 text-[#d5d7da]" />
                    <p className="font-semibold text-[#424751]">Belum ada artikel ditemukan</p>
                    <p className="text-xs text-[#717680] mt-1">Mulai tulis artikel baru untuk meningkatkan SEO.</p>
                  </td>
                </tr>
              ) : (
                articles.map((item) => (
                  <tr key={item.id} className="hover:bg-[#f9fafb] transition-colors">
                    <td className="py-3.5 px-4 max-w-sm">
                      <div className="flex items-start gap-3">
                        {item.coverImageUrl && (
                          <img
                            src={item.coverImageUrl}
                            alt=""
                            className="w-12 h-9 rounded object-cover border border-[#eaecf0] shrink-0 mt-0.5"
                          />
                        )}
                        <div>
                          <Link
                            href={`/articles/${item.id}`}
                            className="font-semibold text-[#181d27] hover:text-[#465984] line-clamp-1 text-[13px]"
                          >
                            {item.title}
                          </Link>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[11px] text-[#717680] font-mono truncate">
                              /blog/{item.slugId || item.slug}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#f2f4f7] text-[#344054]" title={`ID: /blog/${item.slugId || item.slug}`}>
                                ID
                              </span>
                              {item.slugEn || item.translations?.some((t) => t.locale === 'en' && (t.slug || t.title)) ? (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200" title={`EN: /en/blog/${item.slugEn || item.translations?.find((t) => t.locale === 'en')?.slug || item.slug}`}>
                                  EN
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-50 text-slate-400" title="English Belum Lengkap">
                                  EN
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {item.category ? (
                        <span className="px-2 py-0.5 rounded-md bg-[#f2f4f7] text-[#424751] font-semibold text-[11px]">
                          {item.category.name}
                        </span>
                      ) : (
                        <span className="text-[#a4a7ae]">-</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <div className="font-medium text-[#181d27]">
                          {item.author?.name || 'Tanpa Author'}
                        </div>
                        {item.reviewer && (
                          <div className="text-[10px] text-[#717680] flex items-center gap-1">
                            <span>Rev:</span>
                            <span className="font-medium text-[#535862]">{item.reviewer.name}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          item.status === 'PUBLISHED'
                            ? 'bg-[#ecfdf3] text-[#079455] border border-[#abefc6]'
                            : item.status === 'SCHEDULED'
                            ? 'bg-[#fffaeb] text-[#dc6803] border border-[#fedf89]'
                            : item.status === 'ARCHIVED'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-[#f2f5f9] text-[#465984] border border-[#c6d2e6]'
                        }`}
                      >
                        {item.status === 'PUBLISHED' && <CheckCircle className="size-3 text-[#079455]" />}
                        {item.status === 'SCHEDULED' && <Clock className="size-3 text-[#dc6803]" />}
                        {item.status === 'ARCHIVED' && <Clock className="size-3 text-amber-700" />}
                        {item.status === 'DRAFT' && <Edit01 className="size-3 text-[#465984]" />}
                        <span>{item.status}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-[#535862]">
                      <div>
                        {item.status === 'SCHEDULED'
                          ? formatDate(item.scheduledAt)
                          : formatDate(item.publishedAt || item.createdAt)}
                      </div>
                      {item.contentUpdatedAt && (
                        <div className="text-[10px] text-[#717680] mt-0.5 flex items-center gap-1 font-mono">
                          <span>lastmod:</span>
                          <span>{new Date(item.contentUpdatedAt).toLocaleDateString('id-ID')}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {item.status === 'PUBLISHED' && (
                          <div className="inline-flex items-center gap-1">
                            <a
                              href={getLandingUrl(`/blog/${item.slugId || item.slug}`)}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={`Buka live ID (/blog/${item.slugId || item.slug})`}
                              className="p-1.5 rounded hover:bg-[#f2f4f7] text-[#535862] transition cursor-pointer flex items-center gap-0.5"
                            >
                              <Eye className="size-3.5 text-[#465984]" />
                              <span className="text-[10px] font-bold text-[#465984]">ID</span>
                            </a>
                            {item.slugEn && (
                              <a
                                href={getLandingUrl(`/en/blog/${item.slugEn}`)}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={`Buka live EN (/en/blog/${item.slugEn})`}
                                className="p-1.5 rounded hover:bg-blue-50 text-blue-700 transition cursor-pointer flex items-center gap-0.5"
                              >
                                <Eye className="size-3.5 text-blue-700" />
                                <span className="text-[10px] font-bold text-blue-700">EN</span>
                              </a>
                            )}
                          </div>
                        )}
                        {item.status !== 'PUBLISHED' && (
                          <button
                            type="button"
                            title="Publish sekarang"
                            onClick={() => handlePublishNow(item.id)}
                            className="p-1.5 rounded hover:bg-[#ecfdf3] text-[#079455] transition cursor-pointer"
                          >
                            <Send01 className="size-3.5 text-[#079455]" />
                          </button>
                        )}
                        <Link
                          href={`/articles/${item.id}`}
                          title="Edit artikel"
                          className="p-1.5 rounded hover:bg-[#f2f4f7] text-[#535862] transition"
                        >
                          <Edit01 className="size-3.5 text-[#535862]" />
                        </Link>
                        <button
                          type="button"
                          title="Hapus artikel"
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 rounded hover:bg-[#fef3f2] text-[#d92d20] transition cursor-pointer"
                        >
                          <Trash01 className="size-3.5 text-[#d92d20]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>

          {/* Pagination Controls */}
          <TablePagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            itemsPerPage={limit}
            onPageChange={setPage}
            onItemsPerPageChange={setLimit}
          />
        </div>
      </div>
    </div>
  );
}
