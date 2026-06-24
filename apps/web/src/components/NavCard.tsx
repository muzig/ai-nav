import { useState } from 'react';
import { ExternalLink, Pencil, Trash2, GripVertical } from 'lucide-react';
import type { Bookmark } from '../hooks/useBookmarks';

interface NavCardProps {
  bookmark: Bookmark;
  index: number;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (id: number) => void;
}

export default function NavCard({ bookmark, index, onEdit, onDelete }: NavCardProps) {
  const [showActions, setShowActions] = useState(false);
  const [imgError, setImgError] = useState(false);

  const domain = (() => {
    try {
      return new URL(bookmark.url).hostname.replace('www.', '');
    } catch {
      return bookmark.url;
    }
  })();

  return (
    <div
      className="stagger-child group relative"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <a
        href={bookmark.url}
        target="_blank"
        rel="noopener noreferrer"
        className="glass glass-hover block p-4 cursor-pointer no-underline"
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* Action buttons */}
        <div
          className={`absolute top-3 right-3 flex gap-1 transition-opacity duration-200 ${
            showActions ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEdit(bookmark);
            }}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[var(--text-secondary)] hover:text-white transition-colors"
            title="Edit"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(bookmark.id);
            }}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-[var(--text-secondary)] hover:text-red-400 transition-colors"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>

        <div className="flex items-start gap-3">
          {/* Favicon */}
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {bookmark.favicon && !imgError ? (
              <img
                src={bookmark.favicon}
                alt=""
                className="w-6 h-6 object-contain"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-accent-cyan/30 to-accent-violet/30" />
            )}
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-[var(--text-primary)] truncate font-display">
                {bookmark.title}
              </h3>
              <ExternalLink
                size={12}
                className="flex-shrink-0 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">
              {domain}
            </p>
            {bookmark.description && (
              <p className="text-xs text-[var(--text-muted)] mt-1.5 line-clamp-2 leading-relaxed">
                {bookmark.description}
              </p>
            )}
          </div>
        </div>
      </a>
    </div>
  );
}
