import { useState } from 'react';
import type { AiSuggestion, ParseUrlsResponse } from '@ai-nav/shared';

export type { AiSuggestion };

export function useAI() {
  const [parsing, setParsing] = useState(false);
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

  const saveApiKey = async (key: string) => {
    await fetch('/api/ai/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ claude_api_key: key }),
    });
  };

  const checkApiKey = async (): Promise<boolean> => {
    const res = await fetch('/api/ai/settings');
    const data = await res.json();
    return data.hasApiKey;
  };

  return {
    parsing,
    result,
    error,
    parseUrls,
    saveApiKey,
    checkApiKey,
    clearResult: () => setResult(null),
    clearError: () => setError(null),
  };
}
