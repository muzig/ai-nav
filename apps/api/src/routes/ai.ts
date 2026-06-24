import { Router } from 'express';
import { extractMetadataBulk } from '../services/metadata.js';
import { categorizeUrls } from '../services/ai.js';
import { getAllCategories, setSetting, getSetting } from '@ai-nav/db';

const router = Router();

// POST /api/ai/parse — parse and categorize a batch of URLs
router.post('/parse', async (req, res) => {
  try {
    const { urls } = req.body;
    if (!Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ error: 'urls array is required' });
    }

    // Validate and clean URLs
    const validUrls: string[] = [];
    for (const raw of urls) {
      try {
        const url = raw.trim();
        if (!url) continue;
        // Add protocol if missing
        const normalized = url.startsWith('http') ? url : `https://${url}`;
        new URL(normalized); // validate
        validUrls.push(normalized);
      } catch {
        // skip invalid URLs
      }
    }

    if (validUrls.length === 0) {
      return res.status(400).json({ error: 'No valid URLs provided' });
    }

    // Extract metadata
    const metadata = await extractMetadataBulk(validUrls);

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

// POST /api/ai/settings — save API key
router.post('/settings', (req, res) => {
  const { claude_api_key } = req.body;
  if (claude_api_key !== undefined) {
    setSetting('claude_api_key', claude_api_key);
  }
  res.json({ success: true });
});

// GET /api/ai/settings — check if API key is set
router.get('/settings', (_req, res) => {
  const hasKey = !!getSetting('claude_api_key');
  res.json({ hasApiKey: hasKey });
});

export default router;
