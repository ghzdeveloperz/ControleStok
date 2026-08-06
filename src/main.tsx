import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { AppProviders } from "./app/providers/AppProviders";
import "./index.css";
import "./design_system/theme/global.css";

const root = document.getElementById("root");
if (!root) throw new Error("Elemento raiz da aplicação não encontrado.");

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </React.StrictMode>,
);
