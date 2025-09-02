import { defineConfig } from 'vite'

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  envDir: '../', // Tell Vite to look for .env files in the project root
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: 'src/index.html'
      }
    }
  },
  server: {
    port: 3000,
    open: true,
    // Enable CORS for local development with Puppeteer
    cors: true,
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin'
    }
  },
  css: {
    postcss: './postcss.config.cjs'
  },
  optimizeDeps: {
    exclude: ['puppeteer'] // Don't try to optimize Puppeteer for browser
  },
  
  define: {
    // Define environment variables for Puppeteer detection
    __PUPPETEER_AVAILABLE__: 'typeof window !== "undefined" && window.require !== undefined'
  }
})