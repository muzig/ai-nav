import { useState } from 'react';
import { Edit3, MoreHorizontal, Star } from 'lucide-react';
import type { Bookmark } from '@ai-nav/shared';

interface ToolItemProps {
  bookmark: Bookmark;
  onOpen(bookmark: Bookmark): void;
  onFavorite(id: number, favorite: boolean): Promise<void>;
  onEdit(bookmark: Bookmark): void;
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export default function ToolItem({ bookmark, onOpen, onFavorite, onEdit }: ToolItemProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className={`tool-item ${bookmark.is_favorite ? 'is-favorite' : ''}`}>
      <button className="tool-primary" onClick={() => onOpen(bookmark)}>
        <span className="tool-icon">
          {bookmark.favicon
            ? <img src={bookmark.favicon} alt="" loading="lazy" />
            : bookmark.title.slice(0, 1).toUpperCase()}
        </span>
        <span className="tool-copy">
          <strong>{bookmark.title}</strong>
          <small>{hostname(bookmark.url)}</small>
        </span>
      </button>
      <div className="tool-actions">
        <button
          aria-label={`${bookmark.is_favorite ? 'Remove' : 'Add'} ${bookmark.title} ${bookmark.is_favorite ? 'from' : 'to'} favorites`}
          onClick={() => void onFavorite(bookmark.id, !bookmark.is_favorite)}
        >
          <Star size={13} fill={bookmark.is_favorite ? 'currentColor' : 'none'} />
        </button>
        <button
          aria-label={`More actions for ${bookmark.title}`}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <MoreHorizontal size={14} />
        </button>
      </div>
      {menuOpen && (
        <div className="tool-menu">
          <button
            onClick={() => {
              setMenuOpen(false);
              void onFavorite(bookmark.id, !bookmark.is_favorite);
            }}
          >
            <Star size={14} fill={bookmark.is_favorite ? 'currentColor' : 'none'} />
            {bookmark.is_favorite ? 'Unfavorite' : 'Favorite'}
          </button>
          <button
            onClick={() => {
              setMenuOpen(false);
              onEdit(bookmark);
            }}
          >
            <Edit3 size={14} />
            Edit
          </button>
        </div>
      )}
    </div>
  );
}
