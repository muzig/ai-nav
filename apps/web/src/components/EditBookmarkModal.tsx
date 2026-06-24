import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import type { Bookmark, Category } from '../hooks/useBookmarks';

interface EditBookmarkModalProps {
  isOpen: boolean;
  bookmark: Bookmark | null;
  categories: Category[];
  onClose: () => void;
  onSave: (id: number, data: Partial<Bookmark>) => void;
}

export default function EditBookmarkModal({
  isOpen,
  bookmark,
  categories,
  onClose,
  onSave,
}: EditBookmarkModalProps) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');

  useEffect(() => {
    if (bookmark) {
      setTitle(bookmark.title);
      setUrl(bookmark.url);
      setDescription(bookmark.description);
      setCategoryId(String(bookmark.category_id ?? ''));
    }
  }, [bookmark]);

  const handleSave = () => {
    if (!bookmark || !title.trim() || !url.trim()) return;
    onSave(bookmark.id, {
      title: title.trim(),
      url: url.trim(),
      description: description.trim(),
      category_id: categoryId ? Number(categoryId) : null,
    });
    onClose();
  };

  if (!isOpen || !bookmark) return null;

  return (
    <div className="fixed inset-0 z-50 modal-backdrop flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="glass-strong w-full max-w-md animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="text-lg font-display font-semibold text-[var(--text-primary)]">
            Edit Bookmark
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-white hover:bg-white/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-accent-cyan/30"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1.5">URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-accent-cyan/30"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-accent-cyan/30 resize-none"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1.5">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-accent-cyan/30 appearance-none"
            >
              <option value="">Uncategorized</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-white/5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || !url.trim()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
            style={{
              background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(167, 139, 250, 0.2))',
              border: '1px solid rgba(0, 212, 255, 0.3)',
            }}
          >
            <Save size={14} />
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
