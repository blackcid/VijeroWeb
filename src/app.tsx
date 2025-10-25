import React from "react";
import Board from "./components/board";

export default function App() {
    return (
        <div className="app">
            <header className="header">
                <span className="title">Viajero Kanban</span>
            </header>
            <div className="content">
                <Board />
            </div>
            <div className="footer">Estado persistido en localStorage</div>
        </div>
    );
}
