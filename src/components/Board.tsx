import React, { useEffect, useRef } from "react";
import {
    DndContext,
    DragEndEvent,
    DragOverEvent,
    PointerSensor,
    pointerWithin,
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

    // Posición X del ratón para el umbral de mitad
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

    function getOverHalfX(e: DragOverEvent | DragEndEvent): number | null {
        const over: any = e.over as any;
        if (!over?.rect) return null;
        const { left, width } = over.rect as any; // client coords
        if (left == null || width == null) return null;
        return left + width / 2;
    }

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
            if (dragId && overId && dragId !== overId) {
                const dragIndex = columnOrder.indexOf(dragId);
                const overIndex = columnOrder.indexOf(overId);
                if (dragIndex === -1 || overIndex === -1) return;

                const mouseX = mouseXRef.current; // cursor
                const overHalfX = getOverHalfX(e); // mitad de la columna destino
                if (mouseX == null || overHalfX == null) return;

                if (dragIndex < overIndex && mouseX > overHalfX) {
                    moveColumn(dragId, overId, "after");
                } else if (dragIndex > overIndex && mouseX < overHalfX) {
                    moveColumn(dragId, overId, "before");
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
            if (dragId && overId) {
                const dragIndex = columnOrder.indexOf(dragId);
                const overIndex = columnOrder.indexOf(overId);
                if (dragIndex === -1 || overIndex === -1) return;
                const place = dragIndex < overIndex ? "after" : "before";
                moveColumn(dragId, overId, place);
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
                collisionDetection={pointerWithin}
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
