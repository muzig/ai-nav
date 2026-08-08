import { useState } from 'react';
import { BookOpenText, Code2, Edit3, LayoutDashboard, MoreHorizontal, Server, Star } from 'lucide-react';
import type { Bookmark } from '@ai-nav/shared';
import { isLocalServiceUrl } from '../features/bookmarks/selectors';
import { resolveLocalServiceIcon } from '../features/bookmarks/serviceIcons';

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

function serviceAddress(url: string): string {
  try {
    const parsed = new URL(url);
    const port = parsed.port || (parsed.protocol === 'https:' ? '443' : '80');
    return `${parsed.hostname.replace(/^\[|\]$/g, '')}:${port}`;
  } catch {
    return url;
  }
}

function LocalServiceFallback({ title }: { title: string }) {
  const normalized = title.toLocaleLowerCase().replace(/\s+/g, ' ').trim();
  const FallbackIcon = normalized.includes('content studio')
    ? LayoutDashboard
    : normalized.includes('lexicon')
      ? BookOpenText
      : normalized.includes('dsa')
        ? Code2
        : Server;

  return (
    <span data-testid="local-service-fallback" aria-hidden="true">
      <FallbackIcon size={18} />
    </span>
  );
}

function ToolIcon({ bookmark, localService }: { bookmark: Bookmark; localService: boolean }) {
  const mappedIcon = localService ? resolveLocalServiceIcon(bookmark) : null;
  // Local favicon URLs point at private hosts and are often unavailable when
  // the navigation page itself is reachable. Known services use bundled brand
  // assets; unknown services use a bundled generic glyph immediately.
  const iconSource = mappedIcon?.src || (localService ? null : bookmark.favicon);
  const [failedSource, setFailedSource] = useState<string | null>(null);

  if (iconSource && iconSource !== failedSource) {
    return (
      <img
        src={iconSource}
        alt=""
        loading="lazy"
        data-service-icon={mappedIcon?.id}
        onError={() => setFailedSource(iconSource)}
      />
    );
  }

  if (localService) return <LocalServiceFallback title={bookmark.title} />;
  return bookmark.title.slice(0, 1).toUpperCase();
}

export default function ToolItem({ bookmark, onOpen, onFavorite, onEdit }: ToolItemProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const localService = isLocalServiceUrl(bookmark.url);

  return (
    <div className={`tool-item ${bookmark.is_favorite ? 'is-favorite' : ''} ${localService ? 'is-local-service' : ''}`}>
      <button className="tool-primary" onClick={() => onOpen(bookmark)}>
        <span className="tool-icon">
          <ToolIcon bookmark={bookmark} localService={localService} />
        </span>
        <span className="tool-copy">
          <strong>{bookmark.title}</strong>
          <small>{localService ? serviceAddress(bookmark.url) : hostname(bookmark.url)}</small>
          {localService && (
            <span className="tool-status"><span className="tool-status-dot" aria-hidden="true" />Local service</span>
          )}
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
