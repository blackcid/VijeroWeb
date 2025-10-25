import React, { useState } from "react";
import { useBoard } from "../../store";
import type { Id } from "../../types";
import { CardItem } from "../card-item";

interface Props {
    id: Id;
}

// Renders the column content: card list and add-card form
export const ColumnContent: React.FC<Props> = ({ id }) => {
    const { columns, cards, addCard } = useBoard();
    const col = columns[id];
    const [adding, setAdding] = useState(false);

    return (
        <>
            <div className="list">
                {col.cardIds.map((cid) => (
                    <CardItem
                        key={cid}
                        id={cid}
                        data={cards[cid]}
                        columnId={id}
                    />
                ))}
            </div>
            {adding ? (
                <AddCardForm
                    onCancel={() => setAdding(false)}
                    onAdd={(t) => {
                        addCard(id, t);
                        setAdding(false);
                    }}
                />
            ) : (
                <div className="add-card">
                    <button
                        className="text-button"
                        onClick={() => setAdding(true)}
                    >
                        + Add card
                    </button>
                </div>
            )}
        </>
    );
};

const AddCardForm: React.FC<{
    onAdd: (title: string) => void;
    onCancel: () => void;
}> = ({ onAdd, onCancel }) => {
    const [t, setT] = useState("");
    return (
        <div className="add-card">
            <input
                className="input"
                placeholder="Card title"
                value={t}
                onChange={(e) => setT(e.target.value)}
            />
            <button
                className="icon-btn primary"
                onClick={() => t.trim() && onAdd(t.trim())}
            >
                Add
            </button>
            <button className="icon-btn" onClick={onCancel}>
                Cancel
            </button>
        </div>
    );
};
