import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { useBoard } from "../../store";

const Segment: React.FC<{ index: number }> = ({ index }) => {
    const { setNodeRef } = useDroppable({
        id: `ov-${index}`,
        data: { type: "overlay", index },
    });
    return <div ref={setNodeRef} className="overlay-segment" />;
};

const Spacer: React.FC<{ index: number }> = ({ index }) => {
    const { setNodeRef } = useDroppable({
        id: `ov-${index}`,
        data: { type: "overlay", index },
    });
    return <div ref={setNodeRef} className="overlay-spacer" />;
};

export const OverlayRail: React.FC = () => {
    const { columnOrder } = useBoard();
    return (
        <div className="column-overlays">
            {columnOrder.map((_, i) => (
                <Segment key={`ov-seg-${i}`} index={i} />
            ))}
            <Spacer index={columnOrder.length} />
        </div>
    );
};
