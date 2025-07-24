// src/utils/pdf/PuppeteerGenerator.js
// Professional PDF generation using Puppeteer - integrates with existing LinesheetGenerator

import puppeteer from 'puppeteer';

export class PuppeteerGenerator {
  constructor() {
    this.browser = null;
    this.isInitialized = false;
  }

  /**
   * Initialize Puppeteer browser instance
   */
  async initialize() {
    if (this.isInitialized && this.browser) {
      return;
    }

    try {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      });
      
      this.isInitialized = true;
      console.log('✅ Puppeteer initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize Puppeteer:', error);
      throw new Error(`Failed to launch Puppeteer: ${error.message}`);
    }
  }

  /**
   * Generate PDF from existing LinesheetGenerator HTML
   * @param {string} linesheetHTML - Complete HTML from LinesheetGenerator.generateLinesheetHTML()
   * @param {Object} options - PDF generation options
   * @returns {Buffer} PDF buffer
   */
  async generatePDF(linesheetHTML, options = {}) {
    if (!this.browser) {
      await this.initialize();
    }

    const page = await this.browser.newPage();
    
    try {
      // Configure page for high-quality rendering
      await page.setViewport({ 
        width: 816,  // 8.5 inches * 96 DPI
        height: 1056, // 11 inches * 96 DPI
        deviceScaleFactor: 2 // High DPI for crisp text
      });

      // Prepare HTML with inline styles and assets
      const processedHTML = await this.prepareHTMLForPuppeteer(linesheetHTML);
      
      // Load HTML and wait for all resources
      await page.setContent(processedHTML, {
        waitUntil: ['networkidle0', 'load'],
        timeout: 60000
      });

      // Wait for fonts to load
      await page.evaluateHandle('document.fonts.ready');
      
      // Wait for images to load
      await page.evaluate(() => {
        const images = Array.from(document.images);
        return Promise.all(images.map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise(resolve => {
            img.onload = resolve;
            img.onerror = resolve; // Continue even if image fails
          });
        }));
      });

      // Generate PDF with optimal settings
      const pdfOptions = {
        format: 'Letter', // 8.5" x 11"
        printBackground: true,
        preferCSSPageSize: true,
        margin: {
          top: '0.75in',
          bottom: '0.75in', 
          left: '0.75in',
          right: '0.75in'
        },
        displayHeaderFooter: false,
        ...options
      };

      const pdfBuffer = await page.pdf(pdfOptions);
      
      console.log('✅ PDF generated successfully');
      return pdfBuffer;
      
    } catch (error) {
      console.error('❌ PDF generation failed:', error);
      throw new Error(`PDF generation failed: ${error.message}`);
    } finally {
      await page.close();
    }
  }

  /**
   * Prepare HTML for Puppeteer by inlining CSS and converting relative paths
   * @param {string} html - Original HTML from LinesheetGenerator
   * @returns {string} Processed HTML ready for Puppeteer
   */
  async prepareHTMLForPuppeteer(html) {
    try {
      // Get the base URL for resolving relative paths
      const baseURL = window.location.origin;
      
      // Load the linesheet CSS file content
      const cssContent = await this.loadLinesheetCSS();
      
      // Replace the CSS link with inline styles
      const processedHTML = html.replace(
        /<link rel="stylesheet" href="styles\/themes\/linesheet-document\.css">/,
        `<style>${cssContent}</style>`
      );
      
      // Convert any relative image URLs to absolute URLs
      const finalHTML = processedHTML.replace(
        /src="(?!http|data:)([^"]+)"/g,
        `src="${baseURL}/$1"`
      );
      
      return finalHTML;
      
    } catch (error) {
      console.error('❌ Failed to prepare HTML for Puppeteer:', error);
      // Return original HTML as fallback
      return html;
    }
  }

  /**
   * Load CSS content from the linesheet-document.css file
   * @returns {string} CSS content
   */
  async loadLinesheetCSS() {
    try {
      const response = await fetch('styles/themes/linesheet-document.css');
      if (!response.ok) {
        throw new Error(`Failed to load CSS: ${response.status}`);
      }
      return await response.text();
    } catch (error) {
      console.warn('⚠️ Could not load linesheet CSS, using fallback styles');
      return this.getFallbackCSS();
    }
  }

  /**
   * Fallback CSS in case the external file can't be loaded
   * @returns {string} Basic CSS styles
   */
  getFallbackCSS() {
    return `
      /* Fallback CSS for PDF generation */
      .linesheet-preview-content {
        font-family: 'Cardo', serif;
        font-size: 12pt;
        line-height: 1.4;
        color: #000;
        background-color: #fff;
      }
      
      .cover-page,
      .table-of-contents,
      .category-section {
        width: 100%;
        height: 100vh;
        padding: 0.75in;
        page-break-after: always;
        break-after: page;
      }
      
      .linesheet-product-card {
        margin-bottom: 12pt;
        padding: 8pt;
        border: 1pt solid #ccc;
        break-inside: avoid;
      }
      
      .product-image {
        max-width: 100%;
        height: auto;
      }
      
      @media print {
        * {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
      }
    `;
  }

  /**
   * Cleanup browser resources
   */
  async cleanup() {
    if (this.browser) {
      try {
        await this.browser.close();
        console.log('✅ Puppeteer browser closed');
      } catch (error) {
        console.error('❌ Error closing Puppeteer browser:', error);
      } finally {
        this.browser = null;
        this.isInitialized = false;
      }
    }
  }

  /**
   * Check if Puppeteer is available and properly initialized
   * @returns {boolean} True if Puppeteer is ready to use
   */
  isReady() {
    return this.isInitialized && this.browser !== null;
  }
}