"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import { cx } from "@/lib/cx";

/**
 * Makes one seat draggable and a drop target. Dragging only starts after the pointer moves a
 * few pixels, so a plain click still selects the seat. There is deliberately no keyboard drag:
 * keyboard users select a seat with Enter and then pick a swap, which keeps Enter and Space
 * working normally on the seat buttons.
 */
export function DndSeat({
  id,
  canDrag,
  canDrop,
  children,
}: {
  id: string;
  canDrag: boolean;
  canDrop: boolean;
  children: React.ReactNode;
}) {
  const drag = useDraggable({ id, disabled: !canDrag });
  const drop = useDroppable({ id, disabled: !canDrop });
  const t = drag.transform;
  return (
    <div
      ref={(node) => {
        drag.setNodeRef(node);
        drop.setNodeRef(node);
      }}
      {...drag.listeners}
      style={{
        transform: t ? `translate3d(${t.x}px, ${t.y}px, 0)` : undefined,
        zIndex: drag.isDragging ? 20 : undefined,
        position: drag.isDragging ? "relative" : undefined,
        touchAction: canDrag ? "none" : undefined,
        cursor: canDrag ? (drag.isDragging ? "grabbing" : "grab") : undefined,
      }}
      className={cx(
        "rounded-[3px]",
        drop.isOver &&
          !drag.isDragging &&
          "outline-2 outline-offset-2 outline-accent",
        drag.isDragging && "opacity-90",
      )}
    >
      {children}
    </div>
  );
}
