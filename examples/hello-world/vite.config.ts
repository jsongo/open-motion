import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@open-motion/core': path.resolve(__dirname, '../../packages/core/src/index.tsx'),
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
});
