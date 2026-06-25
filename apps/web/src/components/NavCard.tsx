import { useState } from 'react';
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
  const [showActions, setShowActions] = useState(false);
  const [imgError, setImgError] = useState(false);
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
    zIndex: isDragging ? 50 : undefined,
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
      className="stagger-child group relative"
      {...attributes}
    >
      <a
        href={bookmark.url}
        target="_blank"
        rel="noopener noreferrer"
        className="glass glass-hover block p-4 cursor-pointer no-underline min-h-[100px] sm:h-[120px]"
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* Drag handle - only in edit mode */}
        {!isReadonly && (
          <div
            className="absolute top-3 left-3 p-1 rounded text-[var(--text-muted)] opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing hover:bg-white/10"
            {...listeners}
          >
            <GripVertical size={14} />
          </div>
        )}

        {/* Action buttons - only in edit mode */}
        {!isReadonly && (
          <div
            className={`absolute top-3 right-3 flex gap-1 transition-opacity duration-200 ${showActions ? 'sm:opacity-100' : 'sm:opacity-0'} opacity-100`}
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
        )}

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
                className="flex-shrink-0 text-[var(--text-muted)] opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
              />
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">
              {domain}
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1.5 line-clamp-2 leading-relaxed">
              {bookmark.description || ' '}
            </p>
          </div>
        </div>
      </a>
    </div>
  );
}
