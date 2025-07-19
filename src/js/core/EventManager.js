// js/core/EventManager.js
// Event handling and UI interactions

export class EventManager {
  constructor(app) {
    this.app = app;
    this.setupEventListeners();
  }

  // Event Setup (moved from main.js)
  setupEventListeners() {
    // Airtable connection
    // Connection Controls
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

    // Export Controls
    const exportPdfButton = document.getElementById('export-pdf');
    if (exportPdfButton) {
      exportPdfButton.addEventListener('click', () => this.app.exportManager.exportPDF());
    }

    const exportMarkdownButton = document.getElementById('export-markdown');
    if (exportMarkdownButton) {
      exportMarkdownButton.addEventListener('click', () => this.app.exportManager.exportMarkdown());
    }

    // Settings
    const settingsButton = document.getElementById('settings-button');
    if (settingsButton) {
      settingsButton.addEventListener('click', () => this.showSettings());
    }

    // Preview Line Sheet button
    const previewButton = document.getElementById('preview-linesheet');
    if (previewButton) {
      previewButton.addEventListener('click', () => {
        this.app.previewManager.handlePreviewLinesheet();
      });
    }

    // Toggle Preview Panel button
    const togglePreviewButton = document.getElementById('toggle-preview-panel');
    if (togglePreviewButton) {
      togglePreviewButton.addEventListener('click', () => {
        this.app.previewManager.togglePreviewPanel();
      });
    }

    // Close Preview Panel button
    const closePreviewButton = document.getElementById('close-preview-panel');
    if (closePreviewButton) {
      closePreviewButton.addEventListener('click', () => {
        this.app.previewManager.closePreviewPanel();
      });
    }

    // Configuration change listeners that trigger preview updates
    const configElements = [
      'template-selector',
      'font-selector'
    ];

    configElements.forEach(elementId => {
      const element = document.getElementById(elementId);
      if (element) {
        element.addEventListener('change', () => {
          this.app.previewManager.handleConfigurationChange();
        });
      }
    });

    console.log('✅ Event listeners set up successfully');
  }

  // Settings (moved from main.js)
  showSettings() {
    // Placeholder for settings modal
    this.app.notificationManager.showInfo('Settings panel will be implemented in Phase 2');
  }
}

export default EventManager;