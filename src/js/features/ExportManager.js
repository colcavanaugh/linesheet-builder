// js/features/ExportManager.js
// Export operations (PDF, Markdown, etc.) - Updated with client-side PDF export

import { getErrorMessage } from '../config/app.config.js';

export class ExportManager {
  constructor(app) {
    this.app = app;
  }

  // Export Operations - Updated with working PDF export
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

    this.app.uiManager.updateLoadingState(true, 'Generating PDF...');
    
    try {
      await this.generateClientSidePDF();
      this.app.notificationManager.showSuccess('PDF exported successfully!');
      
    } catch (error) {
      console.error('PDF export failed:', error);
      this.app.notificationManager.showError('Failed to generate PDF: ' + error.message);
    } finally {
      this.app.uiManager.updateLoadingState(false);
    }
  }

  /**
   * Generate PDF using client-side libraries (html2canvas + jsPDF)
   */
  async generateClientSidePDF() {
    // Check if required libraries are loaded
    if (typeof window.html2canvas === 'undefined' || typeof window.jsPDF === 'undefined') {
      throw new Error('PDF generation libraries not loaded. Please refresh the page and try again.');
    }

    // Get library references
    const html2canvas = window.html2canvas;
    const { jsPDF } = window.jsPDF;

    const previewContent = document.getElementById('linesheet-preview-content');
    if (!previewContent) {
      throw new Error('Preview content not found');
    }

    // Get current timestamp for filename
    const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const filename = `Gilty-Boy-Linesheet-${timestamp}.pdf`;

    // PDF configuration
    const pdfConfig = {
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    };

    // html2canvas configuration for better quality
    const canvasConfig = {
      scale: 2, // Higher resolution
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: previewContent.scrollWidth,
      height: previewContent.scrollHeight,
      windowWidth: previewContent.scrollWidth,
      windowHeight: previewContent.scrollHeight
    };

    try {
      // Update loading message
      this.app.uiManager.updateLoadingMessage('Capturing preview...');

      // Temporarily modify styles for better PDF rendering
      const originalStyles = this.prepareContentForPDF(previewContent);

      // Generate canvas from preview content
      const canvas = await html2canvas(previewContent, canvasConfig);

      // Restore original styles
      this.restoreContentStyles(previewContent, originalStyles);

      // Update loading message
      this.app.uiManager.updateLoadingMessage('Generating PDF...');

      // Create PDF
      const pdf = new jsPDF(pdfConfig);

      // Calculate dimensions
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate scale to fit content to page width
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      
      const scaledWidth = imgWidth * ratio;
      const scaledHeight = imgHeight * ratio;

      // Check if content fits on one page
      if (scaledHeight <= pdfHeight) {
        // Single page - center content
        const xOffset = (pdfWidth - scaledWidth) / 2;
        const yOffset = (pdfHeight - scaledHeight) / 2;
        pdf.addImage(imgData, 'PNG', xOffset, yOffset, scaledWidth, scaledHeight);
      } else {
        // Multiple pages - split content
        await this.addMultiPageContent(pdf, imgData, scaledWidth, scaledHeight, pdfWidth, pdfHeight);
      }

      // Add metadata
      pdf.setProperties({
        title: `Gilty Boy Line Sheet - ${timestamp}`,
        subject: 'Wholesale Product Catalog',
        author: 'Gilty Boy',
        creator: 'Gilty Boy Line Sheet Builder'
      });

      // Update loading message
      this.app.uiManager.updateLoadingMessage('Downloading PDF...');

      // Download the PDF
      pdf.save(filename);

    } catch (error) {
      console.error('Error in PDF generation:', error);
      throw new Error(`PDF generation failed: ${error.message}`);
    }
  }

  /**
   * Prepare content for better PDF rendering
   */
  prepareContentForPDF(element) {
    const originalStyles = {};
    
    // Store original styles
    originalStyles.width = element.style.width;
    originalStyles.height = element.style.height;
    originalStyles.overflow = element.style.overflow;
    originalStyles.maxHeight = element.style.maxHeight;

    // Temporarily modify for PDF
    element.style.width = 'auto';
    element.style.height = 'auto';
    element.style.overflow = 'visible';
    element.style.maxHeight = 'none';

    // Apply PDF-friendly styles to child elements
    const cards = element.querySelectorAll('.product-card, .linesheet-product-card');
    cards.forEach(card => {
      card.style.pageBreakInside = 'avoid';
      card.style.display = 'block';
      card.style.marginBottom = '20px';
    });

    return originalStyles;
  }

  /**
   * Restore original content styles
   */
  restoreContentStyles(element, originalStyles) {
    element.style.width = originalStyles.width;
    element.style.height = originalStyles.height;
    element.style.overflow = originalStyles.overflow;
    element.style.maxHeight = originalStyles.maxHeight;
  }

  /**
   * Add content across multiple pages
   */
  async addMultiPageContent(pdf, imgData, scaledWidth, scaledHeight, pdfWidth, pdfHeight) {
    const pageHeight = pdfHeight;
    let currentY = 0;
    let pageNumber = 1;

    while (currentY < scaledHeight) {
      if (pageNumber > 1) {
        pdf.addPage();
      }

      const remainingHeight = scaledHeight - currentY;
      const heightToAdd = Math.min(pageHeight, remainingHeight);

      // Calculate source coordinates for cropping
      const srcY = (currentY / scaledHeight) * (scaledHeight / (scaledWidth / pdfWidth));
      const srcHeight = (heightToAdd / scaledHeight) * (scaledHeight / (scaledWidth / pdfWidth));

      // Add image portion to current page
      pdf.addImage(
        imgData, 
        'PNG', 
        0, 
        0, 
        pdfWidth, 
        heightToAdd,
        undefined,
        'FAST',
        0,
        -srcY
      );

      currentY += heightToAdd;
      pageNumber++;

      // Prevent infinite loop
      if (pageNumber > 50) {
        console.warn('PDF generation stopped after 50 pages to prevent infinite loop');
        break;
      }
    }
  }

  /**
   * Enable/disable PDF export button based on preview state
   */
  updatePDFButtonState() {
    const exportButton = document.getElementById('export-pdf');
    const previewContent = document.getElementById('linesheet-preview-content');
    
    if (exportButton) {
      const hasPreview = previewContent && previewContent.innerHTML.trim();
      const hasProducts = this.app.stateManager.getState().products.length > 0;
      
      exportButton.disabled = !(hasPreview && hasProducts);
      
      if (hasPreview && hasProducts) {
        exportButton.title = 'Export current preview as PDF';
      } else if (!hasProducts) {
        exportButton.title = 'Load products first';
      } else {
        exportButton.title = 'Generate preview first';
      }
    }
  }

  // Removed exportMarkdown method since markdown export was removed
}

export default ExportManager;