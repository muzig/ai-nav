import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, ArrowRight } from 'lucide-react';
import type { Bookmark } from '../hooks/useBookmarks';

interface SearchBarProps {
  bookmarks: Bookmark[];
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchBar({ bookmarks, isOpen, onClose }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
    }
  }, [isOpen, onClose]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return bookmarks
      .filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.url.toLowerCase().includes(q) ||
          b.description.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [query, bookmarks]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] modal-backdrop flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div
        className="bg-[var(--color-paper-2)] border border-[var(--color-rule)] rounded-lg w-full max-w-xl mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[var(--color-rule)]">
          <Search size={14} className="text-[var(--color-ink-3)] flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search bookmarks…"
            className="flex-1 bg-transparent text-[var(--color-ink)] placeholder-[var(--color-ink-3)] text-xs outline-none font-[family-name:var(--font-body)]"
          />
          <kbd className="hidden sm:flex items-center gap-0.5 text-[10px] text-[var(--color-ink-3)] bg-[var(--color-paper-3)] px-1.5 py-0.5 rounded">
            ESC
          </kbd>
        </div>

        {/* Results */}
        {query.trim() && (
          <div className="max-h-[300px] overflow-y-auto p-1.5">
            {results.length === 0 ? (
              <div className="text-center py-6 text-[var(--color-ink-3)] text-xs">
                No results for "{query}"
              </div>
            ) : (
              results.map((bm) => (
                <a
                  key={bm.id}
                  href={bm.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onClose}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-[var(--color-paper-3)] transition-colors group no-underline"
                >
                  <img
                    src={bm.favicon}
                    alt=""
                    className="w-4 h-4 object-contain rounded flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-[var(--color-ink)] truncate font-medium">
                      {bm.title}
                    </div>
                    <div className="text-[10px] text-[var(--color-ink-3)] truncate font-[family-name:var(--font-outlier)]">
                      {bm.url}
                    </div>
                  </div>
                  <ArrowRight
                    size={12}
                    className="text-[var(--color-ink-3)] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  />
                </a>
              ))
            )}
          </div>
        )}

        {/* Hint when empty */}
        {!query.trim() && (
          <div className="px-4 py-5 text-center text-[var(--color-ink-3)] text-xs">
            Start typing to search
          </div>
        )}
      </div>
    </div>
  );
}
