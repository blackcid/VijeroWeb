import React, { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import type { Card, Id } from "../types";
import { useBoard } from "../store";

export const CardItem: React.FC<{ id: Id; data: Card; columnId: Id }> = ({
    id,
    data,
}) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } =
        useDraggable({ id });
    const { updateCard, removeCard } = useBoard();
    const [editing, setEditing] = useState(false);
    const [title, setTitle] = useState(data.title);
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
            {editing ? (
                <div>
                    <input
                        className="input"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                    <div className="card-actions">
                        <button
                            className="icon-btn primary"
                            onClick={() => {
                                updateCard(id, { title });
                                setEditing(false);
                            }}
                        >
                            Guardar
                        </button>
                        <button
                            className="icon-btn"
                            onClick={() => setEditing(false)}
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            ) : (
                <div>
                    <h4 className="card-title">{data.title}</h4>
                    <div className="card-actions">
                        <button
                            className="text-button"
                            onClick={() => setEditing(true)}
                        >
                            Editar
                        </button>
                        <button
                            className="text-button"
                            onClick={() => removeCard(id)}
                        >
                            Eliminar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
