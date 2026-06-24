import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, ArrowRight, Command } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 modal-backdrop flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div
        className="glass-strong w-full max-w-xl mx-4 overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
          <Search size={18} className="text-[var(--text-muted)] flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search bookmarks..."
            className="flex-1 bg-transparent text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm outline-none font-body"
          />
          <kbd className="hidden sm:flex items-center gap-1 text-[10px] text-[var(--text-muted)] bg-white/5 px-1.5 py-0.5 rounded">
            ESC
          </kbd>
        </div>

        {/* Results */}
        {query.trim() && (
          <div className="max-h-[300px] overflow-y-auto p-2">
            {results.length === 0 ? (
              <div className="text-center py-8 text-[var(--text-muted)] text-sm">
                No bookmarks found for "{query}"
              </div>
            ) : (
              results.map((bm) => (
                <a
                  key={bm.id}
                  href={bm.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors group no-underline"
                >
                  <img
                    src={bm.favicon}
                    alt=""
                    className="w-5 h-5 object-contain rounded flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-[var(--text-primary)] truncate font-medium">
                      {bm.title}
                    </div>
                    <div className="text-xs text-[var(--text-muted)] truncate">
                      {bm.url}
                    </div>
                  </div>
                  <ArrowRight
                    size={14}
                    className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  />
                </a>
              ))
            )}
          </div>
        )}

        {/* Hint when empty */}
        {!query.trim() && (
          <div className="px-4 py-6 text-center text-[var(--text-muted)] text-sm">
            Start typing to search your bookmarks
          </div>
        )}
      </div>
    </div>
  );
}
