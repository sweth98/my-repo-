import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    // Source maps ship your original TypeScript to anyone who opens DevTools.
    // Off for production builds; nginx also refuses to serve .map files.
    sourcemap: false,
  },
  server: {
    // `npm run dev` only. Forwards /api to the API container so the browser
    // still sees one origin - the same shape as production, which means
    // SameSite=Strict cookies behave identically in dev and in Docker.
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3000",
        changeOrigin: false,
      },
    },
  },
});
