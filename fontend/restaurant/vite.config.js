import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'window',
  },
  server: {
    host: true, // Lắng nghe trên mọi card mạng (0.0.0.0) để điện thoại cùng Wi-Fi truy cập được
    port: 5173,
  },
})
