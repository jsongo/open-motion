import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@open-motion/core': path.resolve(__dirname, '../../packages/core/src/index.tsx'),
      '@open-motion/components': path.resolve(__dirname, '../../packages/components/src/index.tsx'),
      'react': path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
    },
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    exclude: ['@open-motion/core'],
  },
});
