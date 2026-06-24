import { useState, useEffect } from 'react';
import { Search, Plus, Settings, Sparkles, Command, Loader2 } from 'lucide-react';
import { useBookmarks } from '../hooks/useBookmarks';
import CategoryGroup from './CategoryGroup';
import SearchBar from './SearchBar';
import AddUrlModal from './AddUrlModal';
import EditBookmarkModal from './EditBookmarkModal';
import SettingsPanel from './SettingsPanel';
import type { Bookmark, Category } from '../hooks/useBookmarks';

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

  const [searchOpen, setSearchOpen] = useState(false);
  const [addUrlOpen, setAddUrlOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        setAddUrlOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleConfirmBookmarks = async (
    items: Array<{ title: string; url: string; description: string; favicon: string; category_id: number | null }>
  ) => {
    await addBookmarksBulk(items);
    setAddUrlOpen(false);
  };

  const handleAddCategory = async (name: string): Promise<Category> => {
    return addCategory({ name });
  };

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
            {/* Search button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-white/5 hover:bg-white/8 border border-white/5 transition-all"
            >
              <Search size={14} />
              <span className="hidden sm:inline">Search</span>
              <kbd className="hidden sm:flex items-center gap-0.5 text-[10px] ml-2 bg-white/5 px-1.5 py-0.5 rounded">
                <Command size={10} />K
              </kbd>
            </button>

            {/* Add button */}
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

            {/* Settings */}
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-colors"
            >
              <Settings size={18} />
            </button>
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
              Welcome to AI Nav
            </h2>
            <p className="text-[var(--text-secondary)] max-w-md mb-8 leading-relaxed">
              Paste a bunch of URLs and let AI organize them into categories automatically.
              No manual sorting needed.
            </p>
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
          </div>
        ) : (
          /* Bookmarks grouped by category */
          grouped.map((group, i) => (
            <CategoryGroup
              key={group.category?.id ?? 'uncategorized'}
              category={group.category}
              bookmarks={group.bookmarks}
              index={i}
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
      <SearchBar
        bookmarks={bookmarks}
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />

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
