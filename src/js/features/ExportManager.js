// src/js/features/ExportManager.js
// Phase 1: Basic PDF Export Implementation
// Connects existing HTML generation to PDF server via HTTP API

export class ExportManager {
  constructor(app) {
    this.app = app;
    this.pdfServerUrl = 'http://localhost:3001';
  }

  /**
   * Export current linesheet to PDF using Puppeteer server
   * Maintains strict client-server separation
   */
  async exportToPDF() {
    const state = this.app.stateManager.getState();
    
    // Validate we have products to export
    if (!state.products || state.products.length === 0) {
      this.app.notificationManager.showError('No products available for PDF export. Please load products first.');
      return;
    }

    // Validate that linesheet has been generated
    if (!state.organizedProducts) {
      this.app.notificationManager.showError('Please generate a linesheet preview first before exporting to PDF.');
      return;
    }

    this.app.uiManager.updateLoadingState(true, 'Generating PDF with Puppeteer...');
    
    try {
      // Step 1: Check if PDF server is running
      const serverRunning = await this.checkPDFServer();
      if (!serverRunning) {
        throw new Error('PDF server is not running. Please start it with: npm run pdf-server');
      }

      // Step 2: Generate HTML using existing LinesheetGenerator
      console.log('🔄 Generating linesheet HTML...');
      const linesheetHTML = this.app.linesheetGenerator.generateLinesheetHTML();
      
      if (!linesheetHTML || linesheetHTML.length < 100) {
        throw new Error('Generated HTML appears invalid or empty');
      }

      console.log('🔍 Debug HTML being sent:');
      console.log('- Length:', linesheetHTML.length);
      console.log('- Has CSS link:', linesheetHTML.includes('styles/themes/linesheet-document.css'));
      console.log('- First 200 chars:', linesheetHTML.substring(0, 200));

      // Step 3: Send HTML to PDF server
      console.log('🔄 Sending HTML to PDF server...');
      const response = await fetch(`${this.pdfServerUrl}/api/generate-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          html: linesheetHTML,
          options: this.getPDFOptions()
        }),
        // Add timeout for large linesheets
        signal: AbortSignal.timeout(60000) // 60 second timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`PDF generation failed: ${response.status} - ${errorText}`);
      }

      // Step 4: Download the PDF
      console.log('✅ PDF generated successfully, downloading...');
      const arrayBuffer = await response.arrayBuffer();
      const pdfBlob = new Blob([arrayBuffer], { type: 'application/pdf' });
      
      if (pdfBlob.size === 0) {
        throw new Error('Generated PDF is empty');
      }

      const filename = this.generatePDFFilename();
      this.downloadPDF(pdfBlob, filename);
      
      this.app.notificationManager.showSuccess(`PDF exported successfully as ${filename}`);
      
    } catch (error) {
      console.error('PDF export failed:', error);
      
      // Provide helpful error messages based on error type
      if (error.message.includes('PDF server is not running')) {
        this.app.notificationManager.showError(
          'PDF Server Not Running: Please start the PDF server with "npm run pdf-server" in a separate terminal.'
        );
      } else if (error.message.includes('timeout')) {
        this.app.notificationManager.showError(
          'PDF generation timed out. Try with fewer products or check PDF server logs.'
        );
      } else if (error.message.includes('fetch')) {
        this.app.notificationManager.showError(
          'Network error connecting to PDF server. Make sure it\'s running on port 3001.'
        );
      } else {
        this.app.notificationManager.showError(`PDF export failed: ${error.message}`);
      }
      
    } finally {
      this.app.uiManager.updateLoadingState(false);
    }
  }

  /**
   * Check if PDF server is running and responsive
   * @returns {boolean} Server status
   */
  async checkPDFServer() {
    try {
      const response = await fetch(`${this.pdfServerUrl}/api/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 second timeout for health check
      });
      return response.ok;
    } catch (error) {
      console.warn('PDF server health check failed:', error.message);
      return false;
    }
  }

  /**
   * Get PDF generation options for Puppeteer
   * @returns {Object} PDF options
   */
  getPDFOptions() {
    return {
      format: 'Letter',
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: '0.5in',
        bottom: '0.5in',
        left: '0.5in',
        right: '0.5in'
      },
      displayHeaderFooter: false,
      // High quality settings
      deviceScaleFactor: 2,
      // Wait for fonts and images to load
      waitUntil: 'networkidle0'
    };
  }

  /**
   * Generate filename for PDF export
   * @returns {string} PDF filename
   */
  generatePDFFilename() {
    const state = this.app.stateManager.getState();
    const brandName = state.config?.brand?.name || 'GiltyBoy';
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const productCount = state.products?.length || 0;
    
    return `${brandName}-LineSheet-${productCount}products-${timestamp}.pdf`;
  }

  /**
   * Download PDF blob to user's device
   * @param {Blob} pdfBlob - PDF blob from server
   * @param {string} filename - Desired filename
   */
  downloadPDF(pdfBlob, filename) {
    try {
      const url = URL.createObjectURL(pdfBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      
    } catch (error) {
      console.error('Download failed:', error);
      throw new Error('Failed to download PDF file');
    }
  }

  /**
   * Debug method to test HTML generation
   * @returns {string} Generated HTML for inspection
   */
  getPreviewHTML() {
    try {
      return this.app.linesheetGenerator.generateLinesheetHTML();
    } catch (error) {
      console.error('HTML generation failed:', error);
      return null;
    }
  }

  /**
   * Export to Markdown (existing functionality - placeholder)
   */
  async exportToMarkdown() {
    // TODO: Implement markdown export
    this.app.notificationManager.showInfo('Markdown export coming soon!');
  }

  /**
   * Debug method for testing PDF server communication
   */
  async testPDFServerConnection() {
    console.log('Testing PDF server connection...');
    
    try {
      const health = await this.checkPDFServer();
      console.log('Server health:', health ? '✅ Online' : '❌ Offline');
      
      if (health) {
        // Test minimal PDF generation
        const testHTML = `
          <!DOCTYPE html>
          <html>
            <head><title>Test PDF</title></head>
            <body><h1>PDF Server Test</h1><p>If you can read this, the PDF server is working!</p></body>
          </html>
        `;
        
        const response = await fetch(`${this.pdfServerUrl}/api/generate-pdf`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ html: testHTML }),
          signal: AbortSignal.timeout(10000)
        });
        
        if (response.ok) {
          const blob = await response.blob();
          console.log('✅ Test PDF generated successfully:', blob.size, 'bytes');
          this.downloadPDF(blob, 'test-pdf.pdf');
        } else {
          console.error('❌ Test PDF generation failed:', response.status);
        }
      }
      
    } catch (error) {
      console.error('❌ PDF server test failed:', error);
    }
  }

  /**
   * Update PDF button state based on current conditions
   * Called by EventManager to enable/disable export button
   */
  updatePDFButtonState() {
    const exportButton = document.getElementById('export-pdf');
    const previewContent = document.getElementById('linesheet-preview-content');
    
    if (!exportButton) {
      console.warn('Export PDF button not found');
      return;
    }
    
    const hasPreview = previewContent && previewContent.innerHTML.trim();
    const hasProducts = this.app.stateManager.getState().products.length > 0;
    
    // For now, don't check server status as it may not be running yet
    const canExport = hasPreview && hasProducts;
    exportButton.disabled = !canExport;
    
    if (canExport) {
      exportButton.title = 'Export current preview as professional PDF';
    } else if (!hasProducts) {
      exportButton.title = 'Load products first';
    } else {
      exportButton.title = 'Generate preview first';
    }
    
    console.log('📊 PDF button state updated:', { hasPreview, hasProducts, canExport });
  }
}

export default ExportManager;