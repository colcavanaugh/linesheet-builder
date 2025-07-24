// js/features/PreviewManager.js
// Line sheet preview functionality - Enhanced for Phase 2.2 with DEBUG FIXES

export class PreviewManager {
  constructor(app) {
    this.app = app;
    this.previewUpdateTimeout = null;
  }

  // Initialize preview panel state (existing method - keep as is)
  initializePreviewPanel() {
    const previewPanel = document.getElementById('linesheet-preview-panel');
    const toggleButton = document.getElementById('toggle-preview-panel');
    
    if (previewPanel) {
      previewPanel.style.display = 'none';
    }
    
    if (toggleButton) {
      toggleButton.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9"></path>
          <path d="M9 21h6"></path>
          <path d="M12 18v3"></path>
        </svg>
        Show Preview
      `;
    }
    
    console.log('✅ Preview panel initialized');
  }

  // ENHANCED PREVIEW METHODS FOR PHASE 2.2

  /**
   * Handle preview line sheet button click - Enhanced for complete document structure
   */
  async handlePreviewLinesheet() {
    try {
      this.app.uiManager.updateLoadingState(true, 'Generating complete line sheet preview...');
      
      // Ensure we have organized products
      const state = this.app.stateManager.getState();
      if (!state.organizedProducts && state.products.length > 0) {
        this.app.notificationManager.showInfo('Organizing products for line sheet generation...');
        await this.app.productManager.organizeProducts();
      }
      
      const updatedState = this.app.stateManager.getState();
      if (!updatedState.organizedProducts) {
        this.app.notificationManager.showError('No products available for line sheet generation. Please load products first.');
        return;
      }
      
      // DEBUG: Log the organized products structure
      console.log('🔍 DEBUG: Organized products structure:', updatedState.organizedProducts);
      
      // Validate that we have the data we need for complete document structure
      const validation = this.validateLinesheetData();
      if (!validation.isValid) {
        this.app.notificationManager.showWarning(`Line sheet generated with warnings: ${validation.warnings.join(', ')}`);
      }
      
      // Generate and show complete preview
      this.showLinesheetPreview();

      if (this.app.exportManager) {
        this.app.exportManager.updatePDFButtonState();
      }
      
    } catch (error) {
      console.error('Error generating line sheet preview:', error);
      this.app.notificationManager.showError('Failed to generate line sheet preview: ' + error.message);
    } finally {
      this.app.uiManager.updateLoadingState(false);
    }
  }

  /**
   * Show line sheet preview in the existing inline preview panel
   */
  showLinesheetPreview() {
    try {
      // Generate the line sheet HTML
      const linesheetHTML = this.app.linesheetGenerator.generateLinesheetHTML();
      
      // Use the EXISTING preview panel from your HTML (not create a new one)
      const previewPanel = document.getElementById('linesheet-preview-panel');
      const previewContent = document.getElementById('linesheet-preview-content');
      
      if (!previewPanel) {
        throw new Error('Preview panel not found in HTML');
      }
      
      if (previewContent) {
        // Extract just the body content for preview display
        const bodyContent = this.extractBodyContentForPreview(linesheetHTML);
        previewContent.innerHTML = bodyContent;
      }
      
      // Show the preview panel (your existing inline panel)
      previewPanel.style.display = 'block';
      previewPanel.scrollIntoView({ behavior: 'smooth' });
      
      // Update the toggle button text
      const toggleButton = document.getElementById('toggle-preview-panel');
      if (toggleButton) {
        toggleButton.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6 6 18"></path>
            <path d="m6 6 12 12"></path>
          </svg>
          Hide Preview
        `;
      }
      
      this.app.notificationManager.showSuccess('Line sheet preview generated successfully!');
      
    } catch (error) {
      console.error('Failed to generate line sheet preview:', error);
      this.app.notificationManager.showError('Failed to generate line sheet preview: ' + error.message);
    }
  }

  /**
   * Extract body content from complete HTML document for preview display
   * @param {string} completeHTML - Complete HTML document
   * @returns {string} Body content for preview
   */
  extractBodyContentForPreview(completeHTML) {
    // Extract everything between <body> tags
    const bodyMatch = completeHTML.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
      return bodyMatch[1];
    }
    
    // Fallback: return the complete HTML if body extraction fails
    return completeHTML;
  }

  /**
   * Create preview panel HTML structure if it doesn't exist
   * @returns {HTMLElement} Preview panel element
   */
  createPreviewPanel() {
    const previewPanel = document.createElement('div');
    previewPanel.id = 'linesheet-preview-panel';
    previewPanel.className = 'preview-panel';
    previewPanel.style.display = 'none';
    
    previewPanel.innerHTML = `
      <div class="preview-panel-header">
        <h3>Line Sheet Preview</h3>
        <div class="preview-controls">
          <button id="print-preview" class="btn btn-secondary print-preview-button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6,9 6,2 18,2 18,9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
            Print Preview
          </button>
          <button id="close-preview" class="btn btn-secondary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
            </svg>
            Close
          </button>
        </div>
      </div>
      <div class="preview-panel-content">
        <div id="linesheet-preview-content" class="linesheet-preview-content">
          <!-- Preview content will be inserted here -->
        </div>
      </div>
    `;
    
    // Add event listeners
    const closeButton = previewPanel.querySelector('#close-preview');
    closeButton.addEventListener('click', () => this.closePreviewPanel());
    
    const printButton = previewPanel.querySelector('#print-preview');
    printButton.addEventListener('click', () => this.printPreview());
    
    return previewPanel;
  }

  /**
   * Toggle preview panel visibility with improved state management
   */
  togglePreviewPanel() {
    const previewPanel = document.getElementById('linesheet-preview-panel');
    const toggleButton = document.getElementById('toggle-preview-panel');
    
    if (!previewPanel) {
      // If preview panel doesn't exist, generate the preview
      this.showLinesheetPreview();
      return;
    }
    
    const isVisible = previewPanel.style.display !== 'none';
    
    if (isVisible) {
      // Hide preview
      this.closePreviewPanel();
    } else {
      // Show existing preview or generate new one
      const state = this.app.stateManager.getState();
      if (state.organizedProducts) {
        this.showLinesheetPreview();
      } else {
        this.app.notificationManager.showError('Please load and organize products first before generating preview.');
      }
    }
  }

  /**
   * Close the existing inline preview panel
   */
  closePreviewPanel() {
    const previewPanel = document.getElementById('linesheet-preview-panel');
    const toggleButton = document.getElementById('toggle-preview-panel');
    
    if (previewPanel) {
      previewPanel.style.display = 'none';
    }
    
    if (toggleButton) {
      toggleButton.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9"></path>
          <path d="M9 21h6"></path>
          <path d="M12 18v3"></path>
        </svg>
        Show Preview
      `;
    }
  }
  
  /**
   * Handle print preview functionality
   */
  printPreview() {
    try {
      // Generate complete HTML document for printing
      const completeHTML = this.app.linesheetGenerator.generateLinesheetHTML();
      
      // Create a new window for printing
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      
      if (!printWindow) {
        this.app.notificationManager.showError('Please allow pop-ups to use the print preview feature.');
        return;
      }
      
      // Write the complete document to the print window
      printWindow.document.open();
      printWindow.document.write(completeHTML);
      printWindow.document.close();
      
      // Wait for content to load, then focus and print
      printWindow.onload = function() {
        printWindow.focus();
        // Auto-open print dialog after a brief delay
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };
      
      this.app.notificationManager.showInfo('Print preview opened in new window. Print dialog will appear shortly.');
      
    } catch (error) {
      console.error('Print preview failed:', error);
      this.app.notificationManager.showError('Failed to generate print preview: ' + error.message);
    }
  }

  /**
   * Handle configuration changes that should update preview
   * Enhanced to work with complete document structure
   */
  handleConfigurationChange() {
    // Update configuration state
    this.updateConfigurationFromUI();
    
    // If preview is currently shown, update it
    const previewPanel = document.getElementById('linesheet-preview-panel');
    if (previewPanel && previewPanel.style.display !== 'none') {
      // Debounce the preview update to avoid excessive regeneration
      clearTimeout(this.previewUpdateTimeout);
      this.previewUpdateTimeout = setTimeout(() => {
        this.showLinesheetPreview();
      }, 500);
    }
  }

  /**
   * Update configuration state from UI elements
   * Enhanced for Phase 2.2 complete document structure
   */
  updateConfigurationFromUI() {
    const state = this.app.stateManager.getState();
    
    // Update template selection
    const templateSelector = document.getElementById('template-selector');
    if (templateSelector) {
      state.config.template = templateSelector.value;
    }

    // Update font selection
    const fontSelector = document.getElementById('font-selector');
    if (fontSelector) {
      state.config.customization.font = fontSelector.value;
    }

    // Update any additional configuration options that may be added in Phase 2.3
    
    // Update font preview in the main interface
    this.app.uiManager.updateFontPreview();
    
    // Save configuration
    this.app.stateManager.saveConfig();
    
    console.log('Configuration updated:', state.config);
  }

  /**
   * Validate line sheet data for complete document generation - FIXED VERSION
   * @returns {Object} Validation result with isValid flag and warnings array
   */
  validateLinesheetData() {
    const warnings = [];
    let isValid = true;
    
    const state = this.app.stateManager.getState();
    
    // Check if we have organized products
    if (!state.organizedProducts) {
      warnings.push('No organized product data available');
      isValid = false;
      return { isValid, warnings };
    }
    
    // DEBUG: Log the structure to understand what we're working with
    console.log('🔍 DEBUG: organizedProducts structure:', state.organizedProducts);
    console.log('🔍 DEBUG: categories type:', typeof state.organizedProducts.categories);
    console.log('🔍 DEBUG: categories value:', state.organizedProducts.categories);
    
    // FIXED: Safely access categories with proper error handling
    let categories = [];
    if (state.organizedProducts.categories && Array.isArray(state.organizedProducts.categories)) {
      categories = state.organizedProducts.categories;
    } else if (state.organizedProducts.categories && typeof state.organizedProducts.categories === 'object') {
      // If categories is an object, try to convert to array
      categories = Object.values(state.organizedProducts.categories);
    } else {
      // Fallback: look for products directly
      console.warn('⚠️ Categories not found in expected format, checking for direct products');
      if (state.products && Array.isArray(state.products)) {
        warnings.push('Using fallback product organization');
        // Create a simple category structure
        categories = [{
          name: 'All Products',
          products: state.products
        }];
      }
    }
    
    // Check if we have categories
    if (!categories || categories.length === 0) {
      warnings.push('No product categories found');
      isValid = false;
      return { isValid, warnings };
    }
    
    console.log('✅ DEBUG: Found', categories.length, 'categories');
    
    // Check for products without images
    let productsWithoutImages = 0;
    categories.forEach(category => {
      if (category.products && Array.isArray(category.products)) {
        category.products.forEach(product => {
          if (!product.images || product.images.length === 0) {
            productsWithoutImages++;
          }
        });
      }
    });
    
    if (productsWithoutImages > 0) {
      warnings.push(`${productsWithoutImages} products without images`);
    }
    
    // Check for products without pricing
    let productsWithoutPricing = 0;
    categories.forEach(category => {
      if (category.products && Array.isArray(category.products)) {
        category.products.forEach(product => {
          if (!product.wholesalePrice || product.wholesalePrice <= 0) {
            productsWithoutPricing++;
          }
        });
      }
    });
    
    if (productsWithoutPricing > 0) {
      warnings.push(`${productsWithoutPricing} products without wholesale pricing`);
    }
    
    // Check for products without SKUs
    let productsWithoutSKU = 0;
    categories.forEach(category => {
      if (category.products && Array.isArray(category.products)) {
        category.products.forEach(product => {
          if (!product.sku || product.sku.trim() === '') {
            productsWithoutSKU++;
          }
        });
      }
    });
    
    if (productsWithoutSKU > 0) {
      warnings.push(`${productsWithoutSKU} products without SKU codes`);
    }
    
    console.log('✅ DEBUG: Validation complete, warnings:', warnings);
    
    return { isValid, warnings };
  }
}

export default PreviewManager;