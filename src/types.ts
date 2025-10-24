export type Id = string;

export interface Card {
    id: Id;
    title: string;
    description?: string;
}

export interface Column {
    id: Id;
    title: string;
    cardIds: Id[];
}

export interface BoardState {
    columns: Record<Id, Column>;
    cards: Record<Id, Card>;
    columnOrder: Id[];
}
