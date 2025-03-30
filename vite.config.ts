import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  },
  publicDir: 'public'
});

// build: {
//   rollupOptions: {
//     external: ['dotenv', 'path', 'os', 'crypto', './api/*'], // Mark Node.js modules and `api` folder as external
//   },
// },
// server: {
//   proxy: {
//     '/api': 'http://localhost:3000', // Proxy API requests to your backend
//   },
// },
