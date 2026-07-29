import { useEffect, useRef, useState } from 'react';
import { Menu, Plus, X } from 'lucide-react';
import type { BookmarkShelf } from '../features/bookmarks/selectors';

interface CategoryOutlineProps {
  shelves: BookmarkShelf[];
  activeId: string | null;
  onNavigate(id: string): void;
  onAdd(): void;
}

export default function CategoryOutline({ shelves, activeId, onNavigate, onAdd }: CategoryOutlineProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstItemRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    firstItemRef.current?.focus();
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [open]);

  const items = (
    <nav className="outline-list" aria-label="Tool categories">
      {shelves.map((shelf, index) => (
        <button
          ref={index === 0 ? firstItemRef : undefined}
          key={shelf.id}
          className={activeId === shelf.id ? 'is-active' : ''}
          aria-current={activeId === shelf.id ? 'location' : undefined}
          onClick={() => {
            onNavigate(shelf.id);
            setOpen(false);
          }}
        >
          <span>{shelf.title}</span>
          <span>{shelf.bookmarks.length}</span>
        </button>
      ))}
    </nav>
  );

  return (
    <>
      <button
        ref={triggerRef}
        className="outline-trigger"
        aria-label="Open category outline"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Menu size={18} />
      </button>
      <aside className="category-outline">
        <div className="outline-label">On this page</div>
        {items}
        <button className="outline-add" onClick={onAdd}><Plus size={14} /> Add tool</button>
      </aside>
      {open && (
        <div className="outline-mobile-layer">
          <div className="outline-scrim" aria-hidden="true" onClick={() => setOpen(false)} />
          <aside className="outline-drawer" aria-label="Category outline">
            <div className="outline-drawer-head">
              <span>On this page</span>
              <button aria-label="Close category outline" onClick={() => setOpen(false)}><X size={18} /></button>
            </div>
            {items}
            <button className="outline-add" onClick={() => { setOpen(false); onAdd(); }}><Plus size={14} /> Add tool</button>
          </aside>
        </div>
      )}
    </>
  );
}
