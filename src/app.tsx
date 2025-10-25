import React from "react";
import { useBoard } from "./store";
import Board from "./components/board";

export default function App() {
    const { addColumn } = useBoard();
    return (
        <div className="app">
            <header className="header">
                <span className="title">Viajero Kanban</span>
                <button className="icon-btn primary" onClick={() => addColumn("Nueva columna")}>
                    Nueva columna
                </button>
            </header>
            <Board />
            <div className="footer">Estado persistido en localStorage</div>
        </div>
    );
}
