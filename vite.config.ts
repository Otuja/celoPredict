import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true // Allows access from network (useful for testing on mobile via IP)
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  // This ensures environment variables from .env are loaded correctly
  define: {
    'process.env': {} // Safe fallback for some legacy libraries
  }
});