'use client';

import React, { useState } from 'react';
import { Lock01, XClose, CheckCircle, AlertCircle } from '@untitledui/icons';
import { api } from '@/lib/api';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError('Konfirmasi kata sandi baru tidak cocok');
      return;
    }

    if (newPassword.length < 8) {
      setError('Kata sandi baru minimal 8 karakter');
      return;
    }

    setLoading(true);
    try {
      await api.changePassword(oldPassword, newPassword);
      setSuccess('Kata sandi Anda berhasil diperbarui!');
      setTimeout(() => {
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setSuccess(null);
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Gagal mengubah kata sandi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#eaecf0] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#eaecf0]">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-[#f4f5f8] flex items-center justify-center text-[#465984]">
              <Lock01 className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#181d27]">Ubah Kata Sandi</h3>
              <p className="text-xs text-[#535862]">Perbarui kredensial keamanan akun CMS Anda</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#717680] hover:bg-[#f4f5f8]"
          >
            <XClose className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="size-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-700">
              <CheckCircle className="size-4 shrink-0 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#344054]">
              Kata Sandi Saat Ini
            </label>
            <input
              type="password"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2 text-sm bg-white border border-[#d5d7da] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984] text-[#181d27]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#344054]">
              Kata Sandi Baru (Min. 8 Karakter)
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2 text-sm bg-white border border-[#d5d7da] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984] text-[#181d27]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#344054]">
              Konfirmasi Kata Sandi Baru
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2 text-sm bg-white border border-[#d5d7da] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984] text-[#181d27]"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-[#414651] bg-white border border-[#d5d7da] rounded-lg hover:bg-[#f8fafc]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#465984] hover:bg-[#38476a] rounded-lg shadow-xs disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Perbarui Kata Sandi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
