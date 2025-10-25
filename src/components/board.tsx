import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragMoveEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  pointerWithin as basePointerWithin,
  DroppableContainer,
} from "@dnd-kit/core";
import type { CollisionDetection, UniqueIdentifier } from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { useBoard } from "../store";
import { Column } from "./column/column";
import { OverlayRail } from "./column/overlay-rail";
import { CardItem } from "./card-item";

// Collision detection: prefer overlays only when dragging a column; otherwise use default
const smartCollision: CollisionDetection = (args) => {
  const activeType = args.active?.data?.current?.type as string | undefined;
  if (activeType === "column") {
    const overlays = args.droppableContainers.filter(
      (c: DroppableContainer) => c.data?.current?.type === "overlay"
    );
    const useSet = overlays.length ? overlays : args.droppableContainers;
    return basePointerWithin({ ...args, droppableContainers: useSet });
  }
  return basePointerWithin(args);
};

type ColShape = { id: string; title: string; cardIds: string[] };
type CardShape = { id: string; title: string; description?: string };

const Board: React.FC = () => {
  const { columnOrder, columns, cards, moveCard, moveColumn, addColumn } = useBoard();

  // Helper typed views to satisfy TS
  const cols = columns as Record<string, ColShape>;
  const cardsMap = cards as Record<string, CardShape>;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Track mouse X for the column half-threshold
  const mouseXRef = useRef<number>(0);
  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      mouseXRef.current = e.clientX;
    };
    const onMouseMove = (e: MouseEvent) => {
      mouseXRef.current = e.clientX;
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  function getHalfXFromOver(
    e: DragOverEvent | DragEndEvent | DragMoveEvent
  ): number | null {
    const over = e.over;
    if (!over) return null;
    const { left, width } = over.rect;
    return left + width / 2;
  }

  // Overlays state
  const [activeColId, setActiveColId] = useState<string | null>(null);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  function onDragStart(e: DragStartEvent) {
    const a = e.active.data.current as { type?: string; colId?: UniqueIdentifier; cardId?: UniqueIdentifier; columnId?: UniqueIdentifier };
    if (a?.type === "column") setActiveColId(String(a.colId ?? e.active.id));
    if (a?.type === "card") setActiveCardId(String(a.cardId ?? e.active.id));
    lastHoverRef.current = null;
  }

  function onDragCancel() {
    setActiveColId(null);
    setActiveCardId(null);
    lastHoverRef.current = null;
  }

  // Column reordering with overlays + half-threshold
  function reorderByHalfThreshold(e: DragMoveEvent | DragOverEvent | DragEndEvent) {
    const active = e.active;
    const over = e.over;
    if (!over) return;
    const a = active.data.current as { type?: string; colId?: UniqueIdentifier };
    const o = over.data?.current as { type?: string; index?: number } | undefined;
    if (!(a?.type === "column" && o?.type === "overlay")) return;

    const dragId = String(a.colId ?? active.id);
    const currentIndex = columnOrder.indexOf(dragId);
    if (!dragId || currentIndex === -1) return;

    const targetIndex =
      typeof o.index === "number" ? o.index : Number(String(over.id).replace(/^ov-/, ""));
    if (Number.isNaN(targetIndex) || targetIndex < 0) return;

    const half = getHalfXFromOver(e);
    const mouseX = mouseXRef.current;
    if (half == null || mouseX == null) return;

    if (targetIndex >= columnOrder.length) {
      if (currentIndex !== columnOrder.length - 1 && mouseX > half) {
        const lastId = columnOrder[columnOrder.length - 1];
        if (lastId) moveColumn(dragId, lastId, "after");
      }
      return;
    }

    const targetId = columnOrder[targetIndex];
    if (!targetId) return;

    if (currentIndex < targetIndex) {
      if (mouseX > half) moveColumn(dragId, targetId, "after");
    } else if (currentIndex > targetIndex) {
      if (mouseX < half) moveColumn(dragId, targetId, "before");
    }
  }

  function onDragMove(e: DragMoveEvent) {
    reorderByHalfThreshold(e);
  }

  // Keep last hover to avoid redundant moves
  const lastHoverRef = useRef<{ cardId: string; toColId: string; insertAt: number } | null>(null);

  function handleCardHover(e: DragOverEvent | DragMoveEvent) {
    const active = e.active;
    const over = e.over;
    if (!over || !active) return;

    const a = active.data.current as {
      type?: string;
      cardId?: UniqueIdentifier;
      columnId?: UniqueIdentifier;
    } | undefined;
    if (!a || a.type !== "card") return;

    const cardId = String(a.cardId ?? active.id);
    if (!cardId) return;

    const o = over.data?.current as {
      type?: string;
      cardId?: UniqueIdentifier;
      columnId?: UniqueIdentifier;
      index?: number;
      colId?: UniqueIdentifier;
    } | undefined;

    let toColId: string | undefined;
    let insertAt: number = Number.MAX_SAFE_INTEGER;

    if (o?.type === "card") {
      toColId = String(o.columnId ?? over.id);
      const targetCardId = String(o.cardId ?? over.id);
      if (!toColId || !targetCardId) return;
      const toCol = cols[toColId];
      if (!toCol) return;
      const targetIdx = toCol.cardIds.indexOf(targetCardId);
      insertAt = targetIdx >= 0 ? targetIdx : toCol.cardIds.length;

      // If moving within same column and the target index is after the current index,
      // removing the dragged card will shift indexes, so decrement insertAt by 1.
      const currentColEntry = (Object.values(cols) as ColShape[]).find((c) => c.cardIds.includes(cardId));
      const currentColId = currentColEntry?.id;
      const currentIndex = currentColEntry ? currentColEntry.cardIds.indexOf(cardId) : -1;
      if (currentColId === toColId && currentIndex >= 0 && insertAt > currentIndex) {
        insertAt = insertAt - 1;
      }
    } else if (o?.type === "column") {
      toColId = String(o.colId ?? over.id);
      insertAt = Number.MAX_SAFE_INTEGER;
    } else if (o?.type === "overlay") {
      const idx = Number(o.index ?? String(over.id).replace(/^ov-/, ""));
      const toIdx = Math.min(idx, columnOrder.length - 1);
      toColId = columnOrder[toIdx];
      insertAt = Number.MAX_SAFE_INTEGER;
    } else {
      return;
    }

    if (!toColId) return;

    const last = lastHoverRef.current;
    if (last && last.cardId === cardId && last.toColId === toColId && last.insertAt === insertAt) {
      return; // already moved to this position
    }

    // perform move so dragged element appears within target column while dragging
    moveCard(cardId, toColId, insertAt);
    lastHoverRef.current = { cardId, toColId, insertAt };
  }

  function onDragOver(e: DragOverEvent) {
    // Columns keep reordering on move via overlay; for cards, move on hover so they appear
    // in the destination column while dragging (enables visual reordering inside target column).
    try {
      handleCardHover(e);
    } catch (err) {
      // swallow errors during hover handling to avoid breaking DnD
      // console.error(err);
    }
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveColId(null);
    setActiveCardId(null);
    lastHoverRef.current = null;
    // Columns final placement if needed
    reorderByHalfThreshold(e);

    // Cards: move on drop (within or between columns)
    const a = e.active.data.current as {
      type?: string;
      cardId?: UniqueIdentifier;
      columnId?: UniqueIdentifier;
    } | undefined;
    const o = e.over?.data?.current as {
      type?: string;
      cardId?: UniqueIdentifier;
      columnId?: UniqueIdentifier;
      index?: number;
      colId?: UniqueIdentifier;
    } | undefined;

    if (!a || a.type !== "card" || !e.over) return;

    const cardId = String(a.cardId ?? e.active.id);
    if (!cardId) return;

    if (o?.type === "card") {
      // Insert before the target card within its column
      const toColId = String(o.columnId ?? e.over.id);
      const targetCardId = String(o.cardId ?? e.over.id);
      if (!toColId || !targetCardId) return;
      const targetIdx = cols[toColId].cardIds.indexOf(targetCardId);
      const insertAt = targetIdx >= 0 ? targetIdx : cols[toColId].cardIds.length;
      moveCard(cardId, toColId, insertAt);
      return;
    }

    if (o?.type === "column") {
      const toColId = String(o.colId ?? e.over.id);
      if (!toColId) return;
      moveCard(cardId, toColId, Number.MAX_SAFE_INTEGER);
      return;
    }

    if (o?.type === "overlay") {
      const idx = Number(o.index ?? String(e.over.id).replace(/^ov-/, ""));
      const toColId = columnOrder[Math.min(idx, columnOrder.length - 1)];
      if (toColId) moveCard(cardId, toColId, Number.MAX_SAFE_INTEGER);
      return;
    }
  }

  const activeColumn = useMemo(() => {
    if (!activeColId) return null;
    return <Column id={activeColId} index={0} />;
  }, [activeColId]);

  const activeCard = useMemo(() => {
    if (!activeCardId) return null;
    // find columnId for this card
    const colEntry = (Object.values(cols) as ColShape[]).find((c) => c.cardIds.includes(activeCardId!));
    const colId = colEntry?.id ?? ("" as string);
    const data = cardsMap[activeCardId];
    if (!data) return null;
    return <CardItem id={activeCardId} data={data} columnId={colId} />;
  }, [activeCardId, columns, cards]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={smartCollision}
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
          <button className="add-column" onClick={() => addColumn("Nueva columna")}>
            + Add column
          </button>
        </div>
      </SortableContext>
      <DragOverlay adjustScale={false}>{activeColumn ?? activeCard}</DragOverlay>
    </DndContext>
  );
};

export default Board;
