import React from "react";
import {
    DndContext,
    DragEndEvent,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import { useBoard } from "../store";
import { Column } from "./Column";

const Board: React.FC = () => {
    const { columnOrder, addColumn, moveCard } = useBoard();

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );

    function onDragEnd(e: DragEndEvent) {
        const { active, over } = e;
        if (!over) return;
        const cardId = String(active.id);
        const overId = String(over.id);
        // over.id es el id de la columna donde soltamos
        if (cardId && overId) {
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
