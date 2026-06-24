import { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Plus, Settings, Sparkles, Command, Loader2, Eye, Pencil, Wand2, Check, AlertCircle } from 'lucide-react';
import { useBookmarks } from '../hooks/useBookmarks';
import { useAI } from '../hooks/useAI';
import CategoryGroup from './CategoryGroup';
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
    updateCategory,
    deleteCategory,
  } = useBookmarks();

  const { autoGroup, autoGrouping } = useAI();
  const [autoGroupResult, setAutoGroupResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [addUrlOpen, setAddUrlOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [mode, setMode] = useState<AppMode>(() => {
    const saved = localStorage.getItem('ai-nav-mode');
    return (saved === 'readonly' || saved === 'edit') ? saved : 'edit';
  });
  const searchRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
      // Only allow Cmd+N in edit mode
      if ((e.metaKey || e.ctrlKey) && e.key === 'n' && mode === 'edit') {
        e.preventDefault();
        setAddUrlOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [mode]);

  // Filter grouped bookmarks by search query
  const filteredGrouped = useMemo(() => {
    if (!searchQuery.trim()) return grouped;
    const q = searchQuery.toLowerCase();
    return grouped
      .map((group) => ({
        ...group,
        bookmarks: group.bookmarks.filter(
          (b) =>
            b.title.toLowerCase().includes(q) ||
            b.url.toLowerCase().includes(q) ||
            b.description.toLowerCase().includes(q)
        ),
      }))
      .filter((group) => group.bookmarks.length > 0);
  }, [grouped, searchQuery]);

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
    const uncategorized = bookmarks.filter((b) => b.category_id === null);
    if (uncategorized.length === 0) {
      setAutoGroupResult({ type: 'error', message: 'No uncategorized bookmarks' });
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

  return (
    <div className="min-h-screen relative">
      {/* Floating orbs */}
      <div className="orb w-[400px] h-[400px] bg-accent-cyan/5 top-[-100px] left-[-100px]" />
      <div className="orb w-[300px] h-[300px] bg-accent-violet/5 bottom-[10%] right-[-50px]" style={{ animationDelay: '-3s' }} />

      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-cyan/30 to-accent-violet/30 flex items-center justify-center">
              <Sparkles size={18} className="text-accent-cyan" />
            </div>
            <div>
              <h1 className="text-lg font-display font-bold text-gradient">AI Nav</h1>
              <p className="text-[10px] text-[var(--text-muted)] -mt-0.5 tracking-wider uppercase">
                Smart Navigation
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Inline search */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm bg-white/5 border border-white/5 focus-within:border-accent-cyan/30 transition-all w-48 sm:w-64">
              <Search size={14} className="text-[var(--text-muted)] flex-shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="flex-1 bg-transparent text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm outline-none min-w-0"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)] flex-shrink-0"
                >
                  ×
                </button>
              )}
              <kbd className="hidden sm:flex items-center gap-0.5 text-[10px] text-[var(--text-muted)] bg-white/5 px-1.5 py-0.5 rounded flex-shrink-0">
                <Command size={10} />K
              </kbd>
            </div>

            {/* Mode toggle */}
            <button
              onClick={toggleMode}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${
                isReadonly
                  ? 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5'
                  : 'text-accent-cyan bg-accent-cyan/10 border border-accent-cyan/20'
              }`}
              title={isReadonly ? 'Switch to edit mode' : 'Switch to read-only mode'}
            >
              {isReadonly ? <Eye size={14} /> : <Pencil size={14} />}
              <span className="hidden sm:inline">{isReadonly ? 'Read Only' : 'Edit'}</span>
            </button>

            {/* Add button - only in edit mode */}
            {!isReadonly && (
              <button
                onClick={() => setAddUrlOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.15), rgba(167, 139, 250, 0.15))',
                  border: '1px solid rgba(0, 212, 255, 0.25)',
                }}
              >
                <Plus size={14} />
                <span className="hidden sm:inline">Add URLs</span>
              </button>
            )}

            {/* AI Auto Group button - only in edit mode */}
            {!isReadonly && (
              <button
                onClick={handleAutoGroup}
                disabled={autoGrouping}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.2), rgba(255, 106, 157, 0.15))',
                  border: '1px solid rgba(167, 139, 250, 0.3)',
                }}
                title="AI auto-group uncategorized bookmarks"
              >
                {autoGrouping ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Wand2 size={14} />
                )}
                <span className="hidden sm:inline">{autoGrouping ? 'Grouping...' : 'AI Group'}</span>
              </button>
            )}

            {/* Toast notification for auto-group result */}
            {autoGroupResult && (
              <div
                className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium animate-slide-up glass-strong ${
                  autoGroupResult.type === 'success' ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {autoGroupResult.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                {autoGroupResult.message}
              </div>
            )}

            {/* Settings - only in edit mode */}
            {!isReadonly && (
              <button
                onClick={() => setSettingsOpen(true)}
                className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-colors"
              >
                <Settings size={18} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 size={24} className="animate-spin text-accent-cyan" />
          </div>
        ) : bookmarks.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent-cyan/10 to-accent-violet/10 flex items-center justify-center mb-6 animate-float">
              <Sparkles size={32} className="text-accent-cyan" />
            </div>
            <h2 className="text-2xl font-display font-bold text-[var(--text-primary)] mb-2">
              {isReadonly ? 'No Bookmarks Yet' : 'Welcome to AI Nav'}
            </h2>
            <p className="text-[var(--text-secondary)] max-w-md mb-8 leading-relaxed">
              {isReadonly
                ? 'No bookmarks have been added yet.'
                : 'Paste a bunch of URLs and let AI organize them into categories automatically. No manual sorting needed.'}
            </p>
            {!isReadonly && (
              <button
                onClick={() => setAddUrlOpen(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(167, 139, 250, 0.2))',
                  border: '1px solid rgba(0, 212, 255, 0.3)',
                }}
              >
                <Plus size={16} />
                Add Your First Bookmarks
              </button>
            )}
          </div>
        ) : (
          /* Bookmarks grouped by category */
          filteredGrouped.map((group, i) => (
            <CategoryGroup
              key={group.category?.id ?? 'uncategorized'}
              category={group.category}
              bookmarks={group.bookmarks}
              index={i}
              mode={mode}
              onEditBookmark={setEditingBookmark}
              onDeleteBookmark={deleteBookmark}
              onEditCategory={(cat) => {
                const name = prompt('Category name:', cat.name);
                if (name?.trim()) updateCategory(cat.id, { name: name.trim() });
              }}
              onDeleteCategory={(id) => {
                if (confirm('Delete this category? Bookmarks will become uncategorized.')) {
                  deleteCategory(id);
                }
              }}
              onAddBookmark={(categoryId) => setAddUrlOpen(true)}
            />
          ))
        )}
      </main>

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

      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
