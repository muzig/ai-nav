import { useState } from 'react';
import { useDialogFocus } from '../hooks/useDialogFocus';
import { Menu, X } from 'lucide-react';
import type { BookmarkShelf } from '../features/bookmarks/selectors';

interface CategoryOutlineProps {
  shelves: BookmarkShelf[];
  activeId: string | null;
  onNavigate(id: string): void;
}

export default function CategoryOutline({ shelves, activeId, onNavigate }: CategoryOutlineProps) {
  const [open, setOpen] = useState(false);
  const drawerRef = useDialogFocus(open, () => setOpen(false));

  const items = (
    <nav className="outline-list" aria-label="Tool categories">
      {shelves.map((shelf) => (
        <button
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
      </aside>
      {open && (
        <div className="outline-mobile-layer">
          <div className="outline-scrim" aria-hidden="true" onClick={() => setOpen(false)} />
          <div ref={drawerRef} className="outline-drawer" role="dialog" aria-modal="true" aria-label="Category outline" tabIndex={-1}>
            <div className="outline-drawer-head">
              <span>On this page</span>
              <button aria-label="Close category outline" onClick={() => setOpen(false)}><X size={18} /></button>
            </div>
            {items}
          </div>
        </div>
      )}
    </>
  );
}
