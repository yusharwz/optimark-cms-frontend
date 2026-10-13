'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  File06,
  Folder,
  Users01,
  SwitchHorizontal01,
  Image03,
  Globe01,
  Plus,
} from '@untitledui/icons';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    {
      name: 'Artikel SEO',
      href: '/articles',
      icon: File06,
      active: pathname === '/articles' || pathname.startsWith('/articles/'),
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
      name: 'Media & Gambar',
      href: '/media',
      icon: Image03,
      active: pathname.startsWith('/media'),
    },
  ];

  return (
    <aside className="w-64 border-r border-[#eaecf0] bg-white flex flex-col h-screen sticky top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 border-b border-[#f2f4f7] justify-between">
        <Link href="/articles" className="flex items-center gap-2.5">
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
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                item.active
                  ? 'bg-[#f2f5f9] text-[#465984] font-semibold'
                  : 'text-[#424751] hover:bg-[#f9fafb] hover:text-[#181d27]'
              )}
            >
              <Icon
                className={cn(
                  'size-4 shrink-0 transition-colors',
                  item.active ? 'text-[#465984]' : 'text-[#717680]'
                )}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / Public Links */}
      <div className="p-3 border-t border-[#f2f4f7] bg-[#fdfdfd] space-y-2">
        <div className="text-[11px] font-semibold text-[#717680] uppercase tracking-wider px-2">
          Integrasi Live
        </div>
        <a
          href="http://localhost:3001/api/public/sitemap.xml"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between px-3 py-1.5 text-xs text-[#535862] hover:text-[#465984] hover:bg-white rounded-md border border-[#e9eaeb] transition-colors"
        >
          <div className="flex items-center gap-2">
            <Globe01 className="size-3.5 text-[#717680]" />
            <span>Sitemap XML</span>
          </div>
          <span className="text-[10px] bg-[#f4f5f6] px-1.5 py-0.5 rounded text-[#717680]">
            3001
          </span>
        </a>
        <a
          href="http://localhost:3001/api/public/posts"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between px-3 py-1.5 text-xs text-[#535862] hover:text-[#465984] hover:bg-white rounded-md border border-[#e9eaeb] transition-colors"
        >
          <div className="flex items-center gap-2">
            <Globe01 className="size-3.5 text-[#717680]" />
            <span>Public API Feed</span>
          </div>
          <span className="text-[10px] bg-[#f4f5f6] px-1.5 py-0.5 rounded text-[#717680]">
            JSON
          </span>
        </a>
      </div>
    </aside>
  );
}
