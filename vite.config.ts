import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  // GitHub Pages serves project sites below /<repository>/ rather than /.
  // Local development keeps the root path unless the deploy workflow sets it.
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react()],
  server: {
    port: 3000,
    open: false
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'db-vendor': ['dexie', 'dexie-react-hooks'],
          'qr-vendor': ['qrcode.react', 'html5-qrcode'],
          'lucide-icons': ['lucide-react'],
        }
      }
    }
  }
});
