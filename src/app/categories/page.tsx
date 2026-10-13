'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { api } from '@/lib/api';
import { Category } from '@/lib/types';
import { Plus, Trash01, Edit01, Check, XClose } from '@untitledui/icons';

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
    <div className="flex-1 flex flex-col min-h-screen bg-[#f8fafc]">
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
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#465984] hover:bg-[#3f5077] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="size-3.5 text-white" />
            <span>Tambah Kategori</span>
          </button>
        }
      />

      <div className="p-8 space-y-6 max-w-5xl">
        {isAdding && (
          <form
            onSubmit={handleCreate}
            className="bg-white p-6 rounded-2xl border border-[#eaecf0] shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#181d27] uppercase tracking-wider">
                Tambah Kategori Baru
              </span>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="text-[#717680] hover:text-[#181d27] cursor-pointer"
              >
                <XClose className="size-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1">Nama Kategori</label>
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
                  className="w-full text-xs p-2.5 border border-[#d5d7da] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984] text-[#181d27]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1">Custom Slug</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="seo-search"
                  className="w-full text-xs p-2.5 border border-[#d5d7da] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984] text-[#181d27] font-mono"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-[#344054] mb-1">Deskripsi Singkat</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Deskripsi topik untuk halaman kategori publik..."
                  className="w-full text-xs p-2.5 border border-[#d5d7da] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984] text-[#181d27]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3.5 py-2 text-xs font-semibold text-[#344054] hover:bg-[#f9fafb] border border-[#d5d7da] rounded-lg cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs bg-[#465984] hover:bg-[#3f5077] text-white font-semibold rounded-lg shadow-xs cursor-pointer"
              >
                Simpan Kategori
              </button>
            </div>
          </form>
        )}

        <div className="bg-white rounded-xl border border-[#eaecf0] shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#fafafa] border-b border-[#eaecf0] text-[#717680] font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Nama & Deskripsi</th>
                <th className="py-3 px-4">Slug URL</th>
                <th className="py-3 px-4">Jumlah Artikel</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f2f4f7]">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-[#717680]">
                    Memuat kategori...
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-[#717680]">
                    Belum ada kategori.
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-[#f9fafb] transition-colors">
                    <td className="py-3 px-4">
                      {editingId === cat.id ? (
                        <div className="space-y-1">
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="p-1.5 border border-[#d5d7da] rounded text-xs w-full text-[#181d27]"
                          />
                          <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Deskripsi..."
                            className="p-1.5 border border-[#d5d7da] rounded text-[11px] w-full text-[#535862]"
                          />
                        </div>
                      ) : (
                        <div>
                          <span className="font-semibold text-[#181d27] block">{cat.name}</span>
                          {cat.description && (
                            <span className="text-[11px] text-[#717680] block">{cat.description}</span>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-[#717680]">
                      /blog/kategori/{cat.slug}
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-[#f2f4f7] text-[#424751] font-semibold text-[11px]">
                        {cat._count?.articles ?? 0} artikel
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      {editingId === cat.id ? (
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleUpdate(cat.id)}
                            className="p-1 text-[#079455] hover:bg-[#ecfdf3] rounded cursor-pointer"
                          >
                            <Check className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="p-1 text-[#717680] hover:bg-[#f2f4f7] rounded cursor-pointer"
                          >
                            <XClose className="size-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => startEdit(cat)}
                            className="p-1.5 text-[#535862] hover:bg-[#f2f4f7] rounded cursor-pointer"
                          >
                            <Edit01 className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(cat.id)}
                            className="p-1.5 text-[#d92d20] hover:bg-[#fef3f2] rounded cursor-pointer"
                          >
                            <Trash01 className="size-3.5" />
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
