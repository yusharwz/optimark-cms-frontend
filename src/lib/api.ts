import {
  Article,
  Category,
  Person,
  RedirectItem,
  MediaItem,
  CommentItem,
  CommentStatus,
  CommentStats,
  User,
  AuthResponse,
} from './types';
import { compressImageToWebp } from './image-compression';

export function getLandingUrl(path: string = ''): string {
  const cleanPath = path ? (path.startsWith('/') ? path : `/${path}`) : '';
  const envLanding = process.env.NEXT_PUBLIC_LANDING_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (envLanding) {
    return `${envLanding.replace(/\/+$/, '')}${cleanPath}`;
  }
  if (typeof window !== 'undefined') {
    if (window.location.hostname.includes('staging') || window.location.hostname.includes('dritech.co.id')) {
      return `https://optimark-staging-landing.dritech.co.id${cleanPath}`;
    }
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return `http://localhost:3000${cleanPath}`;
    }
  }
  return `https://optimark.ai${cleanPath}`;
}

function getApiBase(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined') {
    if (window.location.hostname.includes('dritech.co.id')) {
      return 'https://optimark-staging-api.dritech.co.id/api';
    }
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:3001/api';
    }
  }
  return 'http://localhost:3001/api';
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${getApiBase()}${endpoint}`;
  const token = typeof window !== 'undefined' ? localStorage.getItem('optimark_cms_token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers as Record<string, string> || {}),
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
  // Auth
  login: (data: { email: string; password: string }) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMe: () => request<User>('/auth/me'),

  changePassword: (oldPassword: string, newPassword: string) =>
    request<{ success: boolean; message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword }),
    }),

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
  uploadMedia: async (
    file: File,
    altText?: string,
    convertToWebp = true,
    targetSlug?: string,
  ): Promise<MediaItem> => {
    // 0. Client-Side Image Validation & WebP Compression
    // Runs in browser: validates <5MB, checks allowed image format (rejects js, php, etc.),
    // and converts to crisp WebP (quality 0.85) with automatic kebab-case slug naming.
    const processedFile = convertToWebp
      ? await compressImageToWebp(file, { targetName: targetSlug || altText })
      : file;
    // 1. Request presigned URL from backend to upload direct to R2 (no BE load)
    try {
      const mimeType = processedFile.type || 'image/webp';
      const cleanAlt = (altText || processedFile.name.replace(/\.[^/.]+$/, '')).trim();
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
          filename: processedFile.name,
          mimeType,
          size: processedFile.size,
          altText: cleanAlt,
        }),
      });

      // 2. Direct PUT to Cloudflare R2 presigned URL
      const r2Res = await fetch(presigned.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': mimeType,
        },
        body: processedFile,
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
          size: processedFile.size,
          altText: presigned.altText || cleanAlt,
        }),
      });
    } catch (presignedErr) {
      console.warn('Presigned upload failed, falling back to backend upload:', presignedErr);
      // Fallback: direct multipart upload to backend
      const formData = new FormData();
      formData.append('file', processedFile);
      if (altText) formData.append('altText', altText.trim());
      formData.append('convertToWebp', convertToWebp ? 'true' : 'false');

      const token = typeof window !== 'undefined' ? localStorage.getItem('optimark_cms_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${getApiBase()}/media/upload`, {
        method: 'POST',
        headers,
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
  syncMediaAlt: (urlOrFilename: string, altText: string) =>
    request<MediaItem | null>(`/media/sync-alt`, {
      method: 'PATCH',
      body: JSON.stringify({ urlOrFilename, altText }),
    }).catch(() => null),
  deleteMedia: (id: string) =>
    request<{ success: boolean; id: string }>(`/media/${id}`, {
      method: 'DELETE',
    }),

  // Public / Preview
  getPreviewArticle: (token: string) => request<Article>(`/public/preview/${token}`),
};
