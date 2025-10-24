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
    const { columnOrder, addColumn, moveCard, moveColumn } = useBoard();
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );

    function onDragEnd(e: DragEndEvent) {
        const { active, over } = e;
        if (!over) return;

        const a = active.data?.current as any;
        const o = over.data?.current as any;

        // Reordenar columnas si se arrastra una columna sobre otra
        if (a?.type === "column" && o?.type === "column") {
            const dragId = String(
                a.colId ?? String(active.id).replace(/^col-/, "")
            );
            const overId = String(o.colId ?? over.id);
            if (dragId && overId) moveColumn(dragId, overId);
            return;
        }

        // Mover tarjeta entre columnas
        if (a?.type === "card" && o?.type === "column") {
            const cardId = String(a.cardId ?? active.id);
            const overId = String(o.colId ?? over.id);
            if (cardId && overId) {
                moveCard(cardId, overId, Number.MAX_SAFE_INTEGER);
            }
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
