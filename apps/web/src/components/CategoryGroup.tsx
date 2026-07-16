import { useState } from 'react';
import {
  Sparkles, Code, Users, Server, Folder, Globe,
  Music, Newspaper, ShoppingCart, Cloud, BookOpen, Gamepad2,
  MoreHorizontal, Plus, Pencil, Trash2, GripVertical
} from 'lucide-react';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import type { Category, Bookmark } from '../hooks/useBookmarks';
import type { AppMode } from './Dashboard';
import NavCard from './NavCard';

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  sparkles: Sparkles,
  code: Code,
  users: Users,
  server: Server,
  folder: Folder,
  globe: Globe,
  music: Music,
  newspaper: Newspaper,
  'shopping-cart': ShoppingCart,
  cloud: Cloud,
  'book-open': BookOpen,
  gamepad2: Gamepad2,
};

interface CategoryGroupProps {
  category: Category | null;
  bookmarks: Bookmark[];
  index: number;
  mode?: AppMode;
  onEditBookmark: (bookmark: Bookmark) => void;
  onDeleteBookmark: (id: number) => void;
  onEditCategory?: (category: Category) => void;
  onDeleteCategory?: (id: number) => void;
  onAddBookmark: (categoryId: number | null) => void;
  isDraggable?: boolean;
  dragHandleProps?: Record<string, unknown>;
}

export default function CategoryGroup({
  category,
  bookmarks,
  index,
  mode = 'edit',
  onEditBookmark,
  onDeleteBookmark,
  onEditCategory,
  onDeleteCategory,
  onAddBookmark,
  isDraggable,
  dragHandleProps,
}: CategoryGroupProps) {
  const [showMenu, setShowMenu] = useState(false);
  const isReadonly = mode === 'readonly';

  const IconComponent = category ? (ICON_MAP[category.icon] || Folder) : Globe;
  const categoryName = category?.name || 'Uncategorized';

  return (
    <section className="mb-8">
      {/* Category header */}
      <div className="category-header">
        {isDraggable && (
          <div
            className="drag-handle"
            {...dragHandleProps}
          >
            <GripVertical size={14} />
          </div>
        )}
        <div className="category-header__icon">
          <IconComponent size={14} />
        </div>
        <h2 className="category-header__title">
          {categoryName}
        </h2>
        <span className="category-header__count">
          {bookmarks.length}
        </span>

        {/* Actions */}
        {!isReadonly && (
          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={() => onAddBookmark(category?.id ?? null)}
              className="btn-icon"
              title="Add bookmark"
            >
              <Plus size={14} />
            </button>

            {category && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="btn-icon"
                >
                  <MoreHorizontal size={14} />
                </button>

                {showMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-[var(--z-dropdown)]"
                      onClick={() => setShowMenu(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 z-[calc(var(--z-dropdown)+1)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] rounded-md p-1 min-w-[140px]">
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onEditCategory?.(category);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[var(--color-ink-2)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-2)] rounded-md transition-colors"
                      >
                        <Pencil size={14} /> Edit
                      </button>
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onDeleteCategory?.(category.id);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[var(--color-error)] hover:bg-[oklch(65%_0.20_25_/_0.1)] rounded-md transition-colors"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cards list — vertical stack, not grid */}
      <SortableContext items={bookmarks.map((b) => b.id)} strategy={rectSortingStrategy}>
        <div className="flex flex-col gap-2">
          {bookmarks.map((bm, i) => (
            <NavCard
              key={bm.id}
              bookmark={bm}
              index={i}
              mode={mode}
              onEdit={onEditBookmark}
              onDelete={onDeleteBookmark}
            />
          ))}
        </div>
      </SortableContext>
    </section>
  );
}
