import React, { useEffect, useRef } from "react";
import {
    DndContext,
    DragEndEvent,
    DragOverEvent,
    DragMoveEvent,
    PointerSensor,
    pointerWithin,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import { useBoard } from "./store";
import { Column } from "./components/Column";

const LOG_PREFIX = "[KANBAN-DND]";

/* En esta versión, la lógica de reordenación por el movimiento del ratón (reorderColumnsByMouse) se evalúa continuamente
   mientras se mueve el ratón, no sólo cuando cambia el "over" o en el drop. Esto se logra añadiendo el evento onDragMove
   que reutiliza la misma función de umbral.
*/

export default function App() {
    const { columnOrder, addColumn, moveCard, moveColumn } = useBoard();
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );

    // Posición X del ratón (cliente) para umbral de mitad
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

    function getOverHalfX(
        e: DragOverEvent | DragEndEvent | DragMoveEvent
    ): number | null {
        const over: any = (e as any).over as any;
        if (!over?.rect) return null;
        const { left, width } = over.rect as any; // coordenadas cliente
        if (left == null || width == null) return null;
        return left + width / 2;
    }

    function reorderColumnsByMouse(
        e: DragOverEvent | DragEndEvent | DragMoveEvent,
        phase: "hover" | "drop" | "move"
    ) {
        const { active, over } = e as any;
        if (!over) return;
        const a = active.data?.current as any;
        const o = over.data?.current as any;
        if (!(a?.type === "column" && o?.type === "column")) return;

        const dragId = String(
            a.colId ?? String(active.id).replace(/^col-/, "")
        );
        const overId = String(o.colId ?? over.id);
        if (!dragId || !overId || dragId === overId) {
            console.log(LOG_PREFIX, phase, "skip (ids)", { dragId, overId });
            return;
        }

        const dragIndex = columnOrder.indexOf(dragId);
        const overIndex = columnOrder.indexOf(overId);
        if (dragIndex === -1 || overIndex === -1) {
            console.log(LOG_PREFIX, phase, "skip (index)", {
                dragIndex,
                overIndex,
            });
            return;
        }

        const mouseX = mouseXRef.current;
        const half = getOverHalfX(e);
        console.log(LOG_PREFIX, phase, {
            dragId,
            overId,
            dragIndex,
            overIndex,
            mouseX,
            overHalfX: half,
        });
        if (mouseX == null || half == null) return;

        if (dragIndex < overIndex && mouseX > half) {
            console.log(LOG_PREFIX, phase, "move after", { dragId, overId });
            moveColumn(dragId, overId, "after");
        } else if (dragIndex > overIndex && mouseX < half) {
            console.log(LOG_PREFIX, phase, "move before", { dragId, overId });
            moveColumn(dragId, overId, "before");
        } else {
            console.log(LOG_PREFIX, phase, "no-move (threshold not crossed)");
        }
    }

    function onDragMove(e: DragMoveEvent) {
        reorderColumnsByMouse(e, "move");
    }

    function onDragOver(e: DragOverEvent) {
        const { active, over } = e;
        if (!over) return;
        const a = active.data?.current as any;
        const o = over.data?.current as any;

        // Reordenar columnas SOLO cuando el RATÓN cruza la mitad de la columna destino
        if (a?.type === "column" && o?.type === "column") {
            reorderColumnsByMouse(e, "hover");
            return;
        }

        // Mover tarjeta en caliente al pasar por encima de una columna
        if (a?.type === "card" && o?.type === "column") {
            const cardId = String(a.cardId ?? active.id);
            const overId = String(o.colId ?? over.id);
            if (cardId && overId) {
                console.log(LOG_PREFIX, "hover card->col", { cardId, overId });
                moveCard(cardId, overId, Number.MAX_SAFE_INTEGER);
            }
        }
    }

    function onDragEnd(e: DragEndEvent) {
        const { active, over } = e;
        if (!over) return;

        const a = active.data?.current as any;
        const o = over.data?.current as any;

        if (a?.type === "column" && o?.type === "column") {
            // Misma lógica que en onDragOver para consistencia
            reorderColumnsByMouse(e, "drop");
            return;
        }

        if (a?.type === "card" && o?.type === "column") {
            const cardId = String(a.cardId ?? active.id);
            const overId = String(o.colId ?? over.id);
            if (cardId && overId) {
                console.log(LOG_PREFIX, "drop card->col", { cardId, overId });
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
                collisionDetection={pointerWithin}
                onDragMove={onDragMove}
                onDragOver={onDragOver}
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
