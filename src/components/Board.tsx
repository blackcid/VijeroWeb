import React from "react";
import {
    DndContext,
    DragEndEvent,
    DragOverEvent,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import { useBoard } from "../store";
import { Column } from "./Column";

const Board: React.FC = () => {
    const { columnOrder, addColumn, moveCard, moveColumn } = useBoard();

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );

    function onDragOver(e: DragOverEvent) {
        const { active, over } = e;
        if (!over) return;
        const a = active.data?.current as any;
        const o = over.data?.current as any;

        if (a?.type === "column" && o?.type === "column") {
            const dragId = String(
                a.colId ?? String(active.id).replace(/^col-/, "")
            );
            const overId = String(o.colId ?? over.id);
            if (dragId && overId && dragId !== overId)
                moveColumn(dragId, overId);
            return;
        }

        if (a?.type === "card" && o?.type === "column") {
            const cardId = String(a.cardId ?? active.id);
            const overId = String(o.colId ?? over.id);
            if (cardId && overId)
                moveCard(cardId, overId, Number.MAX_SAFE_INTEGER);
        }
    }

    function onDragEnd(e: DragEndEvent) {
        const { active, over } = e;
        if (!over) return;
        const a = active.data?.current as any;
        const o = over.data?.current as any;

        if (a?.type === "column" && o?.type === "column") {
            const dragId = String(
                a.colId ?? String(active.id).replace(/^col-/, "")
            );
            const overId = String(o.colId ?? over.id);
            if (dragId && overId) moveColumn(dragId, overId);
            return;
        }

        if (a?.type === "card" && o?.type === "column") {
            const cardId = String(a.cardId ?? active.id);
            const overId = String(o.colId ?? over.id);
            if (cardId && overId)
                moveCard(cardId, overId, Number.MAX_SAFE_INTEGER);
        }
    }

    return (
        <div className="board">
            <div className="board-toolbar">
                <button
                    className="icon-btn primary"
                    onClick={() => addColumn("Nueva columna")}
                >
                    Nueva columna
                </button>
            </div>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragOver={onDragOver}
                onDragEnd={onDragEnd}
            >
                <div className="columns">
                    {columnOrder.map((cid) => (
                        <Column key={cid} id={cid} index={0} />
                    ))}
                </div>
            </DndContext>
        </div>
    );
};

export default Board;
