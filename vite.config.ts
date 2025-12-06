import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "fs";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    https: {
      key: fs.readFileSync(path.resolve(__dirname, "cert/key.pem")),
      cert: fs.readFileSync(path.resolve(__dirname, "cert/cert.pem")),
    },
    host: true, // necessário para acessar pelo celular
    port: 5173,
  },
});
