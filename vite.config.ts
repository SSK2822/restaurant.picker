import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/SSK2822/",
  plugins: [react()],
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
