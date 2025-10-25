import React, { useEffect, useMemo, useRef } from "react";
import {
    DndContext,
    DragEndEvent,
    DragOverEvent,
    DragMoveEvent,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    pointerWithin as basePointerWithin,
} from "@dnd-kit/core";
import type { CollisionDetection } from "@dnd-kit/core";
import {
    SortableContext,
    horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useBoard } from "../store";
import { Column } from "./column/column";
import { OverlayRail } from "./column/overlay-rail";

// Collision detection that prefers overlay droppables when present
const overlayFirst: CollisionDetection = (args) => {
    const overlays = args.droppableContainers.filter(
        (c) => (c.data as any)?.current?.type === "overlay"
    );
    const useSet = overlays.length ? overlays : args.droppableContainers;
    return basePointerWithin({ ...args, droppableContainers: useSet });
};

const Board: React.FC = () => {
    const { columnOrder, moveCard, moveColumn, addColumn } = useBoard();

    // Sensors
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
        window.addEventListener("pointermove", onMove as any, {
            passive: true,
        });
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

    // Active column overlay
    const [activeColId, setActiveColId] = React.useState<string | null>(null);

    function onDragStart(e: any) {
        const a = e.active?.data?.current as any;
        if (a?.type === "column")
            setActiveColId(String(a.colId ?? e.active.id));
    }

    function onDragCancel() {
        setActiveColId(null);
    }

    // Reorder using overlays + half-threshold only when over overlay
    function reorderByHalfThreshold(
        e: DragMoveEvent | DragOverEvent | DragEndEvent
    ) {
        const { active, over } = e as any;
        if (!over) return;
        const a = active.data?.current as any;
        const o = over.data?.current as any;
        if (!(a?.type === "column" && o?.type === "overlay")) return; // only overlays trigger reorder

        const dragId = String(
            a.colId ?? String(active.id).replace(/^col-/, "")
        );
        const currentIndex = columnOrder.indexOf(dragId);
        if (!dragId || currentIndex === -1) return;

        const targetIndex = Number(
            o.index ?? String(over.id).replace(/^ov-/, "")
        );
        if (Number.isNaN(targetIndex) || targetIndex < 0) return;

        const half = getHalfXFromOver(e);
        const mouseX = mouseXRef.current;
        if (half == null || mouseX == null) return;

        if (targetIndex >= columnOrder.length) {
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
            if (cardId && overId)
                moveCard(cardId, overId, Number.MAX_SAFE_INTEGER);
        }
    }

    function onDragEnd(e: DragEndEvent) {
        setActiveColId(null);
        reorderByHalfThreshold(e);
    }

    const activeColumn = useMemo(() => {
        if (!activeColId) return null;
        return <Column id={activeColId} index={0} />;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeColId]);

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={overlayFirst}
            onDragStart={onDragStart}
            onDragCancel={onDragCancel}
            onDragMove={onDragMove}
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
                    <button
                        className="add-column"
                        onClick={() => addColumn("Nueva columna")}
                    >
                        + Add column
                    </button>
                </div>
            </SortableContext>
            <DragOverlay adjustScale={false}>{activeColumn}</DragOverlay>
        </DndContext>
    );
};

export default Board;
