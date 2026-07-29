// ---- Bookmark ----

export interface Bookmark {
  id: number;
  title: string;
  url: string;
  description: string;
  favicon: string;
  category_id: number | null;
  sort_order: number;
  is_favorite: boolean;
  favorited_at: string | null;
  last_opened_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateBookmarkInput {
  title: string;
  url: string;
  description?: string;
  favicon?: string;
  category_id?: number | null;
}

export interface UpdateBookmarkInput {
  title?: string;
  url?: string;
  description?: string;
  favicon?: string;
  category_id?: number | null;
  is_favorite?: boolean;
}

export interface SetFavoriteRequest {
  is_favorite: boolean;
}

export interface OpenBookmarkResponse {
  bookmark: Bookmark;
}

export interface BulkCreateResult {
  created: Bookmark[];
  skipped: Array<{ url: string; reason: 'duplicate' | 'invalid' }>;
}

// ---- Category ----

export interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryInput {
  name: string;
  icon?: string;
  color?: string;
}

// ---- AI ----

export interface UrlMetadata {
  url: string;
  title: string;
  description: string;
  favicon: string;
}

export interface AiSuggestion extends UrlMetadata {
  suggestedCategory: string;
  confidence: number;
}

export interface ParseUrlsRequest {
  urls: string[];
}

export interface ParseUrlsResponse {
  suggestions: AiSuggestion[];
  existingCategories: string[];
}

// ---- Settings ----

export interface SaveSettingsRequest {
  claude_api_key?: string;
}

export interface SettingsStatus {
  hasApiKey: boolean;
}

// ---- API Response ----

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}
