import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: './', // CRÍTICO: Paths relativos para funcionar no Capacitor
  plugins: [
    react()
    // PWA REMOVIDO COMPLETAMENTE PARA EVITAR CACHE
  ],
  server: {
    port: 5173,
    host: true, // Expõe na rede local (0.0.0.0)
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8005',
        changeOrigin: true,
        secure: false
      },
      '/static': {
        target: 'http://127.0.0.1:8005',
        changeOrigin: true,
        secure: false
      },
      '/media': {
        target: 'http://127.0.0.1:8005',
        changeOrigin: true,
        secure: false
      }
    }
  },
  css: {
    postcss: {
      plugins: []
    },
    devSourcemap: false,
    preprocessorOptions: {
      css: {
        charset: false
      }
    }
  },
  esbuild: {
    logOverride: {
      'this-is-undefined-in-esm': 'silent'
    }
  },
  build: {
    cssCodeSplit: true,
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          mui: ['@mui/material', '@mui/icons-material']
        }
      }
    }
  }
})
