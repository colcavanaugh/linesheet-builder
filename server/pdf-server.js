// server/pdf-server.js
// Ultra-conservative PDF server optimized for complex HTML content
// Uses proven working Puppeteer configuration from Windows testing

import express from 'express';
import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function inlineCSS(html) {
  try {
    const cssPath = path.join(__dirname, '../src/styles/themes/linesheet-document.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    
    const pdfOverrides = `
      /* PDF Export Overrides - Minimal, Cover Page Focus */
      .cover-page{
        padding-top: 0;
        transform: translate(-8px, 0);
      }
     
      /* Respect different card layouts */
      .linesheet-product-card.portrait {
        display: flex !important;
        flex-direction: row !important;
        width: 300px !important;
        height: 300px !important;
      }
      
        /* Portrait-specific image sizing */
      .linesheet-product-card.portrait .product-image-container {
        width: 60% !important;
        height: 100% !important;
      }
      
      .linesheet-product-card.portrait .product-info {
        width: 40% !important;
        height: 100% !important;
        margin: 0 !important;
        padding-left: 8px !important;
      }

      .linesheet-product-card.landscape {
        display: block !important;
        width: 300px !important;
        height: 300px !important;
      }
      
      /* Fix image container sizing */
      .linesheet-product-card.landscape .product-image-container {
        width: 100% !important;
        height: 60% !important;
        position: relative !important;
      }
      
      /* Fix product info sizing */
      .linesheet-product-card.landscape .product-info {
        width: 100% !important;
        height: 40% !important;
        margin: 0 !important;
        padding: 0 !important;
        position: relative !important;
      }
      
      .product-image {
        width: 100% !important;
        height: 100% !important;
      }
    `;
            
    const result = html.replace(
      /<link rel="stylesheet" href="styles\/themes\/linesheet-document\.css">/,
      `<style>${cssContent}${pdfOverrides}</style>`
    );
    
    // DEBUG: Check if our overrides are in the final HTML
    console.log('PDF Overrides added:', result.includes('PDF Export Overrides'));
    console.log('Override sample:', result.substring(result.indexOf('PDF Export Overrides'), result.indexOf('PDF Export Overrides') + 200));
    
    return result;
    
  } catch (error) {
    console.error('CSS loading failed:', error.message);
    return html;
  }
}

class PDFServer {
  constructor() {
    this.app = express();
    this.port = 3001;
    this.browser = null;
    
    console.log('🚀 Initializing PDF Server...');
    this.setupMiddleware();
    this.setupRoutes();
  }
  
  setupMiddleware() {
    console.log('⚙️ Setting up middleware...');
    
    // Enable CORS for all development server variations
    this.app.use(cors({
      origin: [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5174',
        'http://127.0.0.1:5174'
      ],
      credentials: true,
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));
    
    // Parse JSON bodies
    this.app.use(express.json({ limit: '10mb' }));
    
    // Serve static assets (CSS, fonts, images) for Puppeteer
    this.app.use('/styles', express.static(path.join(__dirname, '../src/styles')));
    this.app.use('/assets', express.static(path.join(__dirname, '../src/assets')));
    
    // Log requests
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${req.get('origin')}`);
      next();
    });
    
    console.log('✅ Middleware configured');
  }

  setupRoutes() {
    console.log('🛤️ Setting up routes...');
    
    // Health check endpoint
    this.app.get('/api/health', (req, res) => {
      console.log('📋 Health check requested');
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        browserReady: !!this.browser,
        port: this.port
      });
    });

    // Main PDF generation endpoint
    this.app.post('/api/generate-pdf', async (req, res) => {
      console.log('📄 PDF generation requested');
      
      try {
        const { html, options = {} } = req.body;
        
        if (!html) {
          console.log('❌ No HTML provided');
          return res.status(400).json({ error: 'HTML content is required' });
        }

        console.log('📊 PDF generation details:', {
          htmlLength: html.length,
          hasOptions: Object.keys(options).length > 0
        });

        const pdfBuffer = await this.generatePDF(html, options);
        
        // Set headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Length', pdfBuffer.length);
        res.setHeader('Content-Disposition', 'attachment; filename="linesheet.pdf"');
        
        console.log('✅ PDF generated successfully:', pdfBuffer.length, 'bytes');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Length', pdfBuffer.length);
        res.end(pdfBuffer);
        
      } catch (error) {
        console.error('❌ PDF generation failed:', error);
        res.status(500).json({ 
          error: 'PDF generation failed', 
          message: error.message 
        });
      }
    });

    // Test endpoint for debugging
    this.app.post('/api/test-pdf', async (req, res) => {
      console.log('🧪 Test PDF generation requested');
      
      try {
        const testHTML = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>PDF Server Test</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 40px; }
                .test-header { color: #333; border-bottom: 2px solid #007acc; padding-bottom: 10px; }
                .test-info { background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 5px; }
              </style>
            </head>
            <body>
              <h1 class="test-header">PDF Server Test</h1>
              <div class="test-info">
                <p><strong>Status:</strong> PDF server is working correctly!</p>
                <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
                <p><strong>Server Port:</strong> ${this.port}</p>
              </div>
              <p>This PDF was generated successfully using Puppeteer.</p>
            </body>
          </html>
        `;

        const pdfBuffer = await this.generatePDF(testHTML);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="test.pdf"');
        res.send(pdfBuffer);
        
        console.log('✅ Test PDF generated successfully');
        
      } catch (error) {
        console.error('❌ Test PDF failed:', error);
        res.status(500).json({ error: 'Test PDF generation failed', message: error.message });
      }
    });
    
    console.log('✅ Routes configured');
  }
  
  async initializeBrowser() {
    console.log('🌐 Starting Puppeteer browser...');
    
    try {
      // Use minimal, proven working configuration
      const browserOptions = {
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox'
        ],
        timeout: 30000
      };

      console.log('🚀 Launching browser with proven working configuration...');
      this.browser = await puppeteer.launch(browserOptions);
      console.log('✅ Browser launched successfully');
      
      // Handle browser disconnect
      this.browser.on('disconnected', () => {
        console.log('⚠️ Puppeteer browser disconnected');
        this.browser = null;
      });
      
    } catch (error) {
      console.error('❌ Failed to start Puppeteer browser:', error);
      throw new Error(`Browser initialization failed: ${error.message}`);
    }
  }

  async generatePDF(html, options = {}) {
    console.log('🔄 Starting conservative PDF generation...');
    console.log('📊 HTML size:', html.length, 'characters');
    
    if (!this.browser) {
      console.log('🚀 Browser not available, initializing...');
      await this.initializeBrowser();
    }

    let page = null;
    
    try {
      console.log('📱 Creating new page...');
      page = await this.browser.newPage();
      
      // Conservative viewport settings
      await page.setViewport({
        width: 800,
        height: 1000,
        deviceScaleFactor: 1
      });

      // Extended timeouts for complex content
      await page.setDefaultTimeout(120000); // 2 minutes
      await page.setDefaultNavigationTimeout(120000);

      console.log('📝 Preprocessing HTML content...');
      
      // Clean HTML to remove problematic elements
      let cleanHtml = html
        .replace(/loading="lazy"/g, '')
        .replace(/srcset="[^"]*"/g, '')
        .replace(/sizes="[^"]*"/g, '')
        .replace(/data-[^=]*="[^"]*"/g, '');

      // Add PDF-specific CSS optimizations
      const pdfCSS = `
        <style>
          * { 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important;
          }
          img { 
            max-width: 100% !important; 
            height: auto !important;
            page-break-inside: avoid !important;
          }
          .linesheet-product-card {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .category-section {
            page-break-before: always !important;
            break-before: page !important;
          }
        </style>
      `;
      
      // Inline CSS formatting overrides
      const htmlWithInlineCSS = await inlineCSS(cleanHtml);

      // Insert CSS optimization
      let finalHtml = htmlWithInlineCSS;
      if (finalHtml.includes('</head>')) {
        finalHtml = finalHtml.replace('</head>', pdfCSS + '</head>');
      }

      console.log('📄 Setting content with basic requirements...');
      
      // Set content with minimal wait requirements

      await page.setContent(finalHtml, {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });

      console.log('⏳ Allowing page to stabilize...');
      
      // Give the page time to render
      await new Promise(resolve => setTimeout(resolve, 3000));

      console.log('🎨 Generating PDF with conservative settings...');
      
      // Use ultra-conservative PDF settings
      const pdfOptions = {
        format: 'Letter',
        printBackground: true,
        preferCSSPageSize: false,
        margin: {
          top: '0in',     // Remove Puppeteer margins
          bottom: '0in',
          left: '0in', 
          right: '0in'
        },
        displayHeaderFooter: false,
        timeout: 120000,
        scale: 1
      };

      console.log('📊 PDF generation options:', pdfOptions);
      
      const pdfBuffer = await page.pdf(pdfOptions);
      
      console.log('✅ PDF generation completed successfully');
      console.log('📄 PDF size:', pdfBuffer.length, 'bytes');
      
      return pdfBuffer;
      
    } catch (error) {
      console.error('❌ Error during PDF generation:', error.message);
      
      // Log specific error details
      if (error.message.includes('Target closed')) {
        console.error('🔍 Browser target closed - HTML may be too complex');
        console.error('💡 Consider reducing product count or simplifying content');
      }
      
      // Reinitialize browser after any error
      console.log('🔄 Reinitializing browser for next request...');
      if (this.browser) {
        try {
          await this.browser.close();
        } catch (closeError) {
          console.log('⚠️ Browser close error:', closeError.message);
        }
      }
      this.browser = null;
      
      throw error;
      
    } finally {
      if (page) {
        try {
          console.log('🧹 Cleaning up page...');
          await page.close();
        } catch (closeError) {
          console.log('⚠️ Page cleanup error (non-critical):', closeError.message);
        }
      }
    }
  }

  async start() {
    try {
      console.log(`🎯 Starting PDF Server on port ${this.port}...`);
      
      // Initialize Puppeteer browser first
      await this.initializeBrowser();
      
      // Start Express server
      this.server = this.app.listen(this.port, () => {
        console.log('');
        console.log('🎉 PDF Server Successfully Started!');
        console.log('');
        console.log(`📍 Server URL: http://localhost:${this.port}`);
        console.log(`🏥 Health Check: http://localhost:${this.port}/api/health`);
        console.log(`🧪 Test PDF: http://localhost:${this.port}/api/test-pdf`);
        console.log('');
        console.log('✅ Ready to generate PDFs!');
        console.log('💡 Keep this terminal open while using the app');
        console.log('');
      });

      // Handle server shutdown gracefully
      process.on('SIGINT', () => this.shutdown());
      process.on('SIGTERM', () => this.shutdown());
      
    } catch (error) {
      console.error('');
      console.error('❌ CRITICAL ERROR: Failed to start PDF server');
      console.error('');
      console.error('Error details:', error.message);
      console.error('');
      
      if (error.message.includes('EADDRINUSE')) {
        console.error('🔧 SOLUTION: Port 3001 is already in use.');
        console.error('   Try: pkill -f "pdf-server" then restart');
      } else if (error.message.includes('Browser initialization')) {
        console.error('🔧 SOLUTION: Puppeteer installation issue.');
        console.error('   Try: npm uninstall puppeteer && npm install puppeteer');
      }
      
      console.error('');
      process.exit(1);
    }
  }

  async shutdown() {
    console.log('');
    console.log('🛑 Shutting down PDF server...');
    
    try {
      if (this.browser) {
        await this.browser.close();
        console.log('✅ Puppeteer browser closed');
      }
      
      if (this.server) {
        this.server.close();
        console.log('✅ Express server closed');
      }
      
      console.log('👋 PDF server shutdown complete');
      process.exit(0);
      
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  }
}

// Start the server directly (no conditional check needed)
console.log('🎨 Gilty Boy PDF Server');
console.log('========================');
console.log('');

const server = new PDFServer();
server.start();

export default PDFServer;