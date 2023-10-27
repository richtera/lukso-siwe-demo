import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import mkcert from "vite-plugin-mkcert";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    proxy: {
      "/.well-known": "http://localhost:3000",
      "/verify": "http://localhost:3000",
      "/exchange": "http://localhost:3000",
    },
    https: true,
  },
  define: {
    global: "globalThis",
  },
  resolve: {
    alias: {
      process: "process/browser",
      util: "util",
    },
  },
  plugins: [mkcert(), react()],
});
