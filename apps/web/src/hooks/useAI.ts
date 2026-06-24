import { useState } from 'react';
import type { AiSuggestion, ParseUrlsResponse, Bookmark, Category } from '@ai-nav/shared';

export type { AiSuggestion };

export function useAI() {
  const [parsing, setParsing] = useState(false);
  const [autoGrouping, setAutoGrouping] = useState(false);
  const [result, setResult] = useState<ParseUrlsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parseUrls = async (text: string) => {
    setParsing(true);
    setError(null);
    setResult(null);

    try {
      // Extract URLs from text (handles pasted lists, markdown, etc.)
      const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+|(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s<>"{}|\\^`[\]]*)?/gi;
      const matches = text.match(urlRegex) || [];
      const urls = [...new Set(matches.map((u) => u.trim()))];

      if (urls.length === 0) {
        setError('No valid URLs found in the pasted text');
        return null;
      }

      const res = await fetch('/api/ai/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to parse URLs');
      }

      const data: ParseUrlsResponse = await res.json();
      setResult(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return null;
    } finally {
      setParsing(false);
    }
  };

  const saveSettings = async (settings: { claude_api_key?: string; base_url?: string; model?: string }) => {
    await fetch('/api/ai/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
  };

  const checkApiKey = async (): Promise<boolean> => {
    const res = await fetch('/api/ai/settings');
    const data = await res.json();
    return data.hasApiKey;
  };

  /**
   * Auto-group ALL bookmarks using AI based on their title/description/URL.
   * Re-categorizes everything intelligently, not just uncategorized ones.
   */
  const autoGroup = async (
    bookmarks: Bookmark[],
    categories: Category[],
    onAddCategory: (name: string) => Promise<Category>,
    onUpdateBookmark: (id: number, data: Partial<Bookmark>) => Promise<unknown>
  ): Promise<{ grouped: number; errors: number }> => {
    setAutoGrouping(true);
    setError(null);

    try {
      if (bookmarks.length === 0) {
        setError('No bookmarks to group');
        return { grouped: 0, errors: 0 };
      }

      // Send all bookmark URLs + metadata to AI parse
      const items = bookmarks.map((b) => ({
        url: b.url,
        title: b.title,
        description: b.description,
      }));
      const res = await fetch('/api/ai/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'AI parse failed');
      }

      const data: ParseUrlsResponse = await res.json();

      // Build category name → id map, create new categories as needed
      const categoryMap = new Map<string, number>();
      for (const c of categories) {
        categoryMap.set(c.name.toLowerCase(), c.id);
      }

      let grouped = 0;
      let errors = 0;

      for (const suggestion of data.suggestions) {
        const target = bookmarks.find((b) => b.url === suggestion.url);
        if (!target) continue;

        const catName = suggestion.suggestedCategory;
        if (!catName) { errors++; continue; }

        let categoryId = categoryMap.get(catName.toLowerCase());

        // Create category if it doesn't exist
        if (categoryId === undefined) {
          try {
            const newCat = await onAddCategory(catName);
            categoryId = newCat.id;
            categoryMap.set(catName.toLowerCase(), categoryId);
          } catch {
            errors++;
            continue;
          }
        }

        // Skip if already in the correct category
        if (target.category_id === categoryId) {
          grouped++;
          continue;
        }

        // Update bookmark's category
        try {
          await onUpdateBookmark(target.id, { category_id: categoryId });
          grouped++;
        } catch {
          errors++;
        }
      }

      return { grouped, errors };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return { grouped: 0, errors: 0 };
    } finally {
      setAutoGrouping(false);
    }
  };

  return {
    parsing,
    autoGrouping,
    result,
    error,
    parseUrls,
    autoGroup,
    saveSettings,
    checkApiKey,
    clearResult: () => setResult(null),
    clearError: () => setError(null),
  };
}
