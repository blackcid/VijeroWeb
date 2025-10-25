import React, { useState } from "react";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import { useBoard } from "../../store";
import type { Id } from "../../types";
import { ColumnContent } from "./column-content";

interface Props {
    id: Id;
    index: number;
}

export const Column: React.FC<Props> = ({ id }) => {
    const { columns, renameColumn, removeColumn } = useBoard();
    const col = columns[id];
    const [title, setTitle] = useState(col.title);

    // Draggable column with a drag handle on the header
    const {
        setNodeRef: setDragRef,
        attributes: dragAttrs,
        listeners: dragListeners,
        transform: dragTransform,
        isDragging: colDragging,
    } = useDraggable({ id: `col-${id}`, data: { type: "column", colId: id } });

    // Droppable container; disabled while this column is being dragged
    const { setNodeRef: setDropRef } = useDroppable({
        id,
        data: { type: "column", colId: id },
        disabled: colDragging,
    });

    // Merge refs onto the outer full-height container
    const mergedRef = (el: HTMLElement | null) => {
        setDropRef(el);
        setDragRef(el as any);
    };

    const dragStyle: React.CSSProperties = dragTransform
        ? {
              transform: `translate3d(${dragTransform.x}px, ${dragTransform.y}px, 0)`,
          }
        : undefined;

    return (
        <div
            className="column-container"
            ref={mergedRef}
            style={{
                ...(dragStyle || {}),
                ...(colDragging ? { opacity: 0.6 } : {}),
                height: "100%", // ensure the hit area spans full vertical space
            }}
        >
            <div className="column">
                <header
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
                <ColumnContent id={id} />
            </div>
        </div>
    );
};
