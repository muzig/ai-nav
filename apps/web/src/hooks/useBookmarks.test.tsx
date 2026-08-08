import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useBookmarks } from './useBookmarks';

describe('useBookmarks', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps collection state valid when the API returns an error object', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Not found' }),
    }));

    const { result } = renderHook(() => useBookmarks());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.bookmarks).toEqual([]);
    expect(result.current.categories).toEqual([]);
    expect(result.current.grouped).toEqual([]);
  });
});
