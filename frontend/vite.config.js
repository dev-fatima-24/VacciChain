import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/auth': 'http://backend:4000',
      '/vaccination': 'http://backend:4000',
      '/verify': 'http://backend:4000',
    },
  },
});
