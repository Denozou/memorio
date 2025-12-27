import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Enable better code-splitting
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react', 'framer-motion'],
          'i18n': ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
          'markdown': ['react-markdown', 'remark-gfm'],
        },
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 500,
    // Enable minification (esbuild is default and faster)
    minify: 'esbuild',
    // Generate source maps for debugging (can disable in production)
    sourcemap: false,
  },
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
