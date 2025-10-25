import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Card, Id } from "../types";

export const CardItem: React.FC<{ id: Id; data: Card; columnId: Id }> = ({
  id,
  data,
  columnId,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id, data: { type: "card", cardId: id, columnId } });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      className={`card${isDragging ? " is-dragging" : ""}`}
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <div>
        <h4 className="card-title">{data.title}</h4>
      </div>
    </div>
  );
};
