import { PropsWithChildren } from 'react';
import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';
import './SortableBlock.css';

interface Props extends PropsWithChildren {
  id: string;
  label: string;
}

export function SortableBlock({ id, label, children }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
  } as const;

  return (
    <div ref={setNodeRef} style={style} className={`sortable-block${isDragging ? ' sortable-block--dragging' : ''}`}>
      <div className="sortable-block__handle" {...attributes} {...listeners}>
        <span aria-hidden>↕</span>
        <small>{label}</small>
      </div>
      <div className="sortable-block__content">{children}</div>
    </div>
  );
}
