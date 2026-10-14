'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Header } from '@/components/Header';
import { api } from '@/lib/api';
import { CommentItem, CommentStatus, CommentStats } from '@/lib/types';
import {
  MessageSquare01,
  CheckCircle,
  AlertTriangle,
  SlashCircle01,
  Trash01,
  SearchLg,
  ArrowUpRight,
  Clock,
  Globe01,
  File06,
} from '@untitledui/icons';

export default function CommentsPage() {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [stats, setStats] = useState<CommentStats>({
    total: 0,
    pending: 0,
    approved: 0,
    spam: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [commentsRes, statsRes] = await Promise.all([
        api.getComments({
          status: statusFilter === 'ALL' ? undefined : statusFilter,
          search: debouncedSearch.trim() || undefined,
          limit: 50,
        }),
        api.getCommentStats(),
      ]);

      setComments(commentsRes.items || []);
      setStats(statsRes);
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, debouncedSearch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdateStatus = async (id: string, newStatus: CommentStatus) => {
    try {
      setUpdatingId(id);
      await api.updateCommentStatus(id, newStatus);
      await loadData();
    } catch (err: any) {
      alert(`Gagal memperbarui status: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus komentar ini secara permanen?')) {
      return;
    }
    try {
      setUpdatingId(id);
      await api.deleteComment(id);
      await loadData();
    } catch (err: any) {
      alert(`Gagal menghapus komentar: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status: CommentStatus) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#ecfdf3] text-[#027a48] border border-[#a6f4c5]">
            <CheckCircle className="size-3" />
            Disetujui
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#fffaeb] text-[#b54708] border border-[#fedf89]">
            <Clock className="size-3" />
            Menunggu Moderasi
          </span>
        );
      case 'SPAM':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#fef3f2] text-[#b42318] border border-[#fecdca]">
            <AlertTriangle className="size-3" />
            Spam
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f8f9fa] text-[#535862] border border-[#e9eaeb]">
            <SlashCircle01 className="size-3" />
            Ditolak
          </span>
        );
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-[#f8fafc]">
      <Header
        title="Moderasi Komentar Blog"
        description="Kelola, setujui, tolak, atau tandai spam kiriman komentar pembaca dari landing page."
      />

      <div className="p-8 max-w-7xl mx-auto space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => setStatusFilter('ALL')}
            className={`p-5 bg-white rounded-xl border transition-all cursor-pointer ${
              statusFilter === 'ALL'
                ? 'border-[#465984] ring-2 ring-[#465984]/10 shadow-sm'
                : 'border-[#eaecf0] hover:border-[#d0d5dd]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#535862] uppercase tracking-wider">
                Total Komentar
              </span>
              <MessageSquare01 className="size-4 text-[#717680]" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#181d27]">{stats.total}</span>
              <span className="text-xs text-[#717680]">semua entri</span>
            </div>
          </div>

          <div
            onClick={() => setStatusFilter('PENDING')}
            className={`p-5 bg-white rounded-xl border transition-all cursor-pointer ${
              statusFilter === 'PENDING'
                ? 'border-[#f79009] ring-2 ring-[#f79009]/10 shadow-sm'
                : 'border-[#eaecf0] hover:border-[#d0d5dd]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#b54708] uppercase tracking-wider">
                Menunggu Moderasi
              </span>
              <Clock className="size-4 text-[#f79009]" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#b54708]">{stats.pending}</span>
              {stats.pending > 0 && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#fffaeb] text-[#b54708] border border-[#fedf89]">
                  Perlu Ditinjau
                </span>
              )}
            </div>
          </div>

          <div
            onClick={() => setStatusFilter('APPROVED')}
            className={`p-5 bg-white rounded-xl border transition-all cursor-pointer ${
              statusFilter === 'APPROVED'
                ? 'border-[#12b76a] ring-2 ring-[#12b76a]/10 shadow-sm'
                : 'border-[#eaecf0] hover:border-[#d0d5dd]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#027a48] uppercase tracking-wider">
                Disetujui & Tampil
              </span>
              <CheckCircle className="size-4 text-[#12b76a]" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#027a48]">{stats.approved}</span>
              <span className="text-xs text-[#717680]">live di landing page</span>
            </div>
          </div>

          <div
            onClick={() => setStatusFilter('SPAM')}
            className={`p-5 bg-white rounded-xl border transition-all cursor-pointer ${
              statusFilter === 'SPAM'
                ? 'border-[#f04438] ring-2 ring-[#f04438]/10 shadow-sm'
                : 'border-[#eaecf0] hover:border-[#d0d5dd]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#b42318] uppercase tracking-wider">
                Terdeteksi Spam
              </span>
              <AlertTriangle className="size-4 text-[#f04438]" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#b42318]">{stats.spam}</span>
              <span className="text-xs text-[#717680]">diblokir</span>
            </div>
          </div>
        </div>

        {/* Filter Tabs & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#eaecf0] shadow-xs">
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {[
              { id: 'ALL', label: 'Semua', count: stats.total },
              { id: 'PENDING', label: 'Menunggu', count: stats.pending },
              { id: 'APPROVED', label: 'Disetujui', count: stats.approved },
              { id: 'SPAM', label: 'Spam', count: stats.spam },
              { id: 'REJECTED', label: 'Ditolak', count: stats.rejected },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 ${
                  statusFilter === tab.id
                    ? 'bg-[#465984] text-white'
                    : 'text-[#535862] hover:bg-[#f2f4f7] hover:text-[#181d27]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    statusFilter === tab.id
                      ? 'bg-white/20 text-white'
                      : 'bg-[#eaecf0] text-[#535862]'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <SearchLg className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#717680]" />
            <input
              type="text"
              placeholder="Cari nama, email, isi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-[#d0d5dd] rounded-lg text-xs focus:ring-2 focus:ring-[#465984] focus:border-[#465984] outline-none"
            />
          </div>
        </div>

        {/* Comments Feed */}
        {loading ? (
          <div className="p-12 text-center bg-white rounded-xl border border-[#eaecf0]">
            <div className="inline-block size-6 border-2 border-[#465984] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs text-[#717680]">Memuat data komentar...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-xl border border-[#eaecf0] shadow-xs">
            <MessageSquare01 className="size-12 text-[#98a2b3] mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-[#181d27]">Tidak Ada Komentar</h3>
            <p className="text-xs text-[#717680] mt-1 max-w-sm mx-auto">
              {search
                ? 'Tidak ada komentar yang cocok dengan kata kunci pencarian Anda.'
                : 'Belum ada komentar untuk filter status ini. Kiriman komentar dari landing page akan muncul di sini secara otomatis.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="bg-white rounded-xl border border-[#eaecf0] p-5 shadow-xs hover:border-[#d0d5dd] transition-all space-y-3"
              >
                {/* Header row: Author info & Status badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#f2f4f7]">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-full bg-[#f2f5f9] text-[#465984] font-bold text-xs flex items-center justify-center shrink-0 border border-[#465984]/20">
                      {comment.authorName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#181d27]">
                          {comment.authorName}
                        </span>
                        {comment.authorWebsite && (
                          <a
                            href={comment.authorWebsite}
                            target="_blank"
                            rel="ugc nofollow noreferrer"
                            className="text-[#465984] hover:underline flex items-center gap-0.5 text-xs"
                            title={comment.authorWebsite}
                          >
                            <Globe01 className="size-3" />
                            <ArrowUpRight className="size-3" />
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#717680]">
                        <span>{comment.authorEmail}</span>
                        <span>•</span>
                        <span>
                          {format(new Date(comment.createdAt), 'dd MMM yyyy, HH:mm', {
                            locale: localeId,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(comment.status)}
                  </div>
                </div>

                {/* Target Article Reference */}
                <div className="bg-[#f8fafc] px-3 py-2 rounded-lg text-xs flex items-center justify-between gap-2 border border-[#eaecf0]">
                  <div className="flex items-center gap-2 text-[#535862] truncate">
                    <File06 className="size-3.5 text-[#465984] shrink-0" />
                    <span className="text-[#717680]">Artikel:</span>
                    <span className="font-medium text-[#181d27] truncate">
                      {comment.article?.title || comment.slug}
                    </span>
                  </div>
                  <a
                    href={`https://optimark.ai/blog/${comment.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#465984] hover:underline shrink-0 flex items-center gap-1 font-medium"
                  >
                    <span>Buka URL</span>
                    <ArrowUpRight className="size-3" />
                  </a>
                </div>

                {/* Comment Content */}
                <div className="text-xs text-[#344054] leading-relaxed bg-[#fcfcfd] p-3 rounded-lg border border-[#f2f4f7] font-normal">
                  <p className="whitespace-pre-wrap">{comment.content}</p>
                </div>

                {/* Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="text-[11px] text-[#717680]">
                    ID: <code className="bg-[#f2f4f7] px-1 py-0.5 rounded">{comment.id}</code>
                  </div>

                  <div className="flex items-center gap-2">
                    {comment.status !== 'APPROVED' && (
                      <button
                        disabled={updatingId === comment.id}
                        onClick={() => handleUpdateStatus(comment.id, 'APPROVED')}
                        className="px-3 py-1.5 bg-[#12b76a] hover:bg-[#039855] text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                      >
                        <CheckCircle className="size-3.5" />
                        <span>Setujui</span>
                      </button>
                    )}

                    {comment.status !== 'SPAM' && (
                      <button
                        disabled={updatingId === comment.id}
                        onClick={() => handleUpdateStatus(comment.id, 'SPAM')}
                        className="px-3 py-1.5 bg-white hover:bg-[#fef3f2] text-[#b42318] border border-[#fecdca] rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <AlertTriangle className="size-3.5" />
                        <span>Tandai Spam</span>
                      </button>
                    )}

                    {comment.status !== 'REJECTED' && (
                      <button
                        disabled={updatingId === comment.id}
                        onClick={() => handleUpdateStatus(comment.id, 'REJECTED')}
                        className="px-3 py-1.5 bg-white hover:bg-[#f8f9fa] text-[#535862] border border-[#d0d5dd] rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <SlashCircle01 className="size-3.5" />
                        <span>Tolak</span>
                      </button>
                    )}

                    <button
                      disabled={updatingId === comment.id}
                      onClick={() => handleDelete(comment.id)}
                      className="p-1.5 text-[#717680] hover:text-[#d92d20] hover:bg-[#fee4e2] rounded-lg transition-colors disabled:opacity-50"
                      title="Hapus Komentar"
                    >
                      <Trash01 className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
