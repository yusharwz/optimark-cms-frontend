'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { api } from '@/lib/api';
import { Person, PersonType, ProfileItem } from '@/lib/types';
import {
  Plus,
  Trash01,
  Edit01,
  Users01,
  Check,
  XClose,
  Upload01,
  Lock01,
  Mail01,
  Globe01,
} from '@untitledui/icons';

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Modal State
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Active locale tab in modal ('id' | 'en')
  const [activeLangTab, setActiveLangTab] = useState<'id' | 'en'>('id');

  // Common Profile Fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [type, setType] = useState<PersonType>('BOTH');

  // Bilingual Fields
  const [roleId, setRoleId] = useState('');
  const [roleEn, setRoleEn] = useState('');
  const [positionId, setPositionId] = useState('');
  const [positionEn, setPositionEn] = useState('');
  const [bioId, setBioId] = useState('');
  const [bioEn, setBioEn] = useState('');

  // Expertise (comma-separated or array)
  const [expertiseIdText, setExpertiseIdText] = useState('');
  const [expertiseEnText, setExpertiseEnText] = useState('');

  // Experience Items
  const [experienceId, setExperienceId] = useState<ProfileItem[]>([]);
  const [experienceEn, setExperienceEn] = useState<ProfileItem[]>([]);

  // Education Items
  const [educationId, setEducationId] = useState<ProfileItem[]>([]);
  const [educationEn, setEducationEn] = useState<ProfileItem[]>([]);

  // Credentials Fields
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userRole] = useState<'AUTHOR' | 'EDITOR' | 'ADMIN'>('AUTHOR');

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  const resetForm = () => {
    setName('');
    setSlug('');
    setAvatarUrl('');
    setLinkedinUrl('');
    setType('BOTH');
    setRoleId('');
    setRoleEn('');
    setPositionId('');
    setPositionEn('');
    setBioId('');
    setBioEn('');
    setExpertiseIdText('');
    setExpertiseEnText('');
    setExperienceId([]);
    setExperienceEn([]);
    setEducationId([]);
    setEducationEn([]);
    setUserEmail('');
    setUserPassword('');
    setEditingId(null);
    setActiveLangTab('id');
  };

  const startEdit = (p: Person) => {
    setEditingId(p.id);
    setName(p.name);
    setSlug(p.slug);
    setAvatarUrl(p.avatarUrl || '');
    setLinkedinUrl(p.linkedinUrl || '');
    setType(p.type);

    setRoleId(p.roleId || p.role || '');
    setRoleEn(p.roleEn || p.role || '');
    setPositionId(p.positionId || '');
    setPositionEn(p.positionEn || '');
    setBioId(p.bioId || p.bio || '');
    setBioEn(p.bioEn || p.bio || '');

    setExpertiseIdText((p.expertiseId || []).join(', '));
    setExpertiseEnText((p.expertiseEn || []).join(', '));

    setExperienceId(p.experienceId || []);
    setExperienceEn(p.experienceEn || []);
    setEducationId(p.educationId || []);
    setEducationEn(p.educationEn || []);

    if (p.user) {
      setUserEmail(p.user.email);
    } else {
      setUserEmail('');
    }
    setUserPassword('');
    setIsAdding(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Nama wajib diisi');
      return;
    }

    const expertiseId = expertiseIdText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const expertiseEn = expertiseEnText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload: any = {
      name: name.trim(),
      slug: slug.trim() || undefined,
      role: roleId.trim() || roleEn.trim() || 'Contributor',
      roleId: roleId.trim() || undefined,
      roleEn: roleEn.trim() || undefined,
      positionId: positionId.trim() || undefined,
      positionEn: positionEn.trim() || undefined,
      bio: bioId.trim() || bioEn.trim() || undefined,
      bioId: bioId.trim() || undefined,
      bioEn: bioEn.trim() || undefined,
      expertiseId,
      expertiseEn,
      experienceId,
      experienceEn,
      educationId,
      educationEn,
      avatarUrl: avatarUrl.trim() || undefined,
      linkedinUrl: linkedinUrl.trim() || undefined,
      type,
    };

    if (userEmail.trim()) {
      payload.email = userEmail.trim();
      payload.userRole = userRole;
      if (userPassword.trim()) {
        payload.password = userPassword.trim();
      }
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await api.updatePerson(editingId, payload);
      } else {
        await api.createPerson(payload);
      }
      resetForm();
      setIsAdding(false);
      await loadPeople();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan profil person');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus person ini?')) return;
    try {
      await api.deletePerson(id);
      loadPeople();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus person');
    }
  };

  // Helpers for Experience & Education lists
  const addExperienceItem = (lang: 'id' | 'en') => {
    const newItem: ProfileItem = { title: '', org: '', period: '' };
    if (lang === 'id') setExperienceId([...experienceId, newItem]);
    else setExperienceEn([...experienceEn, newItem]);
  };

  const updateExperienceItem = (
    lang: 'id' | 'en',
    index: number,
    field: keyof ProfileItem,
    val: string
  ) => {
    if (lang === 'id') {
      const copy = [...experienceId];
      copy[index] = { ...copy[index], [field]: val };
      setExperienceId(copy);
    } else {
      const copy = [...experienceEn];
      copy[index] = { ...copy[index], [field]: val };
      setExperienceEn(copy);
    }
  };

  const removeExperienceItem = (lang: 'id' | 'en', index: number) => {
    if (lang === 'id') setExperienceId(experienceId.filter((_, i) => i !== index));
    else setExperienceEn(experienceEn.filter((_, i) => i !== index));
  };

  const addEducationItem = (lang: 'id' | 'en') => {
    const newItem: ProfileItem = { title: '', org: '', period: '' };
    if (lang === 'id') setEducationId([...educationId, newItem]);
    else setEducationEn([...educationEn, newItem]);
  };

  const updateEducationItem = (
    lang: 'id' | 'en',
    index: number,
    field: keyof ProfileItem,
    val: string
  ) => {
    if (lang === 'id') {
      const copy = [...educationId];
      copy[index] = { ...copy[index], [field]: val };
      setEducationId(copy);
    } else {
      const copy = [...educationEn];
      copy[index] = { ...copy[index], [field]: val };
      setEducationEn(copy);
    }
  };

  const removeEducationItem = (lang: 'id' | 'en', index: number) => {
    if (lang === 'id') setEducationId(educationId.filter((_, i) => i !== index));
    else setEducationEn(educationEn.filter((_, i) => i !== index));
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#fdfdfd]">
      <Header
        title="Author & Reviewer E-E-A-T"
        description="Kelola profil penulis dan reviewer editorial dalam dwi-bahasa (ID & EN) beserta akun kredensial login CMS."
        actions={
          <button
            type="button"
            onClick={() => {
              resetForm();
              setIsAdding(true);
            }}
            className="flex items-center gap-2 py-2 px-3.5 bg-[#465984] hover:bg-[#3f5077] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Plus className="size-4 shrink-0 text-white" />
            <span>Tambah Person Baru</span>
          </button>
        }
      />

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Table / List */}
        <div className="bg-white border border-[#eaecf0] rounded-xl shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-[#eaecf0] flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#181d27]">Daftar Profil Penulis & Reviewer</h3>
            <span className="text-xs text-[#535862]">{people.length} Orang Terdaftar</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-[#535862]">Memuat data profil...</div>
          ) : people.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#535862]">Belum ada profil author atau reviewer.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[760px]">
                <thead className="bg-[#f9fafb] text-[#535862] font-semibold border-b border-[#eaecf0]">
                  <tr>
                    <th className="px-6 py-3">Nama & Avatar</th>
                    <th className="px-6 py-3">Role / Posisi (ID & EN)</th>
                    <th className="px-6 py-3">Tipe E-E-A-T</th>
                    <th className="px-6 py-3">Akun Kredensial CMS</th>
                    <th className="px-6 py-3">Statistik Artikel</th>
                    <th className="px-6 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaecf0] text-[#181d27]">
                  {people.map((p) => (
                    <tr key={p.id} className="hover:bg-[#f9fafb]/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {p.avatarUrl ? (
                            <img
                              src={p.avatarUrl}
                              alt={p.name}
                              className="size-10 rounded-full object-cover border border-[#eaecf0]"
                            />
                          ) : (
                            <div className="size-10 rounded-full bg-[#f2f4f7] text-[#465984] font-bold flex items-center justify-center text-sm border border-[#eaecf0]">
                              {p.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-sm text-[#181d27]">{p.name}</div>
                            <div className="text-[11px] text-[#717680]">/blog/{p.type.toLowerCase() === 'reviewer' ? 'reviewer' : 'author'}/{p.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-[#181d27]">{p.roleId || p.role}</div>
                        {p.roleEn && <div className="text-[11px] text-[#717680]">EN: {p.roleEn}</div>}
                        {p.positionId && <div className="text-[10px] text-[#465984] font-medium mt-0.5">{p.positionId}</div>}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 text-[11px] font-semibold rounded-full border ${
                            p.type === 'AUTHOR'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : p.type === 'REVIEWER'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {p.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {p.user ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 text-xs text-[#181d27] font-medium">
                              <Mail01 className="size-3.5 text-emerald-600" />
                              <span>{p.user.email}</span>
                            </div>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#f4f5f8] text-[#535862] font-semibold">
                              ROLE: {p.user.role}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#717680] italic">Belum Ada Akun</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-[#535862]">
                        <div>{p._count?.authoredArticles || 0} Ditulis</div>
                        <div>{p._count?.reviewedArticles || 0} Ditinjau</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => startEdit(p)}
                            className="p-1.5 rounded-lg text-[#535862] hover:text-[#465984] hover:bg-[#f4f5f8]"
                            title="Edit Profil"
                          >
                            <Edit01 className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(p.id)}
                            className="p-1.5 rounded-lg text-[#535862] hover:text-red-600 hover:bg-red-50"
                            title="Hapus Profil"
                          >
                            <Trash01 className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal Form Tambah / Edit */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl border border-[#eaecf0] my-8 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#eaecf0] bg-[#fdfdfd]">
              <div>
                <h3 className="text-base font-bold text-[#181d27]">
                  {editingId ? 'Edit Profil Author / Reviewer' : 'Tambah Profil Author / Reviewer Baru'}
                </h3>
                <p className="text-xs text-[#535862]">
                  Lengkapi data profil dwi-bahasa dan akun login CMS untuk persona editorial ini.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setIsAdding(false);
                }}
                className="p-1.5 rounded-lg text-[#717680] hover:bg-[#f4f5f8]"
              >
                <XClose className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Identitas Dasar */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-[#465984] uppercase tracking-wider">
                  1. Informasi Identitas
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#344054]">
                      Nama Lengkap *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Jonathan Anderson T."
                      className="w-full px-3.5 py-2 text-xs bg-white border border-[#d5d7da] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984] text-[#181d27]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#344054]">
                      Slug URL (Opsional / Auto)
                    </label>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="e.g. jonathan-anderson"
                      className="w-full px-3.5 py-2 text-xs bg-white border border-[#d5d7da] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984] text-[#181d27]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#344054]">
                      Tipe Persona E-E-A-T
                    </label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as PersonType)}
                      className="w-full px-3.5 py-2 text-xs bg-white border border-[#d5d7da] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984] text-[#181d27]"
                    >
                      <option value="AUTHOR">AUTHOR (Penulis Artikel)</option>
                      <option value="REVIEWER">REVIEWER (Peninjau Editorial)</option>
                      <option value="BOTH">BOTH (Penulis & Reviewer)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#344054]">
                      Tautan Profil LinkedIn
                    </label>
                    <input
                      type="url"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      placeholder="https://www.linkedin.com/in/..."
                      className="w-full px-3.5 py-2 text-xs bg-white border border-[#d5d7da] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984] text-[#181d27]"
                    />
                  </div>
                </div>

                {/* Avatar Upload */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#344054]">
                    Foto Profil Avatar
                  </label>
                  <div className="flex items-center gap-4">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Avatar preview"
                        className="size-14 rounded-full object-cover border border-[#eaecf0]"
                      />
                    ) : (
                      <div className="size-14 rounded-full bg-[#f2f4f7] border border-[#eaecf0] flex items-center justify-center text-[#717680] text-xs font-semibold">
                        No Img
                      </div>
                    )}
                    <div className="flex-1 space-y-1.5">
                      <input
                        type="url"
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        placeholder="https://optimark-staging-media.dritech.co.id/..."
                        className="w-full px-3.5 py-2 text-xs bg-white border border-[#d5d7da] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984] text-[#181d27]"
                      />
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#f4f5f8] hover:bg-[#eaecf0] text-[#414651] text-xs font-semibold rounded-lg cursor-pointer transition">
                        <Upload01 className="size-3.5" />
                        <span>{uploadingAvatar ? 'Mengunggah ke R2...' : 'Upload Gambar Baru ke R2'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarUpload}
                          disabled={uploadingAvatar}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dwi-Bahasa (ID & EN Tabs) */}
              <div className="space-y-4 pt-4 border-t border-[#eaecf0]">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#465984] uppercase tracking-wider">
                    2. Profil Dwi-Bahasa (Role, Expertise, Pengalaman, Pendidikan)
                  </h4>
                  <div className="flex bg-[#f2f4f7] p-0.5 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setActiveLangTab('id')}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                        activeLangTab === 'id' ? 'bg-white text-[#181d27] shadow-xs' : 'text-[#535862]'
                      }`}
                    >
                      🇮🇩 Bahasa Indonesia (ID)
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveLangTab('en')}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                        activeLangTab === 'en' ? 'bg-white text-[#181d27] shadow-xs' : 'text-[#535862]'
                      }`}
                    >
                      🇬🇧 English (EN)
                    </button>
                  </div>
                </div>

                {activeLangTab === 'id' ? (
                  <div className="space-y-4 bg-[#f8fafc] p-4 rounded-xl border border-[#eaecf0]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-[#344054]">
                          Role / Gelar Editorial (ID)
                        </label>
                        <input
                          type="text"
                          value={roleId}
                          onChange={(e) => setRoleId(e.target.value)}
                          placeholder="e.g. SEO Lead & Reviewer Editorial"
                          className="w-full px-3.5 py-2 text-xs bg-white border border-[#d5d7da] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984] text-[#181d27]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-[#344054]">
                          Posisi / Jabatan Pekerjaan (ID)
                        </label>
                        <input
                          type="text"
                          value={positionId}
                          onChange={(e) => setPositionId(e.target.value)}
                          placeholder="e.g. Head of Organic Growth"
                          className="w-full px-3.5 py-2 text-xs bg-white border border-[#d5d7da] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984] text-[#181d27]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-[#344054]">
                        Bio Profil (ID)
                      </label>
                      <textarea
                        rows={3}
                        value={bioId}
                        onChange={(e) => setBioId(e.target.value)}
                        placeholder="Deskripsi singkat pengalaman profesional dan keahlian..."
                        className="w-full px-3.5 py-2 text-xs bg-white border border-[#d5d7da] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984] text-[#181d27]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-[#344054]">
                        Expertise / Keahlian Khusus (Pisahkan dengan koma)
                      </label>
                      <input
                        type="text"
                        value={expertiseIdText}
                        onChange={(e) => setExpertiseIdText(e.target.value)}
                        placeholder="Riset Keyword, On-Page SEO, Content Strategy, Analisis Data"
                        className="w-full px-3.5 py-2 text-xs bg-white border border-[#d5d7da] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984] text-[#181d27]"
                      />
                    </div>

                    {/* Pengalaman ID */}
                    <div className="space-y-2 pt-2 border-t border-[#e2e8f0]">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-[#344054]">
                          Pengalaman Kerja (ID)
                        </label>
                        <button
                          type="button"
                          onClick={() => addExperienceItem('id')}
                          className="text-[11px] font-semibold text-[#465984] hover:underline"
                        >
                          + Tambah Pengalaman
                        </button>
                      </div>
                      {experienceId.map((item, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <div className="flex items-center gap-1.5 shrink-0">
                            {item.logo ? (
                              <div className="relative group">
                                <img
                                  src={item.logo}
                                  alt={item.org || 'Logo'}
                                  className="size-7 rounded object-contain border border-[#eaecf0] bg-white p-0.5"
                                />
                                <button
                                  type="button"
                                  onClick={() => updateExperienceItem('id', idx, 'logo', '')}
                                  className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 text-[8px] opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Hapus Logo"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : null}
                            <label className="cursor-pointer px-2 py-1.5 border border-[#d5d7da] rounded-md hover:bg-[#f2f4f7] text-[#535862] flex items-center gap-1 text-[11px] shrink-0" title="Upload Logo">
                              <Upload01 className="size-3 text-[#465984]" />
                              <span className="hidden sm:inline">{item.logo ? 'Ganti' : 'Logo'}</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  try {
                                    const res = await api.uploadMedia(file, `${item.org || 'Logo'}`);
                                    updateExperienceItem('id', idx, 'logo', res.url);
                                  } catch (err: any) {
                                    alert('Gagal upload logo: ' + err.message);
                                  }
                                }}
                              />
                            </label>
                          </div>
                          <input
                            type="text"
                            placeholder="Posisi (e.g. Senior SEO)"
                            value={item.title}
                            onChange={(e) => updateExperienceItem('id', idx, 'title', e.target.value)}
                            className="flex-1 px-3 py-1.5 text-xs bg-white border border-[#d5d7da] rounded-md"
                          />
                          <input
                            type="text"
                            placeholder="Perusahaan / Org"
                            value={item.org}
                            onChange={(e) => updateExperienceItem('id', idx, 'org', e.target.value)}
                            className="flex-1 px-3 py-1.5 text-xs bg-white border border-[#d5d7da] rounded-md"
                          />
                          <input
                            type="text"
                            placeholder="Periode (e.g. 2022 - Sekarang)"
                            value={item.period}
                            onChange={(e) => updateExperienceItem('id', idx, 'period', e.target.value)}
                            className="w-32 px-3 py-1.5 text-xs bg-white border border-[#d5d7da] rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => removeExperienceItem('id', idx)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                          >
                            <Trash01 className="size-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Pendidikan ID */}
                    <div className="space-y-2 pt-2 border-t border-[#e2e8f0]">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-[#344054]">
                          Riwayat Pendidikan (ID)
                        </label>
                        <button
                          type="button"
                          onClick={() => addEducationItem('id')}
                          className="text-[11px] font-semibold text-[#465984] hover:underline"
                        >
                          + Tambah Pendidikan
                        </button>
                      </div>
                      {educationId.map((item, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <div className="flex items-center gap-1.5 shrink-0">
                            {item.logo ? (
                              <div className="relative group">
                                <img
                                  src={item.logo}
                                  alt={item.org || 'Logo'}
                                  className="size-7 rounded object-contain border border-[#eaecf0] bg-white p-0.5"
                                />
                                <button
                                  type="button"
                                  onClick={() => updateEducationItem('id', idx, 'logo', '')}
                                  className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 text-[8px] opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Hapus Logo"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : null}
                            <label className="cursor-pointer px-2 py-1.5 border border-[#d5d7da] rounded-md hover:bg-[#f2f4f7] text-[#535862] flex items-center gap-1 text-[11px] shrink-0" title="Upload Logo">
                              <Upload01 className="size-3 text-[#465984]" />
                              <span className="hidden sm:inline">{item.logo ? 'Ganti' : 'Logo'}</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  try {
                                    const res = await api.uploadMedia(file, `${item.org || 'Logo'}`);
                                    updateEducationItem('id', idx, 'logo', res.url);
                                  } catch (err: any) {
                                    alert('Gagal upload logo: ' + err.message);
                                  }
                                }}
                              />
                            </label>
                          </div>
                          <input
                            type="text"
                            placeholder="Gelar / Jurusan"
                            value={item.title}
                            onChange={(e) => updateEducationItem('id', idx, 'title', e.target.value)}
                            className="flex-1 px-3 py-1.5 text-xs bg-white border border-[#d5d7da] rounded-md"
                          />
                          <input
                            type="text"
                            placeholder="Institusi / Universitas"
                            value={item.org}
                            onChange={(e) => updateEducationItem('id', idx, 'org', e.target.value)}
                            className="flex-1 px-3 py-1.5 text-xs bg-white border border-[#d5d7da] rounded-md"
                          />
                          <input
                            type="text"
                            placeholder="Periode (e.g. 2018 - 2022)"
                            value={item.period}
                            onChange={(e) => updateEducationItem('id', idx, 'period', e.target.value)}
                            className="w-32 px-3 py-1.5 text-xs bg-white border border-[#d5d7da] rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => removeEducationItem('id', idx)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                          >
                            <Trash01 className="size-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 bg-[#f8fafc] p-4 rounded-xl border border-[#eaecf0]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-[#344054]">
                          Editorial Role / Title (EN)
                        </label>
                        <input
                          type="text"
                          value={roleEn}
                          onChange={(e) => setRoleEn(e.target.value)}
                          placeholder="e.g. SEO Lead & Editorial Reviewer"
                          className="w-full px-3.5 py-2 text-xs bg-white border border-[#d5d7da] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984] text-[#181d27]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-[#344054]">
                          Work Position / Title (EN)
                        </label>
                        <input
                          type="text"
                          value={positionEn}
                          onChange={(e) => setPositionEn(e.target.value)}
                          placeholder="e.g. Head of Organic Search"
                          className="w-full px-3.5 py-2 text-xs bg-white border border-[#d5d7da] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984] text-[#181d27]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-[#344054]">
                        Bio Profile (EN)
                      </label>
                      <textarea
                        rows={3}
                        value={bioEn}
                        onChange={(e) => setBioEn(e.target.value)}
                        placeholder="Brief description of professional experience and expertise..."
                        className="w-full px-3.5 py-2 text-xs bg-white border border-[#d5d7da] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984] text-[#181d27]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-[#344054]">
                        Expertise Areas (Comma-separated)
                      </label>
                      <input
                        type="text"
                        value={expertiseEnText}
                        onChange={(e) => setExpertiseEnText(e.target.value)}
                        placeholder="Keyword Research, On-Page SEO, Content Strategy, Data Analytics"
                        className="w-full px-3.5 py-2 text-xs bg-white border border-[#d5d7da] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984] text-[#181d27]"
                      />
                    </div>

                    {/* Experience EN */}
                    <div className="space-y-2 pt-2 border-t border-[#e2e8f0]">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-[#344054]">
                          Work Experience (EN)
                        </label>
                        <button
                          type="button"
                          onClick={() => addExperienceItem('en')}
                          className="text-[11px] font-semibold text-[#465984] hover:underline"
                        >
                          + Add Experience
                        </button>
                      </div>
                      {experienceEn.map((item, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <div className="flex items-center gap-1.5 shrink-0">
                            {item.logo ? (
                              <div className="relative group">
                                <img
                                  src={item.logo}
                                  alt={item.org || 'Logo'}
                                  className="size-7 rounded object-contain border border-[#eaecf0] bg-white p-0.5"
                                />
                                <button
                                  type="button"
                                  onClick={() => updateExperienceItem('en', idx, 'logo', '')}
                                  className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 text-[8px] opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Remove Logo"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : null}
                            <label className="cursor-pointer px-2 py-1.5 border border-[#d5d7da] rounded-md hover:bg-[#f2f4f7] text-[#535862] flex items-center gap-1 text-[11px] shrink-0" title="Upload Logo">
                              <Upload01 className="size-3 text-[#465984]" />
                              <span className="hidden sm:inline">{item.logo ? 'Change' : 'Logo'}</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  try {
                                    const res = await api.uploadMedia(file, `${item.org || 'Logo'}`);
                                    updateExperienceItem('en', idx, 'logo', res.url);
                                  } catch (err: any) {
                                    alert('Failed to upload logo: ' + err.message);
                                  }
                                }}
                              />
                            </label>
                          </div>
                          <input
                            type="text"
                            placeholder="Title (e.g. Lead Consultant)"
                            value={item.title}
                            onChange={(e) => updateExperienceItem('en', idx, 'title', e.target.value)}
                            className="flex-1 px-3 py-1.5 text-xs bg-white border border-[#d5d7da] rounded-md"
                          />
                          <input
                            type="text"
                            placeholder="Company / Org"
                            value={item.org}
                            onChange={(e) => updateExperienceItem('en', idx, 'org', e.target.value)}
                            className="flex-1 px-3 py-1.5 text-xs bg-white border border-[#d5d7da] rounded-md"
                          />
                          <input
                            type="text"
                            placeholder="Period (e.g. 2022 - Present)"
                            value={item.period}
                            onChange={(e) => updateExperienceItem('en', idx, 'period', e.target.value)}
                            className="w-32 px-3 py-1.5 text-xs bg-white border border-[#d5d7da] rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => removeExperienceItem('en', idx)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                          >
                            <Trash01 className="size-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Education EN */}
                    <div className="space-y-2 pt-2 border-t border-[#e2e8f0]">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-[#344054]">
                          Education History (EN)
                        </label>
                        <button
                          type="button"
                          onClick={() => addEducationItem('en')}
                          className="text-[11px] font-semibold text-[#465984] hover:underline"
                        >
                          + Add Education
                        </button>
                      </div>
                      {educationEn.map((item, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <div className="flex items-center gap-1.5 shrink-0">
                            {item.logo ? (
                              <div className="relative group">
                                <img
                                  src={item.logo}
                                  alt={item.org || 'Logo'}
                                  className="size-7 rounded object-contain border border-[#eaecf0] bg-white p-0.5"
                                />
                                <button
                                  type="button"
                                  onClick={() => updateEducationItem('en', idx, 'logo', '')}
                                  className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 text-[8px] opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Remove Logo"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : null}
                            <label className="cursor-pointer px-2 py-1.5 border border-[#d5d7da] rounded-md hover:bg-[#f2f4f7] text-[#535862] flex items-center gap-1 text-[11px] shrink-0" title="Upload Logo">
                              <Upload01 className="size-3 text-[#465984]" />
                              <span className="hidden sm:inline">{item.logo ? 'Change' : 'Logo'}</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  try {
                                    const res = await api.uploadMedia(file, `${item.org || 'Logo'}`);
                                    updateEducationItem('en', idx, 'logo', res.url);
                                  } catch (err: any) {
                                    alert('Failed to upload logo: ' + err.message);
                                  }
                                }}
                              />
                            </label>
                          </div>
                          <input
                            type="text"
                            placeholder="Degree / Major"
                            value={item.title}
                            onChange={(e) => updateEducationItem('en', idx, 'title', e.target.value)}
                            className="flex-1 px-3 py-1.5 text-xs bg-white border border-[#d5d7da] rounded-md"
                          />
                          <input
                            type="text"
                            placeholder="Institution / University"
                            value={item.org}
                            onChange={(e) => updateEducationItem('en', idx, 'org', e.target.value)}
                            className="flex-1 px-3 py-1.5 text-xs bg-white border border-[#d5d7da] rounded-md"
                          />
                          <input
                            type="text"
                            placeholder="Period (e.g. 2018 - 2022)"
                            value={item.period}
                            onChange={(e) => updateEducationItem('en', idx, 'period', e.target.value)}
                            className="w-32 px-3 py-1.5 text-xs bg-white border border-[#d5d7da] rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => removeEducationItem('en', idx)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                          >
                            <Trash01 className="size-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Kredensial Akun CMS */}
              <div className="space-y-4 pt-4 border-t border-[#eaecf0]">
                <div className="flex items-center gap-2">
                  <Lock01 className="size-4 text-[#465984]" />
                  <h4 className="text-xs font-bold text-[#465984] uppercase tracking-wider">
                    3. Kredensial Login CMS (Opsional)
                  </h4>
                </div>
                <p className="text-xs text-[#535862]">
                  Jika diisi, akun user CMS akan dibuat atau diperbarui otomatis agar persona ini bisa masuk ke CMS dashboard.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#f8fafc] p-4 rounded-xl border border-[#eaecf0]">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#344054]">
                      Email Login
                    </label>
                    <input
                      type="email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="author@optimark.ai"
                      className="w-full px-3.5 py-2 text-xs bg-white border border-[#d5d7da] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984] text-[#181d27]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#344054]">
                      {editingId ? 'Kata Sandi Baru (Kosongkan jika tetap)' : 'Kata Sandi (Password)'}
                    </label>
                    <input
                      type="password"
                      value={userPassword}
                      onChange={(e) => setUserPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2 text-xs bg-white border border-[#d5d7da] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984] text-[#181d27]"
                    />
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#eaecf0]">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setIsAdding(false);
                  }}
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold text-[#414651] bg-white border border-[#d5d7da] rounded-lg hover:bg-[#f8fafc]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#465984] hover:bg-[#38476a] rounded-lg shadow-xs disabled:opacity-50 flex items-center gap-2"
                >
                  <Check className="size-4" />
                  <span>{submitting ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Buat Profil Person'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
