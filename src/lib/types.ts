export type ArticleStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED';
export type PersonType = 'AUTHOR' | 'REVIEWER' | 'BOTH';
export type CommentStatus = 'PENDING' | 'APPROVED' | 'SPAM' | 'REJECTED';

export interface TocItem {
  id: string;
  level: number;
  text: string;
}

export interface Category {
  id: string;
  name: string;
  nameId?: string | null;
  nameEn?: string | null;
  slug: string;
  description?: string | null;
  descriptionId?: string | null;
  descriptionEn?: string | null;
  metaTitleId?: string | null;
  metaTitleEn?: string | null;
  metaDescriptionId?: string | null;
  metaDescriptionEn?: string | null;
  sortOrder: number;
  _count?: {
    articles: number;
  };
}

export interface ProfileItem {
  title: string;
  org: string;
  period: string;
  logo?: string;
}

export interface Person {
  id: string;
  name: string;
  slug: string;
  role: string;
  roleId?: string | null;
  roleEn?: string | null;
  positionId?: string | null;
  positionEn?: string | null;
  bio?: string | null;
  bioId?: string | null;
  bioEn?: string | null;
  expertiseId?: string[];
  expertiseEn?: string[];
  experienceId?: ProfileItem[] | null;
  experienceEn?: ProfileItem[] | null;
  educationId?: ProfileItem[] | null;
  educationEn?: ProfileItem[] | null;
  avatarUrl?: string | null;
  linkedinUrl?: string | null;
  type: PersonType;
  user?: {
    id: string;
    email: string;
    role: string;
  } | null;
  _count?: {
    authoredArticles: number;
    reviewedArticles: number;
  };
}

export interface ArticleTranslation {
  id?: string;
  articleId?: string;
  locale: 'id' | 'en';
  title: string;
  excerpt?: string | null;
  content: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  canonicalUrl?: string | null;
  coverImageUrl?: string | null;
  coverImageAlt?: string | null;
  tags: string[];
  readMinutes: number;
  status: ArticleStatus;
  featured: boolean;
  tableOfContents?: TocItem[] | null;
  previewToken: string;
  publishedAt?: string | null;
  scheduledAt?: string | null;
  contentUpdatedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  categoryId?: string | null;
  category?: Category | null;
  authorId?: string | null;
  author?: Person | null;
  reviewerId?: string | null;
  reviewer?: Person | null;
  translations?: ArticleTranslation[];
  draftData?: any;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'EDITOR' | 'AUTHOR';
  personId?: string | null;
  person?: Person | null;
  createdAt?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface CommentItem {
  id: string;
  slug: string;
  authorName: string;
  authorEmail: string;
  authorWebsite?: string | null;
  avatarUrl?: string | null;
  content: string;
  status: CommentStatus;
  likes: number;
  parentId?: string | null;
  articleId?: string | null;
  createdAt: string;
  updatedAt: string;
  article?: {
    id: string;
    title: string;
    slug: string;
  } | null;
  parent?: {
    id: string;
    authorName: string;
    content: string;
  } | null;
  replies?: CommentItem[];
}

export interface CommentStats {
  total: number;
  pending: number;
  approved: number;
  spam: number;
  rejected: number;
}

export interface RedirectItem {
  id: string;
  sourcePath: string;
  targetPath: string;
  statusCode: number;
  active: boolean;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MediaItem {
  id: string;
  url: string;
  key: string;
  filename: string;
  altText?: string | null;
  mimeType: string;
  size: number;
  width?: number | null;
  height?: number | null;
  createdAt: string;
}
