'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { api } from '@/lib/api';
import { RedirectItem } from '@/lib/types';
import {
  Plus,
  Trash01,
  Edit01,
  SwitchHorizontal01,
  Check,
  XClose,
  ArrowRight,
  InfoCircle,
  SearchLg,
} from '@untitledui/icons';
import { formatDate } from '@/lib/utils';
import { TablePagination } from '@/components/TablePagination';

export default function RedirectsPage() {
  const [redirects, setRedirects] = useState<RedirectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Form State
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [sourcePath, setSourcePath] = useState('');
  const [targetPath, setTargetPath] = useState('');
  const [statusCode, setStatusCode] = useState(301);
  const [description, setDescription] = useState('');
  const [active, setActive] = useState(true);

  const loadRedirects = async () => {
    try {
      setLoading(true);
      const data = await api.getRedirects();
      setRedirects(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRedirects();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourcePath.trim() || !targetPath.trim()) return;

    try {
      await api.createRedirect({
        sourcePath: sourcePath.trim(),
        targetPath: targetPath.trim(),
        statusCode: Number(statusCode) || 301,
        description: description.trim() || undefined,
        active,
      });
      resetForm();
      setIsAdding(false);
      loadRedirects();
    } catch (err: any) {
      alert(err.message || 'Gagal menambahkan redirect');
    }
  };

  const resetForm = () => {
    setSourcePath('');
    setTargetPath('');
    setStatusCode(301);
    setDescription('');
    setActive(true);
    setEditingId(null);
  };

  const startEdit = (item: RedirectItem) => {
    setEditingId(item.id);
    setSourcePath(item.sourcePath);
    setTargetPath(item.targetPath);
    setStatusCode(item.statusCode);
    setDescription(item.description || '');
    setActive(item.active);
    setIsAdding(true);
  };

  const handleUpdate = async (id: string) => {
    try {
      await api.updateRedirect(id, {
        sourcePath: sourcePath.trim(),
        targetPath: targetPath.trim(),
        statusCode: Number(statusCode) || 301,
        description: description.trim() || undefined,
        active,
      });
      resetForm();
      setIsAdding(false);
      loadRedirects();
    } catch (err: any) {
      alert(err.message || 'Gagal update redirect');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus aturan redirect ini?')) return;
    try {
      await api.deleteRedirect(id);
      loadRedirects();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus redirect');
    }
  };

  const filteredRedirects = redirects.filter((r) => {
    if (filterStatus === 'ACTIVE' && !r.active) return false;
    if (filterStatus === 'INACTIVE' && r.active) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.sourcePath.toLowerCase().includes(q) ||
      r.targetPath.toLowerCase().includes(q) ||
      (r.description && r.description.toLowerCase().includes(q))
    );
  });

  const totalPages = Math.ceil(filteredRedirects.length / limit) || 1;
  const paginatedRedirects = filteredRedirects.slice((page - 1) * limit, page * limit);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#f8fafc]">
      <Header
        title="301 / 302 Redirect Manager"
        description="Kelola pengalihan URL dinamis untuk menjaga integritas link juice dan mencegah error 404 pada Google Organic Search."
        actions={
          <button
            type="button"
            onClick={() => {
              resetForm();
              setIsAdding(!isAdding);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#465984] hover:bg-[#3f5077] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="size-3.5 text-white" />
            <span>Tambah Redirect</span>
          </button>
        }
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 w-full flex-1">
        {/* SEO Tip Card */}
        <div className="p-4 rounded-xl border border-[#c6d2e6] bg-[#f2f5f9] text-[#1e273b] text-xs flex items-start gap-3 shadow-xs">
          <InfoCircle className="size-4 text-[#465984] shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold text-[#181d27]">Otomatisasi 301:</span> Ketika Anda mengubah slug artikel di CMS, sistem backend otomatis membuat aturan 301 dari URL lama ke URL baru. Halaman ini digunakan untuk memantau atau menambahkan redirect kustom tambahan (misal dari URL kampanye lama).
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-[#eaecf0] shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setFilterStatus('ALL');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
                filterStatus === 'ALL'
                  ? 'bg-[#181d27] text-white'
                  : 'bg-[#f9fafb] text-[#535862] hover:bg-[#f2f4f7]'
              }`}
            >
              Semua ({redirects.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterStatus('ACTIVE');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
                filterStatus === 'ACTIVE'
                  ? 'bg-[#181d27] text-white'
                  : 'bg-[#f9fafb] text-[#535862] hover:bg-[#f2f4f7]'
              }`}
            >
              Aktif ({redirects.filter((r) => r.active).length})
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterStatus('INACTIVE');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
                filterStatus === 'INACTIVE'
                  ? 'bg-[#181d27] text-white'
                  : 'bg-[#f9fafb] text-[#535862] hover:bg-[#f2f4f7]'
              }`}
            >
              Nonaktif ({redirects.filter((r) => !r.active).length})
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <SearchLg className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#717680]" />
            <input
              type="text"
              placeholder="Cari path asal, tujuan, atau catatan..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 pr-3 py-1.5 text-xs bg-white border border-[#d5d7da] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984] text-[#181d27] w-full"
            />
          </div>
        </div>

        {isAdding && (
          <form
            onSubmit={(e) => {
              if (editingId) {
                e.preventDefault();
                handleUpdate(editingId);
              } else {
                handleCreate(e);
              }
            }}
            className="bg-white p-6 rounded-2xl border border-[#eaecf0] shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#181d27] uppercase tracking-wider">
                {editingId ? 'Edit Aturan Redirect' : 'Tambah Redirect Baru'}
              </span>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setIsAdding(false);
                }}
                className="text-[#717680] hover:text-[#181d27] cursor-pointer"
              >
                <XClose className="size-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1">Source Path (URL Asal)</label>
                <input
                  type="text"
                  value={sourcePath}
                  onChange={(e) => setSourcePath(e.target.value)}
                  placeholder="/blog/slug-lama-2025"
                  required
                  className="w-full text-xs p-2.5 border border-[#d5d7da] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984] text-[#181d27] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1">Target Path (URL Tujuan)</label>
                <input
                  type="text"
                  value={targetPath}
                  onChange={(e) => setTargetPath(e.target.value)}
                  placeholder="/blog/slug-baru-2026"
                  required
                  className="w-full text-xs p-2.5 border border-[#d5d7da] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984] text-[#181d27] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1">HTTP Status Code</label>
                <select
                  value={statusCode}
                  onChange={(e) => setStatusCode(Number(e.target.value))}
                  className="w-full text-xs p-2.5 border border-[#d5d7da] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984] bg-white text-[#181d27]"
                >
                  <option value={301}>301 Moved Permanently (SEO Standard)</option>
                  <option value={302}>302 Found (Temporary Redirect)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1">Catatan / Alasan</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ganti judul & pembaruan tahun 2026..."
                  className="w-full text-xs p-2.5 border border-[#d5d7da] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984] text-[#181d27]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-xs cursor-pointer text-[#344054] font-medium">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="rounded text-[#465984] focus:ring-[#465984]"
                  />
                  <span>Aktifkan redirect ini langsung</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setIsAdding(false);
                }}
                className="px-3.5 py-2 text-xs font-semibold text-[#344054] hover:bg-[#f9fafb] border border-[#d5d7da] rounded-lg cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs bg-[#465984] hover:bg-[#3f5077] text-white font-semibold rounded-lg shadow-xs cursor-pointer"
              >
                {editingId ? 'Simpan Perubahan' : 'Buat Redirect'}
              </button>
            </div>
          </form>
        )}

        {/* Redirects Table */}
        <div className="bg-white rounded-xl border border-[#eaecf0] shadow-xs overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs border-collapse min-w-[640px]">
            <thead>
              <tr className="bg-[#fafafa] border-b border-[#eaecf0] text-[#717680] font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Pengalihan (Source → Target)</th>
                <th className="py-3 px-4">Tipe Status</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Dibuat Pada</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f2f4f7]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-[#717680]">
                    Memuat redirects...
                  </td>
                </tr>
              ) : filteredRedirects.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#717680]">
                    {search || filterStatus !== 'ALL'
                      ? 'Tidak ada aturan redirect yang cocok dengan filter.'
                      : 'Belum ada aturan redirect aktif.'}
                  </td>
                </tr>
              ) : (
                paginatedRedirects.map((r) => (
                  <tr key={r.id} className="hover:bg-[#f9fafb] transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 font-mono text-[11px]">
                        <span className="text-[#181d27] font-semibold">{r.sourcePath}</span>
                        <ArrowRight className="size-3.5 text-[#717680]" />
                        <span className="text-[#465984] font-semibold">{r.targetPath}</span>
                      </div>
                      {r.description && (
                        <div className="text-[10px] text-[#717680] mt-0.5">{r.description}</div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-[#f2f5f9] text-[#465984] border border-[#c6d2e6]">
                        {r.statusCode}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          r.active
                            ? 'bg-[#ecfdf3] text-[#079455]'
                            : 'bg-[#f2f4f7] text-[#535862]'
                        }`}
                      >
                        {r.active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-[#535862]">
                      {formatDate(r.createdAt)}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(r)}
                          className="p-1.5 text-[#535862] hover:bg-[#f2f4f7] rounded cursor-pointer"
                        >
                          <Edit01 className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(r.id)}
                          className="p-1.5 text-[#d92d20] hover:bg-[#fef3f2] rounded cursor-pointer"
                        >
                          <Trash01 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>

          <TablePagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={filteredRedirects.length}
            itemsPerPage={limit}
            onPageChange={setPage}
          />
        </div>
      </div>
    </div>
  );
}
