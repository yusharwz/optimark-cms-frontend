'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FileText,
  FolderTree,
  Users,
  Shuffle,
  Image as ImageIcon,
  ExternalLink,
  PlusCircle,
  Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    {
      name: 'Artikel SEO',
      href: '/articles',
      icon: FileText,
      active: pathname === '/articles' || pathname.startsWith('/articles/'),
    },
    {
      name: 'Kategori Topik',
      href: '/categories',
      icon: FolderTree,
      active: pathname.startsWith('/categories'),
    },
    {
      name: 'Author & Reviewer',
      href: '/people',
      icon: Users,
      active: pathname.startsWith('/people'),
    },
    {
      name: '301 Redirects',
      href: '/redirects',
      icon: Shuffle,
      active: pathname.startsWith('/redirects'),
    },
    {
      name: 'Media & Gambar',
      href: '/media',
      icon: ImageIcon,
      active: pathname.startsWith('/media'),
    },
  ];

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col h-screen sticky top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100 justify-between">
        <Link href="/articles" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#465984] flex items-center justify-center text-white font-bold text-base shadow-sm">
            O
          </div>
          <div>
            <span className="font-semibold text-slate-900 text-sm tracking-tight block">
              Optimark CMS
            </span>
            <span className="text-[10px] text-slate-500 font-medium tracking-wider uppercase block">
              SEO Engine
            </span>
          </div>
        </Link>
      </div>

      {/* Quick Action */}
      <div className="p-4">
        <Link
          href="/articles/new"
          className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg text-sm font-medium text-white bg-[#465984] hover:bg-[#38486d] shadow-sm transition-colors duration-150"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Tulis Artikel Baru</span>
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Menu Konten
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150',
                item.active
                  ? 'bg-slate-100 text-[#465984] font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50',
              )}
            >
              <Icon
                className={cn(
                  'w-4 h-4',
                  item.active ? 'text-[#465984]' : 'text-slate-400',
                )}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>

      {/* XML Sitemap & E-E-A-T Quick Links Footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-2">
        <a
          href="http://localhost:3001/api/public/sitemap.xml"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between text-xs text-slate-600 hover:text-[#465984] p-2 rounded-md hover:bg-white transition-colors"
        >
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span>XML Sitemap Live</span>
          </div>
          <ExternalLink className="w-3 h-3 text-slate-400" />
        </a>

        <div className="pt-2 text-[11px] text-slate-400 text-center">
          Optimark Organic CMS v1.0
        </div>
      </div>
    </aside>
  );
}
