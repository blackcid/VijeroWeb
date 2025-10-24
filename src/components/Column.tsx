import React, { useState } from "react";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import { useBoard } from "../store";
import type { Id } from "../types";
import { CardItem } from "./CardItem";

interface Props {
    id: Id;
    index: number;
}

export const Column: React.FC<Props> = ({ id }) => {
    const { columns, cards, addCard, renameColumn, removeColumn } = useBoard();
    const col = columns[id];
    const [adding, setAdding] = useState(false);
    const [title, setTitle] = useState(col.title);

    const { setNodeRef, isOver } = useDroppable({
        id,
        data: { type: "column" },
    });

    // draggable completo de la columna (usamos un handle para mover)
    const {
        setNodeRef: setDragRef,
        attributes: dragAttrs,
        listeners: dragListeners,
        transform: dragTransform,
        isDragging: colDragging,
    } = useDraggable({ id: `col-${id}`, data: { type: "column", colId: id } });

    const dragStyle: React.CSSProperties = dragTransform
        ? {
              transform: `translate3d(${dragTransform.x}px, ${dragTransform.y}px, 0)`,
          }
        : undefined;

    return (
        <div
            className="column"
            ref={setNodeRef}
            style={{
                ...(isOver
                    ? { outline: "2px dashed var(--primary)" }
                    : undefined),
                ...(dragStyle || {}),
                ...(colDragging ? { opacity: 0.6 } : {}),
            }}
        >
            <header
                ref={setDragRef}
                {...dragListeners}
                {...dragAttrs}
                style={{ cursor: "grab" }}
            >
                <input
                    className="input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={() => renameColumn(id, title)}
                />
                <button
                    className="text-button"
                    onClick={() => removeColumn(id)}
                >
                    ✕
                </button>
            </header>
            <div className="list">
                {col.cardIds.map((cid) => (
                    <CardItem
                        key={cid}
                        id={cid}
                        data={cards[cid]}
                        columnId={id}
                    />
                ))}
            </div>
            {adding ? (
                <AddCardForm
                    onCancel={() => setAdding(false)}
                    onAdd={(t) => {
                        addCard(id, t);
                        setAdding(false);
                    }}
                />
            ) : (
                <div className="add-card">
                    <button
                        className="text-button"
                        onClick={() => setAdding(true)}
                    >
                        + Añadir tarjeta
                    </button>
                </div>
            )}
        </div>
    );
};

const AddCardForm: React.FC<{
    onAdd: (title: string) => void;
    onCancel: () => void;
}> = ({ onAdd, onCancel }) => {
    const [t, setT] = useState("");
    return (
        <div className="add-card">
            <input
                className="input"
                placeholder="Título de la tarjeta"
                value={t}
                onChange={(e) => setT(e.target.value)}
            />
            <button
                className="icon-btn primary"
                onClick={() => t.trim() && onAdd(t.trim())}
            >
                Añadir
            </button>
            <button className="icon-btn" onClick={onCancel}>
                Cancelar
            </button>
        </div>
    );
};
