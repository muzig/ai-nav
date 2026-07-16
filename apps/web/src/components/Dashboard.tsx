import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Search, Plus, Settings, Loader2, Eye, Pencil, Wand2, Check, AlertCircle, X, Trash2, ExternalLink, GripVertical, Menu } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useBookmarks } from '../hooks/useBookmarks';
import { useAI } from '../hooks/useAI';
import { useHealthCheck } from '../hooks/useHealthCheck';
import AddUrlModal from './AddUrlModal';
import EditBookmarkModal from './EditBookmarkModal';
import SettingsPanel from './SettingsPanel';
import type { Bookmark, Category } from '../hooks/useBookmarks';

export type AppMode = 'edit' | 'readonly';

export default function Dashboard() {
  const {
    bookmarks,
    categories,
    grouped,
    loading,
    addBookmarksBulk,
    updateBookmark,
    deleteBookmark,
    addCategory,
    deleteCategory,
    reorderBookmarks,
  } = useBookmarks();

  const { autoGroup, autoGrouping } = useAI();
  const healthStatus = useHealthCheck();
  const [autoGroupResult, setAutoGroupResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [addUrlOpen, setAddUrlOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<number | 'all' | 'uncategorized'>('all');
  const [mode, setMode] = useState<AppMode>(() => {
    const saved = localStorage.getItem('ai-nav-mode');
    return (saved === 'readonly' || saved === 'edit') ? saved : 'edit';
  });
  const [activeId, setActiveId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'n' && mode === 'edit') {
        e.preventDefault();
        setAddUrlOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [mode]);

  const filteredGrouped = useMemo(() => {
    let result = grouped;
    if (activeCategoryId === 'uncategorized') {
      result = result.filter(g => g.category === null);
    } else if (activeCategoryId !== 'all') {
      result = result.filter(g => g.category?.id === activeCategoryId);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.map(group => ({
        ...group,
        bookmarks: group.bookmarks.filter(
          (b) =>
            b.title.toLowerCase().includes(q) ||
            b.url.toLowerCase().includes(q) ||
            b.description.toLowerCase().includes(q)
        ),
      })).filter(group => group.bookmarks.length > 0);
    }
    return result;
  }, [grouped, searchQuery, activeCategoryId]);

  const allBookmarksCount = bookmarks.length;
  const uncategorizedCount = bookmarks.filter(b => !b.category_id).length;

  const handleConfirmBookmarks = async (
    items: Array<{ title: string; url: string; description: string; favicon: string; category_id: number | null }>
  ) => {
    await addBookmarksBulk(items);
    setAddUrlOpen(false);
  };

  const handleAddCategory = async (name: string): Promise<Category> => {
    return addCategory({ name });
  };

  const handleAutoGroup = async () => {
    setAutoGroupResult(null);
    if (bookmarks.length === 0) {
      setAutoGroupResult({ type: 'error', message: 'No bookmarks to group' });
      setTimeout(() => setAutoGroupResult(null), 3000);
      return;
    }
    const { grouped, errors } = await autoGroup(bookmarks, categories, handleAddCategory, updateBookmark);
    if (grouped > 0) {
      setAutoGroupResult({ type: 'success', message: `AI grouped ${grouped} bookmark${grouped > 1 ? 's' : ''}${errors ? `, ${errors} failed` : ''}` });
    } else {
      setAutoGroupResult({ type: 'error', message: 'No bookmarks were grouped' });
    }
    setTimeout(() => setAutoGroupResult(null), 4000);
  };

  const toggleMode = () => {
    const newMode = mode === 'edit' ? 'readonly' : 'edit';
    setMode(newMode);
    localStorage.setItem('ai-nav-mode', newMode);
  };

  const isReadonly = mode === 'readonly';

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = active.id as number;
    const overId = over.id as number;

    const activeGroup = filteredGrouped.find((g) =>
      g.bookmarks.some((b) => b.id === activeId)
    );
    const overGroup = filteredGrouped.find((g) =>
      g.bookmarks.some((b) => b.id === overId)
    );

    if (!activeGroup || !overGroup) return;

    if (activeGroup === overGroup) {
      const ids = activeGroup.bookmarks.map((b) => b.id);
      const oldIndex = ids.indexOf(activeId);
      const newIndex = ids.indexOf(overId);
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = [...ids];
        newOrder.splice(oldIndex, 1);
        newOrder.splice(newIndex, 0, activeId);
        reorderBookmarks(activeGroup.category?.id ?? null, newOrder);
      }
    }
  }, [filteredGrouped, reorderBookmarks]);

  const activeBookmark = activeId
    ? bookmarks.find((b) => b.id === activeId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
    <div className="app">
      {/* HEADER */}
      <header className="app__header">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSidebarOpen(true)}
            className="btn-icon md:hidden"
            aria-label="Open menu"
          >
            <Menu size={14} />
          </button>
          <span className="font-[family-name:var(--font-outlier)] text-[14px] font-medium text-[var(--color-ink)] tracking-tight">
            ai.nav
          </span>
          <span className={`w-1.5 h-1.5 rounded-full ${
            healthStatus === 'online' ? 'bg-[var(--color-accent)]' :
            healthStatus === 'offline' ? 'bg-[var(--color-error)]' : 'bg-[var(--color-warning)]'
          }`} />
        </div>

        <div className="flex items-center gap-2">
          <div className="header-search">
            <div className="input w-48 sm:w-64">
              <Search size={13} className="text-[var(--color-ink-3)] flex-shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="search…"
              />
              {searchQuery ? (
                <button onClick={() => setSearchQuery('')} className="text-[var(--color-ink-3)] hover:text-[var(--color-ink)]">
                  <X size={12} />
                </button>
              ) : (
                <kbd>⌘K</kbd>
              )}
            </div>
          </div>

          {/* Mobile search button */}
          <button
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="btn-icon md:hidden"
            aria-label="Search"
          >
            <Search size={14} />
          </button>

          <button onClick={toggleMode} className="btn btn--ghost" title={isReadonly ? 'Edit mode' : 'Read mode'}>
            {isReadonly ? <Pencil size={13} /> : <Eye size={13} />}
          </button>

          {!isReadonly && (
            <button onClick={() => setAddUrlOpen(true)} className="btn btn--primary">
              <Plus size={13} />
              <span>add</span>
            </button>
          )}

          {!isReadonly && (
            <button
              onClick={handleAutoGroup}
              disabled={autoGrouping}
              className="btn hidden sm:inline-flex"
              title="AI auto-group"
            >
              {autoGrouping ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />}
              <span>{autoGrouping ? '…' : 'ai'}</span>
            </button>
          )}

          {!isReadonly && (
            <button onClick={() => setSettingsOpen(true)} className="btn-icon">
              <Settings size={15} />
            </button>
          )}
        </div>
      </header>

      {/* Mobile search bar */}
      {mobileSearchOpen && (
        <div className="md:hidden px-3 py-2 border-b border-[var(--color-rule)] bg-[var(--color-paper)]">
          <div className="input w-full">
            <Search size={13} className="text-[var(--color-ink-3)] flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="search…"
              autoFocus
            />
            <button onClick={() => { setMobileSearchOpen(false); setSearchQuery(''); }} className="text-[var(--color-ink-3)]">
              <X size={12} />
            </button>
          </div>
        </div>
      )}

      {/* SIDEBAR — Categories */}
      <div
        className={`app__sidebar-overlay ${sidebarOpen ? 'app__sidebar-overlay--visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />
      <aside className={`app__sidebar ${sidebarOpen ? 'app__sidebar--open' : ''}`}>
        <div className="flex items-center justify-between md:hidden px-4 py-3 border-b border-[var(--color-rule)]">
          <span className="font-[family-name:var(--font-outlier)] text-[14px] font-medium text-[var(--color-ink)]">menu</span>
          <button onClick={() => setSidebarOpen(false)} className="btn-icon" aria-label="Close menu">
            <X size={14} />
          </button>
        </div>
        <div className="sidebar-label">view</div>
        <button
          className={`sidebar-item ${activeCategoryId === 'all' ? 'sidebar-item--active' : ''}`}
          onClick={() => { setActiveCategoryId('all'); setSidebarOpen(false); }}
        >
          <span>all</span>
          <span className="sidebar-item__count">{allBookmarksCount}</span>
        </button>
        <button
          className={`sidebar-item ${activeCategoryId === 'uncategorized' ? 'sidebar-item--active' : ''}`}
          onClick={() => { setActiveCategoryId('uncategorized'); setSidebarOpen(false); }}
        >
          <span>uncategorized</span>
          <span className="sidebar-item__count">{uncategorizedCount}</span>
        </button>

        <div className="sidebar-label" style={{ marginTop: 'var(--space-md)' }}>categories</div>
        {categories.map((cat) => {
          const count = bookmarks.filter(b => b.category_id === cat.id).length;
          return (
            <button
              key={cat.id}
              className={`sidebar-item ${activeCategoryId === cat.id ? 'sidebar-item--active' : ''}`}
              onClick={() => { setActiveCategoryId(cat.id); setSidebarOpen(false); }}
            >
              <span>{cat.name}</span>
              <span className="sidebar-item__count">{count}</span>
            </button>
          );
        })}
        {categories.length === 0 && (
          <div className="px-4 py-2 text-[12px] text-[var(--color-ink-3)] font-[family-name:var(--font-outlier)]">
            no categories yet
          </div>
        )}
      </aside>

      {/* MAIN — Bookmarks list */}
      <main className="app__main">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={16} className="animate-spin text-[var(--color-ink-3)]" />
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="empty">
            <div className="badge mb-3">
              <span>empty</span>
            </div>
            <h2 className="empty__title">Welcome to ai.nav</h2>
            <p className="empty__desc">
              Paste URLs and AI will organize them into categories automatically. Or start by adding your first bookmark.
            </p>
            {!isReadonly && (
              <button onClick={() => setAddUrlOpen(true)} className="btn btn--primary">
                <Plus size={12} />
                <span>add bookmarks</span>
              </button>
            )}
          </div>
        ) : filteredGrouped.length === 0 ? (
          <div className="empty">
            <p className="empty__desc">no matches for "{searchQuery}"</p>
          </div>
        ) : (
          <div>
            {filteredGrouped.map((group) => (
              <CategorySection
                key={group.category?.id ?? 'uncategorized'}
                bookmarks={group.bookmarks}
                categoryName={group.category?.name ?? 'Uncategorized'}
                mode={mode}
                onEditBookmark={setEditingBookmark}
                onDeleteBookmark={deleteBookmark}
              />
            ))}
          </div>
        )}
      </main>

      {/* Drag overlay */}
      <DragOverlay>
        {activeBookmark ? (
          <div className="opacity-60">
            <BookmarkCard bookmark={activeBookmark} mode="edit" onEdit={() => {}} onDelete={() => {}} />
          </div>
        ) : null}
      </DragOverlay>

      {/* Toast */}
      {autoGroupResult && (
        <div className={`toast ${autoGroupResult.type === 'error' ? 'toast--error' : ''}`}>
          {autoGroupResult.type === 'success' ? <Check size={12} /> : <AlertCircle size={12} />}
          <span>{autoGroupResult.message}</span>
        </div>
      )}

      {/* Modals */}
      <AddUrlModal
        isOpen={addUrlOpen}
        onClose={() => setAddUrlOpen(false)}
        onConfirm={handleConfirmBookmarks}
        categories={categories}
        onAddCategory={handleAddCategory}
      />
      <EditBookmarkModal
        isOpen={!!editingBookmark}
        bookmark={editingBookmark}
        categories={categories}
        onClose={() => setEditingBookmark(null)}
        onSave={(id, data) => updateBookmark(id, data)}
      />
      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
    </DndContext>
  );
}

/* ===== Bookmark Row (terminal-style data row) ===== */

function BookmarkCard({ bookmark, mode, onEdit, onDelete }: {
  bookmark: Bookmark;
  mode: AppMode;
  onEdit: (b: Bookmark) => void;
  onDelete: (id: number) => void;
}) {
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
    opacity: isDragging ? 0.3 : 1,
  };

  const domain = (() => {
    try {
      return new URL(bookmark.url).hostname.replace('www.', '');
    } catch {
      return bookmark.url;
    }
  })();

  const isReadonly = mode === 'readonly';

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="card-item">
      <a
        href={bookmark.url}
        target="_blank"
        rel="noopener noreferrer"
        className="card-item__link"
      >
        <div className="card-item__head">
          <div className="card-item__favicon">
            {bookmark.favicon ? (
              <img
                src={bookmark.favicon}
                alt=""
                className="w-4 h-4 object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
              />
            ) : (
              <div className="w-4 h-4 bg-[var(--color-rule)] rounded-sm" />
            )}
          </div>
          <div className="card-item__title">{bookmark.title}</div>
          {!isReadonly && (
            <div className="card-item__menu" onClick={(e) => e.preventDefault()}>
              <div className="card-item__drag" {...listeners}>
                <GripVertical size={11} />
              </div>
            </div>
          )}
        </div>
        {bookmark.description && (
          <div className="card-item__desc">{bookmark.description}</div>
        )}
        <div className="card-item__foot">
          <span className="card-item__domain">{domain}</span>
          <div className="card-item__actions">
            <ExternalLink size={11} className="text-[var(--color-ink-3)]" />
            {!isReadonly && (
              <>
                <button onClick={(e) => { e.preventDefault(); onEdit(bookmark); }} className="btn-icon" title="Edit">
                  <Pencil size={11} />
                </button>
                <button onClick={(e) => { e.preventDefault(); onDelete(bookmark.id); }} className="btn-icon" title="Delete">
                  <Trash2 size={11} />
                </button>
              </>
            )}
          </div>
        </div>
      </a>
    </div>
  );
}

function CategorySection({ bookmarks, categoryName, mode, onEditBookmark, onDeleteBookmark }: {
  bookmarks: Bookmark[];
  categoryName: string;
  mode: AppMode;
  onEditBookmark: (b: Bookmark) => void;
  onDeleteBookmark: (id: number) => void;
}) {
  return (
    <section className="mb-8">
      <div className="flex items-baseline gap-2 mb-3">
        <h2 className="font-[family-name:var(--font-outlier)] text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-2)]">
          {categoryName}
        </h2>
        <span className="text-[11px] text-[var(--color-ink-3)]">{bookmarks.length}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        <SortableContext items={bookmarks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          {bookmarks.map((bm) => (
            <BookmarkCard
              key={bm.id}
              bookmark={bm}
              mode={mode}
              onEdit={onEditBookmark}
              onDelete={onDeleteBookmark}
            />
          ))}
        </SortableContext>
      </div>
    </section>
  );
}