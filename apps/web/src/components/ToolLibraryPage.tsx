import { useMemo, useState } from 'react';
import { Loader2, Moon, Plus, Settings, Sun } from 'lucide-react';
import type { Bookmark, Category } from '@ai-nav/shared';
import { buildShelves } from '../features/bookmarks/selectors';
import { useActiveShelf } from '../hooks/useActiveShelf';
import { useBookmarks } from '../hooks/useBookmarks';
import AddUrlModal from './AddUrlModal';
import CategoryOutline from './CategoryOutline';
import CommandInput from './CommandInput';
import EditBookmarkModal from './EditBookmarkModal';
import ToolShelf from './ToolShelf';

interface ToolLibraryPageProps {
  theme: 'light' | 'dark';
  onToggleTheme(): void;
  onOpenSettings(): void;
}

export default function ToolLibraryPage({
  theme,
  onToggleTheme,
  onOpenSettings,
}: ToolLibraryPageProps) {
  const {
    bookmarks,
    categories,
    loading,
    addBookmarksBulk,
    updateBookmark,
    deleteBookmark,
    addCategory,
    setFavorite,
    openBookmark,
  } = useBookmarks();
  const [query, setQuery] = useState('');
  const [addUrlOpen, setAddUrlOpen] = useState(false);
  const [initialUrls, setInitialUrls] = useState<string[]>([]);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);

  const shelves = useMemo(
    () => buildShelves(bookmarks, categories, query),
    [bookmarks, categories, query],
  );
  const shelfIds = useMemo(() => shelves.map((shelf) => shelf.id), [shelves]);
  const activeShelf = useActiveShelf(shelfIds);

  const openAddFlow = (urls: string[] = []) => {
    setInitialUrls(urls);
    setAddUrlOpen(true);
  };

  const handleAddCategory = (name: string): Promise<Category> => addCategory({ name });

  const navigateToShelf = (id: string) => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById(id)?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  return (
    <div className="app-shell">
      <a className="skip-link" href="#tool-library">Skip to tool library</a>
      <header className="app-bar">
        <div className="app-brand">
          <span className="app-mark">A</span>
          <span>AI Nav</span>
        </div>
        <div className="app-actions">
          <button aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`} onClick={onToggleTheme}>
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          <button aria-label="Open settings" onClick={onOpenSettings}><Settings size={16} /></button>
          <button className="app-add" onClick={() => openAddFlow()}><Plus size={15} /> Add tool</button>
        </div>
      </header>

      <div className="library-layout">
        <CategoryOutline
          shelves={shelves}
          activeId={activeShelf}
          onNavigate={navigateToShelf}
          onAdd={() => openAddFlow()}
        />
        <main id="tool-library" className="library-main">
          <CommandInput query={query} onSearch={setQuery} onAddUrls={openAddFlow} />

          {loading ? (
            <div className="library-state"><Loader2 className="animate-spin" /> Loading your tools…</div>
          ) : bookmarks.length === 0 ? (
            <div className="library-state library-empty">
              <h1>Your AI tools, all in one place.</h1>
              <p>Paste a URL and AI Nav will fetch its details and organize it for you.</p>
              <button className="primary-action" onClick={() => openAddFlow()}><Plus size={16} /> Add your first tool</button>
            </div>
          ) : shelves.length === 0 ? (
            <div className="library-state">
              <h1>No results for “{query}”</h1>
              <button className="text-action" onClick={() => setQuery('')}>Clear search</button>
            </div>
          ) : (
            <div className="shelf-list">
              {shelves.map((shelf) => (
                <ToolShelf
                  key={shelf.id}
                  shelf={shelf}
                  onOpen={openBookmark}
                  onFavorite={setFavorite}
                  onEdit={setEditingBookmark}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      <AddUrlModal
        isOpen={addUrlOpen}
        initialUrls={initialUrls}
        onClose={() => setAddUrlOpen(false)}
        onConfirm={async (items) => { await addBookmarksBulk(items); }}
        categories={categories}
        onAddCategory={handleAddCategory}
      />
      <EditBookmarkModal
        isOpen={!!editingBookmark}
        bookmark={editingBookmark}
        categories={categories}
        onClose={() => setEditingBookmark(null)}
        onSave={(id, data) => updateBookmark(id, data)}
        onDelete={(id) => { void deleteBookmark(id); }}
      />
    </div>
  );
}
