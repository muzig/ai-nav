import Anthropic from '@anthropic-ai/sdk';
import { getSetting } from '@ai-nav/db';
import type { UrlMetadata, AiSuggestion } from '@ai-nav/shared';

function getClient(): Anthropic | null {
  const apiKey = getSetting('claude_api_key');
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
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
      suggestedCategory: heuristicCategory(m.url, existingCategories),
      confidence: 0.5,
    }));
  }

  const urlList = metadata
    .map((m, i) => `${i + 1}. ${m.url}\n   Title: ${m.title}\n   Desc: ${m.description}`)
    .join('\n');

  const prompt = `You are a bookmark organizer. Analyze these URLs and categorize each one.

URLs:
${urlList}

Existing categories: ${existingCategories.join(', ') || 'none yet'}

For each URL, suggest:
1. The best category (use an existing one if it fits, or suggest a new concise category name)
2. A confidence score (0.0-1.0)

Respond with ONLY a JSON array, no explanation:
[
  {"index": 0, "suggestedCategory": "...", "confidence": 0.9},
  ...
]

Guidelines:
- Prefer reusing existing categories when appropriate
- Category names should be 1-3 words, title case
- Common categories: AI Tools, Dev Tools, Social, Self-hosted, Entertainment, News, Shopping, Productivity, Cloud Services, Documentation
- Higher confidence for well-known sites`;

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
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
        suggestedCategory: suggestion?.suggestedCategory || heuristicCategory(m.url, existingCategories),
        confidence: suggestion?.confidence || 0.5,
      };
    });
  } catch (err) {
    console.error('AI categorization failed, using heuristics:', err);
    return metadata.map((m) => ({
      ...m,
      suggestedCategory: heuristicCategory(m.url, existingCategories),
      confidence: 0.5,
    }));
  }
}

function heuristicCategory(url: string, existing: string[]): string {
  const hostname = new URL(url).hostname.toLowerCase();

  const rules: [RegExp, string][] = [
    [/github|gitlab|bitbucket|npmjs|pypi|crates\.io/, 'Dev Tools'],
    [/chatgpt|openai|anthropic|claude|gemini|huggingface|replicate/, 'AI Tools'],
    [/twitter|x\.com|facebook|instagram|linkedin|reddit|discord|mastodon/, 'Social'],
    [/youtube|netflix|twitch|spotify|bilibili/, 'Entertainment'],
    [/aws|azure|gcloud|cloudflare|vercel|netlify|digitalocean/, 'Cloud Services'],
    [/docs|documentation|wiki|mdn|stackoverflow/, 'Documentation'],
    [/amazon|taobao|jd\.com|shop/, 'Shopping'],
    [/news|bbc|cnn|reuters/, 'News'],
  ];

  for (const [pattern, category] of rules) {
    if (pattern.test(hostname)) {
      // Try to match existing category
      const match = existing.find((c) => c.toLowerCase() === category.toLowerCase());
      return match || category;
    }
  }

  return existing.length > 0 ? existing[existing.length - 1] : 'Other';
}
