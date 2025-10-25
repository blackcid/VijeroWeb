import React, { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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

    const {
        setNodeRef,
        attributes,
        listeners,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id,
        data: { type: "column", colId: id },
    });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            className={`column${isDragging ? " is-dragging" : ""}`}
            ref={setNodeRef}
            style={style}
        >
            <header {...listeners} {...attributes}>
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
    );
};
