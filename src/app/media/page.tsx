'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { api } from '@/lib/api';
import { MediaItem } from '@/lib/types';
import { Upload, Copy, Check, Edit2, Image as ImageIcon } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function MediaPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Edit Alt Text state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [altInput, setAltInput] = useState('');

  const loadMedia = async () => {
    try {
      setLoading(true);
      const data = await api.getMedia();
      setMedia(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      await api.uploadMedia(file, file.name, true);
      loadMedia();
    } catch (err: any) {
      alert(err.message || 'Gagal upload media');
    } finally {
      setUploading(false);
    }
  };

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const saveAlt = async (id: string) => {
    try {
      await api.updateMediaAlt(id, altInput);
      setEditingId(null);
      loadMedia();
    } catch (err: any) {
      alert(err.message || 'Gagal update alt text');
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="Media & Gambar R2"
        description="Kelola aset gambar, optimasi WebP, dan optimalkan Image Alt Text untuk Google Image SEO."
        actions={
          <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#465984] hover:bg-[#38486d] text-white text-xs font-medium shadow-sm transition-colors">
            <Upload className="w-3.5 h-3.5" />
            <span>{uploading ? 'Mengunggah...' : 'Upload Gambar Baru'}</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        }
      />

      <div className="p-8 space-y-6 max-w-7xl">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Memuat aset media dari Cloudflare R2...
          </div>
        ) : media.length === 0 ? (
          <div className="py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            <ImageIcon className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="font-semibold text-slate-700">Belum ada aset gambar tersimpan</p>
            <p className="text-xs text-slate-400 mt-1">Upload gambar untuk digunakan dalam artikel SEO Anda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {media.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col"
              >
                <div className="aspect-video bg-slate-100 relative group overflow-hidden border-b border-slate-100">
                  <img
                    src={item.url}
                    alt={item.altText || item.filename}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(item.url, item.id)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm transition"
                    title="Salin URL Gambar"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2 text-xs">
                  <div>
                    <div className="font-medium text-slate-900 truncate" title={item.filename}>
                      {item.filename}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 flex items-center justify-between">
                      <span>{(item.size / 1024).toFixed(1)} KB</span>
                      <span>{item.mimeType}</span>
                    </div>
                  </div>

                  {/* Alt Text Box */}
                  <div className="pt-1 border-t border-slate-100">
                    {editingId === item.id ? (
                      <div className="space-y-1.5">
                        <input
                          type="text"
                          value={altInput}
                          onChange={(e) => setAltInput(e.target.value)}
                          placeholder="Alt text gambar..."
                          className="w-full p-1 border rounded text-[11px] text-slate-800"
                        />
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="px-2 py-0.5 text-[10px] text-slate-500 hover:bg-slate-100 rounded"
                          >
                            Batal
                          </button>
                          <button
                            type="button"
                            onClick={() => saveAlt(item.id)}
                            className="px-2 py-0.5 text-[10px] bg-[#465984] text-white rounded font-medium"
                          >
                            Simpan Alt
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-[11px]">
                        <span
                          className="text-slate-600 truncate max-w-[170px]"
                          title={item.altText || 'Alt text kosong'}
                        >
                          <span className="font-medium text-slate-400">Alt: </span>
                          {item.altText || <i className="text-amber-500">Belum diisi</i>}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(item.id);
                            setAltInput(item.altText || '');
                          }}
                          className="text-slate-400 hover:text-slate-700 p-1"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
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
