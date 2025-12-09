// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import DevFixBarcode from "./DevFixBarcode"; // ⬅️ IMPORTA AQUI
import { LoadingProvider } from "./contexts/LoadingContext";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <LoadingProvider>
      <BrowserRouter>

        <App />
      </BrowserRouter>
    </LoadingProvider>
  </React.StrictMode>
);
