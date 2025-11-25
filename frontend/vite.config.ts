import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "shared": path.resolve(__dirname, "../shared/src"),
    },
  },
  optimizeDeps: {
    include: ['shared'],
  },
  server: {
    port: parseInt(process.env.FRONTEND_PORT || '5173'),
    proxy: {
      "/api": {
        target: process.env.VITE_API_BASE_URL || `http://localhost:${process.env.BACKEND_PORT || '3001'}`,
        changeOrigin: true,
      },
      "/mcp": {
        target: process.env.VITE_API_BASE_URL || `http://localhost:${process.env.BACKEND_PORT || '3001'}`,
        changeOrigin: true,
      },
    },
  },
})
