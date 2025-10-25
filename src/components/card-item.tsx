import React from "react";
import { useDraggable } from "@dnd-kit/core";
import type { Card, Id } from "../types";

export const CardItem: React.FC<{ id: Id; data: Card; columnId: Id }> = ({
    id,
    data,
}) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } =
        useDraggable({ id, data: { type: "card", cardId: id } });

    const style: React.CSSProperties = transform
        ? {
              transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
              opacity: isDragging ? 0.6 : 1,
          }
        : { opacity: isDragging ? 0.6 : 1 };

    return (
        <div
            className="card"
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
        >
            <div>
                <span className="card-title">{data.title}</span>
            </div>
        </div>
    );
};
