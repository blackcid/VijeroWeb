import React, { useEffect, useState } from "react";
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

    // Apply background to the whole window (body)
    useEffect(() => {
        if (backgroundUrl) {
            document.body.style.backgroundImage = `url(${backgroundUrl})`;
            document.body.style.backgroundSize = "cover";
            document.body.style.backgroundRepeat = "no-repeat";
            document.body.style.backgroundPosition = "center";
        } else {
            document.body.style.backgroundImage = "";
            document.body.style.backgroundSize = "";
            document.body.style.backgroundRepeat = "";
            document.body.style.backgroundPosition = "";
        }
        return () => {
            // cleanup if component unmounts
            document.body.style.backgroundImage = "";
            document.body.style.backgroundSize = "";
            document.body.style.backgroundRepeat = "";
            document.body.style.backgroundPosition = "";
        };
    }, [backgroundUrl]);

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
            <div className="content">
                <Board />
            </div>
            <div className="footer">Estado persistido en localStorage</div>
        </div>
    );
}
