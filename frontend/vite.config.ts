import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 3000,
    proxy: {
      '/ws': {
        target: process.env.WEBSOCKET_URL || 'ws://localhost:3001',
        ws: true,
      },
    },
  },
})
