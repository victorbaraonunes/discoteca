import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
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
