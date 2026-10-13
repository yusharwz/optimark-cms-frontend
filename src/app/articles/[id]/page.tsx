'use client';

import { useState, useEffect, use } from 'react';
import { Header } from '@/components/Header';
import { ArticleEditor } from '@/components/ArticleEditor';
import { api } from '@/lib/api';
import { Article } from '@/lib/types';

interface EditArticlePageProps {
  params: Promise<{ id: string }>;
}

export default function EditArticlePage({ params }: EditArticlePageProps) {
  const resolvedParams = use(params);
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getArticle(resolvedParams.id)
      .then((data) => setArticle(data))
      .catch((err) => setError(err.message || 'Gagal memuat artikel'))
      .finally(() => setLoading(false));
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px] text-[#717680] text-xs">
        Memuat detail artikel...
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px] text-[#d92d20] text-xs">
        {error || 'Artikel tidak ditemukan'}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#f8fafc]">
      <Header
        title={`Edit: ${article.title}`}
        description={`Terakhir diperbarui: ${new Date(article.updatedAt).toLocaleString('id-ID')}`}
      />
      <ArticleEditor initialData={article} />
    </div>
  );
}
