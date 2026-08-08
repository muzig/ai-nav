import type { Bookmark } from '@ai-nav/shared';
import type { BookmarkShelf } from '../features/bookmarks/selectors';
import ToolItem from './ToolItem';

interface ToolShelfProps {
  shelf: BookmarkShelf;
  onOpen(bookmark: Bookmark): void;
  onFavorite(id: number, favorite: boolean): Promise<void>;
  onEdit(bookmark: Bookmark): void;
}

export default function ToolShelf({ shelf, onOpen, onFavorite, onEdit }: ToolShelfProps) {
  const localShelf = shelf.id === 'local-services';

  return (
    <section id={shelf.id} className={`tool-shelf ${localShelf ? 'is-local-shelf' : ''}`} aria-labelledby={`${shelf.id}-title`}>
      <div className="shelf-heading">
        <h2 id={`${shelf.id}-title`}>{shelf.title}</h2>
        <span>{shelf.bookmarks.length}</span>
      </div>
      {localShelf && <p className="shelf-caption">Services available on this device or network</p>}
      <div className="tool-grid">
        {shelf.bookmarks.map((bookmark) => (
          <ToolItem
            key={bookmark.id}
            bookmark={bookmark}
            onOpen={onOpen}
            onFavorite={onFavorite}
            onEdit={onEdit}
          />
        ))}
      </div>
    </section>
  );
}
