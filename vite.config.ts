import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        timeout: 300000,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            // Remove default size limit on proxy requests
            proxyReq.setSocketKeepAlive(true);
          });
        },
      },
      '/uploads': 'http://localhost:3000',
    },
  },
})
