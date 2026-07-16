import { ExternalLink, Pencil, Trash2, GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Bookmark } from '../hooks/useBookmarks';
import type { AppMode } from './Dashboard';

interface NavCardProps {
  bookmark: Bookmark;
  index: number;
  mode?: AppMode;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (id: number) => void;
  dragHandleRef?: React.Ref<HTMLDivElement>;
}

export default function NavCard({ bookmark, index, mode = 'edit', onEdit, onDelete }: NavCardProps) {
  const isReadonly = mode === 'readonly';

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: bookmark.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 'var(--z-drag)' : undefined,
  };

  const domain = (() => {
    try {
      return new URL(bookmark.url).hostname.replace('www.', '');
    } catch {
      return bookmark.url;
    }
  })();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative"
      {...attributes}
    >
      <a
        href={bookmark.url}
        target="_blank"
        rel="noopener noreferrer"
        className="card flex items-start gap-3"
      >
        {/* Drag handle — always visible on touch */}
        {!isReadonly && (
          <div
            className="drag-handle flex-shrink-0 mt-0.5"
            {...listeners}
          >
            <GripVertical size={14} />
          </div>
        )}

        {/* Favicon */}
        <div className="w-8 h-8 rounded-md bg-[var(--color-paper-3)] flex items-center justify-center flex-shrink-0 overflow-hidden">
          {bookmark.favicon ? (
            <img
              src={bookmark.favicon}
              alt=""
              className="w-5 h-5 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-5 h-5 rounded-sm bg-[var(--color-rule)]" />
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-[var(--color-ink)] truncate font-[var(--font-display)]">
              {bookmark.title}
            </h3>
            <ExternalLink
              size={12}
              className="flex-shrink-0 text-[var(--color-ink-3)]"
            />
          </div>
          <p className="text-xs text-[var(--color-ink-3)] mt-0.5 truncate font-[family-name:var(--font-outlier)]">
            {domain}
          </p>
          {bookmark.description && (
            <p className="text-xs text-[var(--color-ink-2)] mt-1.5 line-clamp-2 leading-relaxed">
              {bookmark.description}
            </p>
          )}
        </div>

        {/* Action buttons — visible on touch, hover on pointer */}
        {!isReadonly && (
          <div className="action-group flex-shrink-0">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit(bookmark);
              }}
              className="btn-icon"
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
              className="btn-icon hover:text-[var(--color-error)] hover:bg-[oklch(65%_0.20_25_/_0.1)]"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </a>
    </div>
  );
}
