import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Bookmark } from '@ai-nav/shared';
import ToolItem from './ToolItem';

const bookmark: Bookmark = {
  id: 1,
  title: 'Custom local app',
  url: 'http://100.64.0.10:6300/',
  description: '',
  favicon: 'http://100.64.0.10:6300/favicon.ico',
  category_id: null,
  sort_order: 0,
  is_favorite: false,
  favorited_at: null,
  last_opened_at: null,
  created_at: '',
  updated_at: '',
};

describe('ToolItem', () => {
  it('uses a local-service glyph instead of requesting an unreachable stored favicon', () => {
    render(
      <ToolItem
        bookmark={bookmark}
        onOpen={vi.fn()}
        onFavorite={vi.fn().mockResolvedValue(undefined)}
        onEdit={vi.fn()}
      />,
    );

    expect(screen.queryByRole('presentation')).not.toBeInTheDocument();
    expect(screen.getByTestId('local-service-fallback')).toBeInTheDocument();
  });

  it('falls back to the title initial when a public favicon cannot load', () => {
    render(
      <ToolItem
        bookmark={{
          ...bookmark,
          title: 'Example',
          url: 'https://example.com/',
          favicon: 'https://example.com/missing.ico',
        }}
        onOpen={vi.fn()}
        onFavorite={vi.fn().mockResolvedValue(undefined)}
        onEdit={vi.fn()}
      />,
    );

    fireEvent.error(screen.getByRole('presentation'));
    expect(screen.getByText('E')).toBeInTheDocument();
  });
});
