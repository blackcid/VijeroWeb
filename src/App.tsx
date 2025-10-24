import React from "react";
import {
    DndContext,
    DragEndEvent,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import { useBoard } from "./store";
import { Column } from "./components/Column";

export default function App() {
    const { columnOrder, addColumn, moveCard } = useBoard();
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );

    function onDragEnd(e: DragEndEvent) {
        const { active, over } = e;
        if (!over) return;
        const cardId = String(active.id);
        const overId = String(over.id);
        // over.id is column id where we drop
        if (cardId && overId) {
            moveCard(cardId, overId, Number.MAX_SAFE_INTEGER);
        }
    }

    return (
        <div className="app">
            <header className="header">
                <span className="title">Viajero Kanban</span>
                <button
                    className="icon-btn primary"
                    onClick={() => addColumn("Nueva columna")}
                >
                    Nueva columna
                </button>
            </header>
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
            <div className="footer">Estado persistido en localStorage</div>
        </div>
    );
}
