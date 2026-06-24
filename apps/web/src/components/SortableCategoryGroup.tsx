import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import CategoryGroup from './CategoryGroup';
import type { Category, Bookmark } from '../hooks/useBookmarks';
import type { AppMode } from './Dashboard';

interface SortableCategoryGroupProps {
  id: number | string;
  category: Category | null;
  bookmarks: Bookmark[];
  index: number;
  mode?: AppMode;
  onEditBookmark: (bookmark: Bookmark) => void;
  onDeleteBookmark: (id: number) => void;
  onEditCategory?: (category: Category) => void;
  onDeleteCategory?: (id: number) => void;
  onAddBookmark: (categoryId: number | null) => void;
}

export default function SortableCategoryGroup({
  id,
  ...props
}: SortableCategoryGroupProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <CategoryGroup
        {...props}
        isDraggable={!!props.category}
        dragHandleProps={props.category ? listeners : undefined}
      />
    </div>
  );
}
