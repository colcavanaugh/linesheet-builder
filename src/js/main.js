// js/main.js
// Main application entry point - Refactored for modular architecture

import { APP_CONFIG } from './config/app.config.js';
import AirtableValidator from './utils/airtable/validator.js';
import DevHelpers from '../../scripts/dev-helpers.js';

// Core modules
import StateManager from './core/StateManager.js';
import EventManager from './core/EventManager.js';

// Feature modules
import AirtableManager from './features/AirtableManager.js';
import ProductManager from './features/ProductManager.js';
import PreviewManager from './features/PreviewManager.js';
import ExportManager from './features/ExportManager.js';

// UI modules
import UIManager from './ui/UIManager.js';
import NotificationManager from './ui/NotificationManager.js';

// Generator modules
import LinesheetGenerator from './generators/LinesheetGenerator.js';

// Export modules
import { PuppeteerGenerator } from './utils/pdf/PuppeteerGenerator.js';


class LineSheetApp {
  constructor() {
    // Initialize core managers
    this.stateManager = new StateManager();
    this.validator = AirtableValidator;
    
    // Initialize UI managers
    this.uiManager = new UIManager(this);
    this.notificationManager = new NotificationManager(this);
    
    // Initialize feature managers
    this.airtableManager = new AirtableManager(this);
    this.productManager = new ProductManager(this);
    this.previewManager = new PreviewManager(this);
    this.exportManager = new ExportManager(this);
    
    // Initialize generator
    this.linesheetGenerator = new LinesheetGenerator(this);
    
    // Initialize event manager (must be last)
    this.eventManager = new EventManager(this);

    // Initialize Puppeteer PDF generator
    this.pdfGenerator = new PuppeteerGenerator();
    
    this.init();
  }

  async init() {
    console.log('🎨 Initializing Gilty Boy Line Sheet Builder...');
    
    try {
      // Initialize UI
      this.uiManager.initializeUI();
      
      // Check for saved configuration
      this.stateManager.loadSavedConfig();
      
      // Initialize preview panel state
      this.previewManager.initializePreviewPanel();
      
      // Test Airtable connection if credentials are available
      if (this.uiManager.hasAirtableCredentials()) {
        await this.airtableManager.testAirtableConnection();
      }
      
      console.log('✅ Application initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize application:', error);
      this.notificationManager.showError('Failed to initialize application. Please refresh and try again.');
    }
  }

  // Template and Customization (moved from main.js)
  updateTemplate(templateName) {
    if (!APP_CONFIG.templates.available.includes(templateName)) {
      this.notificationManager.showError(`Template "${templateName}" is not available.`);
      return;
    }

    this.stateManager.getState().config.template = templateName;
    this.stateManager.saveConfig();
    this.uiManager.renderPreview();
    
    console.log(`Template changed to: ${templateName}`);
  }

  updateFont(fontName) {
    this.stateManager.getState().config.customization.font = fontName;
    this.stateManager.saveConfig();
    this.uiManager.updateFontPreview();
    
    console.log(`Font changed to: ${fontName}`);
  }

  // Debug Methods (enhanced)
  getDebugInfo() {
    return {
      ...this.stateManager.getDebugInfo(),
      cacheStats: this.airtableManager.airtableClient.getCacheStats()
    };
  }

  handlePuppeteerError(error) {
    console.error('Puppeteer PDF generation error:', error);
    
    if (error.message.includes('Failed to launch')) {
      this.notificationManager.showError(
        'PDF generation service unavailable. Using alternative method...'
      );
      // Automatically switch to client-side method
      this.exportManager.setExportMethod('client-side');
    } else if (error.message.includes('timeout')) {
      this.notificationManager.showError(
        'PDF generation timed out. Please try with fewer products or simpler layout.'
      );
    } else if (error.message.includes('memory')) {
      this.notificationManager.showError(
        'Not enough memory for PDF generation. Using lower quality settings...'
      );
    } else {
      this.notificationManager.showError(
        'PDF generation failed. Please try again or use the basic export method.'
      );
    }
  }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.app = new LineSheetApp();
  
  // Make DevHelpers available globally for console debugging
  if (import.meta.env.MODE === 'development') {
    window.DevHelpers = DevHelpers;
    console.log('🛠️ Development mode: DevHelpers available in console');
    console.log('💡 Try: DevHelpers.checkEnvironmentSetup()');
  }
});

// Export for module usage
export default LineSheetApp;