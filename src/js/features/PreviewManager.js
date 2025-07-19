// js/features/PreviewManager.js
// Line sheet preview functionality

export class PreviewManager {
  constructor(app) {
    this.app = app;
    this.previewUpdateTimeout = null;
  }

  // Preview Management (moved from main.js)
  /**
   * Handle preview line sheet button click
   */
  async handlePreviewLinesheet() {
    try {
      this.app.uiManager.updateLoadingState(true, 'Generating line sheet preview...');
      
      // Ensure we have organized products
      const state = this.app.stateManager.getState();
      if (!state.organizedProducts && state.products.length > 0) {
        await this.app.productManager.organizeProducts();
      }
      
      const updatedState = this.app.stateManager.getState();
      if (!updatedState.organizedProducts) {
        this.app.notificationManager.showError('No products available for line sheet generation. Please load products first.');
        return;
      }
      
      // Generate and show preview
      this.showLinesheetPreview();
      
    } catch (error) {
      console.error('Error generating line sheet preview:', error);
      this.app.notificationManager.showError('Failed to generate line sheet preview. Please try again.');
    } finally {
      this.app.uiManager.updateLoadingState(false);
    }
  }

  /**
   * Handle configuration changes that should update preview
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

    // Update font preview
    this.app.uiManager.updateFontPreview();
    
    // Save configuration
    this.app.stateManager.saveConfig();
  }

  /**
   * Close preview panel
   */
  closePreviewPanel() {
    const previewPanel = document.getElementById('linesheet-preview-panel');
    const toggleButton = document.getElementById('toggle-preview-panel');
    
    if (previewPanel) {
      previewPanel.style.display = 'none';
    }
    
    if (toggleButton) {
      toggleButton.textContent = 'Show Preview';
    }
  }

  /**
   * Show line sheet preview in the UI
   */
  showLinesheetPreview() {
    try {
      const linesheetHTML = this.app.linesheetGenerator.generateLinesheetHTML();
      const previewPanel = document.getElementById('linesheet-preview-panel');
      const previewContent = document.getElementById('linesheet-preview-content');
      
      if (previewContent) {
        previewContent.innerHTML = linesheetHTML;
      }
      
      if (previewPanel) {
        previewPanel.style.display = 'block';
        previewPanel.scrollIntoView({ behavior: 'smooth' });
      }
      
      this.app.notificationManager.showSuccess('Line sheet preview generated successfully!');
    } catch (error) {
      console.error('Failed to generate line sheet preview:', error);
      this.app.notificationManager.showError('Failed to generate line sheet preview. Please ensure products are loaded.');
    }
  }

  /**
   * Toggle preview panel visibility
   */
  togglePreviewPanel() {
    const previewPanel = document.getElementById('linesheet-preview-panel');
    const toggleButton = document.getElementById('toggle-preview-panel');
    
    if (previewPanel) {
      const isVisible = previewPanel.style.display !== 'none';
      previewPanel.style.display = isVisible ? 'none' : 'block';
      
      if (toggleButton) {
        toggleButton.textContent = isVisible ? 'Show Preview' : 'Hide Preview';
      }
    }
  }

  /**
   * Initialize preview panel state
   */
  initializePreviewPanel() {
    const previewPanel = document.getElementById('linesheet-preview-panel');
    const toggleButton = document.getElementById('toggle-preview-panel');
    
    if (previewPanel) {
      previewPanel.style.display = 'none';
    }
    
    if (toggleButton) {
      toggleButton.textContent = 'Show Preview';
    }
    
    console.log('✅ Preview panel initialized');
  }
}

export default PreviewManager;