import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import manifest from "./manifest.json";

export default defineConfig({
  base: "",
  plugins: [
    react(),
    tailwindcss(),
    crx({ manifest }),
    {
      name: "strip-crossorigin",
      enforce: "post",
      transformIndexHtml(html) {
        return html
          .replace(/ crossorigin/g, "")
          .replace(/<link rel="modulepreload"[^>]*>/g, "");
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    modulePreload: false,
    rollupOptions: {
      input: {
        blocked: "src/blocked/index.html",
      },
    },
  },
});
