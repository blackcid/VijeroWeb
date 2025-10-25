import { createRoot } from "react-dom/client";
import App from "./app";
import "./styles.scss";

const rootEl = document.getElementById("root")!;
createRoot(rootEl).render(<App />);
