/**
 * Knowledge Base Types
 */

import { User, KnowledgeAccessLevel } from '@prisma/client';

export interface KBArticle {
  id: string;
  title: string;
  content: string;
  summary?: string | null;
  accessLevel: KnowledgeAccessLevel;
  teamId?: string | null;
  authorId: string;
  author: Pick<User, 'id' | 'name' | 'email'>;
  viewCount: number;
  helpfulCount: number;
  isPublished: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  categories?: KBCategory[];
}

export interface KBCategory {
  id: string;
  name: string;
  description?: string | null;
  parentId?: string | null;
  parent?: {
    id: string;
    name: string;
  } | null;
  children?: {
    id: string;
    name: string;
    description?: string | null;
  }[];
  _count?: {
    articleCategories: number;
  };
}

export interface KBArticleSuggestion {
  id: string;
  title: string;
  summary?: string | null;
  viewCount: number;
  helpfulCount: number;
}

export interface KBFilters {
  accessLevel?: KnowledgeAccessLevel;
  teamId?: string;
  categoryId?: string;
  isPublished?: boolean;
  search?: string;
}

// API Response Types
export interface GetKBArticlesResponse {
  articles: KBArticle[];
}

export interface GetKBArticleResponse {
  article: KBArticle;
}

export interface GetKBCategoriesResponse {
  categories: KBCategory[];
}

export interface GetKBSuggestionsResponse {
  suggestions: KBArticleSuggestion[];
}

export interface SearchKBArticlesResponse {
  articles: KBArticle[];
  query: string;
}
