import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const localKeyPath = path.resolve(__dirname, "cert/key.pem");
const localCertPath = path.resolve(__dirname, "cert/cert.pem");
const hasLocalCertificate =
  fs.existsSync(localKeyPath) && fs.existsSync(localCertPath);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    https: hasLocalCertificate
      ? {
          key: fs.readFileSync(localKeyPath),
          cert: fs.readFileSync(localCertPath),
        }
      : undefined,
  },
});
