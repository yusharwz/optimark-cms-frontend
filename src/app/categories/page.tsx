'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { api } from '@/lib/api';
import { Category } from '@/lib/types';
import { Plus, Trash01, Edit01, XClose, Globe01, SearchLg } from '@untitledui/icons';
import { TablePagination } from '@/components/TablePagination';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  // Modal form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [activeTab, setActiveTab] = useState<'id' | 'en'>('id');

  // Form fields
  const [slug, setSlug] = useState('');
  const [sortOrder, setSortOrder] = useState(0);

  // ID fields
  const [nameId, setNameId] = useState('');
  const [descriptionId, setDescriptionId] = useState('');
  const [metaTitleId, setMetaTitleId] = useState('');
  const [metaDescriptionId, setMetaDescriptionId] = useState('');

  // EN fields
  const [nameEn, setNameEn] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [metaTitleEn, setMetaTitleEn] = useState('');
  const [metaDescriptionEn, setMetaDescriptionEn] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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

  const openCreateModal = () => {
    setEditingCategory(null);
    setSlug('');
    setSortOrder(categories.length + 1);
    setNameId('');
    setDescriptionId('');
    setMetaTitleId('');
    setMetaDescriptionId('');
    setNameEn('');
    setDescriptionEn('');
    setMetaTitleEn('');
    setMetaDescriptionEn('');
    setActiveTab('id');
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setSlug(cat.slug);
    setSortOrder(cat.sortOrder ?? 0);
    setNameId(cat.nameId || cat.name || '');
    setDescriptionId(cat.descriptionId || cat.description || '');
    setMetaTitleId(cat.metaTitleId || '');
    setMetaDescriptionId(cat.metaDescriptionId || '');
    setNameEn(cat.nameEn || '');
    setDescriptionEn(cat.descriptionEn || '');
    setMetaTitleEn(cat.metaTitleEn || '');
    setMetaDescriptionEn(cat.metaDescriptionEn || '');
    setActiveTab('id');
    setError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const primaryName = nameId.trim() || nameEn.trim();
    if (!primaryName) {
      setError('Nama kategori wajib diisi minimal pada salah satu bahasa.');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const autoSlug =
        slug.trim() ||
        primaryName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '');

      const payload = {
        name: primaryName,
        nameId: nameId.trim() || primaryName,
        nameEn: nameEn.trim() || undefined,
        slug: autoSlug,
        description: descriptionId.trim() || descriptionEn.trim() || undefined,
        descriptionId: descriptionId.trim() || undefined,
        descriptionEn: descriptionEn.trim() || undefined,
        metaTitleId: metaTitleId.trim() || undefined,
        metaTitleEn: metaTitleEn.trim() || undefined,
        metaDescriptionId: metaDescriptionId.trim() || undefined,
        metaDescriptionEn: metaDescriptionEn.trim() || undefined,
        sortOrder: Number(sortOrder) || 0,
      };

      if (editingCategory) {
        await api.updateCategory(editingCategory.id, payload);
      } else {
        await api.createCategory(payload);
      }

      setIsModalOpen(false);
      loadCategories();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan kategori');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, catName: string) => {
    if (!confirm(`Hapus kategori "${catName}"? Artikel di bawah kategori ini akan terpengaruh.`)) return;
    try {
      await api.deleteCategory(id);
      loadCategories();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus kategori');
    }
  };

  const filteredCategories = categories.filter((cat) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (cat.name && cat.name.toLowerCase().includes(q)) ||
      (cat.nameId && cat.nameId.toLowerCase().includes(q)) ||
      (cat.nameEn && cat.nameEn.toLowerCase().includes(q)) ||
      (cat.slug && cat.slug.toLowerCase().includes(q)) ||
      (cat.description && cat.description.toLowerCase().includes(q)) ||
      (cat.descriptionId && cat.descriptionId.toLowerCase().includes(q)) ||
      (cat.descriptionEn && cat.descriptionEn.toLowerCase().includes(q))
    );
  });

  const totalPages = Math.ceil(filteredCategories.length / limit) || 1;
  const paginatedCategories = filteredCategories.slice((page - 1) * limit, page * limit);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#f8fafc]">
      <Header
        title="Kategori Topik SEO (Bilingual)"
        description="Kelola taksonomi artikel dwibahasa (ID/EN) dan metadata SEO dinamis untuk Google Organic Search."
        actions={
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#465984] hover:bg-[#3f5077] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="size-3.5 text-white" />
            <span>Tambah Kategori Baru</span>
          </button>
        }
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 w-full flex-1">
        {/* Search & Filter Bar */}
        <div className="bg-white p-4 rounded-xl border border-[#eaecf0] shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="text-xs text-[#535862] font-medium">
            Total <span className="font-semibold text-[#181d27]">{filteredCategories.length}</span> Kategori Terdaftar
          </div>

          <div className="relative w-full sm:w-72">
            <SearchLg className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#717680]" />
            <input
              type="text"
              placeholder="Cari kategori atau slug..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 pr-3 py-1.5 text-xs bg-white border border-[#d5d7da] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984] text-[#181d27] w-full"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#eaecf0] shadow-xs overflow-hidden w-full">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs border-collapse min-w-[760px]">
            <thead>
              <tr className="bg-[#fafafa] border-b border-[#eaecf0] text-[#717680] font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Nama Topik (ID / EN)</th>
                <th className="py-3 px-4">Deskripsi Dinamis</th>
                <th className="py-3 px-4">URL Kategori</th>
                <th className="py-3 px-4">Artikel</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f2f4f7]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#717680]">
                    Memuat daftar kategori...
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-[#717680]">
                    {search ? 'Tidak ada kategori yang cocok dengan pencarian.' : 'Belum ada kategori yang terdaftar.'}
                  </td>
                </tr>
              ) : (
                paginatedCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-[#f9fafb] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-[#181d27]">{cat.nameId || cat.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-mono">ID</span>
                        </div>
                        {cat.nameEn && (
                          <div className="flex items-center gap-1.5 text-[#535862]">
                            <span>{cat.nameEn}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-mono">EN</span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs truncate text-[#535862]">
                      <span className="block truncate text-[11px] text-[#414651]">
                        {cat.descriptionId || cat.description || '-'}
                      </span>
                      {cat.descriptionEn && (
                        <span className="block truncate text-[11px] text-[#717680] italic">
                          EN: {cat.descriptionEn}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-[#717680]">
                      /blog/kategori/{cat.slug}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-[#f2f4f7] text-[#424751] font-semibold text-[11px]">
                        {cat._count?.articles ?? 0} artikel
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(cat)}
                          className="p-1.5 text-[#535862] hover:bg-[#f2f4f7] rounded cursor-pointer"
                          title="Edit Kategori & SEO"
                        >
                          <Edit01 className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(cat.id, cat.name)}
                          className="p-1.5 text-[#d92d20] hover:bg-[#fef3f2] rounded cursor-pointer"
                          title="Hapus Kategori"
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
            totalItems={filteredCategories.length}
            itemsPerPage={limit}
            onPageChange={setPage}
            onItemsPerPageChange={setLimit}
          />
        </div>
      </div>

      {/* Modal Add / Edit Category */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-[#eaecf0] shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-[#eaecf0] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#181d27]">
                  {editingCategory ? 'Edit Kategori Topik & SEO' : 'Tambah Kategori Topik Baru'}
                </h3>
                <p className="text-xs text-[#717680]">
                  Pengaturan taksonomi dwibahasa dan metadata Google SEO
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-[#717680] hover:text-[#181d27] cursor-pointer"
              >
                <XClose className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                  {error}
                </div>
              )}

              {/* General Settings: Slug & Sort Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-[#eaecf0]">
                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1">
                    Slug URL Kategori *
                  </label>
                  <div className="flex items-center">
                    <span className="text-[11px] text-[#717680] bg-[#f2f4f7] px-2 py-2 border border-r-0 border-[#d5d7da] rounded-l-lg font-mono">
                      /kategori/
                    </span>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="seo"
                      required
                      className="w-full text-xs p-2 border border-[#d5d7da] rounded-r-lg focus:outline-none focus:ring-2 focus:ring-[#465984] text-[#181d27] font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1">
                    Urutan Tampilan (Sort Order)
                  </label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    min={0}
                    className="w-full text-xs p-2 border border-[#d5d7da] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984] text-[#181d27]"
                  />
                </div>
              </div>

              {/* Language Tabs */}
              <div>
                <div className="flex items-center gap-2 border-b border-[#eaecf0] pb-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('id')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      activeTab === 'id'
                        ? 'bg-[#465984] text-white'
                        : 'bg-[#f2f4f7] text-[#535862] hover:bg-[#e4e7ec]'
                    }`}
                  >
                    <span>🇮🇩 Bahasa Indonesia (ID)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('en')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      activeTab === 'en'
                        ? 'bg-[#465984] text-white'
                        : 'bg-[#f2f4f7] text-[#535862] hover:bg-[#e4e7ec]'
                    }`}
                  >
                    <span>🇬🇧 English (EN)</span>
                  </button>
                </div>

                {activeTab === 'id' ? (
                  <div className="pt-4 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#344054] mb-1">
                        Nama Kategori (ID) *
                      </label>
                      <input
                        type="text"
                        value={nameId}
                        onChange={(e) => {
                          setNameId(e.target.value);
                          if (!slug && !editingCategory) {
                            setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                          }
                        }}
                        placeholder="Contoh: SEO"
                        className="w-full text-xs p-2.5 border border-[#d5d7da] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984] text-[#181d27]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#344054] mb-1">
                        Deskripsi Topik (ID)
                      </label>
                      <textarea
                        rows={2}
                        value={descriptionId}
                        onChange={(e) => setDescriptionId(e.target.value)}
                        placeholder="Panduan praktis optimasi mesin pencari untuk bisnis lokal dan UMKM..."
                        className="w-full text-xs p-2.5 border border-[#d5d7da] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984] text-[#181d27]"
                      />
                    </div>

                    <div className="pt-2 border-t border-dashed border-[#eaecf0] space-y-3">
                      <div className="flex items-center gap-1.5 text-[#465984] font-semibold text-xs">
                        <Globe01 className="size-3.5" />
                        <span>SEO Meta Tags (ID)</span>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#535862] mb-1">
                          Meta Title (ID)
                        </label>
                        <input
                          type="text"
                          value={metaTitleId}
                          onChange={(e) => setMetaTitleId(e.target.value)}
                          placeholder="Artikel & Panduan SEO | Optimark"
                          className="w-full text-xs p-2 border border-[#d5d7da] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984] text-[#181d27]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#535862] mb-1">
                          Meta Description (ID)
                        </label>
                        <textarea
                          rows={2}
                          value={metaDescriptionId}
                          onChange={(e) => setMetaDescriptionId(e.target.value)}
                          placeholder="Kumpulan panduan praktis SEO, riset keyword..."
                          className="w-full text-xs p-2 border border-[#d5d7da] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984] text-[#181d27]"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="pt-4 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#344054] mb-1">
                        Category Name (EN)
                      </label>
                      <input
                        type="text"
                        value={nameEn}
                        onChange={(e) => setNameEn(e.target.value)}
                        placeholder="Example: SEO"
                        className="w-full text-xs p-2.5 border border-[#d5d7da] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984] text-[#181d27]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#344054] mb-1">
                        Topic Description (EN)
                      </label>
                      <textarea
                        rows={2}
                        value={descriptionEn}
                        onChange={(e) => setDescriptionEn(e.target.value)}
                        placeholder="Practical search engine optimization guides for local businesses and SMBs..."
                        className="w-full text-xs p-2.5 border border-[#d5d7da] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984] text-[#181d27]"
                      />
                    </div>

                    <div className="pt-2 border-t border-dashed border-[#eaecf0] space-y-3">
                      <div className="flex items-center gap-1.5 text-[#465984] font-semibold text-xs">
                        <Globe01 className="size-3.5" />
                        <span>SEO Meta Tags (EN)</span>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#535862] mb-1">
                          Meta Title (EN)
                        </label>
                        <input
                          type="text"
                          value={metaTitleEn}
                          onChange={(e) => setMetaTitleEn(e.target.value)}
                          placeholder="SEO Articles & Guides | Optimark"
                          className="w-full text-xs p-2 border border-[#d5d7da] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984] text-[#181d27]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#535862] mb-1">
                          Meta Description (EN)
                        </label>
                        <textarea
                          rows={2}
                          value={metaDescriptionEn}
                          onChange={(e) => setMetaDescriptionEn(e.target.value)}
                          placeholder="Practical SEO guides, keyword research, and Google Search Console optimization..."
                          className="w-full text-xs p-2 border border-[#d5d7da] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984] text-[#181d27]"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[#eaecf0]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#344054] hover:bg-[#f9fafb] border border-[#d5d7da] rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs bg-[#465984] hover:bg-[#3f5077] text-white font-semibold rounded-lg shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Kategori'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
