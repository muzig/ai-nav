import { afterEach, describe, expect, it, vi } from 'vitest';
import { extractMetadata } from './metadata.js';

describe('extractMetadata', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns basic metadata when the remote page cannot be read', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));

    await expect(extractMetadata('https://example.com/article')).resolves.toMatchObject({
      url: 'https://example.com/article',
      title: 'example.com',
      description: '',
      favicon: 'https://www.google.com/s2/favicons?domain=example.com&sz=64',
    });
  });
});
