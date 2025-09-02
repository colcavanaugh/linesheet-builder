# Puppeteer PDF Export Integration Plan

## Project Analysis Summary

Based on the project knowledge analysis, your linesheet application already has a solid foundation with:

- **Complete HTML generation system** via `LinesheetGenerator.js`
- **Live preview functionality** via `PreviewManager.js` 
- **Organized product data pipeline** from Airtable
- **Print-optimized CSS** in `linesheet-document.css`
- **Event-driven architecture** ready for integration

The current system generates complete HTML documents with cover page, table of contents, and product catalog sections. Now we need to add professional PDF export via Puppeteer.

---

## Files to Add for Puppeteer Implementation

### 1. Core PDF Generation Module
```
src/utils/pdf/
├── PuppeteerGenerator.js     # Main PDF generation class
├── config.js                 # PDF-specific configuration
└── fonts.js                  # Font loading utilities
```

### 2. Export Management Enhancement
```
src/utils/export/
├── ExportManager.js          # Enhanced export workflow (update existing)
├── ProgressTracker.js        # Export progress monitoring
└── QualityController.js      # PDF quality settings
```

### 3. Local Server Setup
```
src/server/
├── preview-server.js         # Local HTTP server for Puppeteer
├── static-handler.js         # Serve CSS/assets to Puppeteer
└── pdf-endpoint.js           # PDF generation endpoint
```

### 4. Configuration & Dependencies
```
package.json                  # Add Puppeteer dependencies
puppeteer.config.js          # Puppeteer launch settings
.puppeteerrc.cjs             # Puppeteer download config
```

---

## Integration Architecture

### Current Flow
```
Airtable Data → LinesheetGenerator → PreviewManager → HTML Display
```

### Enhanced Flow with PDF Export
```
Airtable Data → LinesheetGenerator → PreviewManager → HTML Display
                                                   ↓
                                    PuppeteerGenerator → PDF File
```

### Technical Integration Points

#### 1. **Leverage Existing HTML Generation**
Your `LinesheetGenerator.generateLinesheetHTML()` already creates complete, styled documents. Puppeteer will use this exact same HTML.

#### 2. **Extend Current Export System**
Update the existing `ExportManager.js` to include PDF generation alongside the planned Markdown export.

#### 3. **Reuse Print CSS**
Your existing `linesheet-document.css` print styles will be perfect for PDF generation.

---

## Implementation Plan

### Phase 1: Local Server Setup (Days 1-2)

#### **Day 1: Basic Server Infrastructure**

**File: `src/server/preview-server.js`**
```javascript
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class PreviewServer {
  constructor() {
    this.app = express();
    this.server = null;
    this.port = 3001; // Avoid conflicts with dev server
  }

  setupRoutes() {
    // Serve static assets (CSS, fonts, images)
    this.app.use('/styles', express.static(path.join(__dirname, '../../styles')));
    this.app.use('/assets', express.static(path.join(__dirname, '../../assets')));
    
    // PDF generation endpoint
    this.app.post('/generate-pdf', this.handlePDFGeneration.bind(this));
    
    // HTML preview endpoint for Puppeteer
    this.app.post('/preview', this.handlePreviewHTML.bind(this));
  }

  async start() {
    this.setupRoutes();
    return new Promise((resolve) => {
      this.server = this.app.listen(this.port, () => {
        console.log(`Preview server running on http://localhost:${this.port}`);
        resolve(this.port);
      });
    });
  }

  async stop() {
    if (this.server) {
      this.server.close();
    }
  }
}
```

**File: `package.json` updates**
```json
{
  "dependencies": {
    "puppeteer": "^21.6.1",
    "express": "^4.18.2"
  },
  "scripts": {
    "pdf-server": "node src/server/preview-server.js"
  }
}
```

#### **Day 2: Font and Asset Handling**

**File: `src/utils/pdf/fonts.js`**
```javascript
export class FontManager {
  constructor() {
    this.fontPaths = new Map();
    this.loadedFonts = new Set();
  }

  // Register fonts that your CSS uses
  registerFonts() {
    this.fontPaths.set('Cardo', 'https://fonts.googleapis.com/css2?family=Cardo:wght@400;700');
    this.fontPaths.set('Inter', 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600');
  }

  getFontCSS() {
    return Array.from(this.fontPaths.values())
      .map(url => `@import url('${url}');`)
      .join('\n');
  }
}
```

### Phase 2: Core Puppeteer Integration (Days 3-5)

#### **Day 3-4: PDF Generator Core**

**File: `src/utils/pdf/PuppeteerGenerator.js`**
```javascript
import puppeteer from 'puppeteer';
import { FontManager } from './fonts.js';
import { PreviewServer } from '../../server/preview-server.js';

export class PuppeteerGenerator {
  constructor() {
    this.browser = null;
    this.server = null;
    this.fontManager = new FontManager();
  }

  async initialize() {
    // Start local server for serving assets
    this.server = new PreviewServer();
    await this.server.start();

    // Launch Puppeteer
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }

  async generatePDF(linesheetHTML, config = {}) {
    if (!this.browser) {
      await this.initialize();
    }

    const page = await this.browser.newPage();
    
    try {
      // Set page size and configuration
      await page.setViewport({ 
        width: 1200, 
        height: 1600, 
        deviceScaleFactor: 2 
      });

      // Load the HTML with proper base URL for assets
      await page.setContent(linesheetHTML, {
        waitUntil: ['networkidle0', 'load'],
        timeout: 30000
      });

      // Wait for fonts and images to load
      await page.evaluateHandle('document.fonts.ready');
      
      // Generate PDF with high quality settings
      const pdfBuffer = await page.pdf({
        format: 'Letter',
        printBackground: true,
        preferCSSPageSize: true,
        margin: {
          top: '0.5in',
          bottom: '0.5in', 
          left: '0.5in',
          right: '0.5in'
        },
        displayHeaderFooter: false
      });

      return pdfBuffer;
    } finally {
      await page.close();
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
    if (this.server) {
      await this.server.stop();
    }
  }
}
```

#### **Day 5: Integration with Existing System**

**Update `src/js/features/ExportManager.js`:**
```javascript
import { PuppeteerGenerator } from '../../utils/pdf/PuppeteerGenerator.js';

export class ExportManager {
  constructor(app) {
    this.app = app;
    this.pdfGenerator = new PuppeteerGenerator();
  }

  async exportPDF() {
    const state = this.app.stateManager.getState();
    if (state.products.length === 0) {
      this.app.notificationManager.showError('No products available for PDF export');
      return;
    }

    this.app.uiManager.updateLoadingState(true, 'Generating PDF...');
    
    try {
      // Use existing LinesheetGenerator
      const linesheetHTML = this.app.linesheetGenerator.generateLinesheetHTML();
      
      // Generate PDF with Puppeteer
      const pdfBuffer = await this.pdfGenerator.generatePDF(linesheetHTML);
      
      // Download the PDF
      this.downloadPDF(pdfBuffer, 'GiltyBoy-LineSheet.pdf');
      
      this.app.notificationManager.showSuccess('PDF generated successfully!');
      
    } catch (error) {
      console.error('PDF export failed:', error);
      this.app.notificationManager.showError('Failed to generate PDF: ' + error.message);
    } finally {
      this.app.uiManager.updateLoadingState(false);
    }
  }

  downloadPDF(pdfBuffer, filename) {
    const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }
}
```

### Phase 3: Quality & Error Handling (Days 6-7)

#### **Day 6: Quality Control**

**File: `src/utils/export/QualityController.js`**
```javascript
export class QualityController {
  constructor() {
    this.qualityPresets = {
      draft: {
        deviceScaleFactor: 1,
        imageQuality: 70,
        timeout: 15000
      },
      standard: {
        deviceScaleFactor: 2,
        imageQuality: 85,
        timeout: 30000
      },
      print: {
        deviceScaleFactor: 3,
        imageQuality: 95,
        timeout: 60000
      }
    };
  }

  getSettings(quality = 'standard') {
    return this.qualityPresets[quality] || this.qualityPresets.standard;
  }

  validateHTML(html) {
    // Check for missing images, fonts, etc.
    const warnings = [];
    
    if (html.includes('placeholder.com')) {
      warnings.push('Document contains placeholder images');
    }
    
    if (!html.includes('font-family')) {
      warnings.push('No custom fonts detected');
    }
    
    return { warnings, isValid: warnings.length === 0 };
  }
}
```

#### **Day 7: Progress Tracking & Error Recovery**

**File: `src/utils/export/ProgressTracker.js`**
```javascript
export class ProgressTracker {
  constructor(notificationManager) {
    this.notificationManager = notificationManager;
    this.currentStep = 0;
    this.totalSteps = 0;
  }

  start(steps) {
    this.totalSteps = steps;
    this.currentStep = 0;
    this.updateProgress();
  }

  nextStep(message) {
    this.currentStep++;
    this.updateProgress(message);
  }

  updateProgress(message = '') {
    const percentage = Math.round((this.currentStep / this.totalSteps) * 100);
    const progressMessage = `${message} (${percentage}%)`;
    this.notificationManager.updateLoadingState(true, progressMessage);
  }

  complete() {
    this.currentStep = this.totalSteps;
    this.updateProgress('Complete');
  }
}
```

---

## Integration Steps

### Step 1: Install Dependencies
```bash
npm install puppeteer express
```

### Step 2: Update Existing Files

**Add to existing `src/js/main.js` initialization:**
```javascript
// Add to your existing initialization
this.pdfGenerator = new PuppeteerGenerator();

// Add cleanup to your existing cleanup method
async cleanup() {
  // ... existing cleanup
  if (this.pdfGenerator) {
    await this.pdfGenerator.cleanup();
  }
}
```

**Update existing PDF export button handler:**
```javascript
// In your existing event listeners setup
document.getElementById('export-pdf').addEventListener('click', () => {
  this.exportManager.exportPDF(); // Now uses Puppeteer
});
```

### Step 3: CSS Considerations

Your existing CSS in `linesheet-document.css` is already print-optimized. Add these Puppeteer-specific enhancements:

```css
/* Add to linesheet-document.css */
@media print {
  .linesheet-preview-content {
    /* Ensure consistent rendering */
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  
  .product-image {
    /* Optimize image rendering */
    image-rendering: -webkit-optimize-contrast;
    image-rendering: crisp-edges;
  }
}
```

---

## Benefits of This Approach

### **Minimal Code Changes**
- Reuses your existing `LinesheetGenerator.generateLinesheetHTML()`
- Works with current CSS and styling
- Integrates with existing event system and state management

### **Professional PDF Quality**
- True vector text rendering
- High-resolution image handling
- Consistent typography and layout
- Print-shop ready output

### **Error Resilience**
- Progress tracking for user feedback
- Graceful fallbacks for missing assets
- Quality validation before generation

### **Performance Optimized**
- Local server avoids CORS issues
- Efficient browser resource management
- Configurable quality settings
