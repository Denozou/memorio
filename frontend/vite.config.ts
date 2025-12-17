import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      // Proxy specific auth API endpoints only
      '/auth/login': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/auth/register': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/auth/refresh': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/auth/logout': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/auth/check': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/auth/password-reset': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      // Note: /auth/verify-email, /auth/reset-password, /auth/forgot-password are frontend routes (React Router)
    },
  },
})
