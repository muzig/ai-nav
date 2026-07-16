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

export default function EditBookmarkModal({ isOpen, bookmark, categories, onClose, onSave }: EditBookmarkModalProps) {
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
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <span className="modal__title">edit bookmark</span>
          <button onClick={onClose} className="btn-icon"><X size={13} /></button>
        </div>
        <div className="modal__body space-y-3">
          <div>
            <label className="cell__label block mb-1">title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="input" />
          </div>
          <div>
            <label className="cell__label block mb-1">url</label>
            <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} className="input" style={{ fontFamily: 'var(--font-outlier)' }} />
          </div>
          <div>
            <label className="cell__label block mb-1">description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="input" style={{ resize: 'none' }} />
          </div>
          <div>
            <label className="cell__label block mb-1">category</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="input">
              <option value="">unsorted</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="modal__footer">
          <button onClick={onClose} className="btn">cancel</button>
          <button onClick={handleSave} disabled={!title.trim() || !url.trim()} className="btn btn--primary disabled:opacity-40">
            <Save size={12} />
            <span>save</span>
          </button>
        </div>
      </div>
    </div>
  );
}