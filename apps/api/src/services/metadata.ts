import * as cheerio from 'cheerio';
import type { UrlMetadata } from '@ai-nav/shared';

export async function extractMetadata(url: string): Promise<UrlMetadata> {
  const defaultMeta: UrlMetadata = {
    url,
    title: new URL(url).hostname,
    description: '',
    favicon: `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`,
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AI-Nav/1.0)',
        'Accept': 'text/html',
      },
    });
    clearTimeout(timeout);

    if (!response.ok) return defaultMeta;

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract title
    const title =
      $('meta[property="og:title"]').attr('content') ||
      $('meta[name="twitter:title"]').attr('content') ||
      $('title').text() ||
      defaultMeta.title;

    // Extract description
    const description =
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      $('meta[name="twitter:description"]').attr('content') ||
      '';

    // Extract favicon
    let favicon =
      $('link[rel="icon"]').attr('href') ||
      $('link[rel="shortcut icon"]').attr('href') ||
      $('link[rel="apple-touch-icon"]').attr('href') ||
      defaultMeta.favicon;

    // Resolve relative favicon URLs
    if (favicon && !favicon.startsWith('http')) {
      const base = new URL(url);
      favicon = favicon.startsWith('/')
        ? `${base.protocol}//${base.host}${favicon}`
        : `${base.protocol}//${base.host}/${favicon}`;
    }

    return {
      url,
      title: title.trim().slice(0, 200),
      description: description.trim().slice(0, 500),
      favicon,
    };
  } catch {
    return defaultMeta;
  }
}

export async function extractMetadataBulk(urls: string[]): Promise<UrlMetadata[]> {
  const results = await Promise.allSettled(urls.map(extractMetadata));
  return results.map((r, i) =>
    r.status === 'fulfilled'
      ? r.value
      : {
          url: urls[i],
          title: new URL(urls[i]).hostname,
          description: '',
          favicon: `https://www.google.com/s2/favicons?domain=${new URL(urls[i]).hostname}&sz=64`,
        }
  );
}
