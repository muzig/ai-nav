import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import CommandInput from './CommandInput';

describe('CommandInput', () => {
  it('reports search text', async () => {
    const onSearch = vi.fn();
    render(<CommandInput query="" onSearch={onSearch} onAddUrls={vi.fn()} />);
    await userEvent.type(screen.getByRole('searchbox'), 'claude');
    expect(onSearch).toHaveBeenCalled();
    expect(onSearch.mock.calls[onSearch.mock.calls.length - 1]?.[0]).toBe('e');
  });

  it('turns pasted URLs into an add action', () => {
    const onAddUrls = vi.fn();
    render(<CommandInput query="" onSearch={vi.fn()} onAddUrls={onAddUrls} />);
    const input = screen.getByRole('searchbox');
    const clipboardData = { getData: () => 'https://claude.ai\nhttps://chatgpt.com' };
    const event = new Event('paste', { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'clipboardData', { value: clipboardData });
    input.dispatchEvent(event);
    expect(onAddUrls).toHaveBeenCalledWith(['https://claude.ai', 'https://chatgpt.com']);
  });
});
