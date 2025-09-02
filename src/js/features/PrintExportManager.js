// js/features/PrintExportManager.js
// Clean CSS print-based PDF export using browser's native capabilities

import { getErrorMessage } from '../config/app.config.js';

export class PrintExportManager {
  constructor(app) {
    this.app = app;
  }

  async exportPDF() {
    console.log('🖨️ Starting CSS print-based PDF export');
    
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

    try {
      await this.printLinesheet(previewContent);
      this.app.notificationManager.showSuccess('PDF export ready! Use your browser\'s print dialog to save as PDF.');
      
    } catch (error) {
      console.error('💥 PDF export failed:', error);
      this.app.notificationManager.showError('Failed to prepare PDF export: ' + error.message);
    }
  }

  async printLinesheet(sourceElement) {
    console.log('📄 Preparing linesheet for print...');

    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    if (!printWindow) {
      throw new Error('Could not open print window. Please check popup blockers.');
    }

    try {
      // Build the complete print document
      const printHTML = this.buildPrintDocument(sourceElement);
      
      // Write to the print window
      printWindow.document.write(printHTML);
      printWindow.document.close();

      // Wait for all resources to load (especially fonts and images)
      await this.waitForPrintReady(printWindow);

      // Focus the window and trigger print
      printWindow.focus();
      printWindow.print();

      // Clean up after a delay (gives user time to use print dialog)
      setTimeout(() => {
        if (!printWindow.closed) {
          printWindow.close();
        }
      }, 1000);

      console.log('✅ Print dialog opened successfully');

    } catch (error) {
      printWindow.close();
      throw error;
    }
  }

  buildPrintDocument(sourceElement) {
    // Get the current base URL for resolving relative paths
    const baseURL = new URL(window.location.href);
    const cssPath = new URL('styles/themes/linesheet-document.css', baseURL).href;

    // Clone the content to avoid affecting the original
    const clonedContent = sourceElement.cloneNode(true);
    
    // Get current date for metadata
    const timestamp = new Date().toISOString().slice(0, 10);

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gilty Boy Line Sheet - ${timestamp}</title>
    
    <!-- Essential fonts for proper rendering -->
    <link href="https://fonts.googleapis.com/css2?family=Cardo:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
    
    <!-- Your linesheet document styles -->
    <link rel="stylesheet" href="${cssPath}">
    
    <style>
        /* Print-specific optimizations */
        @media print {
            * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            
            /* High-resolution image rendering */
            .product-image {
                image-rendering: -webkit-optimize-contrast;
                image-rendering: crisp-edges;
            }
            
            /* CRITICAL: Use zero page margins so we can control margins per-section */
            @page {
                size: 8.5in 11in;
                margin: 0;
            }
            
            /* Remove browser defaults - let CSS handle all spacing */
            html, body {
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                height: 100% !important;
            }
            
            /* Preserve linesheet container styling but remove screen-only properties */
            .linesheet-preview-content {
                width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                box-shadow: none !important;
                background-color: white !important;
            }
            
            /* PRESERVE individual section margins/padding exactly as specified in CSS */
            .cover-page,
            .table-of-contents,
            .category-section {
                /* Keep existing padding from --paper-margin (0.75in) */
                padding: var(--paper-margin) !important;
                /* Remove screen-only properties that conflict with print */
                width: 100% !important;
                height: 100vh !important;
                margin: 0 !important;
                border: none !important;
                box-shadow: none !important;
                /* Preserve page break behavior */
                page-break-after: always;
                break-after: page;
                /* Ensure proper background */
                background: white !important;
            }
            
            /* Preserve all internal margin/padding specifications */
            .cover-content,
            .toc-content,
            .catalog-footer {
                /* Let these elements keep their CSS-defined spacing */
            }

            .catalog-header {
            height: 10%;
            display: flex;
            align-items: flex-start;
            justify-content: flex-start;
            }

            .category-title {
            font-size: 18pt;
            color: var(--linesheet-brand-primary);
            margin: 0;
            font-weight: bold;
            text-transform: uppercase;
            padding-bottom: var(--linesheet-space-sm);
            border-bottom: 1pt solid var(--linesheet-brand-primary);
            }

            .toc-body {
            height: 80%;
            align-items: center;
            justify-content: center;
            }

            .catalog-body {
            height: 80%;
            align-items: center;
            justify-content: center;
            margin: -20px;
            }
            
            /* PRODUCT GRID LAYOUT - Simple flexbox 2x2 grid */
            .linesheet-preview-content .product-grid {
                display: flex !important;
                flex-wrap: wrap !important;
                width: 100% !important;
                height: 100% !important;
                padding: 0 !important;
                margin: 0 !important;
                gap: 10px !important;
                align-content: flex-start !important;
            }

            /* PRODUCT CARDS - Fixed sizing for 2x2 layout */
            .linesheet-preview-content .linesheet-product-card {
                background: white !important;
                border: 1pt solid #ccc !important;
                border-radius: 3pt !important;
                overflow: hidden !important;
                position: relative !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                box-shadow: none !important;
                
                /* Fixed dimensions for reliable 2x2 grid */
                width: calc(40% - 5px) !important;
                height: calc(40% - 5px) !important;
                margin: 0 !important;
                
                /* Ensure proper flex behavior */
                flex: 0 0 calc(40% - 5px) !important;
                max-width: calc(40% - 5px) !important;
                box-sizing: border-box !important;
            }
            
            .linesheet-preview-content .product-image-container {
                position: relative;
                overflow: hidden;
            }
            
            /* LANDSCAPE ORIENTATION STYLES */
            .linesheet-preview-content .linesheet-product-card.landscape {
                display: block !important;
            }
            
            .linesheet-preview-content .linesheet-product-card.landscape .product-image-container {
                height: 65% !important;
                width: 100% !important;
            }
            
            .linesheet-preview-content .linesheet-product-card.landscape .product-info {
                height: 35% !important;
                width: 100% !important;
                padding: 28px 16px !important;
                display: grid !important;
                grid-template-columns: 1fr .12fr !important;
                justify-content: space-between !important;
            }
            
            .linesheet-preview-content .linesheet-product-card.landscape .product-details {
                margin-left: 10px !important;
            }
            
            .linesheet-preview-content .linesheet-product-card.landscape .product-price {
                margin-bottom: 10px !important;
            }
            
            /* PORTRAIT ORIENTATION STYLES */
            .linesheet-preview-content .linesheet-product-card.portrait {
                display: flex !important;
                flex-direction: row !important;
            }
            
            .linesheet-preview-content .linesheet-product-card.portrait .product-image-container {
                width: 65% !important;
                height: 100% !important;
                flex;
            }
            
            .linesheet-preview-content .linesheet-product-card.portrait .product-info {
                width: 35% !important;
                height: 100% !important;
                padding: var(--linesheet-space-lg) var(--space-md) !important;
            }
            
            .linesheet-preview-content .linesheet-product-card.portrait .product-price {
                font-size: 1rem !important;
                margin-right: 10px !important;
            }
            
            /* SHARED IMAGE AND INFO STYLES */
            .linesheet-preview-content .product-image-container {
                position: relative !important;
                overflow: hidden !important;
                background: #f8f8f8 !important;
                flex-shrink: 0 !important;
            }
            
            .linesheet-preview-content .product-image {
                width: 100% !important;
                height: 100% !important;
                object-fit: cover !important;
                object-position: center !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                image-rendering: -webkit-optimize-contrast !important;
            }
            
            .linesheet-preview-content .product-info {
                display: flex !important;
                flex-direction: column !important;
                justify-content: space-between !important;
                background: white !important;
            }
            
            .linesheet-preview-content .product-details {
                flex-grow: 1 !important;
            }
            
            .linesheet-preview-content .product-code {
                font-size: 0.85rem !important;
                font-weight: 500 !important;
                color: #666 !important;
                text-transform: uppercase !important;
                letter-spacing: 0.05em !important;
                margin-bottom: 3pt !important;
                font-family: 'Cardo', monospace !important;
            }
            
            .linesheet-preview-content .product-name {
                font-weight: 600 !important;
                color: var(--linesheet-text-digital) !important;
                margin-bottom: 3pt !important;
                line-height: 1.2 !important;
                font-size: 0.9rem !important;
            }
            
            .linesheet-preview-content .product-material {
                font-size: 0.85rem !important;
                color: #666 !important;
                line-height: 1.3 !important;
            }
            
            .linesheet-preview-content .product-price {
                font-weight: 500 !important;
                color: var(--linesheet-brand-primary) !important;
                font-size: 1rem !important;
                align-self: flex-end !important;
            }
        }
        
        /* Screen styles for the print preview window */
        @media screen {
            body {
                margin: 20px;
                background: #f5f5f5;
                font-family: 'Cardo', serif;
            }
            
            .print-header {
                background: white;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 20px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                text-align: center;
            }
            
            .print-instructions {
                color: #666;
                font-size: 14px;
                margin-top: 10px;
            }
            
            .print-button {
                background: #8b4513;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 6px;
                font-size: 16px;
                cursor: pointer;
                margin: 10px;
            }
            
            .print-button:hover {
                background: #6d350f;
            }
        }
    </style>
</head>
<body>
    <!-- Print preview header (hidden during actual printing) -->
    <div class="print-header" style="display: none;" id="print-header">
        <h1>Gilty Boy Line Sheet - Print Preview</h1>
        <button class="print-button" onclick="window.print()">Print / Save as PDF</button>
        <button class="print-button" onclick="window.close()" style="background: #666;">Close</button>
        <div class="print-instructions">
            Use your browser's print dialog to save as PDF. Choose "Save as PDF" as the destination.
        </div>
    </div>

    ${clonedContent.outerHTML}

    <script>
        // Show the print header when content is ready (but hide during printing)
        window.addEventListener('load', function() {
            const printHeader = document.getElementById('print-header');
            if (printHeader) {
                printHeader.style.display = 'block';
            }
        });
        
        // Hide header during actual printing
        window.addEventListener('beforeprint', function() {
            const printHeader = document.getElementById('print-header');
            if (printHeader) {
                printHeader.style.display = 'none';
            }
        });
        
        // Show header again after printing
        window.addEventListener('afterprint', function() {
            const printHeader = document.getElementById('print-header');
            if (printHeader) {
                printHeader.style.display = 'block';
            }
        });
    </script>
</body>
</html>`;
  }

  async waitForPrintReady(printWindow) {
    return new Promise((resolve) => {
      console.log('⏳ Waiting for print window to be fully ready...');
      
      const checkReadiness = async () => {
        // Step 1: Wait for basic document load
        if (printWindow.document.readyState !== 'complete') {
          console.log('📄 Document still loading...');
          setTimeout(checkReadiness, 200);
          return;
        }
        
        // Step 2: Wait for all images to load
        const images = printWindow.document.querySelectorAll('img');
        console.log(`🖼️ Found ${images.length} images to load`);
        
        if (images.length === 0) {
          // No images, proceed after font loading delay
          console.log('✅ No images found, proceeding with font loading delay');
          setTimeout(resolve, 800);
          return;
        }
        
        // Check if all images are loaded
        const imagePromises = Array.from(images).map((img, index) => {
          return new Promise((resolveImg) => {
            if (img.complete && img.naturalHeight !== 0) {
              console.log(`✅ Image ${index + 1} already loaded: ${img.src.substring(0, 60)}...`);
              resolveImg();
            } else {
              console.log(`⏳ Waiting for image ${index + 1}: ${img.src.substring(0, 60)}...`);
              
              const handleLoad = () => {
                console.log(`✅ Image ${index + 1} loaded successfully`);
                img.removeEventListener('load', handleLoad);
                img.removeEventListener('error', handleError);
                resolveImg();
              };
              
              const handleError = () => {
                console.warn(`⚠️ Image ${index + 1} failed to load: ${img.src}`);
                img.removeEventListener('load', handleLoad);
                img.removeEventListener('error', handleError);
                resolveImg(); // Continue even if image fails
              };
              
              img.addEventListener('load', handleLoad);
              img.addEventListener('error', handleError);
              
              // Force reload if src is set but not loading
              if (img.src && !img.complete) {
                const currentSrc = img.src;
                img.src = '';
                img.src = currentSrc;
              }
              
              // Timeout fallback after 10 seconds
              setTimeout(() => {
                console.warn(`⏰ Image ${index + 1} timeout - proceeding anyway`);
                img.removeEventListener('load', handleLoad);
                img.removeEventListener('error', handleError);
                resolveImg();
              }, 10000);
            }
          });
        });
        
        // Wait for all images
        try {
          await Promise.all(imagePromises);
          console.log('✅ All images loaded successfully');
          
          // Additional delay for fonts and final rendering
          setTimeout(() => {
            console.log('✅ Print window fully ready');
            resolve();
          }, 1000);
          
        } catch (error) {
          console.warn('⚠️ Some images may not have loaded properly, proceeding anyway:', error);
          setTimeout(resolve, 500);
        }
      };
      
      // Start the readiness check
      if (printWindow.document.readyState === 'complete') {
        checkReadiness();
      } else {
        printWindow.addEventListener('load', checkReadiness);
      }
    });
  }

  updatePDFButtonState() {
    const exportButton = document.getElementById('export-pdf');
    const previewContent = document.getElementById('linesheet-preview-content');
    
    if (exportButton) {
      const hasPreview = previewContent && previewContent.innerHTML.trim();
      const hasProducts = this.app.stateManager.getState().products.length > 0;
      
      exportButton.disabled = !(hasPreview && hasProducts);
      
      if (hasPreview && hasProducts) {
        exportButton.title = 'Open print dialog to save as PDF';
      } else if (!hasProducts) {
        exportButton.title = 'Load products first';
      } else {
        exportButton.title = 'Generate preview first';
      }
    }
  }
}

export default PrintExportManager;