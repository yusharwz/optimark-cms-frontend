'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { Lock01, Mail01, AlertCircle, Eye, EyeOff } from '@untitledui/icons';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login gagal. Periksa kembali email dan password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center items-center p-4 selection:bg-[#465984] selection:text-white">
      <div className="w-full max-w-md bg-white rounded-2xl border border-[#eaecf0] shadow-sm p-8 space-y-6">
        <div className="text-center space-y-2">
          <Image
            src="/assets/optimark-logo.svg"
            alt="Optimark Logo"
            width={44}
            height={44}
            className="mx-auto shrink-0 mb-1"
          />
          <h1 className="text-2xl font-bold text-[#181d27] tracking-tight">
            OPTIMARK CMS
          </h1>
          <p className="text-xs text-[#535862]">
            Masuk dengan kredensial editorial Anda untuk mengelola konten dan SEO.
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-xs text-red-700 font-medium">
            <AlertCircle className="size-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#344054]">
              Alamat Email
            </label>
            <div className="relative">
              <Mail01 className="size-4 text-[#717680] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@optimark.ai"
                className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-white border border-[#d5d7da] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984] text-[#181d27]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#344054]">
              Kata Sandi (Password)
            </label>
            <div className="relative">
              <Lock01 className="size-4 text-[#717680] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2.5 text-sm bg-white border border-[#d5d7da] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465984] text-[#181d27]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#717680] hover:text-[#344054] focus:outline-none"
                aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-lg bg-[#465984] hover:bg-[#38476a] text-white font-semibold text-sm shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? 'Memproses Otentikasi...' : 'Masuk ke Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}
