'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { api } from '@/lib/api';
import { Person, PersonType } from '@/lib/types';
import {
  Plus,
  Trash01,
  Edit01,
  Users01,
  Check,
  XClose,
  ArrowUpRight,
  Upload01,
} from '@untitledui/icons';

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [role, setRole] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [type, setType] = useState<PersonType>('BOTH');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const loadPeople = async () => {
    try {
      setLoading(true);
      const data = await api.getPeople();
      setPeople(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPeople();
  }, []);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingAvatar(true);
      const res = await api.uploadMedia(file, `Avatar ${name || 'Author'}`, true);
      setAvatarUrl(res.url);
    } catch (err: any) {
      alert(err.message || 'Gagal upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role.trim()) return;

    try {
      await api.createPerson({
        name,
        slug: slug.trim() || undefined,
        role,
        bio: bio.trim() || undefined,
        avatarUrl: avatarUrl.trim() || undefined,
        linkedinUrl: linkedinUrl.trim() || undefined,
        type,
      });
      resetForm();
      setIsAdding(false);
      loadPeople();
    } catch (err: any) {
      alert(err.message || 'Gagal membuat profil person');
    }
  };

  const resetForm = () => {
    setName('');
    setSlug('');
    setRole('');
    setBio('');
    setAvatarUrl('');
    setLinkedinUrl('');
    setType('BOTH');
    setEditingId(null);
  };

  const startEdit = (p: Person) => {
    setEditingId(p.id);
    setName(p.name);
    setSlug(p.slug);
    setRole(p.role);
    setBio(p.bio || '');
    setAvatarUrl(p.avatarUrl || '');
    setLinkedinUrl(p.linkedinUrl || '');
    setType(p.type);
    setIsAdding(true);
  };

  const handleUpdate = async (id: string) => {
    try {
      await api.updatePerson(id, {
        name,
        slug: slug.trim() || undefined,
        role,
        bio: bio.trim() || undefined,
        avatarUrl: avatarUrl.trim() || undefined,
        linkedinUrl: linkedinUrl.trim() || undefined,
        type,
      });
      resetForm();
      setIsAdding(false);
      loadPeople();
    } catch (err: any) {
      alert(err.message || 'Gagal update profil');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus profil ini?')) return;
    try {
      await api.deletePerson(id);
      loadPeople();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus profil');
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#f8fafc]">
      <Header
        title="Author & Reviewer E-E-A-T"
        description="Kelola profil penulis dan reviewer ahli untuk memenuhi standar Google E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness)."
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
            <span>Tambah Profil</span>
          </button>
        }
      />

      <div className="p-8 space-y-6 max-w-5xl">
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
                {editingId ? 'Edit Profil E-E-A-T' : 'Tambah Penulis / Reviewer Baru'}
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
                <label className="block text-xs font-semibold text-[#344054] mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!slug && !editingId) {
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                    }
                  }}
                  placeholder="Misal: Jonathan Anderson"
                  required
                  className="w-full text-xs p-2.5 border border-[#d5d7da] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984] text-[#181d27]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1">Jabatan / Kredensial</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="Misal: Head of Content & SEO Strategy"
                  required
                  className="w-full text-xs p-2.5 border border-[#d5d7da] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984] text-[#181d27]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1">Peran di CMS</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as PersonType)}
                  className="w-full text-xs p-2.5 border border-[#d5d7da] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984] bg-white text-[#181d27]"
                >
                  <option value="AUTHOR">Penulis Saja (Author)</option>
                  <option value="REVIEWER">Reviewer Saja (Reviewer)</option>
                  <option value="BOTH">Bisa Keduanya (Author & Reviewer)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1">LinkedIn Profile URL</label>
                <input
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full text-xs p-2.5 border border-[#d5d7da] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984] text-[#181d27]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-[#344054] mb-1">Biografi Profesional</label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Pengalaman lebih dari 8 tahun di bidang SEO dan enterprise growth..."
                  className="w-full text-xs p-2.5 border border-[#d5d7da] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984] text-[#181d27]"
                />
              </div>

              {/* Avatar Uploader */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-[#344054] mb-1">Foto Avatar</label>
                <div className="flex items-center gap-3">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover border border-[#eaecf0]"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#f2f4f7] border border-[#eaecf0] flex items-center justify-center font-bold text-[#535862]">
                      {name ? name.charAt(0) : '?'}
                    </div>
                  )}
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#d5d7da] rounded-lg text-xs font-semibold bg-[#f9fafb] hover:bg-[#f2f4f7] text-[#344054] transition">
                    <Upload01 className="size-3.5 text-[#717680]" />
                    <span>{uploadingAvatar ? 'Uploading...' : 'Upload Foto ke R2'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={uploadingAvatar}
                      className="hidden"
                    />
                  </label>
                  <input
                    type="text"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="Atau tempel URL gambar..."
                    className="flex-1 text-xs p-2 border border-[#d5d7da] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984] text-[#181d27]"
                  />
                </div>
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
                {editingId ? 'Simpan Perubahan' : 'Simpan Profil'}
              </button>
            </div>
          </form>
        )}

        {/* People List Table */}
        <div className="bg-white rounded-xl border border-[#eaecf0] shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#fafafa] border-b border-[#eaecf0] text-[#717680] font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Profil & Kredensial</th>
                <th className="py-3 px-4">Tipe</th>
                <th className="py-3 px-4">Slug Publik</th>
                <th className="py-3 px-4">Artikel Ditulis / Direview</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f2f4f7]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-[#717680]">
                    Memuat profil...
                  </td>
                </tr>
              ) : people.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#717680]">
                    Belum ada profil author atau reviewer.
                  </td>
                </tr>
              ) : (
                people.map((p) => (
                  <tr key={p.id} className="hover:bg-[#f9fafb] transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {p.avatarUrl ? (
                          <img
                            src={p.avatarUrl}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover border border-[#eaecf0] shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#f2f4f7] border border-[#eaecf0] flex items-center justify-center font-bold text-[#535862] shrink-0">
                            {p.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-[#181d27] flex items-center gap-1.5">
                            <span>{p.name}</span>
                            {p.linkedinUrl && (
                              <a
                                href={p.linkedinUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[#465984] hover:text-[#3f5077]"
                              >
                                <ArrowUpRight className="size-3" />
                              </a>
                            )}
                          </div>
                          <div className="text-[11px] text-[#717680]">{p.role}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#f2f4f7] text-[#424751]">
                        {p.type}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-[#717680]">
                      /blog/author/{p.slug}
                    </td>

                    <td className="py-3 px-4 text-[#535862]">
                      {p._count?.authoredArticles ?? 0} ditulis / {p._count?.reviewedArticles ?? 0} direview
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(p)}
                          className="p-1.5 text-[#535862] hover:bg-[#f2f4f7] rounded cursor-pointer"
                        >
                          <Edit01 className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p.id)}
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
      </div>
    </div>
  );
}
