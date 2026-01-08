import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: './',

  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@engine': resolve(__dirname, './src/engine'),
      '@renderer': resolve(__dirname, './src/renderer'),
      '@state': resolve(__dirname, './src/state'),
      '@audio': resolve(__dirname, './src/audio'),
      '@assets': resolve(__dirname, './src/assets'),
      '@utils': resolve(__dirname, './src/utils'),
    }
  },

  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'terser',
    sourcemap: false,

    rollupOptions: {
      output: {
        // Code splitting for better caching
        manualChunks: {
          'pixi': ['pixi.js'],
          'pixi-ui': ['@pixi/ui'],
          'pixi-sound': ['@pixi/sound']
        }
      }
    }
  },

  server: {
    port: 3000,
    open: true,
    host: true
  },

  optimizeDeps: {
    include: ['pixi.js', '@pixi/ui', '@pixi/sound']
  }
});
