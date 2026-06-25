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
  const categoryColor = category?.color || '#6b7280';

  return (
    <section
      className="stagger-child mb-10"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Category header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {isDraggable && (
            <div
              className="p-1 rounded text-[var(--text-muted)] cursor-grab active:cursor-grabbing hover:bg-white/10 transition-colors"
              {...dragHandleProps}
            >
              <GripVertical size={16} />
            </div>
          )}
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: `${categoryColor}20` }}
          >
            <IconComponent size={16} style={{ color: categoryColor }} />
          </div>
          <h2 className="text-lg font-display font-semibold text-[var(--text-primary)]">
            {categoryName}
          </h2>
          <span className="text-xs text-[var(--text-muted)] bg-white/5 px-2 py-0.5 rounded-full">
            {bookmarks.length}
          </span>
        </div>

        {!isReadonly && (
          <div className="flex items-center gap-1 relative">
            <button
              onClick={() => onAddBookmark(category?.id ?? null)}
              className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-colors"
              title="Add bookmark"
            >
              <Plus size={16} />
            </button>

            {category && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-colors"
                >
                  <MoreHorizontal size={16} />
                </button>

                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                    <div className="absolute right-0 top-full mt-1 z-20 glass-strong p-1 min-w-[140px]">
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onEditCategory?.(category);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                      >
                        <Pencil size={14} /> Edit
                      </button>
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onDeleteCategory?.(category.id);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
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

      {/* Cards grid */}
      <SortableContext items={bookmarks.map((b) => b.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
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
