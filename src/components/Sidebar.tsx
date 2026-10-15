'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  File06,
  MessageSquare01,
  Folder,
  Users01,
  SwitchHorizontal01,
  Image03,
  BarChart01,
  Plus,
  LogOut01,
  Lock01,
} from '@untitledui/icons';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { ChangePasswordModal } from '@/components/ChangePasswordModal';

interface SidebarProps {
  onNavigate?: () => void;
  isMobile?: boolean;
}

export function Sidebar({ onNavigate, isMobile = false }: SidebarProps = {}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  useEffect(() => {
    api
      .getCommentStats()
      .then((stats) => {
        setPendingCount(stats.pending || 0);
      })
      .catch(() => {});
  }, [pathname]);

  const navItems = [
    {
      name: 'Artikel SEO',
      href: '/articles',
      icon: File06,
      active: pathname === '/articles' || pathname.startsWith('/articles/'),
    },
    {
      name: 'Komentar Blog',
      href: '/comments',
      icon: MessageSquare01,
      active: pathname.startsWith('/comments'),
      badge: pendingCount > 0 ? pendingCount : null,
    },
    {
      name: 'Kategori Topik',
      href: '/categories',
      icon: Folder,
      active: pathname.startsWith('/categories'),
    },
    {
      name: 'Author & Reviewer',
      href: '/people',
      icon: Users01,
      active: pathname.startsWith('/people'),
    },
    {
      name: '301 Redirects',
      href: '/redirects',
      icon: SwitchHorizontal01,
      active: pathname.startsWith('/redirects'),
    },
    {
      name: 'Audit & Skor SEO',
      href: '/seo-audit',
      icon: BarChart01,
      active: pathname.startsWith('/seo-audit'),
    },
    {
      name: 'Media & Gambar',
      href: '/media',
      icon: Image03,
      active: pathname.startsWith('/media'),
    },
  ];

  return (
    <aside
      className={cn(
        'bg-white flex flex-col select-none',
        isMobile ? 'w-full h-full' : 'w-64 border-r border-[#eaecf0] h-screen sticky top-0 z-30'
      )}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 border-b border-[#f2f4f7] justify-between">
        <Link
          href="/articles"
          onClick={() => onNavigate?.()}
          className="flex items-center gap-2.5"
        >
          <Image
            src="/assets/optimark-logo.svg"
            alt="Optimark"
            width={32}
            height={32}
            className="shrink-0"
          />
          <div>
            <span className="font-semibold text-[#181d27] text-sm tracking-tight block">
              Optimark
            </span>
            <span className="text-[10px] text-[#465984] font-semibold tracking-wider uppercase block">
              CMS Panel
            </span>
          </div>
        </Link>
      </div>

      {/* Quick Action */}
      <div className="p-3">
        <Link
          href="/articles/new"
          onClick={() => onNavigate?.()}
          className="flex items-center justify-center gap-2 w-full py-2.5 px-3 bg-[#465984] hover:bg-[#3f5077] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
        >
          <Plus className="size-4 shrink-0 text-white" />
          <span>Tulis Artikel Baru</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <div className="px-2 pb-1.5 text-[11px] font-semibold text-[#717680] uppercase tracking-wider">
          Manajemen Konten
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onNavigate?.()}
              className={cn(
                'flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                item.active
                  ? 'bg-[#f2f5f9] text-[#465984] font-semibold'
                  : 'text-[#424751] hover:bg-[#f9fafb] hover:text-[#181d27]'
              )}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={cn(
                    'size-4 shrink-0 transition-colors',
                    item.active ? 'text-[#465984]' : 'text-[#717680]'
                  )}
                />
                <span>{item.name}</span>
              </div>
              {item.badge !== null && item.badge !== undefined && (
                <span className="bg-[#465984] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-4 text-center">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Session & Logout */}
      {user && (
        <div className="p-3 border-t border-[#eaecf0] bg-[#fdfdfd] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="size-8 rounded-full bg-[#465984] text-white font-semibold text-xs flex items-center justify-center shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-[#181d27] truncate">
                {user.name}
              </div>
              <div className="text-[10px] text-[#717680] truncate">
                {user.role} {user.person ? `• ${user.person.name}` : ''}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setIsChangePasswordOpen(true)}
              title="Ganti Kata Sandi"
              className="p-1.5 rounded-lg text-[#717680] hover:text-[#465984] hover:bg-[#f4f5f8] transition"
            >
              <Lock01 className="size-4" />
            </button>
            <button
              type="button"
              onClick={logout}
              title="Keluar (Logout)"
              className="p-1.5 rounded-lg text-[#717680] hover:text-red-600 hover:bg-red-50 transition"
            >
              <LogOut01 className="size-4" />
            </button>
          </div>
        </div>
      )}

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </aside>
  );
}
