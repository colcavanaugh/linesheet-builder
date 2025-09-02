import { defineConfig } from 'vite'

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  envDir: '../',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      external: [
        // Exclude all Node.js specific packages
        'proxy-agent',
        'http-proxy-agent',
        'https-proxy-agent',
        'socks-proxy-agent',
        'pac-proxy-agent'
      ]
    }
  },
  server: {
    port: 3000,
    host: '127.0.0.1',
    strictPort: true,
    open: false,
    fs: {
      // Restrict file access - don't let Vite access test files
      deny: [
        '**/tests/**',
        '**/__tests__/**',
        '**/*.test.js',
        '**/*.spec.js'
      ]
    }
  },
  css: {
    postcss: './postcss.config.cjs'
  },
  optimizeDeps: {
    force: true,
    exclude: [
      // Exclude all potentially problematic packages
      'puppeteer',
      'puppeteer-core',
      'proxy-agent',
      'http-proxy-agent', 
      'https-proxy-agent',
      'socks-proxy-agent',
      'pac-proxy-agent',
      '@puppeteer/browsers',
      'chromium-bidi',
      'cosmiconfig',
      // Also exclude anything that might use these
      'get-uri',
      'agent-base'
    ],
    // Only scan specific files, ignore everything else
    entries: [
      'src/index.html',
      'src/js/main.js'
    ]
  },
  define: {
    __PUPPETEER_AVAILABLE__: JSON.stringify(false),
    // Define globals to prevent undefined errors
    global: 'globalThis'
  },
  resolve: {
    alias: {
      // Provide browser-compatible alternatives
      util: 'util'
    }
  },
  logLevel: 'info',
  clearScreen: false
})