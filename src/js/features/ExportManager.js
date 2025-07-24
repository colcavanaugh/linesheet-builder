// src/js/features/ExportManager.js
// Updated export manager that uses local PDF server

import { getErrorMessage } from '../config/app.config.js';
import { ClientPDFGenerator } from '../utils/pdf/ClientPDFGenerator.js';

export class ExportManager {
  constructor(app) {
    this.app = app;
    this.pdfGenerator = new ClientPDFGenerator();
  }

  /**
   * Export PDF using Puppeteer via local server
   */
  async exportPDF() {
    const state = this.app.stateManager.getState();
    if (state.products.length === 0) {
      this.app.notificationManager.showError(getErrorMessage('export', 'noProducts'));
      return;
    }

    // Check if preview content exists
    const previewContent = document.getElementById('linesheet-preview-content');
    if (!previewContent || !previewContent.innerHTML.trim()) {
      this.app.notificationManager.showError('Please generate a preview first before exporting to PDF.');
      return;
    }

    this.app.uiManager.updateLoadingState(true, 'Generating professional PDF with Puppeteer...');
    
    try {
      // Check if PDF server is running
      const serverRunning = await this.pdfGenerator.isServerRunning();
      
      if (!serverRunning) {
        this.app.notificationManager.showError(
          'PDF server is not running. Please start the PDF server with: npm run pdf-server'
        );
        return;
      }

      // Get the complete HTML document from LinesheetGenerator
      const linesheetHTML = this.app.linesheetGenerator.generateLinesheetHTML();
      
      console.log('🔄 Generating PDF with Puppeteer via local server...');
      
      // Generate PDF using the server
      const pdfBuffer = await this.pdfGenerator.generatePDF(linesheetHTML);
      
      // Download the PDF
      this.downloadPDF(pdfBuffer, this.generateFilename());
      
      this.app.notificationManager.showSuccess('Professional PDF exported successfully!');
      
    } catch (error) {
      console.error('PDF export failed:', error);
      
      // Provide helpful error messages
      if (error.message.includes('PDF server is not available')) {
        this.app.notificationManager.showError(
          'PDF Server Not Running: Please start the PDF server with "npm run pdf-server" in a separate terminal.'
        );
      } else if (error.message.includes('Server error')) {
        this.app.notificationManager.showError(
          'PDF Generation Failed: ' + error.message
        );
      } else {
        this.app.notificationManager.showError(
          'PDF export failed: ' + error.message
        );
      }
    } finally {
      this.app.uiManager.updateLoadingState(false);
    }
  }

  /**
   * Download PDF buffer as file
   * @param {ArrayBuffer} pdfBuffer - PDF data buffer
   * @param {string} filename - Filename for download
   */
  downloadPDF(pdfBuffer, filename) {
    const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the object URL
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  /**
   * Generate filename for PDF export
   * @returns {string} Generated filename
   */
  generateFilename() {
    const state = this.app.stateManager.getState();
    const brandName = state.config?.branding?.brandName || 'GiltyBoy';
    const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    return `${brandName}-LineSheet-${timestamp}.pdf`;
  }

  /**
   * Check PDF server status for debugging
   */
  async checkServerStatus() {
    const status = await this.pdfGenerator.getServerStatus();
    console.log('📊 PDF Server Status:', status);
    return status;
  }

  /**
   * Enable/disable PDF export button based on preview and server state
   */
  async updatePDFButtonState() {
    const exportButton = document.getElementById('export-pdf');
    const previewContent = document.getElementById('linesheet-preview-content');
    
    if (exportButton) {
      const hasPreview = previewContent && previewContent.innerHTML.trim();
      const hasProducts = this.app.stateManager.getState().products.length > 0;
      const serverRunning = await this.pdfGenerator.isServerRunning();
      
      const canExport = hasPreview && hasProducts && serverRunning;
      exportButton.disabled = !canExport;
      
      if (canExport) {
        exportButton.title = 'Export current preview as professional PDF';
      } else if (!hasProducts) {
        exportButton.title = 'Load products first';
      } else if (!hasPreview) {
        exportButton.title = 'Generate preview first';
      } else if (!serverRunning) {
        exportButton.title = 'PDF server not running - start with "npm run pdf-server"';
      }
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    // No cleanup needed for client-side generator
  }
}

export default ExportManager;