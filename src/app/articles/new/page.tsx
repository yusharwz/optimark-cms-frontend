'use client';

import { Header } from '@/components/Header';
import { ArticleEditor } from '@/components/ArticleEditor';

export default function NewArticlePage() {
  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#f8fafc]">
      <Header
        title="Tulis Artikel SEO Baru"
        description="Gunakan struktur heading H1-H4, meta title/description optimal, dan E-E-A-T reviewers."
      />
      <ArticleEditor />
    </div>
  );
}
