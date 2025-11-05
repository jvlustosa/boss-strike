import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          playroom: ['playroomkit']
        }
      }
    }
  },
  server: {
    port: 3000,
    host: true,
    allowedHosts: [
      'bcc89db6bb03.ngrok-free.app',
      '.ngrok-free.app',
      '.ngrok.app'
    ]
  },
  preview: {
    port: 3000,
    host: true,
    allowedHosts: [
      'bcc89db6bb03.ngrok-free.app',
      '.ngrok-free.app',
      '.ngrok.app'
    ]
  },
  optimizeDeps: {
    include: ['playroomkit']
  }
})
