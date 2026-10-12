import { useState, useEffect } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import type { Bookmark, Category } from '../hooks/useBookmarks';
import { detectAccessMode } from '../utils/url';
import { useDialogFocus } from '../hooks/useDialogFocus';

interface EditBookmarkModalProps {
  isOpen: boolean;
  bookmark: Bookmark | null;
  categories: Category[];
  onClose: () => void;
  onSave: (id: number, data: Partial<Bookmark>) => unknown | Promise<unknown>;
  onDelete: (id: number) => unknown | Promise<unknown>;
}

export default function EditBookmarkModal({ isOpen, bookmark, categories, onClose, onSave, onDelete }: EditBookmarkModalProps) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [internalUrl, setInternalUrl] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const close = () => { if (!pending) onClose(); };
  const dialogRef = useDialogFocus(isOpen, close);

  useEffect(() => {
    if (bookmark) {
      setError(null);
      setTitle(bookmark.title);
      setUrl(bookmark.url);
      setInternalUrl(bookmark.internal_url || '');
      setDescription(bookmark.description);
      setCategoryId(String(bookmark.category_id ?? ''));
    }
  }, [bookmark]);

  const handleSave = async () => {
    if (!bookmark || !title.trim() || !url.trim()) return;
    const validUrl = (value: string) => {
      try { return ['http:', 'https:'].includes(new URL(value).protocol); } catch { return false; }
    };
    if (!validUrl(url.trim()) || (internalUrl.trim() && !validUrl(internalUrl.trim()))) {
      setError('Enter a valid HTTP or HTTPS address.');
      return;
    }
    setPending(true);
    setError(null);
    try {
      await onSave(bookmark.id, {
        title: title.trim(),
        url: url.trim(),
        internal_url: internalUrl.trim(),
        description: description.trim(),
        category_id: categoryId ? Number(categoryId) : null,
      });
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to save this tool');
    } finally { setPending(false); }
  };

  const handleDelete = async () => {
    if (!bookmark) return;
    setPending(true);
    setError(null);
    try { await onDelete(bookmark.id); onClose(); }
    catch (error) { setError(error instanceof Error ? error.message : 'Unable to delete this tool'); }
    finally { setPending(false); }
  };

  if (!isOpen || !bookmark) return null;

  const mode = detectAccessMode();

  return (
    <div className="modal-backdrop" onClick={close}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="edit-tool-title" aria-busy={pending} tabIndex={-1} className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <span id="edit-tool-title" className="modal__title">Edit tool</span>
          <button onClick={close} disabled={pending} aria-label="Close edit tool" className="btn-icon"><X size={13} /></button>
        </div>
        <div className="modal__body space-y-3">
          <div>
            <label htmlFor="edit-title" className="cell__label block mb-1">title</label>
            <input type="text" id="edit-title" disabled={pending} value={title} onChange={(e) => setTitle(e.target.value)} className="input" />
          </div>

          <div>
            <label htmlFor="edit-url" className="cell__label block mb-1">url <span className="text-muted">(external / Tailscale)</span></label>
            <input type="url" id="edit-url" disabled={pending} value={url} onChange={(e) => setUrl(e.target.value)} className="input" style={{ fontFamily: 'var(--font-outlier)' }} />
          </div>

          <div>
            <label htmlFor="edit-internal-url" className="cell__label block mb-1">internal url <span className="text-muted">(LAN, optional)</span></label>
            <input type="url" id="edit-internal-url" disabled={pending} value={internalUrl} onChange={(e) => setInternalUrl(e.target.value)} className="input" style={{ fontFamily: 'var(--font-outlier)' }} />
            <p className="text-muted" style={{ fontSize: '11px', marginTop: '4px' }}>
              {mode === 'lan'
                ? 'On LAN — clicking uses the internal URL.'
                : 'Remote — clicking uses the external URL.'}
            </p>
          </div>

          <div>
            <label htmlFor="edit-description" className="cell__label block mb-1">description</label>
            <textarea id="edit-description" disabled={pending} value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="input" style={{ resize: 'none' }} />
          </div>
          <div>
            <label htmlFor="edit-category" className="cell__label block mb-1">category</label>
            <select id="edit-category" disabled={pending} value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="input">
              <option value="">unsorted</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>
        {error && <p className="modal-error" role="alert">{error}</p>}
        <div className="modal__footer">
          <button
            onClick={() => void handleDelete()}
            disabled={pending}
            className="btn btn--danger"
          >
            <Trash2 size={12} />
            <span>delete</span>
          </button>
          <span className="modal__footer-spacer" />
          <button onClick={close} disabled={pending} className="btn">cancel</button>
          <button onClick={handleSave} disabled={pending || !title.trim() || !url.trim()} className="btn btn--primary disabled:opacity-40">
            <Save size={12} />
            <span>{pending ? 'Working…' : 'save'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
