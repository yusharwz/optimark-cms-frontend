import {
  Article,
  Category,
  Person,
  RedirectItem,
  MediaItem,
  CommentItem,
  CommentStatus,
  CommentStats,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options?.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorBody.message || `Request failed with status ${response.status}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  // Articles
  getArticles: (params?: {
    status?: string;
    lang?: string;
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.lang) query.set('lang', params.lang);
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    return request<{
      items: Article[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/articles?${query.toString()}`);
  },

  getArticle: (id: string) => request<Article>(`/articles/${id}`),

  createArticle: (data: any) =>
    request<Article>('/articles', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateArticle: (id: string, data: any) =>
    request<Article>(`/articles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  publishArticle: (id: string) =>
    request<Article>(`/articles/${id}/publish`, {
      method: 'POST',
    }),

  unpublishArticle: (id: string) =>
    request<Article>(`/articles/${id}/unpublish`, {
      method: 'POST',
    }),

  deleteArticle: (id: string) =>
    request<void>(`/articles/${id}`, {
      method: 'DELETE',
    }),

  // Comments (Moderation & Landing Page link)
  getComments: (params?: {
    status?: string;
    slug?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.slug) query.set('slug', params.slug);
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    return request<{
      items: CommentItem[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/comments?${query.toString()}`);
  },

  getCommentStats: () => request<CommentStats>('/comments/stats'),

  updateCommentStatus: (id: string, status: CommentStatus) =>
    request<CommentItem>(`/comments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  deleteComment: (id: string) =>
    request<void>(`/comments/${id}`, {
      method: 'DELETE',
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
    // 1. Request presigned URL from backend to upload direct to R2 (no BE load)
    try {
      const mimeType = file.type || 'application/octet-stream';
      const presigned = await request<{
        uploadUrl: string;
        fileUrl: string;
        key: string;
        filename: string;
        mimeType: string;
        altText: string;
      }>('/media/presigned-url', {
        method: 'POST',
        body: JSON.stringify({
          filename: file.name,
          mimeType,
          size: file.size,
          altText,
        }),
      });

      // 2. Direct PUT to Cloudflare R2 presigned URL
      const r2Res = await fetch(presigned.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': mimeType,
        },
        body: file,
      });

      if (!r2Res.ok) {
        throw new Error(`R2 direct upload failed with status ${r2Res.status}`);
      }

      // 3. Confirm upload with backend to persist media metadata in DB
      return await request<MediaItem>('/media/confirm', {
        method: 'POST',
        body: JSON.stringify({
          key: presigned.key,
          url: presigned.fileUrl,
          filename: presigned.filename,
          mimeType: presigned.mimeType,
          size: file.size,
          altText: presigned.altText,
        }),
      });
    } catch (presignedErr) {
      console.warn('Presigned upload failed, falling back to backend upload:', presignedErr);
      // Fallback: direct multipart upload to backend
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
    }
  },
  updateMediaAlt: (id: string, altText: string) =>
    request<MediaItem>(`/media/${id}/alt`, {
      method: 'PATCH',
      body: JSON.stringify({ altText }),
    }),

  // Public / Preview
  getPreviewArticle: (token: string) => request<Article>(`/public/preview/${token}`),
};
