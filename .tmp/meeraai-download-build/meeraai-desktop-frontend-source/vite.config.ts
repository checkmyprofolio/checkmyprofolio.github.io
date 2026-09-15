import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return undefined;
          }

          if (id.includes("react-syntax-highlighter") || id.includes("refractor") || id.includes("prism")) {
            return "syntax";
          }

          if (id.includes("react-markdown") || id.includes("remark-gfm") || id.includes("mdast") || id.includes("micromark") || id.includes("unist")) {
            return "markdown";
          }

          if (id.includes("framer-motion")) {
            return "motion";
          }

          if (id.includes("react") || id.includes("scheduler")) {
            return "react-vendor";
          }

          return undefined;
        },
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
