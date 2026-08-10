import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    // three is intentionally a large, separately-cached chunk that loads only
    // behind the lazy Scene3D import - not part of the entry bundle.
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: { three: ["three"] },
      },
    },
  },
});
