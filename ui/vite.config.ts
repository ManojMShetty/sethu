import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "./",
  server: {
    host: "0.0.0.0",
    port: 5173,
    // The workspace serves this through its own ports subdomain, and Vite
    // refuses unrecognised Host headers by default. Name that domain
    // rather than switching the check off.
    allowedHosts: [".hebbale.academy"],
    // server.py owns the rules. In development the UI runs on its own
    // port and everything under /api is handed straight to it, so there
    // is no CORS to configure and no second base URL to keep in sync.
    proxy: { "/api": "http://127.0.0.1:8000" }
  },
  // A single JS file and a single CSS file: easier to serve from
  // server.py, and one less thing to go wrong on a projector.
  build: { assetsInlineLimit: 100000000, cssCodeSplit: false }
});
