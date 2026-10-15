'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Menu01, XClose } from '@untitledui/icons';
import { Sidebar } from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const isLoginPage = pathname === '/login';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (isLoginPage) {
    return <main className="flex-1 min-w-0">{children}</main>;
  }

  if (loading && !user) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#f8fafc]">
        <div className="size-8 rounded-full border-2 border-[#465984] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col lg:flex-row antialiased text-[#181d27] w-full">
      {/* Mobile Top Navigation Bar */}
      <header className="lg:hidden sticky top-0 z-40 bg-white border-b border-[#eaecf0] px-4 py-3 flex items-center justify-between shadow-2xs">
        <Link href="/articles" className="flex items-center gap-2.5">
          <Image
            src="/assets/optimark-logo.svg"
            alt="Optimark"
            width={28}
            height={28}
            className="shrink-0"
          />
          <div>
            <span className="font-semibold text-[#181d27] text-sm tracking-tight leading-none block">
              Optimark
            </span>
            <span className="text-[9px] text-[#465984] font-bold tracking-wider uppercase block mt-0.5">
              CMS Panel
            </span>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg text-[#535862] hover:bg-[#f8f9fa] border border-[#d5d7da] focus:outline-none focus:ring-2 focus:ring-[#465984]"
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? <XClose className="size-5" /> : <Menu01 className="size-5" />}
        </button>
      </header>

      {/* Mobile Sidebar Overlay Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col z-10">
            <Sidebar onNavigate={() => setMobileMenuOpen(false)} isMobile />
          </div>
        </div>
      )}

      {/* Desktop Persistent Sidebar */}
      <div className="hidden lg:flex shrink-0">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {children}
      </main>
    </div>
  );
}
