# 🎨 Gilty Boy Line Sheet Builder - Development Session Guide

A comprehensive guide for starting, managing, and ending development sessions.

## 📋 Table of Contents

- [🚀 Starting a Development Session](#-starting-a-development-session)
  - [Pre-Development Checklist](#pre-development-checklist)
  - [Environment Setup](#environment-setup)
  - [Starting the Development Server](#starting-the-development-server)
  - [Initial Connection Test](#initial-connection-test)
- [🛠️ Development Commands](#️-development-commands)
  - [Core Development](#core-development)
  - [Code Quality](#code-quality)
  - [Testing Commands](#testing-commands)
  - [Build and Preview](#build-and-preview)
- [🔍 Debugging and Troubleshooting](#-debugging-and-troubleshooting)
  - [Connection Issues](#connection-issues)
  - [Development Tools](#development-tools)
  - [Cache Management](#cache-management)
  - [Performance Monitoring](#performance-monitoring)
- [🧪 Airtable Testing Commands](#-airtable-testing-commands)
  - [Connection Testing](#connection-testing)
  - [Data Validation](#data-validation)
  - [Line Sheet Organization](#line-sheet-organization)
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
# Check Node.js version (should be >= 16.0.0)
node --version

# Check npm version (should be >= 8.0.0)
npm --version

# Check Git status
git status

# Check if environment file exists
ls -la .env
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

**3. Install/Update Dependencies (if needed):**
```bash
# Only run if package.json has changed or node_modules is missing
npm install

# Check for outdated packages
npm outdated
```

### Starting the Development Server

**Primary Development Command:**
```bash
# Start the development server (opens automatically in browser)
npm run dev

# Alternative: Start without auto-opening browser
npm run dev -- --open false

# Start on different port
npm run dev -- --port 3001
```

**Expected Output:**
```
  VITE v4.5.3  ready in 234 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

### Initial Connection Test

**Browser Console Commands:**
```javascript
// Test environment setup
DevHelpers.checkEnvironmentSetup()

// Test Airtable connection
DevHelpers.testAirtableConnection()

// Load and validate your ring data
DevHelpers.testGiltyBoyData()

// Run comprehensive test suite
DevHelpers.runFullTest()
```

---

## 🛠️ Development Commands

### Core Development

**Development Server:**
```bash
# Start development server
npm run dev

# Start with specific host (accessible from other devices)
npm run dev -- --host

# Start in debug mode
DEBUG=vite:* npm run dev
```

**File Watching:**
```bash
# Watch and auto-restart on file changes (if using nodemon)
npm run dev:watch

# Watch specific file types
npm run dev -- --watch "**/*.{js,css,html}"
```

### Code Quality

**Linting:**
```bash
# Check code quality
npm run lint

# Fix auto-fixable issues
npm run lint:fix

# Lint specific files
npx eslint src/js/main.js

# Lint with different formats
npm run lint -- --format table
```

**Code Formatting:**
```bash
# Format all code files
npm run format

# Format specific files
npx prettier --write src/js/main.js

# Check formatting without fixing
npx prettier --check "src/**/*.{js,css,md}"
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

# Run tests with coverage
npm test -- --coverage

# Run tests matching pattern
npm test -- --grep "Airtable"
```

**End-to-End Testing:**
```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests in headed mode (see browser)
npm run test:e2e -- --headed

# Run specific E2E test
npm run test:e2e -- --grep "connection"
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

**Browser Console Debugging:**
```javascript
// Check application state
window.app.getDebugInfo()

// Clear application cache
window.app.airtableClient.clearCache()

// Test specific product loading
window.app.airtableClient.getProducts().then(console.log)

// Check for JavaScript errors
console.clear()
// Then reproduce the issue and check console
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

**Browser DevTools Shortcuts:**
- `F12` - Open DevTools
- `Ctrl+Shift+C` - Inspect element
- `Ctrl+Shift+I` - Toggle DevTools
- `Ctrl+Shift+J` - Console tab
- `Ctrl+R` - Refresh page
- `Ctrl+Shift+R` - Hard refresh (ignore cache)

### Cache Management

**Clear Various Caches:**
```bash
# Clear npm cache
npm cache clean --force

# Clear Vite cache
rm -rf node_modules/.vite

# Clear browser cache (programmatically)
# In browser console:
caches.keys().then(names => names.forEach(name => caches.delete(name)))

# Clear application-specific cache
# In browser console:
localStorage.clear()
sessionStorage.clear()
```

### Performance Monitoring

**Monitor Development Performance:**
```bash
# Analyze bundle size
npm run build -- --analyze

# Check load times
time npm run dev

# Monitor file changes
# In browser console:
performance.mark('dev-start')
// Do some actions
performance.mark('dev-end')
performance.measure('dev-duration', 'dev-start', 'dev-end')
console.log(performance.getEntriesByType('measure'))
```

---

## 🧪 Airtable Testing Commands

### Connection Testing

**Basic Connection Tests:**
```javascript
// In browser console after npm run dev

// 1. Test environment setup
DevHelpers.checkEnvironmentSetup()

// 2. Test basic connection
DevHelpers.testAirtableConnection()

// 3. Load product data
DevHelpers.loadTestData()
```

**Advanced Connection Testing:**
```javascript
// Test specific endpoints
fetch('https://api.airtable.com/v0/appmDNXTcMaDH4rPF/Products?maxRecords=1', {
  headers: {
    'Authorization': 'Bearer ' + import.meta.env.VITE_AIRTABLE_ACCESS_TOKEN
  }
}).then(r => r.json()).then(console.log)

// Test rate limiting
for(let i = 0; i < 10; i++) {
  DevHelpers.testAirtableConnection().then(r => console.log(`Test ${i+1}:`, r))
}
```

### Data Validation

**Validate Your Ring Data:**
```javascript
// Test your specific ring collection
DevHelpers.testGiltyBoyData()

// Validate individual products
window.app.airtableClient.getProducts().then(products => {
  products.forEach(product => {
    const validation = window.app.validator.validateProduct(product)
    if (!validation.isValid) {
      console.error('Invalid product:', product.productCode, validation.errors)
    }
  })
})

// Check for missing images
window.app.airtableClient.getProducts().then(products => {
  const noImages = products.filter(p => p.images.length === 0)
  console.log('Products without images:', noImages.map(p => p.productCode))
})
```

### Line Sheet Organization

**Test Organization Logic:**
```javascript
// Test line sheet organization
window.app.airtableClient.getProducts().then(products => {
  const organized = LineSheetOrganizer.organizeGiltyBoyProducts(products)
  console.log('Line Sheet Structure:', organized)
  console.log('Table of Contents:', organized.tableOfContents)
  console.log('Summary:', organized.summary)
})

// Test price calculations
window.app.airtableClient.getProducts().then(products => {
  const prices = products.map(p => p.wholesalePrice).filter(p => p > 0)
  console.log('Price Range:', {
    min: Math.min(...prices),
    max: Math.max(...prices),
    average: prices.reduce((a,b) => a+b, 0) / prices.length,
    total: prices.reduce((a,b) => a+b, 0)
  })
})
```

---

## 📊 Monitoring and Analytics

### Real-time Monitoring

**Monitor Application State:**
```javascript
// Set up real-time monitoring (in browser console)
setInterval(() => {
  const stats = {
    timestamp: new Date().toISOString(),
    products: window.app?.state?.products?.length || 0,
    cacheSize: window.app?.airtableClient?.getCacheStats()?.size || 0,
    errors: document.querySelectorAll('.notification-error').length
  }
  console.log('App Stats:', stats)
}, 30000) // Every 30 seconds
```

**Network Monitoring:**
```javascript
// Monitor API calls
const originalFetch = window.fetch
window.fetch = function(...args) {
  console.log('API Call:', args[0])
  return originalFetch.apply(this, arguments)
    .then(response => {
      console.log('API Response:', response.status, args[0])
      return response
    })
}
```

### Performance Metrics

**Measure Performance:**
```javascript
// Measure page load time
console.log('Page Load Time:', performance.timing.loadEventEnd - performance.timing.navigationStart, 'ms')

// Measure Airtable fetch time
console.time('airtable-fetch')
window.app.airtableClient.getProducts().then(() => {
  console.timeEnd('airtable-fetch')
})

// Measure component render time
console.time('product-grid-render')
window.app.renderProductGrid()
console.timeEnd('product-grid-render')
```

### Error Tracking

**Track and Log Errors:**
```javascript
// Set up error tracking
window.addEventListener('error', (e) => {
  console.error('Global Error:', {
    message: e.message,
    filename: e.filename,
    line: e.lineno,
    column: e.colno,
    stack: e.error?.stack
  })
})

// Track unhandled promise rejections
window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled Promise Rejection:', e.reason)
})
```

---

## 🔄 Version Control Workflow

### Git Commands

**Daily Git Workflow:**
```bash
# Check current status
git status

# See what changed
git diff

# Stage changes
git add .
# Or stage specific files
git add src/js/main.js

# Commit with descriptive message
git commit -m "feat: add line sheet organization for ring products"

# Push to remote
git push origin main
```

**Git Best Practices:**
```bash
# Create feature branch
git checkout -b feature/pdf-export

# Switch branches
git checkout main
git checkout feature/pdf-export

# Merge feature back to main
git checkout main
git merge feature/pdf-export

# Delete merged branch
git branch -d feature/pdf-export
```

### Branch Management

**Branch Workflow:**
```bash
# List all branches
git branch -a

# Create and switch to new branch
git checkout -b feature/new-feature

# Push new branch to remote
git push -u origin feature/new-feature

# Pull latest changes
git pull origin main

# Rebase current branch on main
git rebase main
```

### Commit Best Practices

**Commit Message Format:**
```bash
# Feature additions
git commit -m "feat: add product image display"

# Bug fixes
git commit -m "fix: resolve Airtable connection timeout"

# Documentation
git commit -m "docs: update development session guide"

# Code refactoring
git commit -m "refactor: reorganize component structure"

# Performance improvements
git commit -m "perf: optimize product data loading"
```

---

## 📦 Dependency Management

### Installing Dependencies

**Add New Dependencies:**
```bash
# Add production dependency
npm install package-name

# Add development dependency
npm install --save-dev package-name

# Install specific version
npm install package-name@1.2.3

# Install from GitHub
npm install user/repo#branch
```

**Verify Installation:**
```bash
# Check installed packages
npm list --depth=0

# Check for peer dependency warnings
npm install

# Verify package in package.json
cat package.json | grep package-name
```

### Updating Dependencies

**Update Packages:**
```bash
# Check for outdated packages
npm outdated

# Update all packages to latest compatible versions
npm update

# Update specific package
npm update package-name

# Update to latest major version (be careful!)
npm install package-name@latest
```

### Security Audits

**Security Commands:**
```bash
# Check for vulnerabilities
npm audit

# Fix automatically fixable vulnerabilities
npm audit fix

# Force fix (may introduce breaking changes)
npm audit fix --force

# Get detailed vulnerability report
npm audit --json
```

---

## 🛑 Ending a Development Session

### Pre-Shutdown Checklist

**Before Ending Session:**
```bash
# 1. Check for unsaved changes
git status

# 2. Run final tests
npm run lint
npm test

# 3. Commit any work in progress
git add .
git commit -m "wip: save progress on [feature name]"

# 4. Push to remote (backup)
git push origin main
```

### Saving Work

**Save Current State:**
```bash
# Create a snapshot of current work
git stash save "Work in progress on $(date)"

# Save with description
git stash save "Debugging Airtable connection issues"

# List all stashes
git stash list

# Apply stash later
git stash apply stash@{0}
```

**Backup Important Files:**
```bash
# Backup configuration
cp .env .env.backup.$(date +%Y%m%d)

# Backup any custom modifications
tar -czf backup-$(date +%Y%m%d).tar.gz src/ docs/ *.md *.json
```

### Cleanup Commands

**Clean Up Development Environment:**
```bash
# Stop the development server (Ctrl+C in terminal)

# Clean temporary files
rm -rf .tmp
rm -rf *.log

# Optional: Clean node_modules to save space
# (only if you won't be developing again soon)
# rm -rf node_modules

# Clean Git working directory
git clean -fd
```

**Close Applications:**
```bash
# Kill any remaining Node processes (if needed)
pkill -f node

# Check for running processes
ps aux | grep node
```

---

## 🆘 Emergency Procedures

### Quick Fixes

**When Things Break:**
```bash
# Nuclear option: Complete reset
rm -rf node_modules package-lock.json
npm install
npm run dev

# Fix Git issues
git reset --hard HEAD
git clean -fd

# Fix file permissions (if needed)
chmod -R 755 src/
chmod +x scripts/*.sh
```

### Recovery Commands

**Recover Lost Work:**
```bash
# Check Git reflog for lost commits
git reflog

# Recover from reflog
git reset --hard HEAD@{2}

# Check stash for saved work
git stash list
git stash show -p stash@{0}

# Recover deleted files
git checkout HEAD -- filename
```

**Emergency Debugging:**
```bash
# Enable debug mode
DEBUG=* npm run dev

# Verbose logging
npm run dev -- --debug

# Check system resources
top
df -h
```

### Reset Procedures

**Complete Project Reset:**
```bash
# 1. Backup current state
git stash save "Emergency backup $(date)"

# 2. Reset to last known good state
git reset --hard HEAD~1

# 3. Clean everything
rm -rf node_modules package-lock.json .vite/

# 4. Fresh install
npm install

# 5. Test basic functionality
npm run dev
```

---

## ⚡ Quick Reference

### Most Used Commands

**Daily Commands:**
```bash
# Start development
npm run dev

# Test Airtable connection
# (in browser console)
DevHelpers.testGiltyBoyData()

# Check code quality
npm run lint

# Commit work
git add . && git commit -m "message" && git push
```

**Troubleshooting Commands:**
```bash
# Clean restart
rm -rf node_modules && npm install && npm run dev

# Check environment
DevHelpers.checkEnvironmentSetup()

# Clear caches
npm cache clean --force
```

### Keyboard Shortcuts

**In Development Server Terminal:**
- `r` - Restart server
- `u` - Show server URL
- `o` - Open in browser
- `c` - Clear console
- `q` - Quit server

**In Browser:**
- `F12` - DevTools
- `Ctrl+R` - Refresh
- `Ctrl+Shift+R` - Hard refresh
- `Ctrl+Shift+I` - Toggle DevTools

### Useful Aliases

**Add to your `.bashrc` or `.zshrc`:**
```bash
# Project shortcuts
alias gb="cd ~/path/to/gilty-boy/linesheet-builder"
alias gbdev="gb && npm run dev"
alias gbtest="gb && npm test"
alias gbpush="gb && git add . && git commit -m 'Quick save' && git push"

# Quick commands
alias ll="ls -la"
alias ..="cd .."
alias gst="git status"
alias glog="git log --oneline -10"
```

---

## 💡 Pro Tips

1. **Always test Airtable connection first** - Run `DevHelpers.testGiltyBoyData()` before making changes
2. **Use browser DevTools Network tab** - Monitor API calls when debugging connection issues
3. **Keep .env file secure** - Never commit it to Git
4. **Commit frequently** - Small, focused commits are easier to debug
5. **Use meaningful branch names** - `feature/pdf-export` not `fix-stuff`
6. **Test in incognito mode** - Helps identify caching issues
7. **Monitor console for errors** - JavaScript errors can break functionality silently

---

*Last updated: $(date +"%Y-%m-%d")*