import React, { useEffect, useMemo, useRef } from "react";
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

    // Track mouse X for half-threshold comparisons
    const mouseXRef = useRef<number>(0);
    useEffect(() => {
        const onMove = (e: PointerEvent | MouseEvent) => {
            mouseXRef.current =
                (e as PointerEvent).clientX ?? (e as MouseEvent).clientX;
        };
        window.addEventListener("pointermove", onMove as any, { passive: true });
        window.addEventListener("mousemove", onMove as any, { passive: true });
        return () => {
            window.removeEventListener("pointermove", onMove as any);
            window.removeEventListener("mousemove", onMove as any);
        };
    }, []);

    function getHalfXFromOver(
        e: DragOverEvent | DragEndEvent | DragMoveEvent
    ): number | null {
        const over: any = (e as any).over as any;
        if (!over?.rect) return null;
        const { left, width } = over.rect as any; // client coords
        if (left == null || width == null) return null;
        return left + width / 2;
    }

    const [activeColId, setActiveColId] = React.useState<string | null>(null);

    function onDragStart(e: any) {
        const a = e.active?.data?.current as any;
        if (a?.type === "column") setActiveColId(String(a.colId ?? e.active.id));
    }

    function onDragCancel() {
        setActiveColId(null);
    }

    function reorderByHalfThreshold(
        e: DragMoveEvent | DragOverEvent | DragEndEvent
    ) {
        const { active, over } = e as any;
        if (!over) return;
        const a = active.data?.current as any;
        const o = over.data?.current as any;
        // Accept overlay or column as target; prefer overlay semantics
        const isOverlay = o?.type === "overlay";
        const isColumnTarget = o?.type === "column";
        if (!(a?.type === "column" && (isOverlay || isColumnTarget))) return;

        const dragId = String(a.colId ?? String(active.id).replace(/^col-/, ""));
        const currentIndex = columnOrder.indexOf(dragId);
        if (!dragId || currentIndex === -1) return;

        // Determine target index and half from the "over"
        let targetIndex: number;
        if (isOverlay) {
            targetIndex = Number(o.index ?? String(over.id).replace(/^ov-/, ""));
        } else {
            // column target: map to its index
            const overId = String(o.colId ?? over.id);
            targetIndex = columnOrder.indexOf(overId);
        }
        if (Number.isNaN(targetIndex) || targetIndex < 0) return;

        const half = getHalfXFromOver(e);
        const mouseX = mouseXRef.current;
        if (half == null || mouseX == null) return;

        if (isOverlay && targetIndex >= columnOrder.length) {
            // Spacer overlay at the end: move to last only after crossing its half
            if (currentIndex !== columnOrder.length - 1 && mouseX > half) {
                const lastId = columnOrder[columnOrder.length - 1];
                if (lastId) moveColumn(dragId, lastId, "after");
            }
            return;
        }

        const targetId = columnOrder[targetIndex];
        if (!targetId) return;

        if (currentIndex < targetIndex) {
            // Moving right: only after cursor crosses target half
            if (mouseX > half) moveColumn(dragId, targetId, "after");
        } else if (currentIndex > targetIndex) {
            // Moving left: only before target half
            if (mouseX < half) moveColumn(dragId, targetId, "before");
        }
    }

    function onDragMove(e: DragMoveEvent) {
        reorderByHalfThreshold(e);
    }

    function onDragOver(e: DragOverEvent) {
        reorderByHalfThreshold(e);
        const { active, over } = e;
        if (!over) return;
        const a = active.data?.current as any;
        const o = over.data?.current as any;
        if (a?.type === "card" && o?.type === "column") {
            const cardId = String(a.cardId ?? active.id);
            const overId = String(o.colId ?? over.id);
            if (cardId && overId) moveCard(cardId, overId, Number.MAX_SAFE_INTEGER);
        }
    }

    function onDragEnd(e: DragEndEvent) {
        setActiveColId(null);
        reorderByHalfThreshold(e);
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
                onDragMove={onDragMove}
                onDragOver={onDragOver}
                onDragEnd={onDragEnd}
            >
                <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
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
