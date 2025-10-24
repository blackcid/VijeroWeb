import { create, StateCreator } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import type { BoardState, Card, Column, Id } from "./types";

interface BoardStore extends BoardState {
    addColumn: (title: string) => void;
    renameColumn: (id: Id, title: string) => void;
    removeColumn: (id: Id) => void;
    addCard: (columnId: Id, title: string) => void;
    updateCard: (id: Id, patch: Partial<Card>) => void;
    removeCard: (id: Id) => void;
    moveCard: (cardId: Id, toColumnId: Id, index: number) => void;
    moveColumn: (dragId: Id, overId: Id) => void;
}

const initial = (): BoardState => {
    const c1: Column = { id: nanoid(6), title: "Por hacer", cardIds: [] };
    const c2: Column = { id: nanoid(6), title: "En progreso", cardIds: [] };
    const c3: Column = { id: nanoid(6), title: "Hecho", cardIds: [] };
    const t1: Card = { id: nanoid(8), title: "Configurar proyecto" };
    const t2: Card = { id: nanoid(8), title: "Diseñar columnas" };
    c1.cardIds.push(t1.id, t2.id);
    return {
        columns: { [c1.id]: c1, [c2.id]: c2, [c3.id]: c3 },
        cards: { [t1.id]: t1, [t2.id]: t2 },
        columnOrder: [c1.id, c2.id, c3.id],
    };
};

const creator: StateCreator<BoardStore> = (set, get) => ({
    ...initial(),
    addColumn: (title: string) =>
        set((s) => {
            const id = nanoid(6);
            const newColumns = {
                ...s.columns,
                [id]: { id, title, cardIds: [] },
            } as Record<Id, Column>;
            const newOrder = [...s.columnOrder, id];
            return { ...s, columns: newColumns, columnOrder: newOrder };
        }),
    renameColumn: (id: Id, title: string) =>
        set((s) => ({
            columns: { ...s.columns, [id]: { ...s.columns[id], title } },
        })),
    removeColumn: (id: Id) =>
        set((s) => {
            const col = s.columns[id];
            const { [id]: _removed, ...restCols } = s.columns;
            const newCards = { ...s.cards } as Record<Id, Card>;
            if (col) col.cardIds.forEach((cid: Id) => delete newCards[cid]);
            return {
                columns: restCols,
                cards: newCards,
                columnOrder: s.columnOrder.filter((x: Id) => x !== id),
            };
        }),
    addCard: (columnId: Id, title: string) =>
        set((s) => {
            const id = nanoid(8);
            const card: Card = { id, title };
            const col = s.columns[columnId];
            return {
                cards: { ...s.cards, [id]: card },
                columns: {
                    ...s.columns,
                    [columnId]: { ...col, cardIds: [...col.cardIds, id] },
                },
            };
        }),
    updateCard: (id: Id, patch: Partial<Card>) =>
        set((s) => ({
            cards: { ...s.cards, [id]: { ...s.cards[id], ...patch } },
        })),
    removeCard: (id: Id) =>
        set((s) => {
            const { [id]: _rm, ...restCards } = s.cards;
            const newCols: Record<Id, Column> = Object.fromEntries(
                Object.entries(s.columns).map(([cid, col]) => {
                    const c = col as Column;
                    return [
                        cid as Id,
                        {
                            ...c,
                            cardIds: c.cardIds.filter((x: Id) => x !== id),
                        },
                    ];
                })
            ) as Record<Id, Column>;
            return { cards: restCards, columns: newCols };
        }),
    moveCard: (cardId: Id, toColumnId: Id, index: number) =>
        set((s) => {
            const fromEntry = Object.values(s.columns).find((c) =>
                (c as Column).cardIds.includes(cardId)
            ) as Column | undefined;
            if (!fromEntry) return s;
            const fromId = fromEntry.id;
            const from = s.columns[fromId];
            const to = s.columns[toColumnId];
            const fromIds = from.cardIds.filter((x: Id) => x !== cardId);
            const toIds = [...to.cardIds];
            const clamped = Math.max(0, Math.min(index, toIds.length));
            toIds.splice(clamped, 0, cardId);
            return {
                columns: {
                    ...s.columns,
                    [fromId]: { ...from, cardIds: fromIds },
                    [toColumnId]: { ...to, cardIds: toIds },
                },
            };
        }),
    moveColumn: (dragId: Id, overId: Id) =>
        set((s) => {
            if (dragId === overId) return s;
            const order = s.columnOrder.filter((x) => x !== dragId);
            const overIndex = order.indexOf(overId);
            const insertAt = overIndex === -1 ? order.length : overIndex + 1; // insertar DESPUÉS de la columna objetivo
            order.splice(insertAt, 0, dragId);
            return { ...s, columnOrder: order };
        }),
});

export const useBoard = create<BoardStore>()(
    persist(creator, { name: "vijero-kanban" })
);
