import React, { useEffect, useRef, useMemo } from "react";
import {
    DndContext,
    DragEndEvent,
    DragOverEvent,
    DragMoveEvent,
    PointerSensor,
    pointerWithin,
    useSensor,
    useSensors,
    DragOverlay,
} from "@dnd-kit/core";
import {
    SortableContext,
    horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useBoard } from "./store";
import { Column } from "./components/column/column";

export default function App() {
    const { columnOrder, addColumn, moveCard, moveColumn } = useBoard();
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );

    const [activeColId, setActiveColId] = React.useState<string | null>(null);

    function onDragStart(e: any) {
        const a = e.active?.data?.current as any;
        if (a?.type === "column")
            setActiveColId(String(a.colId ?? e.active.id));
    }

    function onDragCancel() {
        setActiveColId(null);
    }

    function onDragOver(e: DragOverEvent) {
        const { active, over } = e;
        if (!over) return;
        const a = active.data?.current as any;
        const o = over.data?.current as any;
        if (a?.type === "card" && o?.type === "column") {
            const cardId = String(a.cardId ?? active.id);
            const overId = String(o.colId ?? over.id);
            if (cardId && overId) {
                moveCard(cardId, overId, Number.MAX_SAFE_INTEGER);
            }
        }
    }

    function onDragEnd(e: DragEndEvent) {
        const { active, over } = e;
        setActiveColId(null);
        if (!over) return;
        const a = active.data?.current as any;
        const o = over.data?.current as any;
        if (a?.type === "column" && o) {
            const activeId = String(
                a.colId ?? String(active.id).replace(/^col-/, "")
            );
            const overId = String(o.colId ?? over.id);
            if (activeId && overId && activeId !== overId) {
                const oldIndex = columnOrder.indexOf(activeId);
                const newIndex = columnOrder.indexOf(overId);
                if (oldIndex !== -1 && newIndex !== -1) {
                    moveColumn(
                        activeId,
                        overId,
                        oldIndex < newIndex ? "after" : "before"
                    );
                }
            }
            return;
        }
        if (a?.type === "card" && o?.type === "column") {
            const cardId = String(a.cardId ?? active.id);
            const overId = String(o.colId ?? over.id);
            if (cardId && overId)
                moveCard(cardId, overId, Number.MAX_SAFE_INTEGER);
        }
    }

    const activeColumn = useMemo(() => {
        if (!activeColId) return null;
        return <Column id={activeColId} index={0} />;
    }, [activeColId]);

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
                collisionDetection={pointerWithin}
                onDragStart={onDragStart}
                onDragCancel={onDragCancel}
                onDragOver={onDragOver}
                onDragEnd={onDragEnd}
            >
                <SortableContext
                    items={columnOrder}
                    strategy={horizontalListSortingStrategy}
                >
                    <div className="columns">
                        {columnOrder.map((cid) => (
                            <Column key={cid} id={cid} index={0} />
                        ))}
                    </div>
                </SortableContext>
                <DragOverlay adjustScale={false}>{activeColumn}</DragOverlay>
            </DndContext>
            <div className="footer">Estado persistido en localStorage</div>
        </div>
    );
}
