// src/js/main.js
// Main application entry point

import { APP_CONFIG, getErrorMessage, getSuccessMessage } from '../config/app.config.js';
import AirtableClient from '../utils/airtable/client.js';
import AirtableValidator from '../utils/airtable/validator.js';
import LineSheetOrganizer from '../utils/formatting/linesheet-organizer.js';
import DevHelpers from '../../scripts/dev-helpers.js';

class LineSheetApp {
  constructor() {
    this.state = {
      products: [],
      organizedProducts: null,
      isLoading: false,
      error: null,
      config: {
        template: APP_CONFIG.templates.default,
        customization: {
          font: APP_CONFIG.ui.fonts.brand[0],
          colors: APP_CONFIG.ui.theme,
          branding: null
        }
      },
      ui: {
        currentView: 'dashboard',
        notifications: []
      }
    };

    this.airtableClient = AirtableClient;
    this.validator = AirtableValidator;
    
    this.init();
  }

  async init() {
    console.log('🎨 Initializing Gilty Boy Line Sheet Builder...');
    
    try {
      // Initialize UI
      this.initializeUI();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Check for saved configuration
      this.loadSavedConfig();
      
      // Test Airtable connection if credentials are available
      if (this.hasAirtableCredentials()) {
        await this.testAirtableConnection();
      }
      
      console.log('✅ Application initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize application:', error);
      this.showError('Failed to initialize application. Please refresh and try again.');
    }
  }

  // UI Initialization
  initializeUI() {
    this.updateLoadingState(false);
    this.updateProductCount(0);
    this.renderTemplateSelector();
    this.renderFontSelector();
    this.updateConnectionStatus('disconnected');
  }

  setupEventListeners() {
    // Airtable connection
    const connectBtn = document.getElementById('connect-airtable');
    if (connectBtn) {
      connectBtn.addEventListener('click', () => this.connectToAirtable());
    }

    // Template selection
    const templateSelector = document.getElementById('template-selector');
    if (templateSelector) {
      templateSelector.addEventListener('change', (e) => {
        this.updateTemplate(e.target.value);
      });
    }

    // Font selection
    const fontSelector = document.getElementById('font-selector');
    if (fontSelector) {
      fontSelector.addEventListener('change', (e) => {
        this.updateFont(e.target.value);
      });
    }

    // Export buttons
    const exportPdfBtn = document.getElementById('export-pdf');
    if (exportPdfBtn) {
      exportPdfBtn.addEventListener('click', () => this.exportPDF());
    }

    const exportMarkdownBtn = document.getElementById('export-markdown');
    if (exportMarkdownBtn) {
      exportMarkdownBtn.addEventListener('click', () => this.exportMarkdown());
    }

    // Refresh data
    const refreshBtn = document.getElementById('refresh-data');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.refreshData());
    }

    // Settings
    const settingsBtn = document.getElementById('settings');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => this.showSettings());
    }
  }

  // Airtable Operations
  async connectToAirtable() {
    if (!this.hasAirtableCredentials()) {
      this.showError('Please configure your Airtable Personal Access Token and Base ID in the environment variables.');
      return;
    }

    this.updateLoadingState(true, 'Connecting to Airtable...');
    
    try {
      // Test connection first
      const connectionTest = await this.airtableClient.testConnection();
      
      if (!connectionTest.success) {
        throw new Error(connectionTest.message);
      }

      // Fetch products
      await this.fetchProducts();
      
      this.updateConnectionStatus('connected');
      this.showSuccess(getSuccessMessage('dataLoaded'));
      
    } catch (error) {
      console.error('Airtable connection failed:', error);
      this.showError(error.message);
      this.updateConnectionStatus('error');
    } finally {
      this.updateLoadingState(false);
    }
  }

  async testAirtableConnection() {
    try {
      const result = await this.airtableClient.testConnection();
      if (result.success) {
        this.updateConnectionStatus('ready');
      } else {
        this.updateConnectionStatus('error');
      }
    } catch (error) {
      this.updateConnectionStatus('error');
    }
  }

  async fetchProducts() {
    this.updateLoadingState(true, 'Fetching product data...');
    
    try {
      // SIMPLIFIED: Just ask for active products, let the smart mapper handle everything
      const products = await this.airtableClient.getActiveProducts();

      // The rest remains the same - validation, organization, UI updates
      const validationResults = this.validator.validateProductData(products);
      this.state.products = validationResults.valid.map(item => item.product);
      this.state.organizedProducts = LineSheetOrganizer.organizeGiltyBoyProducts(this.state.products);
      
      this.updateProductCount(this.state.products.length);
      this.updateLineSheetStats(this.state.organizedProducts);
      this.renderProductGrid();
      
    } catch (error) {
      console.error('Failed to fetch products:', error);
      throw error;
    }
  }
  
  async refreshData() {
    if (!this.hasAirtableCredentials()) {
      this.showError('No Airtable connection configured.');
      return;
    }

    // Clear cache to force fresh data
    this.airtableClient.clearCache();
    
    await this.fetchProducts();
    this.showSuccess('Product data refreshed successfully!');
  }

  // Template and Customization
  updateTemplate(templateName) {
    if (!APP_CONFIG.templates.available.includes(templateName)) {
      this.showError(`Template "${templateName}" is not available.`);
      return;
    }

    this.state.config.template = templateName;
    this.saveConfig();
    this.renderPreview();
    
    console.log(`Template changed to: ${templateName}`);
  }

  updateFont(fontName) {
    this.state.config.customization.font = fontName;
    this.saveConfig();
    this.updateFontPreview();
    
    console.log(`Font changed to: ${fontName}`);
  }

  // Export Operations
  async exportPDF() {
    if (this.state.products.length === 0) {
      this.showError(getErrorMessage('export', 'noProducts'));
      return;
    }

    this.updateLoadingState(true, 'Generating PDF...');
    
    try {
      // This will be implemented in Phase 3
      this.showInfo('PDF export will be available in the next development phase.');
      
    } catch (error) {
      console.error('PDF export failed:', error);
      this.showError(getErrorMessage('export', 'pdfGeneration'));
    } finally {
      this.updateLoadingState(false);
    }
  }

  async exportMarkdown() {
    if (this.state.products.length === 0) {
      this.showError(getErrorMessage('export', 'noProducts'));
      return;
    }

    this.updateLoadingState(true, 'Generating Markdown...');
    
    try {
      // This will be implemented in Phase 3
      this.showInfo('Markdown export will be available in the next development phase.');
      
    } catch (error) {
      console.error('Markdown export failed:', error);
      this.showError('Failed to generate Markdown export.');
    } finally {
      this.updateLoadingState(false);
    }
  }

  // UI Updates
  updateLoadingState(isLoading, message = '') {
    this.state.isLoading = isLoading;
    
    const loadingIndicator = document.getElementById('loading-indicator');
    const loadingMessage = document.getElementById('loading-message');
    
    if (loadingIndicator) {
      loadingIndicator.style.display = isLoading ? 'block' : 'none';
    }
    
    if (loadingMessage && message) {
      loadingMessage.textContent = message;
    }

    // Disable/enable buttons during loading
    const buttons = document.querySelectorAll('button:not(.loading-safe)');
    buttons.forEach(btn => {
      btn.disabled = isLoading;
    });
  }

  updateConnectionStatus(status) {
    const statusElement = document.getElementById('connection-status');
    if (!statusElement) return;

    const statusConfig = {
      'disconnected': { text: 'Not Connected', class: 'status-disconnected' },
      'ready': { text: 'Ready to Connect', class: 'status-ready' },
      'connected': { text: 'Connected', class: 'status-connected' },
      'error': { text: 'Connection Error', class: 'status-error' }
    };

    const config = statusConfig[status] || statusConfig.disconnected;
    statusElement.textContent = config.text;
    statusElement.className = `connection-status ${config.class}`;
  }

  updateProductCount(count) {
    const countElement = document.getElementById('product-count');
    const activeCount = this.state.products.filter(p => p.active).length;
    
    if (countElement) {
      countElement.textContent = `${count} products loaded (${activeCount} active for line sheet)`;
    }
  }

  updateLineSheetStats(organizedProducts) {
    if (!organizedProducts) return;
    
    const statsElement = document.getElementById('linesheet-stats');
    if (statsElement) {
      const { summary } = organizedProducts;
      statsElement.innerHTML = `
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">Categories:</span>
            <span class="stat-value">${summary.totalCategories}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Active Products:</span>
            <span class="stat-value">${summary.totalProducts}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Total Value:</span>
            <span class="stat-value">${summary.totalWholesaleValue.toFixed(2)}</span>
          </div>
        </div>
      `;
    }
  }

  renderTemplateSelector() {
    const selector = document.getElementById('template-selector');
    if (!selector) return;

    selector.innerHTML = '';
    APP_CONFIG.templates.available.forEach(template => {
      const option = document.createElement('option');
      option.value = template;
      option.textContent = template.charAt(0).toUpperCase() + template.slice(1);
      option.selected = template === this.state.config.template;
      selector.appendChild(option);
    });
  }

  renderFontSelector() {
    const selector = document.getElementById('font-selector');
    if (!selector) return;

    const fonts = [
      ...APP_CONFIG.ui.fonts.brand,
      ...APP_CONFIG.ui.fonts.body,
      'Arial', 'Georgia', 'Times New Roman', 'Helvetica'
    ];

    selector.innerHTML = '';
    [...new Set(fonts)].forEach(font => {
      const option = document.createElement('option');
      option.value = font;
      option.textContent = font;
      option.selected = font === this.state.config.customization.font;
      selector.appendChild(option);
    });
  }

  renderProductGrid() {
    const container = document.getElementById('product-grid');
    if (!container) return;

    if (this.state.products.length === 0) {
      container.innerHTML = '<p class="no-products">No products to display. Connect to Airtable to load your products.</p>';
      return;
    }

    container.innerHTML = '';
    this.state.products.forEach(product => {
      const productCard = this.createProductCard(product);
      container.appendChild(productCard);
    });
  }

  createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    const imageUrl = product.images.length > 0 
      ? product.images[0].thumbnails?.small?.url || product.images[0].url 
      : '/images/placeholder-product.png';
    
    card.innerHTML = `
      <div class="product-image">
        <img src="${imageUrl}" alt="${product.productName}" loading="lazy">
      </div>
      <div class="product-info">
        <h3 class="product-name">${product.productName}</h3>
        <p class="product-code">${product.productCode}</p>
        <p class="product-material">${product.material}</p>
        <div class="product-prices">
          <span class="wholesale-price">${product.wholesalePrice}</span>
          ${product.retailPrice ? `<span class="retail-price">MSRP: ${product.retailPrice}</span>` : ''}
        </div>
      </div>
    `;
    
    return card;
  }

  renderPreview() {
    // Placeholder for preview rendering
    console.log('Preview rendering will be implemented in Phase 2');
  }

  updateFontPreview() {
    const previewElement = document.getElementById('font-preview');
    if (previewElement) {
      previewElement.style.fontFamily = this.state.config.customization.font;
    }
  }

  // Notifications
  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  showError(message) {
    this.showNotification(message, 'error');
  }

  showWarning(message) {
    this.showNotification(message, 'warning');
  }

  showInfo(message) {
    this.showNotification(message, 'info');
  }

  showNotification(message, type = 'info') {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    };

    this.state.ui.notifications.push(notification);
    this.renderNotification(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => this.removeNotification(notification.id), 5000);
  }

  renderNotification(notification) {
    const container = document.getElementById('notifications');
    if (!container) return;

    const notificationEl = document.createElement('div');
    notificationEl.className = `notification notification-${notification.type}`;
    notificationEl.dataset.id = notification.id;
    
    notificationEl.innerHTML = `
      <span class="notification-message">${notification.message}</span>
      <button class="notification-close" onclick="app.removeNotification(${notification.id})">&times;</button>
    `;
    
    container.appendChild(notificationEl);
  }

  removeNotification(id) {
    const notificationEl = document.querySelector(`[data-id="${id}"]`);
    if (notificationEl) {
      notificationEl.remove();
    }
    
    this.state.ui.notifications = this.state.ui.notifications.filter(n => n.id !== id);
  }

  // Configuration Management
  saveConfig() {
    try {
      localStorage.setItem('linesheet-config', JSON.stringify(this.state.config));
    } catch (error) {
      console.warn('Failed to save configuration:', error);
    }
  }

  loadSavedConfig() {
    try {
      const saved = localStorage.getItem('linesheet-config');
      if (saved) {
        const config = JSON.parse(saved);
        this.state.config = { ...this.state.config, ...config };
        console.log('Loaded saved configuration');
      }
    } catch (error) {
      console.warn('Failed to load saved configuration:', error);
    }
  }

  showSettings() {
    // Placeholder for settings modal
    this.showInfo('Settings panel will be implemented in Phase 2');
  }

  // Utility Methods
  hasAirtableCredentials() {
    return !!(import.meta.env.VITE_AIRTABLE_ACCESS_TOKEN && import.meta.env.VITE_AIRTABLE_BASE_ID);
  }

  // Debug Methods
  getDebugInfo() {
    return {
      state: this.state,
      config: APP_CONFIG,
      cacheStats: this.airtableClient.getCacheStats()
    };
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