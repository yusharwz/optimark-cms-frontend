import { Article, Category, Person, RedirectItem, MediaItem, ArticleStatus } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorBody.message || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  // Articles
  getArticles: (params?: { search?: string; status?: ArticleStatus; categoryId?: string; authorId?: string; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.categoryId) searchParams.set('categoryId', params.categoryId);
    if (params?.authorId) searchParams.set('authorId', params.authorId);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    return request<{ data: Article[]; meta: { total: number; page: number; limit: number; totalPages: number } }>(`/articles?${searchParams.toString()}`);
  },

  getArticle: (id: string) => request<Article>(`/articles/${id}`),

  createArticle: (data: Partial<Article>) =>
    request<Article>('/articles', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateArticle: (id: string, data: Partial<Article>) =>
    request<Article>(`/articles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteArticle: (id: string) =>
    request<void>(`/articles/${id}`, {
      method: 'DELETE',
    }),

  publishArticleNow: (id: string) =>
    request<Article>(`/articles/${id}/publish`, {
      method: 'POST',
    }),

  unpublishArticle: (id: string) =>
    request<Article>(`/articles/${id}/unpublish`, {
      method: 'POST',
    }),

  // Categories
  getCategories: () => request<Category[]>('/categories'),
  createCategory: (data: Partial<Category>) =>
    request<Category>('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCategory: (id: string, data: Partial<Category>) =>
    request<Category>(`/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteCategory: (id: string) =>
    request<void>(`/categories/${id}`, {
      method: 'DELETE',
    }),

  // People (Authors & Reviewers)
  getPeople: () => request<Person[]>('/people'),
  createPerson: (data: Partial<Person>) =>
    request<Person>('/people', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updatePerson: (id: string, data: Partial<Person>) =>
    request<Person>(`/people/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deletePerson: (id: string) =>
    request<void>(`/people/${id}`, {
      method: 'DELETE',
    }),

  // Redirects (301)
  getRedirects: () => request<RedirectItem[]>('/redirects'),
  createRedirect: (data: Partial<RedirectItem>) =>
    request<RedirectItem>('/redirects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateRedirect: (id: string, data: Partial<RedirectItem>) =>
    request<RedirectItem>(`/redirects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteRedirect: (id: string) =>
    request<void>(`/redirects/${id}`, {
      method: 'DELETE',
    }),

  // Media
  getMedia: (limit = 50, offset = 0) => request<MediaItem[]>(`/media?limit=${limit}&offset=${offset}`),
  uploadMedia: async (file: File, altText?: string, convertToWebp = true): Promise<MediaItem> => {
    const formData = new FormData();
    formData.append('file', file);
    if (altText) formData.append('altText', altText);
    formData.append('convertToWebp', convertToWebp ? 'true' : 'false');

    const res = await fetch(`${API_BASE}/media/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || 'Upload failed');
    }

    return res.json();
  },
  updateMediaAlt: (id: string, altText: string) =>
    request<MediaItem>(`/media/${id}/alt`, {
      method: 'PATCH',
      body: JSON.stringify({ altText }),
    }),

  // Public / Preview
  getPreviewArticle: (token: string) => request<Article>(`/public/preview/${token}`),
};
