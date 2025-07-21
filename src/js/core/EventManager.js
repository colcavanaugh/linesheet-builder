// js/core/EventManager.js
// Event handling and UI interactions - Updated for reordered menus and PDF export

export class EventManager {
  constructor(app) {
    this.app = app;
    this.setupEventListeners();
  }

  // Event Setup (updated for new menu structure)
  setupEventListeners() {
    // Airtable connection
    const connectButton = document.getElementById('connect-airtable');
    if (connectButton) {
      connectButton.addEventListener('click', () => this.app.airtableManager.connectToAirtable());
    }

    const refreshButton = document.getElementById('refresh-data');
    if (refreshButton) {
      refreshButton.addEventListener('click', () => this.app.airtableManager.refreshData());
    }

    // Template and Font Selection
    const templateSelector = document.getElementById('template-selector');
    if (templateSelector) {
      templateSelector.addEventListener('change', (e) => {
        this.app.stateManager.getState().config.template = e.target.value;
        this.app.uiManager.updateFontPreview();
        this.app.stateManager.saveConfig();
        this.app.previewManager.handleConfigurationChange();
      });
    }

    const fontSelector = document.getElementById('font-selector');
    if (fontSelector) {
      fontSelector.addEventListener('change', (e) => {
        this.app.stateManager.getState().config.customization.font = e.target.value;
        this.app.uiManager.updateFontPreview();
        this.app.stateManager.saveConfig();
        this.app.previewManager.handleConfigurationChange();
      });
    }

    // ENHANCED: Preview Controls (now first in the menu order)
    const previewButton = document.getElementById('preview-linesheet');
    if (previewButton) {
      previewButton.addEventListener('click', () => {
        this.app.previewManager.handlePreviewLinesheet();
      });
    }

    const togglePreviewButton = document.getElementById('toggle-preview-panel');
    if (togglePreviewButton) {
      togglePreviewButton.addEventListener('click', () => {
        this.app.previewManager.togglePreviewPanel();
      });
    }

    const closePreviewButton = document.getElementById('close-preview-panel');
    if (closePreviewButton) {
      closePreviewButton.addEventListener('click', () => {
        this.app.previewManager.closePreviewPanel();
      });
    }

    // ENHANCED: Export Controls (now second in menu order, markdown removed)
    const exportPdfButton = document.getElementById('export-pdf');
    if (exportPdfButton) {
      exportPdfButton.addEventListener('click', () => this.app.exportManager.exportPDF());
    }

    // REMOVED: Export Markdown button event listener (no longer exists)

    // Settings
    const settingsButton = document.getElementById('settings-button');
    if (settingsButton) {
      settingsButton.addEventListener('click', () => this.showSettings());
    }

    // Set up observers for PDF button state management
    this.setupPDFButtonStateObserver();

    console.log('✅ Event listeners set up successfully (updated for new menu structure)');
  }

  /**
   * Set up observer to manage PDF button state based on preview content
   */
  setupPDFButtonStateObserver() {
    // Update PDF button state when preview content changes
    const previewContent = document.getElementById('linesheet-preview-content');
    if (previewContent) {
      // Create a MutationObserver to watch for changes in preview content
      const observer = new MutationObserver(() => {
        this.app.exportManager.updatePDFButtonState();
      });

      observer.observe(previewContent, {
        childList: true,
        subtree: true,
        characterData: true
      });

      // Initial state update
      this.app.exportManager.updatePDFButtonState();
    }

    // Also update when products are loaded
    const originalConnectToAirtable = this.app.airtableManager.connectToAirtable.bind(this.app.airtableManager);
    this.app.airtableManager.connectToAirtable = async function() {
      const result = await originalConnectToAirtable();
      // Update PDF button state after products are loaded
      setTimeout(() => this.app.exportManager.updatePDFButtonState(), 100);
      return result;
    }.bind(this);
  }

  /**
   * Show settings modal (placeholder)
   */
  showSettings() {
    this.app.notificationManager.showInfo('Settings panel will be available in a future update.');
  }

  /**
   * Update button states based on application state
   */
  updateButtonStates() {
    const state = this.app.stateManager.getState();
    const hasProducts = state.products && state.products.length > 0;
    
    // Update refresh button
    const refreshButton = document.getElementById('refresh-data');
    if (refreshButton) {
      refreshButton.disabled = !hasProducts;
    }

    // Update preview button
    const previewButton = document.getElementById('preview-linesheet');
    if (previewButton) {
      previewButton.disabled = !hasProducts;
      previewButton.title = hasProducts ? 'Generate line sheet preview' : 'Load products first';
    }

    // Update PDF export button (handled by ExportManager)
    this.app.exportManager.updatePDFButtonState();
  }

  /**
   * Add callback to be called when products are loaded
   */
  onProductsLoaded() {
    this.updateButtonStates();
    
    // Show success notification with hint about next steps
    const productCount = this.app.stateManager.getState().products.length;
    this.app.notificationManager.showSuccess(
      `${productCount} products loaded successfully! Click "Preview Line Sheet" to generate your catalog.`
    );
  }

  /**
   * Add callback to be called when preview is generated
   */
  onPreviewGenerated() {
    this.updateButtonStates();
    
    // Show success notification with hint about export
    this.app.notificationManager.showSuccess(
      'Preview generated successfully! You can now export to PDF.'
    );
  }
}

export default EventManager;