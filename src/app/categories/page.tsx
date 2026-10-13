'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { api } from '@/lib/api';
import { Category } from '@/lib/types';
import { Plus, Trash2, Edit2, FolderTree, Check, X } from 'lucide-react';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState(0);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await api.getCategories();
      setCategories(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await api.createCategory({
        name,
        slug: slug.trim() || undefined,
        description: description.trim() || undefined,
        sortOrder: Number(sortOrder) || 0,
      });
      setName('');
      setSlug('');
      setDescription('');
      setSortOrder(0);
      setIsAdding(false);
      loadCategories();
    } catch (err: any) {
      alert(err.message || 'Gagal membuat kategori');
    }
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setSortOrder(cat.sortOrder);
  };

  const handleUpdate = async (id: string) => {
    try {
      await api.updateCategory(id, {
        name,
        slug: slug.trim() || undefined,
        description: description.trim() || undefined,
        sortOrder: Number(sortOrder) || 0,
      });
      setEditingId(null);
      loadCategories();
    } catch (err: any) {
      alert(err.message || 'Gagal update kategori');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus kategori ini?')) return;
    try {
      await api.deleteCategory(id);
      loadCategories();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus kategori');
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="Kategori Topik SEO"
        description="Kelola taksonomi artikel untuk mengelompokkan kata kunci dan topical authority."
        actions={
          <button
            type="button"
            onClick={() => {
              setIsAdding(!isAdding);
              setEditingId(null);
              setName('');
              setSlug('');
              setDescription('');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#465984] hover:bg-[#38486d] text-white text-xs font-medium shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Kategori</span>
          </button>
        }
      />

      <div className="p-8 space-y-6 max-w-5xl">
        {isAdding && (
          <form
            onSubmit={handleCreate}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                Tambah Kategori Baru
              </span>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Nama Kategori</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!slug) {
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                    }
                  }}
                  placeholder="Misal: SEO & Search"
                  required
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Custom Slug</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="seo-search"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">Deskripsi Singkat</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Deskripsi topik untuk halaman kategori publik..."
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs bg-[#465984] hover:bg-[#38486d] text-white font-medium rounded-lg"
              >
                Simpan Kategori
              </button>
            </div>
          </form>
        )}

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Nama & Deskripsi</th>
                <th className="py-3 px-4">Slug URL</th>
                <th className="py-3 px-4">Jumlah Artikel</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-400">
                    Memuat kategori...
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    Belum ada kategori.
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4">
                      {editingId === cat.id ? (
                        <div className="space-y-1">
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="p-1 border rounded text-xs w-full"
                          />
                          <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Deskripsi..."
                            className="p-1 border rounded text-[11px] w-full text-slate-500"
                          />
                        </div>
                      ) : (
                        <div>
                          <span className="font-semibold text-slate-900 block">{cat.name}</span>
                          {cat.description && (
                            <span className="text-[11px] text-slate-500 block">{cat.description}</span>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      /blog/kategori/{cat.slug}
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                        {cat._count?.articles ?? 0} artikel
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      {editingId === cat.id ? (
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleUpdate(cat.id)}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => startEdit(cat)}
                            className="p-1.5 text-slate-500 hover:bg-slate-100 rounded"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(cat.id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
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
