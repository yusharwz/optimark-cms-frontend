'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { api } from '@/lib/api';
import { RedirectItem } from '@/lib/types';
import { Plus, Trash2, Edit2, Shuffle, Check, X, ArrowRight, Info } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function RedirectsPage() {
  const [redirects, setRedirects] = useState<RedirectItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="301 Redirect Management"
        description="Kelola pengalihan URL permanen (301) agar link equity, backlink, dan organic ranking tidak hilang saat URL artikel berubah."
        actions={
          <button
            type="button"
            onClick={() => {
              resetForm();
              setIsAdding(!isAdding);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#465984] hover:bg-[#38486d] text-white text-xs font-medium shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Redirect</span>
          </button>
        }
      />

      <div className="p-8 space-y-6 max-w-5xl">
        {/* SEO Tip Card */}
        <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/70 text-blue-900 text-xs flex items-start gap-3">
          <Info className="w-4 h-4 text-[#465984] shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold">Otomatisasi 301:</span> Ketika Anda mengubah slug artikel di CMS, sistem backend otomatis membuat aturan 301 dari URL lama ke URL baru. Halaman ini digunakan untuk memantau atau menambahkan redirect kustom tambahan (misal dari URL kampanye lama).
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
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                {editingId ? 'Edit Aturan Redirect' : 'Tambah Redirect Baru'}
              </span>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setIsAdding(false);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Source Path (URL Asal)</label>
                <input
                  type="text"
                  value={sourcePath}
                  onChange={(e) => setSourcePath(e.target.value)}
                  placeholder="/blog/slug-lama-2025"
                  required
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Target Path (URL Tujuan)</label>
                <input
                  type="text"
                  value={targetPath}
                  onChange={(e) => setTargetPath(e.target.value)}
                  placeholder="/blog/slug-baru-2026"
                  required
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">HTTP Status Code</label>
                <select
                  value={statusCode}
                  onChange={(e) => setStatusCode(Number(e.target.value))}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984] bg-white"
                >
                  <option value={301}>301 Moved Permanently (SEO Standard)</option>
                  <option value={302}>302 Found (Temporary Redirect)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Catatan / Alasan</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ganti judul & pembaruan tahun 2026..."
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-xs cursor-pointer text-slate-700">
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
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs bg-[#465984] hover:bg-[#38486d] text-white font-medium rounded-lg"
              >
                {editingId ? 'Simpan Perubahan' : 'Buat Redirect'}
              </button>
            </div>
          </form>
        )}

        {/* Redirects Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Pengalihan (Source → Target)</th>
                <th className="py-3 px-4">Tipe Status</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Dibuat Pada</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    Memuat redirects...
                  </td>
                </tr>
              ) : redirects.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Belum ada aturan redirect aktif.
                  </td>
                </tr>
              ) : (
                redirects.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 font-mono text-[11px]">
                        <span className="text-slate-800 font-semibold">{r.sourcePath}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-[#465984]">{r.targetPath}</span>
                      </div>
                      {r.description && (
                        <div className="text-[10px] text-slate-400 mt-0.5">{r.description}</div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-blue-50 text-blue-700 border border-blue-100">
                        {r.statusCode}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          r.active
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {r.active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-500">
                      {formatDate(r.createdAt)}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(r)}
                          className="p-1.5 text-slate-500 hover:bg-slate-100 rounded"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(r.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
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
