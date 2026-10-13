'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Clock,
  FileEdit,
  ExternalLink,
  Trash2,
  Send,
  MoreVertical,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Article, ArticleStatus } from '@/lib/types';
import { Header } from '@/components/Header';
import { formatDate } from '@/lib/utils';

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ArticleStatus | ''>('');
  const [total, setTotal] = useState(0);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const res = await api.getArticles({
        search: search || undefined,
        status: statusFilter || undefined,
        limit: 50,
      });
      setArticles(res.data);
      setTotal(res.meta.total);
    } catch (err) {
      console.error('Failed to fetch articles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchArticles();
  };

  const handlePublishNow = async (id: string) => {
    if (!confirm('Publish artikel ini sekarang ke publik?')) return;
    try {
      await api.publishArticleNow(id);
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
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="Daftar Artikel SEO"
        description="Kelola dan publikasikan artikel untuk mendominasi Google organic search."
        actions={
          <Link
            href="/articles/new"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#465984] hover:bg-[#38486d] text-white text-xs font-medium shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tulis Artikel</span>
          </Link>
        }
      />

      <div className="p-8 space-y-6 max-w-7xl">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
              Total Konten
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{total}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-medium text-emerald-600 uppercase tracking-wider block">
              Tayang (Published)
            </span>
            <div className="text-2xl font-bold text-emerald-700 mt-1">{publishedCount}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-medium text-amber-600 uppercase tracking-wider block">
              Terjadwal (Scheduled)
            </span>
            <div className="text-2xl font-bold text-amber-700 mt-1">{scheduledCount}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
              Draft
            </span>
            <div className="text-2xl font-bold text-slate-700 mt-1">{draftCount}</div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStatusFilter('')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                statusFilter === ''
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua ({total})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('PUBLISHED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                statusFilter === 'PUBLISHED'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              Published
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('SCHEDULED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                statusFilter === 'SCHEDULED'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              Scheduled
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('DRAFT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                statusFilter === 'DRAFT'
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Draft
            </button>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari judul atau slug..."
                className="pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984] w-64"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition"
            >
              Cari
            </button>
          </form>
        </div>

        {/* Articles Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Artikel & Slug</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">E-E-A-T Team</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Tanggal Tayang</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Memuat data artikel...
                  </td>
                </tr>
              ) : articles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-slate-600">Belum ada artikel ditemukan</p>
                    <p className="text-xs text-slate-400 mt-1">Mulai tulis artikel baru untuk meningkatkan SEO.</p>
                  </td>
                </tr>
              ) : (
                articles.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 max-w-sm">
                      <div className="flex items-start gap-3">
                        {item.coverImageUrl && (
                          <img
                            src={item.coverImageUrl}
                            alt=""
                            className="w-12 h-9 rounded object-cover border border-slate-200 shrink-0 mt-0.5"
                          />
                        )}
                        <div>
                          <Link
                            href={`/articles/${item.id}`}
                            className="font-semibold text-slate-900 hover:text-[#465984] line-clamp-1 text-[13px]"
                          >
                            {item.title}
                          </Link>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                            /blog/{item.slug}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {item.category ? (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                          {item.category.name}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <div className="font-medium text-slate-800">
                          {item.author?.name || 'Tanpa Author'}
                        </div>
                        {item.reviewer && (
                          <div className="text-[10px] text-slate-400 flex items-center gap-1">
                            <span>Rev:</span>
                            <span>{item.reviewer.name}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                          item.status === 'PUBLISHED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : item.status === 'SCHEDULED'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {item.status === 'PUBLISHED' && <CheckCircle className="w-3 h-3 text-emerald-600" />}
                        {item.status === 'SCHEDULED' && <Clock className="w-3 h-3 text-amber-600" />}
                        {item.status === 'DRAFT' && <FileEdit className="w-3 h-3 text-slate-500" />}
                        <span>{item.status}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      {item.status === 'SCHEDULED'
                        ? formatDate(item.scheduledAt)
                        : formatDate(item.publishedAt || item.createdAt)}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {item.status !== 'PUBLISHED' && (
                          <button
                            type="button"
                            title="Publish sekarang"
                            onClick={() => handlePublishNow(item.id)}
                            className="p-1.5 rounded hover:bg-emerald-50 text-emerald-600 transition"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <Link
                          href={`/articles/${item.id}`}
                          title="Edit artikel"
                          className="p-1.5 rounded hover:bg-slate-100 text-slate-600 transition"
                        >
                          <FileEdit className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          type="button"
                          title="Hapus artikel"
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 rounded hover:bg-rose-50 text-rose-600 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
