import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Bookmark } from '@ai-nav/shared';
import EditBookmarkModal from './EditBookmarkModal';

const bookmark: Bookmark = {
  id: 1, title: 'Example', url: 'https://example.com/', internal_url: '',
  description: '', favicon: '', category_id: null, sort_order: 0,
  is_favorite: false, favorited_at: null, last_opened_at: null,
  created_at: '', updated_at: '',
};

describe('EditBookmarkModal', () => {
  it('keeps edits visible when saving fails and lets the user retry', async () => {
    const save = vi.fn().mockRejectedValueOnce(new Error('Network unavailable')).mockResolvedValueOnce(bookmark);
    const close = vi.fn();
    render(<EditBookmarkModal isOpen bookmark={bookmark} categories={[]} onClose={close} onSave={save} onDelete={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('title'), { target: { value: 'Edited title' } });
    fireEvent.click(screen.getByRole('button', { name: 'save' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Network unavailable');
    expect(close).not.toHaveBeenCalled();
    expect(screen.getByLabelText('title')).toHaveValue('Edited title');
    fireEvent.click(screen.getByRole('button', { name: 'save' }));
    await waitFor(() => expect(close).toHaveBeenCalledOnce());
    expect(save).toHaveBeenLastCalledWith(1, expect.objectContaining({ title: 'Edited title' }));
  });

  it('keeps the dialog open when deletion fails', async () => {
    const close = vi.fn();
    render(<EditBookmarkModal isOpen bookmark={bookmark} categories={[]} onClose={close} onSave={vi.fn()} onDelete={vi.fn().mockRejectedValue(new Error('Delete failed'))} />);
    fireEvent.click(screen.getByRole('button', { name: 'delete' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Delete failed');
    expect(close).not.toHaveBeenCalled();
  });
});
