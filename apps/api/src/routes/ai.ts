import { Router } from 'express';
import { extractMetadataBulk } from '../services/metadata.js';
import { categorizeUrls, getEffectiveSetting } from '../services/ai.js';
import { getAllCategories, setSetting, getSetting } from '@ai-nav/db';

const router = Router();

// POST /api/ai/parse — parse and categorize URLs
// Supports two modes:
//   { urls: string[] }                    — extract metadata from URLs
//   { items: [{ url, title, description }] } — use provided metadata (for re-grouping)
router.post('/parse', async (req, res) => {
  try {
    const { urls, items } = req.body;

    let metadata: Array<{ url: string; title: string; description: string; favicon: string }>;

    if (Array.isArray(items) && items.length > 0) {
      // Mode 2: use provided metadata (AI re-group existing bookmarks)
      metadata = items
        .filter((item: any) => item?.url)
        .map((item: any) => {
          const url = item.url.trim();
          const normalized = url.startsWith('http') ? url : `https://${url}`;
          let hostname = '';
          try { hostname = new URL(normalized).hostname; } catch { hostname = normalized; }
          return {
            url: normalized,
            title: (item.title || hostname).trim(),
            description: (item.description || '').trim(),
            favicon: item.favicon || `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`,
          };
        });
    } else if (Array.isArray(urls) && urls.length > 0) {
      // Mode 1: extract metadata from URLs
      const validUrls: string[] = [];
      for (const raw of urls) {
        try {
          const url = raw.trim();
          if (!url) continue;
          const normalized = url.startsWith('http') ? url : `https://${url}`;
          new URL(normalized);
          validUrls.push(normalized);
        } catch { /* skip */ }
      }
      if (validUrls.length === 0) {
        return res.status(400).json({ error: 'No valid URLs provided' });
      }
      metadata = await extractMetadataBulk(validUrls);
    } else {
      return res.status(400).json({ error: 'urls or items array is required' });
    }

    // Get existing categories
    const categories = getAllCategories();
    const categoryNames = categories.map((c) => c.name);

    // AI categorization
    const suggestions = await categorizeUrls(metadata, categoryNames);

    res.json({
      suggestions,
      existingCategories: categoryNames,
    });
  } catch (err) {
    console.error('AI parse error:', err);
    res.status(500).json({ error: 'Failed to parse URLs' });
  }
});

// POST /api/ai/settings — save AI settings
router.post('/settings', (req, res) => {
  const { claude_api_key, base_url, model } = req.body;
  if (claude_api_key !== undefined) {
    setSetting('claude_api_key', claude_api_key);
  }
  if (base_url !== undefined) {
    setSetting('base_url', base_url);
  }
  if (model !== undefined) {
    setSetting('model', model);
  }
  res.json({ success: true });
});

// GET /api/ai/settings — get AI settings status
router.get('/settings', (_req, res) => {
  const keyInfo = getEffectiveSetting('claude_api_key');
  const urlInfo = getEffectiveSetting('base_url');
  const modelInfo = getEffectiveSetting('model');
  res.json({
    hasApiKey: !!keyInfo.value,
    apiKeySource: keyInfo.source,
    baseURL: urlInfo.value,
    baseURLSource: urlInfo.source,
    model: modelInfo.value,
    modelSource: modelInfo.source,
  });
});

export default router;
