import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search, Plus, Settings, Loader2, Eye, Pencil, Wand2,
  Check, AlertCircle, X, Trash2, ExternalLink, Sun, Moon
} from 'lucide-react';
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('ai-nav-theme');
    return saved === 'light' ? 'light' : 'dark';
  });
  const [filterCategory, setFilterCategory] = useState<number | 'all' | 'uncategorized' | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ai-nav-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('bento-search-input')?.focus();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'n' && mode === 'edit') {
        e.preventDefault();
        setAddUrlOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [mode]);

  const visibleBookmarks = useMemo(() => {
    let list = bookmarks;
    if (filterCategory === 'uncategorized') {
      list = list.filter(b => !b.category_id);
    } else if (filterCategory !== null && filterCategory !== 'all') {
      list = list.filter(b => b.category_id === filterCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(b =>
        b.title.toLowerCase().includes(q) ||
        b.url.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q)
      );
    }
    return list;
  }, [bookmarks, searchQuery, filterCategory]);

  // Group visible bookmarks by category for inline section anchors
  const groupedByCat = useMemo(() => {
    const byCat = new Map<number | null, { category: Category | null; bookmarks: typeof bookmarks }>();
    for (const bm of visibleBookmarks) {
      const key = bm.category_id ?? null;
      if (!byCat.has(key)) {
        byCat.set(key, {
          category: categories.find(c => c.id === key) ?? null,
          bookmarks: [],
        });
      }
      byCat.get(key)!.bookmarks.push(bm);
    }
    return Array.from(byCat.values());
  }, [visibleBookmarks, categories]);

  const handleConfirmBookmarks = async (items: Array<{ title: string; url: string; description: string; favicon: string; category_id: number | null }>) => {
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
  const today = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const filterPills = useMemo(() => {
    const pills: Array<{ id: number | 'all' | 'uncategorized'; name: string; count: number }> = [
      { id: 'all', name: 'all', count: bookmarks.length },
      { id: 'uncategorized', name: 'unsorted', count: bookmarks.filter(b => !b.category_id).length },
    ];
    for (const cat of categories) {
      pills.push({ id: cat.id, name: cat.name, count: bookmarks.filter(b => b.category_id === cat.id).length });
    }
    return pills;
  }, [categories, bookmarks]);

  const catMap = useMemo(() => {
    const m = new Map<number, string>();
    for (const c of categories) m.set(c.id, c.name);
    return m;
  }, [categories]);

  return (
    <div className="min-h-screen">
      {/* HEADER · minimal, one line */}
      <header className="header">
        <div className="header__brand">
          <span className="header__wordmark">ai.nav</span>
          <span className="header__date hidden sm:inline">/ {today}</span>
          <span className={`w-1.5 h-1.5 rounded-full ${
            healthStatus === 'online' ? 'bg-[var(--color-accent)]' :
            healthStatus === 'offline' ? 'bg-[var(--color-error)]' : 'bg-[var(--color-warning)]'
          }`} />
        </div>
        <div className="header__actions">
          <button onClick={toggleTheme} className="theme-toggle" title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
            {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
          </button>
          <button onClick={toggleMode} className="btn btn--ghost" title="Toggle mode">
            {isReadonly ? <Pencil size={12} /> : <Eye size={12} />}
          </button>
          {!isReadonly && (
            <>
              <button onClick={handleAutoGroup} disabled={autoGrouping} className="btn btn--ghost hidden sm:inline-flex" title="AI group">
                {autoGrouping ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
              </button>
              <button onClick={() => setAddUrlOpen(true)} className="btn btn--primary">
                <Plus size={12} />
                <span className="hidden sm:inline">add</span>
              </button>
            </>
          )}
          {!isReadonly && (
            <button onClick={() => setSettingsOpen(true)} className="btn-icon">
              <Settings size={13} />
            </button>
          )}
        </div>
      </header>

      {/* MAIN · dense grid, viewport-first */}
      <main className="main">
        {/* Compact intro band */}
        <section className="intro">
          <div>
            <h1 className="intro__title">
              {bookmarks.length === 0 ? 'Nothing yet.' : 'Your homepage.'}
            </h1>
            <div className="intro__lead">
              {bookmarks.length === 0
                ? 'Paste URLs and AI will sort them. Then this becomes your homepage.'
                : `${visibleBookmarks.length}/${bookmarks.length} shown · ${categories.length} categories`}
            </div>
          </div>
          {!isReadonly && (
            <div className="intro__stats">
              <div>
                <span className="intro__stat">{bookmarks.length}</span>
                <span className="intro__stat-unit">bookmarks</span>
              </div>
              <div>
                <span className="intro__stat">{categories.length}</span>
                <span className="intro__stat-unit">cats</span>
              </div>
            </div>
          )}
        </section>

        {/* Toolbar — search + filter, single line */}
        <div className="toolbar">
          <div className="search-bar">
            <Search size={12} className="text-[var(--color-ink-3)] flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="filter…"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-[var(--color-ink-3)]">
                <X size={11} />
              </button>
            )}
          </div>
          <div className="filter-row">
            {filterPills.map((p) => (
              <button
                key={String(p.id)}
                onClick={() => setFilterCategory(p.id)}
                className={`filter-pill ${filterCategory === p.id ? 'filter-pill--active' : ''}`}
              >
                <span>{p.name}</span>
                <span className="filter-pill__count">{p.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Dense grid — all visible */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={14} className="animate-spin text-[var(--color-ink-3)]" />
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="empty-state">
            <p className="intro__lead mb-3">No bookmarks yet. Paste URLs and AI will sort them.</p>
            {!isReadonly && (
              <button onClick={() => setAddUrlOpen(true)} className="btn btn--primary">
                <Plus size={12} />
                <span>add your first bookmarks</span>
              </button>
            )}
          </div>
        ) : visibleBookmarks.length === 0 ? (
          <div className="empty-state">
            <p className="intro__lead">No matches.</p>
            <button onClick={() => { setSearchQuery(''); setFilterCategory('all'); }} className="btn mt-3">
              clear filters
            </button>
          </div>
        ) : (
          <div className="dense-grid">
            {visibleBookmarks.map((bm) => (
              <Tile
                key={bm.id}
                bookmark={bm}
                catName={catMap.get(bm.category_id ?? -1) ?? null}
                mode={mode}
                onEdit={setEditingBookmark}
                onDelete={deleteBookmark}
              />
            ))}
          </div>
        )}
      </main>

      {/* Toast */}
      {autoGroupResult && (
        <div className={`toast ${autoGroupResult.type === 'error' ? 'toast--error' : ''}`}>
          {autoGroupResult.type === 'success' ? <Check size={11} /> : <AlertCircle size={11} />}
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
  );
}

/* ===== Tile · dense grid cell ===== */

function Tile({ bookmark, catName, mode, onEdit, onDelete }: {
  bookmark: Bookmark;
  catName: string | null;
  mode: AppMode;
  onEdit: (b: Bookmark) => void;
  onDelete: (id: number) => void;
}) {
  const domain = (() => {
    try {
      return new URL(bookmark.url).hostname.replace('www.', '');
    } catch {
      return bookmark.url;
    }
  })();

  const isReadonly = mode === 'readonly';

  return (
    <a
      href={bookmark.url}
      target="_blank"
      rel="noopener noreferrer"
      className="tile"
      title={catName ? `${bookmark.title} · ${catName}` : bookmark.title}
    >
      <div className="tile__head">
        <div className="tile__favicon">
          {bookmark.favicon ? (
            <img
              src={bookmark.favicon}
              alt=""
              className="w-3.5 h-3.5 object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
            />
          ) : (
            <div className="w-3.5 h-3.5 bg-[var(--color-rule)] rounded-sm" />
          )}
        </div>
        <div className="tile__title">{bookmark.title}</div>
      </div>
      <div className="tile__domain">{domain}</div>
      {catName && <div className="tile__cat" />}
      {!isReadonly && (
        <div className="tile__actions">
          <button
            onClick={(e) => { e.preventDefault(); onEdit(bookmark); }}
            className="tile__action"
            title="Edit"
          >
            <Pencil size={9} />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); onDelete(bookmark.id); }}
            className="tile__action"
            title="Delete"
          >
            <Trash2 size={9} />
          </button>
        </div>
      )}
    </a>
  );
}

/* ===== Bookmark row ===== */

function BookmarkRow({ bookmark, mode, onEdit, onDelete }: {
  bookmark: Bookmark;
  mode: AppMode;
  onEdit: (b: Bookmark) => void;
  onDelete: (id: number) => void;
}) {
  const domain = (() => {
    try {
      return new URL(bookmark.url).hostname.replace('www.', '');
    } catch {
      return bookmark.url;
    }
  })();

  const isReadonly = mode === 'readonly';

  return (
    <a
      href={bookmark.url}
      target="_blank"
      rel="noopener noreferrer"
      className="bm-row group"
    >
      <div className="bm-row__favicon">
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
      <div className="min-w-0 overflow-hidden">
        <div className="bm-row__title">{bookmark.title}</div>
      </div>
      <div className="flex items-center gap-1">
        <span className="bm-row__domain hidden sm:inline">{domain}</span>
        {!isReadonly && (
          <>
            <button
              onClick={(e) => { e.preventDefault(); onEdit(bookmark); }}
              className="btn-icon opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
              title="Edit"
            >
              <Pencil size={11} />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); onDelete(bookmark.id); }}
              className="btn-icon opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
              title="Delete"
            >
              <Trash2 size={11} />
            </button>
          </>
        )}
        <ExternalLink size={11} className="text-[var(--color-ink-3)] opacity-0 group-hover:opacity-100" />
      </div>
    </a>
  );
}