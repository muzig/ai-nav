import Anthropic from '@anthropic-ai/sdk';
import { getSetting } from '@ai-nav/db';
import type { UrlMetadata, AiSuggestion } from '@ai-nav/shared';

const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';

/** Get effective setting: DB value takes priority, env var as fallback */
export function getEffectiveSetting(key: string): { value: string; source: 'db' | 'env' | 'default' } {
  const dbValue = getSetting(key);
  if (dbValue) return { value: dbValue, source: 'db' };

  // Env var mapping with aliases
  const envKeys: string[] = [];
  if (key === 'claude_api_key') {
    envKeys.push('CLAUDE_API_KEY', 'ANTHROPIC_API_KEY', 'ANTHROPIC_AUTH_TOKEN');
  } else if (key === 'base_url') {
    envKeys.push('BASE_URL', 'ANTHROPIC_BASE_URL');
  } else if (key === 'model') {
    envKeys.push('MODEL', 'ANTHROPIC_MODEL');
  } else {
    envKeys.push(key.toUpperCase());
  }

  for (const envKey of envKeys) {
    const envValue = process.env[envKey];
    if (envValue) return { value: envValue, source: 'env' };
  }

  if (key === 'model') return { value: DEFAULT_MODEL, source: 'default' };
  return { value: '', source: 'default' };
}

function getClient(): Anthropic | null {
  const apiKey = getEffectiveSetting('claude_api_key').value;
  if (!apiKey) return null;
  const baseURL = getEffectiveSetting('base_url').value || undefined;
  return new Anthropic({ apiKey, baseURL });
}

function getModel(): string {
  return getEffectiveSetting('model').value;
}

export async function categorizeUrls(
  metadata: UrlMetadata[],
  existingCategories: string[]
): Promise<AiSuggestion[]> {
  const client = getClient();

  // If no API key, fall back to domain-based heuristic categorization
  if (!client) {
    return metadata.map((m) => ({
      ...m,
      suggestedCategory: heuristicCategory(m.url, existingCategories, m.title),
      confidence: 0.5,
    }));
  }

  const urlList = metadata
    .map((m, i) => `${i + 1}. ${m.url}\n   Title: ${m.title}\n   Desc: ${m.description}`)
    .join('\n');

  const prompt = `You are a bookmark organizer. Categorize each bookmark primarily based on its **title/name**, using the URL and description as supporting context.

Bookmarks:
${urlList}

Existing categories: ${existingCategories.join(', ') || 'none yet'}

For each bookmark, suggest:
1. The best category (use an existing one if it fits, or suggest a new concise category name)
2. A confidence score (0.0-1.0)

Respond with ONLY a JSON array, no explanation:
[
  {"index": 0, "suggestedCategory": "...", "confidence": 0.9},
  ...
]

Guidelines:
- **Prioritize the title/name** for categorization (e.g. "Grafana" → Monitoring, "Gitea" → Dev Tools, "Netflix" → Entertainment)
- Prefer reusing existing categories when appropriate
- Category names should be 1-3 words, title case
- Common categories: AI Tools, Dev Tools, Social, Self-hosted, Entertainment, News, Shopping, Productivity, Cloud Services, Documentation, Monitoring, Design, Communication
- Higher confidence for well-known tools/sites`;

  try {
    const response = await client.messages.create({
      model: getModel(),
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('No JSON in response');

    const suggestions = JSON.parse(jsonMatch[0]) as Array<{
      index: number;
      suggestedCategory: string;
      confidence: number;
    }>;

    return metadata.map((m, i) => {
      const suggestion = suggestions.find((s) => s.index === i);
      return {
        ...m,
        suggestedCategory: suggestion?.suggestedCategory || heuristicCategory(m.url, existingCategories, m.title),
        confidence: suggestion?.confidence || 0.5,
      };
    });
  } catch (err) {
    console.error('AI categorization failed, using heuristics:', err);
    return metadata.map((m) => ({
      ...m,
      suggestedCategory: heuristicCategory(m.url, existingCategories, m.title),
      confidence: 0.5,
    }));
  }
}

function heuristicCategory(url: string, existing: string[], title?: string): string {
  const hostname = new URL(url).hostname.toLowerCase();
  const name = (title || '').toLowerCase();

  // Title-based rules (higher priority)
  const titleRules: [RegExp, string][] = [
    [/grafana|prometheus|zabbix|nagios|uptime/, 'Monitoring'],
    [/gitea|gitlab|github|gerrit|bitbucket|forgejo/, 'Dev Tools'],
    [/cloudreve|nextcloud|owncloud|synology|nas/, 'Self-hosted'],
    [/figma|sketch|canva|dribbble/, 'Design'],
    [/slack|discord|telegram|teams|zoom|matrix/, 'Communication'],
    [/notion|obsidian|logseq|trello|jira|linear/, 'Productivity'],
    [/chatgpt|claude|gemini|copilot|midjourney|stable.diffusion/, 'AI Tools'],
    [/netflix|youtube|bilibili|twitch|spotify|plex/, 'Entertainment'],
    [/reddit|twitter|facebook|instagram|mastodon|weibo/, 'Social'],
    [/aws|azure|gcp|cloudflare|vercel|netlify|digitalocean/, 'Cloud Services'],
    [/news|bbc|cnn|reuters|hacker.news|techcrunch/, 'News'],
    [/teslamate|tesla/, 'Monitoring'],
  ];

  // Check title first
  for (const [pattern, category] of titleRules) {
    if (pattern.test(name)) {
      const match = existing.find((c) => c.toLowerCase() === category.toLowerCase());
      return match || category;
    }
  }

  // Fallback to hostname
  const hostRules: [RegExp, string][] = [
    [/github|gitlab|bitbucket|npmjs|pypi|crates\.io/, 'Dev Tools'],
    [/chatgpt|openai|anthropic|claude|gemini|huggingface|replicate/, 'AI Tools'],
    [/twitter|x\.com|facebook|instagram|linkedin|reddit|discord|mastodon/, 'Social'],
    [/youtube|netflix|twitch|spotify|bilibili/, 'Entertainment'],
    [/aws|azure|gcloud|cloudflare|vercel|netlify|digitalocean/, 'Cloud Services'],
    [/docs|documentation|wiki|mdn|stackoverflow/, 'Documentation'],
    [/amazon|taobao|jd\.com|shop/, 'Shopping'],
    [/news|bbc|cnn|reuters/, 'News'],
  ];

  for (const [pattern, category] of hostRules) {
    if (pattern.test(hostname)) {
      const match = existing.find((c) => c.toLowerCase() === category.toLowerCase());
      return match || category;
    }
  }

  return existing.length > 0 ? existing[existing.length - 1] : 'Other';
}
