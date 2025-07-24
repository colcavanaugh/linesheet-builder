# 🎨 Gilty Boy Line Sheet Builder - Development Session Guide

A comprehensive guide for starting, managing, and ending development sessions.

## 📋 Table of Contents

- [🚀 Starting a Development Session](#-starting-a-development-session)
  - [Pre-Development Checklist](#pre-development-checklist)
  - [Environment Setup](#environment-setup)
  - [Starting the Development Servers](#starting-the-development-servers)
  - [Initial Connection Test](#initial-connection-test)
- [🛠️ Development Commands](#️-development-commands)
  - [Core Development](#core-development)
  - [PDF Server Management](#pdf-server-management)
  - [Code Quality](#code-quality)
  - [Testing Commands](#testing-commands)
  - [Build and Preview](#build-and-preview)
- [🔍 Debugging and Troubleshooting](#-debugging-and-troubleshooting)
  - [Connection Issues](#connection-issues)
  - [PDF Generation Issues](#pdf-generation-issues)
  - [Development Tools](#development-tools)
  - [Cache Management](#cache-management)
  - [Performance Monitoring](#performance-monitoring)
- [🧪 Airtable Testing Commands](#-airtable-testing-commands)
  - [Connection Testing](#connection-testing)
  - [Data Validation](#data-validation)
  - [Line Sheet Organization](#line-sheet-organization)
- [📄 PDF Export Testing](#-pdf-export-testing)
  - [Server Status Checks](#server-status-checks)
  - [PDF Quality Testing](#pdf-quality-testing)
  - [Troubleshooting PDF Issues](#troubleshooting-pdf-issues)
- [📊 Monitoring and Analytics](#-monitoring-and-analytics)
  - [Real-time Monitoring](#real-time-monitoring)
  - [Performance Metrics](#performance-metrics)
  - [Error Tracking](#error-tracking)
- [🔄 Version Control Workflow](#-version-control-workflow)
  - [Git Commands](#git-commands)
  - [Branch Management](#branch-management)
  - [Commit Best Practices](#commit-best-practices)
- [📦 Dependency Management](#-dependency-management)
  - [Installing Dependencies](#installing-dependencies)
  - [Updating Dependencies](#updating-dependencies)
  - [Security Audits](#security-audits)
- [🛑 Ending a Development Session](#-ending-a-development-session)
  - [Pre-Shutdown Checklist](#pre-shutdown-checklist)
  - [Saving Work](#saving-work)
  - [Cleanup Commands](#cleanup-commands)
- [🆘 Emergency Procedures](#-emergency-procedures)
  - [Quick Fixes](#quick-fixes)
  - [Recovery Commands](#recovery-commands)
  - [Reset Procedures](#reset-procedures)
- [⚡ Quick Reference](#-quick-reference)
  - [Most Used Commands](#most-used-commands)
  - [Keyboard Shortcuts](#keyboard-shortcuts)
  - [Useful Aliases](#useful-aliases)

---

## 🚀 Starting a Development Session

### Pre-Development Checklist

Before starting any development work, run through this checklist:

```bash
# Check Node.js version (should be >= 18.0.0 for Puppeteer)
node --version

# Check npm version (should be >= 8.0.0)
npm --version

# Check Git status
git status

# Check if environment file exists
ls -la .env

# Verify PDF server directory exists
ls -la server/
```

### Environment Setup

**1. Navigate to Project Directory:**
```bash
cd ~/path/to/gilty-boy/linesheet-builder
```

**2. Check Environment Variables:**
```bash
# Verify your .env file exists and has the required variables
cat .env

# Expected contents:
# VITE_AIRTABLE_ACCESS_TOKEN=your_pat_token_here
# VITE_AIRTABLE_BASE_ID=your_base_id_here
# VITE_AIRTABLE_TABLE_NAME=Products
# NODE_ENV=development
```

**3. Verify PDF Server Setup:**
```bash
# Check PDF server exists
ls -la server/pdf-server.js

# Check Puppeteer is installed
npm list puppeteer

# Verify ports are available
lsof -i :5173  # Vite dev server
lsof -i :3001  # PDF server
```

**4. Install/Update Dependencies (if needed):**
```bash
# Only run if package.json has changed or node_modules is missing
npm install

# Check for outdated packages
npm outdated
```

### Starting the Development Servers

**🎯 Recommended: Start Both Servers Together**
```bash
# Start both Vite dev server AND PDF server simultaneously
npm run dev-all

# Expected output:
# [0] 
# [0]   VITE v4.5.3  ready in 234 ms
# [0] 
# [0]   ➜  Local:   http://localhost:5173/
# [0]   ➜  Network: use --host to expose
# [1] 🚀 PDF Server running on http://localhost:3001
# [1] 📄 Ready to generate PDFs with Puppeteer
# [1] ✅ Puppeteer browser launched
```

**Alternative: Start Servers Separately**

*Terminal 1 - Main Development Server:*
```bash
# Start the Vite development server
npm run dev

# Expected output:
#   VITE v4.5.3  ready in 234 ms
#   ➜  Local:   http://localhost:5173/
```

*Terminal 2 - PDF Generation Server:*
```bash
# Start the PDF server (required for PDF export)
npm run pdf-server

# Expected output:
# 🚀 PDF Server running on http://localhost:3001
# 📄 Ready to generate PDFs with Puppeteer
# ✅ Puppeteer browser launched
```

**Server Status Verification:**
```bash
# Check both servers are running
curl http://localhost:5173  # Should return HTML
curl http://localhost:3001/api/health  # Should return {"status":"ok"}

# Check processes
ps aux | grep node
# Should show both Vite and PDF server processes
```

### Initial Connection Test

**Browser Console Commands (after opening http://localhost:5173):**
```javascript
// Test environment setup
DevHelpers.checkEnvironmentSetup()

// Test Airtable connection
DevHelpers.testAirtableConnection()

// Load and validate your ring data
DevHelpers.testGiltyBoyData()

// Test PDF server connection
window.app.exportManager.checkServerStatus()

// Run comprehensive test suite
DevHelpers.runFullTest()
```

---

## 🛠️ Development Commands

### Core Development

**Development Server Management:**
```bash
# Start both servers (recommended)
npm run dev-all

# Start only Vite dev server
npm run dev

# Start only PDF server
npm run pdf-server

# Start with specific host (accessible from other devices)
npm run dev -- --host

# Start in debug mode
DEBUG=vite:* npm run dev
```

### PDF Server Management

**PDF Server Commands:**
```bash
# Start PDF server
npm run pdf-server

# Start PDF server with debug logging
DEBUG=pdf-server npm run pdf-server

# Check PDF server status
curl http://localhost:3001/api/health

# Test PDF generation endpoint
curl -X POST http://localhost:3001/api/generate-pdf \
  -H "Content-Type: application/json" \
  -d '{"html":"<html><body>Test</body></html>"}'

# Kill PDF server if hung
pkill -f "pdf-server"

# Restart PDF server (if running separately)
pkill -f "pdf-server" && npm run pdf-server
```

**PDF Server Health Monitoring:**
```javascript
// In browser console - check server status
window.app.exportManager.checkServerStatus()

// Monitor server health every 30 seconds
setInterval(async () => {
  const status = await window.app.exportManager.checkServerStatus()
  console.log('PDF Server Status:', status)
}, 30000)
```

### Code Quality

**Linting:**
```bash
# Check code quality
npm run lint

# Fix auto-fixable issues
npm run lint:fix

# Lint specific files
npx eslint src/js/main.js server/pdf-server.js

# Lint with different formats
npm run lint -- --format table
```

**Code Formatting:**
```bash
# Format all code files (including server files)
npm run format

# Format specific files
npx prettier --write src/js/main.js server/pdf-server.js

# Check formatting without fixing
npx prettier --check "src/**/*.{js,css,md}" "server/**/*.js"
```

### Testing Commands

**Unit Testing:**
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- airtable.test.js

# Run PDF-related tests
npm test -- pdf.test.js

# Run tests with coverage
npm test -- --coverage
```

### Build and Preview

**Production Build:**
```bash
# Build for production
npm run build

# Build with verbose output
npm run build -- --mode production --debug

# Clean build (remove dist first)
rm -rf dist && npm run build
```

**Preview Production Build:**
```bash
# Preview production build locally
npm run preview

# Preview on different port
npm run preview -- --port 4173

# Note: PDF server still needed for PDF exports in preview mode
```

---

## 🔍 Debugging and Troubleshooting

### Connection Issues

**Airtable Connection Problems:**
```bash
# Test connection in isolation
curl -H "Authorization: Bearer $VITE_AIRTABLE_ACCESS_TOKEN" \
     "https://api.airtable.com/v0/appmDNXTcMaDH4rPF/Products?maxRecords=1"

# Check environment variables
env | grep VITE_

# Validate PAT format
echo $VITE_AIRTABLE_ACCESS_TOKEN | cut -c1-3
# Should output: pat
```

### PDF Generation Issues

**PDF Server Troubleshooting:**
```bash
# Check if PDF server is running
curl http://localhost:3001/api/health

# Check server logs
# Look at terminal running npm run pdf-server

# Test PDF generation manually
curl -X POST http://localhost:3001/api/generate-pdf \
  -H "Content-Type: application/json" \
  -d '{"html":"<html><body><h1>Test PDF</h1></body></html>"}' \
  --output test.pdf

# Check for port conflicts
lsof -i :3001

# Kill processes using port 3001
lsof -ti:3001 | xargs kill -9
```

**Browser Console PDF Debugging:**
```javascript
// Check PDF server connection
await window.app.exportManager.pdfGenerator.isServerRunning()

// Get detailed server status
await window.app.exportManager.checkServerStatus()

// Test PDF generation with current preview
const html = window.app.linesheetGenerator.generateLinesheetHTML()
console.log('HTML length:', html.length)

// Debug export manager state
console.log('Export Manager:', {
  hasPreview: !!document.getElementById('linesheet-preview-content')?.innerHTML.trim(),
  hasProducts: window.app.stateManager.getState().products.length,
  serverURL: window.app.exportManager.pdfGenerator.serverURL
})
```

### Development Tools

**Vite Dev Tools:**
```bash
# Show Vite help in browser
# Press 'h' in terminal where dev server is running

# Clear Vite cache
rm -rf node_modules/.vite

# Restart with fresh cache
npm run dev -- --force
```

**Server Process Management:**
```bash
# List all Node processes
ps aux | grep node

# Kill all Node processes (nuclear option)
pkill -f node

# Restart everything
npm run dev-all
```

### Cache Management

**Clear Various Caches:**
```bash
# Clear npm cache
npm cache clean --force

# Clear Vite cache
rm -rf node_modules/.vite

# Clear Puppeteer cache
rm -rf .cache/puppeteer

# Re-download Puppeteer
npm run setup-pdf

# Clear browser cache (programmatically)
# In browser console:
caches.keys().then(names => names.forEach(name => caches.delete(name)))

# Clear application-specific cache
# In browser console:
localStorage.clear()
sessionStorage.clear()
```

---

## 📄 PDF Export Testing

### Server Status Checks

**Verify PDF Infrastructure:**
```javascript
// In browser console - comprehensive PDF system check
const pdfSystemCheck = async () => {
  console.log('🔍 PDF System Check:')
  
  // 1. Server availability
  const serverRunning = await window.app.exportManager.pdfGenerator.isServerRunning()
  console.log('- PDF Server Running:', serverRunning)
  
  // 2. Server health
  const serverStatus = await window.app.exportManager.checkServerStatus()
  console.log('- Server Status:', serverStatus)
  
  // 3. Preview content
  const hasPreview = !!document.getElementById('linesheet-preview-content')?.innerHTML.trim()
  console.log('- Has Preview Content:', hasPreview)
  
  // 4. Product data
  const productCount = window.app.stateManager.getState().products.length
  console.log('- Product Count:', productCount)
  
  // 5. HTML generation test
  try {
    const html = window.app.linesheetGenerator.generateLinesheetHTML()
    console.log('- HTML Generation: ✅ Success, length:', html.length)
  } catch (error) {
    console.log('- HTML Generation: ❌ Failed -', error.message)
  }
  
  return { serverRunning, hasPreview, productCount }
}

// Run the check
pdfSystemCheck()
```

### PDF Quality Testing

**Test PDF Generation Process:**
```javascript
// Test minimal PDF generation
const testMinimalPDF = async () => {
  const testHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial; margin: 1in; }
          .test { page-break-after: always; }
        </style>
      </head>
      <body>
        <div class="test">
          <h1>Test PDF Page 1</h1>
          <p>This is a test PDF generation.</p>
        </div>
        <div>
          <h1>Test PDF Page 2</h1>
          <p>This is page 2 of the test.</p>
        </div>
      </body>
    </html>
  `
  
  try {
    const pdfBuffer = await window.app.exportManager.pdfGenerator.generatePDF(testHTML)
    console.log('✅ Minimal PDF test successful, size:', pdfBuffer.byteLength, 'bytes')
    
    // Download test PDF
    const blob = new Blob([pdfBuffer], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'test-pdf.pdf'
    link.click()
    URL.revokeObjectURL(url)
    
  } catch (error) {
    console.error('❌ Minimal PDF test failed:', error)
  }
}

// Run minimal test
testMinimalPDF()
```

### Troubleshooting PDF Issues

**Common PDF Problems and Solutions:**

```javascript
// Problem: "PDF server not running"
// Solution check:
const fixServerIssue = async () => {
  console.log('🔧 Checking PDF server issue...')
  
  // Check if server is actually running
  try {
    const response = await fetch('http://localhost:3001/api/health')
    if (response.ok) {
      console.log('✅ Server is running but app thinks it\'s not')
      console.log('Try refreshing the page')
    }
  } catch (error) {
    console.log('❌ Server is actually not running')
    console.log('Start server with: npm run pdf-server')
  }
}

// Problem: PDF generation fails
// Debug the HTML content:
const debugPDFContent = () => {
  try {
    const html = window.app.linesheetGenerator.generateLinesheetHTML()
    console.log('📄 Generated HTML preview:')
    console.log('Length:', html.length)
    console.log('Contains images:', html.includes('<img'))
    console.log('Contains CSS:', html.includes('<style>') || html.includes('<link'))
    
    // Check for problematic content
    if (html.includes('undefined')) {
      console.warn('⚠️ HTML contains "undefined" - check data validation')
    }
    if (html.length < 1000) {
      console.warn('⚠️ HTML seems too short - might be missing content')
    }
  } catch (error) {
    console.error('❌ HTML generation failed:', error)
  }
}

fixServerIssue()
debugPDFContent()
```

---

## 🧪 Airtable Testing Commands

### Connection Testing

**Basic Connection Tests:**
```javascript
// In browser console after npm run dev-all

// 1. Test environment setup
DevHelpers.checkEnvironmentSetup()

// 2. Test basic connection
DevHelpers.testAirtableConnection()

// 3. Load product data
DevHelpers.loadTestData()

// 4. Test complete workflow including PDF
const testFullWorkflow = async () => {
  console.log('🔄 Testing complete workflow...')
  
  // Load products
  await window.app.productManager.loadProducts()
  console.log('✅ Products loaded')
  
  // Generate preview
  await window.app.previewManager.handlePreviewLinesheet()
  console.log('✅ Preview generated')
  
  // Check PDF server
  const serverOk = await window.app.exportManager.pdfGenerator.isServerRunning()
  console.log('PDF Server Ready:', serverOk)
  
  if (serverOk) {
    console.log('✅ Complete workflow ready - try PDF export!')
  } else {
    console.log('❌ Start PDF server: npm run pdf-server')
  }
}

testFullWorkflow()
```

### Data Validation

**Validate Your Ring Data:**
```javascript
// Test your specific ring collection
DevHelpers.testGiltyBoyData()

// Enhanced product validation including PDF readiness
window.app.airtableClient.getProducts().then(products => {
  console.log('📊 Product Analysis for PDF Generation:')
  
  let validProducts = 0
  let missingImages = 0
  let missingPrices = 0
  
  products.forEach(product => {
    const validation = window.app.validator.validateProduct(product)
    if (validation.isValid) {
      validProducts++
    } else {
      console.warn('Invalid product:', product.productCode, validation.errors)
    }
    
    if (product.images.length === 0) missingImages++
    if (!product.wholesalePrice || product.wholesalePrice <= 0) missingPrices++
  })
  
  console.log(`Valid products: ${validProducts}/${products.length}`)
  console.log(`Missing images: ${missingImages}`)
  console.log(`Missing prices: ${missingPrices}`)
  console.log(`PDF-ready products: ${validProducts - missingImages}`)
})
```

### Line Sheet Organization

**Test Organization Logic:**
```javascript
// Test line sheet organization for PDF
window.app.airtableClient.getProducts().then(products => {
  const organized = LineSheetOrganizer.organizeGiltyBoyProducts(products)
  console.log('📋 Line Sheet Structure for PDF:')
  console.log('- Categories:', Object.keys(organized.categories).length)
  console.log('- Total products:', organized.summary.totalProducts)
  console.log('- Page estimate:', Math.ceil(organized.summary.totalProducts / 8), 'pages')
  console.log('- Price range: $', organized.summary.priceRange.min, '-', organized.summary.priceRange.max)
  
  // Test each category for PDF layout
  Object.entries(organized.categories).forEach(([categoryName, category]) => {
    console.log(`- ${categoryName}: ${category.products.length} products`)
  })
})
```

---

## 📊 Monitoring and Analytics

### Real-time Monitoring

**Monitor Both Servers:**
```javascript
// Enhanced monitoring including PDF server
setInterval(async () => {
  const stats = {
    timestamp: new Date().toISOString(),
    viteApp: {
      products: window.app?.state?.products?.length || 0,
      cacheSize: window.app?.airtableClient?.getCacheStats()?.size || 0,
      errors: document.querySelectorAll('.notification-error').length
    },
    pdfServer: {
      running: await window.app.exportManager.pdfGenerator.isServerRunning(),
      serverURL: window.app.exportManager.pdfGenerator.serverURL
    }
  }
  console.log('📊 System Stats:', stats)
}, 60000) // Every 60 seconds
```

### Performance Metrics

**Measure PDF Generation Performance:**
```javascript
// Measure full PDF generation time
const measurePDFPerformance = async () => {
  console.time('full-pdf-generation')
  
  try {
    // Measure HTML generation
    console.time('html-generation')
    const html = window.app.linesheetGenerator.generateLinesheetHTML()
    console.timeEnd('html-generation')
    
    // Measure PDF server processing
    console.time('pdf-server-processing')
    const pdfBuffer = await window.app.exportManager.pdfGenerator.generatePDF(html)
    console.timeEnd('pdf-server-processing')
    
    console.log('📊 PDF Performance:')
    console.log('- HTML size:', html.length, 'characters')
    console.log('- PDF size:', pdfBuffer.byteLength, 'bytes')
    
  } catch (error) {
    console.error('Performance test failed:', error)
  } finally {
    console.timeEnd('full-pdf-generation')
  }
}

measurePDFPerformance()
```

---

## 🛑 Ending a Development Session

### Pre-Shutdown Checklist

**Before Ending Session:**
```bash
# 1. Check for unsaved changes
git status

# 2. Test both servers are working
curl http://localhost:5173
curl http://localhost:3001/api/health

# 3. Run final tests
npm run lint
npm test

# 4. Test PDF export functionality
# (in browser: load products, generate preview, export PDF)

# 5. Commit any work in progress
git add .
git commit -m "wip: save progress on [feature name]"

# 6. Push to remote (backup)
git push origin main
```

### Cleanup Commands

**Stop All Servers:**
```bash
# If using npm run dev-all, press Ctrl+C once to stop both

# Or stop individually:
# Ctrl+C in terminal running npm run dev
# Ctrl+C in terminal running npm run pdf-server

# Force kill if needed
pkill -f "vite"
pkill -f "pdf-server"

# Verify all processes stopped
ps aux | grep node
```

**Clean Up Development Environment:**
```bash
# Clean temporary files
rm -rf .tmp
rm -rf *.log
rm -rf test*.pdf  # Clean up test PDFs

# Optional: Clean Puppeteer cache to save space
# rm -rf .cache/puppeteer

# Clean Git working directory
git clean -fd
```

---

## 🆘 Emergency Procedures

### Quick Fixes

**When PDF Generation Breaks:**
```bash
# 1. Restart PDF server
pkill -f "pdf-server"
npm run pdf-server

# 2. Clear Puppeteer cache
rm -rf .cache/puppeteer
npm install puppeteer

# 3. Test with minimal HTML
# (use testMinimalPDF() function in browser console)

# 4. Check port conflicts
lsof -i :3001
```

**When Both Servers Break:**
```bash
# Nuclear option: Complete reset
pkill -f node
rm -rf node_modules package-lock.json .vite/
npm install
npm run dev-all
```

---

## ⚡ Quick Reference

### Most Used Commands

**Daily Commands:**
```bash
# Start both servers
npm run dev-all

# Test systems (in browser console)
DevHelpers.testGiltyBoyData()
window.app.exportManager.checkServerStatus()

# Check code quality
npm run lint

# Commit work
git add . && git commit -m "message" && git push
```

**PDF-Specific Commands:**
```bash
# Start only PDF server
npm run pdf-server

# Test PDF server
curl http://localhost:3001/api/health

# Restart PDF server
pkill -f "pdf-server" && npm run pdf-server

# Check PDF server logs
# (watch terminal running npm run pdf-server)
```

**Troubleshooting Commands:**
```bash
# Clean restart everything
pkill -f node && npm run dev-all

# Clear all caches
npm cache clean --force && rm -rf .vite/ .cache/

# Test environment
DevHelpers.checkEnvironmentSetup()
```

### Useful Aliases

**Add to your `.bashrc` or `.zshrc`:**
```bash
# Project shortcuts
alias gb="cd ~/path/to/gilty-boy/linesheet-builder"
alias gbdev="gb && npm run dev-all"  # Updated to start both servers
alias gbtest="gb && npm test"
alias gbpdf="gb && npm run pdf-server"  # PDF server only
alias gbkill="pkill -f node"  # Kill all Node processes

# Quick commands
alias pdftest="curl http://localhost:3001/api/health"
alias vitetest="curl http://localhost:5173"
```

---

## 💡 Pro Tips

1. **Always start both servers** - Use `npm run dev-all` to avoid PDF export issues
2. **Monitor PDF server logs** - Watch for Puppeteer errors and memory issues
3. **Test PDF export early** - Generate a simple preview and export PDF to verify system health
4. **Use server health checks** - Run `window.app.exportManager.checkServerStatus()` when debugging
5. **Clear Puppeteer cache if PDFs look wrong** - `rm -rf .cache/puppeteer && npm install puppeteer`
6. **Check port conflicts** - PDF server needs port 3001, Vite needs 5173
7. **Test with minimal HTML first** - Use `testMinimalPDF()` function to isolate issues
8. **Keep an eye on memory usage** - Puppeteer can be memory-intensive with large catalogs

---

*Last updated: 2025-01-24*