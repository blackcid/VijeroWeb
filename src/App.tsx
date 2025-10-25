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
import { OverlayRail } from "./components/column/overlay-rail";

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

    function handleColumnReorderViaOverlay(
        e: DragMoveEvent | DragOverEvent | DragEndEvent
    ) {
        const { active, over } = e as any;
        if (!over) return;
        const a = active.data?.current as any;
        const o = over.data?.current as any;
        if (!(a?.type === "column" && o?.type === "overlay")) return;

        const dragId = String(
            a.colId ?? String(active.id).replace(/^col-/, "")
        );
        const overIndex = Number(
            o.index ?? String(over.id).replace(/^ov-/, "")
        );
        if (!dragId || Number.isNaN(overIndex)) return;

        const currentIndex = columnOrder.indexOf(dragId);
        if (currentIndex === -1) return;

        // overIndex points to the rail segment boundary: place before index for left boundary,
        // for rightmost spacer, place after the last column
        if (overIndex >= columnOrder.length) {
            const lastId = columnOrder[columnOrder.length - 1];
            if (dragId !== lastId) moveColumn(dragId, lastId, "after");
            return;
        }

        const targetId = columnOrder[overIndex];
        if (!targetId) return;

        if (currentIndex < overIndex) {
            // moving right: only after crossing into segment overIndex
            moveColumn(dragId, targetId, "after");
        } else if (currentIndex > overIndex) {
            // moving left: place before segment overIndex
            moveColumn(dragId, targetId, "before");
        }
    }

    function onDragMove(e: DragMoveEvent) {
        handleColumnReorderViaOverlay(e);
    }

    function onDragOver(e: DragOverEvent) {
        handleColumnReorderViaOverlay(e);
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
        setActiveColId(null);
        handleColumnReorderViaOverlay(e);
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
                        <OverlayRail />
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
