import React, { useState } from "react";
import Board from "./components/board";
import { useBoard } from "./store";

export default function App() {
    const { backgroundUrl, setBackground } = useBoard();
    const [menuOpen, setMenuOpen] = useState(false);

    function onChangeBackground() {
        const url = window.prompt("Background image URL:", backgroundUrl ?? "");
        if (url !== null) setBackground(url.trim() || undefined);
        setMenuOpen(false);
    }

    return (
        <div className="app">
            <header className="header">
                <span className="title">Viajero Kanban</span>
                <div style={{ marginLeft: "auto", position: "relative" }}>
                    <button className="icon-btn" onClick={() => setMenuOpen((o) => !o)} aria-label="Menu">
                        ?
                    </button>
                    {menuOpen && (
                        <div className="menu" style={{ position: "absolute", right: 0, top: "100%" }}>
                            <button className="text-button" onClick={onChangeBackground}>Change background</button>
                        </div>
                    )}
                </div>
            </header>
            <div
                className="content"
                style={{
                    backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : undefined,
                    backgroundSize: backgroundUrl ? "cover" : undefined,
                    backgroundRepeat: backgroundUrl ? "no-repeat" : undefined,
                    backgroundPosition: backgroundUrl ? "center" : undefined,
                    borderRadius: backgroundUrl ? undefined : undefined,
                }}
            >
                <Board />
            </div>
            <div className="footer">Estado persistido en localStorage</div>
        </div>
    );
}
