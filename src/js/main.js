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
      
      // Set up event listeners (including new line sheet listeners)
      this.setupEventListeners();
      
      // Check for saved configuration
      this.loadSavedConfig();
      
      // Initialize preview panel state
      this.initializePreviewPanel();
      
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
    // Connection Controls
    const connectButton = document.getElementById('connect-airtable');
    if (connectButton) {
      connectButton.addEventListener('click', () => this.connectToAirtable());
    }

    const refreshButton = document.getElementById('refresh-data');
    if (refreshButton) {
      refreshButton.addEventListener('click', () => this.refreshProducts());
    }

    // Template and Font Selection
    const templateSelector = document.getElementById('template-selector');
    if (templateSelector) {
      templateSelector.addEventListener('change', (e) => {
        this.state.config.template = e.target.value;
        this.updateFontPreview();
        this.saveConfig();
        this.handleConfigurationChange();
      });
    }

    // Export Controls
    const exportPdfButton = document.getElementById('export-pdf');
    if (exportPdfButton) {
      exportPdfButton.addEventListener('click', () => this.exportToPDF());
    }

    const exportMarkdownButton = document.getElementById('export-markdown');
    if (exportMarkdownButton) {
      exportMarkdownButton.addEventListener('click', () => this.exportToMarkdown());
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
        this.handlePreviewLinesheet();
      });
    }

    // Toggle Preview Panel button
    const togglePreviewButton = document.getElementById('toggle-preview-panel');
    if (togglePreviewButton) {
      togglePreviewButton.addEventListener('click', () => {
        this.togglePreviewPanel();
      });
    }

    // Close Preview Panel button
    const closePreviewButton = document.getElementById('close-preview-panel');
    if (closePreviewButton) {
      closePreviewButton.addEventListener('click', () => {
        this.closePreviewPanel();
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
          this.handleConfigurationChange();
        });
      }
    });

    console.log('✅ Event listeners set up successfully');

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

  // ============================================================================
  // ENHANCED REFRESH METHOD (Phase 2.1)
  // ============================================================================

  /**
   * Enhanced refreshProducts method
   * Replace your existing refreshProducts method with this version
   */


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
    try {
      this.updateLoadingState(true, 'Loading products from Airtable...');
      
      // Load products from Airtable
      const products = await this.airtableClient.getProducts();
      
      if (!products || products.length === 0) {
        this.showWarning('No products found in Airtable. Please check your data.');
        return;
      }

      // Update state
      this.state.products = products;
      
      // Organize products for line sheet
      await this.organizeProducts();
      
      // Update UI
      this.renderProductGrid();
      this.updateProductCount(products.length);
      
      // Update line sheet stats if products are organized
      if (this.state.organizedProducts) {
        this.updateLineSheetStats(this.state.organizedProducts);
      }
      
      this.showSuccess(`Successfully loaded ${products.length} products`);
      
    } catch (error) {
      console.error('Failed to load products:', error);
      this.showError('Failed to load products. Please check your connection and try again.');
    } finally {
      this.updateLoadingState(false);
    }
  }

  async organizeProducts() {
    try {
      if (!this.state.products || this.state.products.length === 0) {
        console.warn('No products to organize');
        return;
      }

      // Use LineSheetOrganizer to structure products
      this.state.organizedProducts = LineSheetOrganizer.organizeGiltyBoyProducts(this.state.products);
      
      console.log('✅ Products organized for line sheet:', this.state.organizedProducts.summary);
      
    } catch (error) {
      console.error('Failed to organize products:', error);
      this.showError('Failed to organize products for line sheet generation.');
    }
  }
  
  async refreshData() {
    try {
      this.updateLoadingState(true, 'Refreshing product data...');
      
      // Clear cache to ensure fresh data
      this.airtableClient.clearCache();
      
      // Reload products
      await this.fetchProducts();
      
      // If preview is currently shown, refresh it
      const previewPanel = document.getElementById('linesheet-preview-panel');
      if (previewPanel && previewPanel.style.display !== 'none') {
        setTimeout(() => {
          this.showLinesheetPreview();
        }, 500);
      }
      
    } catch (error) {
      console.error('Failed to refresh products:', error);
      this.showError('Failed to refresh products. Please try again.');
    } finally {
      this.updateLoadingState(false);
    }
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

  // Linesheet Preview

   /**
   * Handle preview line sheet button click
   */
  async handlePreviewLinesheet() {
    try {
      this.updateLoadingState(true, 'Generating line sheet preview...');
      
      // Ensure we have organized products
      if (!this.state.organizedProducts && this.state.products.length > 0) {
        await this.organizeProducts();
      }
      
      if (!this.state.organizedProducts) {
        this.showError('No products available for line sheet generation. Please load products first.');
        return;
      }
      
      // Generate and show preview
      this.showLinesheetPreview();
      
    } catch (error) {
      console.error('Error generating line sheet preview:', error);
      this.showError('Failed to generate line sheet preview. Please try again.');
    } finally {
      this.updateLoadingState(false);
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
    // Update template selection
    const templateSelector = document.getElementById('template-selector');
    if (templateSelector) {
      this.state.config.template = templateSelector.value;
    }

    // Update font selection
    const fontSelector = document.getElementById('font-selector');
    if (fontSelector) {
      this.state.config.customization.font = fontSelector.value;
    }

    // Update font preview
    this.updateFontPreview();
    
    // Save configuration
    this.saveConfig();
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

  /**
   * Create a product card element with square layout based on image orientation
   * @param {Object} product - Product data from Airtable
   * @returns {HTMLElement} - Product card DOM element
   */
  createProductCard(product) {
    const card = document.createElement('div');
    
    // Determine layout based on image orientation
    const imageOrientation = this.getImageOrientation(product.images[0]);
    const layoutClass = imageOrientation === 'portrait' ? 'product-card--portrait' : 'product-card--landscape';
    
    card.className = `product-card ${layoutClass}`;
    
    const imageUrl = product.images.length > 0 
      ? product.images[0].url 
      : null;
    
    // Create image section (with fallback for missing images)
    const imageSection = imageUrl ? `
      <div class="product-image">
        <img src="${imageUrl}" alt="${product.productName}" loading="lazy">
      </div>
    ` : `
      <div class="product-image product-image--placeholder">
        <svg class="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <circle cx="8.5" cy="8.5" r="1.5"></circle>
          <polyline points="21,15 16,10 5,21"></polyline>
        </svg>
      </div>
    `;
    
    // Build the complete card HTML structure
    card.innerHTML = `
      ${imageSection}
      <div class="product-info">
        <div class="product-details">
          <div class="product-sku">${product.productCode || 'SKU-000'}</div>
          <h3 class="product-name">${product.productName}</h3>
          <p class="product-material">${product.material || 'Material not specified'}</p>
        </div>
        <div class="product-price">$${(product.wholesalePrice || 0) % 1 === 0 ? (product.wholesalePrice || 0) : (product.wholesalePrice || 0).toFixed(2)}</div>
      </div>
    `;
    
    return card;
  }

  /**
   * Determine image orientation for layout purposes
   * @param {Object} image - Image object from Airtable
   * @returns {string} - 'portrait' or 'landscape'
   */
  getImageOrientation(image) {
    if (!image || !image.thumbnails) {
      return 'landscape'; // Default to landscape for missing images
    }
    
    // Check thumbnails for dimensions (prefer larger sizes for accuracy)
    const thumb = image.thumbnails.large || image.thumbnails.full || image.thumbnails.small;
    
    if (thumb && thumb.width && thumb.height) {
      const aspectRatio = thumb.width / thumb.height;
      
      // Portrait if significantly taller than wide
      return aspectRatio < 0.9 ? 'portrait' : 'landscape';
    }
    
    return 'landscape'; // Default fallback
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

// ============================================================================
  // LINE SHEET GENERATION METHODS (Phase 2.1)
  // ============================================================================

  /**
   * Generate complete line sheet HTML document
   * @returns {string} Complete HTML document for line sheet
   */
  generateLinesheetHTML() {
    if (!this.state.organizedProducts) {
      throw new Error('No organized product data available for line sheet generation');
    }

    const { organizedProducts, config } = this.state;
    const { categories, summary } = organizedProducts;

    // Generate document sections
    const coverPageHTML = this.generateCoverPage(config);
    const tocHTML = this.generateTableOfContents(organizedProducts);
    const catalogHTML = this.generateProductCatalog(organizedProducts, config);

    // Combine into complete document
    const completeHTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Gilty Boy - Line Sheet</title>
        <style>
          ${this.getLinesheetCSS()}
        </style>
      </head>
      <body class="linesheet-document">
        ${coverPageHTML}
        ${tocHTML}
        ${catalogHTML}
      </body>
      </html>
    `;

    return completeHTML;
  }

  /**
   * Generate cover page HTML
   * @param {Object} config - Application configuration
   * @returns {string} Cover page HTML
   */
  generateCoverPage(config) {
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `
      <div class="cover-page">
        <div class="cover-content">
          <div class="brand-section">
            <h1 class="brand-name">Gilty Boy</h1>
            <p class="brand-tagline">Wholesale Jewelry Collection</p>
          </div>
          
          <div class="cover-details">
            <div class="detail-item">
              <span class="detail-label">Collection Date:</span>
              <span class="detail-value">${currentDate}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Total Products:</span>
              <span class="detail-value">${this.state.organizedProducts.summary.totalProducts}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Categories:</span>
              <span class="detail-value">${this.state.organizedProducts.summary.totalCategories}</span>
            </div>
          </div>
          
          <div class="contact-section">
            <h3>Contact Information</h3>
            <p>For wholesale inquiries and orders</p>
            <p>Email: wholesale@giltyboy.com</p>
            <p>Phone: (555) 123-4567</p>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Generate table of contents HTML
   * @param {Object} organizedProducts - Organized product data
   * @returns {string} Table of contents HTML
   */
  generateTableOfContents(organizedProducts) {
    const { tableOfContents } = organizedProducts;
    
    let tocHTML = `
      <div class="table-of-contents">
        <h2>Table of Contents</h2>
        <div class="toc-entries">
    `;

    tableOfContents.forEach(item => {
      if (item.type === 'category') {
        tocHTML += `
          <div class="toc-category">
            <span class="toc-category-name">${item.name}</span>
            <span class="toc-dots"></span>
            <span class="toc-page">${item.page}</span>
          </div>
        `;
      } else if (item.type === 'material') {
        tocHTML += `
          <div class="toc-material">
            <span class="toc-material-name">${item.name}</span>
            <span class="toc-count">(${item.count} pieces)</span>
            <span class="toc-dots"></span>
            <span class="toc-page">${item.page}</span>
          </div>
        `;
      }
    });

    tocHTML += `
        </div>
      </div>
    `;

    return tocHTML;
  }

  /**
   * Generate product catalog HTML
   * @param {Object} organizedProducts - Organized product data
   * @param {Object} config - Application configuration
   * @returns {string} Product catalog HTML
   */
  generateProductCatalog(organizedProducts, config) {
    const { categories } = organizedProducts;
    
    let catalogHTML = `<div class="product-catalog">`;

    // Generate each category section
    Object.keys(categories).sort().forEach(categoryName => {
      const categoryData = categories[categoryName];
      
      catalogHTML += `
        <div class="category-section">
          <div class="category-header">
            <h2 class="category-title">${categoryData.displayName || categoryName}</h2>
            <p class="category-stats">${categoryData.totalCount} Products | $${categoryData.totalWholesaleValue.toFixed(2)} Total Value</p>
          </div>
      `;

      // Generate material subsections
      Object.keys(categoryData.byMaterial).sort().forEach(materialName => {
        const materialProducts = categoryData.byMaterial[materialName];
        
        catalogHTML += `
          <div class="material-section">
            <h3 class="material-title">${materialName}</h3>
            <div class="product-grid">
        `;

        // Generate product cards
        materialProducts.forEach(product => {
          catalogHTML += this.createLinesheetProductCard(product, config);
        });

        catalogHTML += `
            </div>
          </div>
        `;
      });

      catalogHTML += `</div>`;
    });

    catalogHTML += `</div>`;
    return catalogHTML;
  }

  /**
   * Create a product card optimized for line sheet display
   * @param {Object} product - Product data
   * @param {Object} config - Application configuration
   * @returns {string} Product card HTML
   */
  createLinesheetProductCard(product, config) {
    const imageUrl = product.imageUrl || '/api/placeholder/300/300';
    const productName = product.productName || 'Unnamed Product';
    const productCode = product.productCode || 'N/A';
    const wholesalePrice = product.wholesalePrice ? `$${product.wholesalePrice.toFixed(2)}` : 'Price on Request';
    const material = product.material || 'Mixed Materials';
    const description = product.description || '';

    return `
      <div class="linesheet-product-card">
        <div class="product-image-container">
          <img src="${imageUrl}" alt="${productName}" class="product-image" loading="lazy">
        </div>
        <div class="product-info">
          <h4 class="product-name">${productName}</h4>
          <p class="product-code">SKU: ${productCode}</p>
          <p class="product-material">${material}</p>
          <p class="product-price">${wholesalePrice}</p>
          ${description ? `<p class="product-description">${description}</p>` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Get CSS styles for line sheet document
   * @returns {string} CSS styles
   */
  getLinesheetCSS() {
    return `
      /* Line Sheet Document Styles */
      .linesheet-document {
        font-family: ${this.state.config.customization.font}, serif;
        line-height: 1.6;
        color: #333;
        max-width: 8.5in;
        margin: 0 auto;
        background: white;
      }

      /* Cover Page */
      .cover-page {
        page-break-after: always;
        height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 2in;
      }

      .brand-name {
        font-size: 3rem;
        font-weight: bold;
        margin-bottom: 0.5rem;
        color: #2c3e50;
      }

      .brand-tagline {
        font-size: 1.2rem;
        color: #7f8c8d;
        margin-bottom: 2rem;
      }

      .cover-details {
        margin: 2rem 0;
      }

      .detail-item {
        display: flex;
        justify-content: space-between;
        margin: 0.5rem 0;
        padding: 0.5rem;
        border-bottom: 1px solid #eee;
      }

      .detail-label {
        font-weight: bold;
      }

      .contact-section {
        margin-top: 2rem;
        padding-top: 2rem;
        border-top: 2px solid #34495e;
      }

      /* Table of Contents */
      .table-of-contents {
        page-break-after: always;
        padding: 1in;
      }

      .table-of-contents h2 {
        font-size: 2rem;
        margin-bottom: 1rem;
        color: #2c3e50;
      }

      .toc-category {
        display: flex;
        align-items: center;
        margin: 1rem 0;
        font-weight: bold;
        font-size: 1.1rem;
      }

      .toc-material {
        display: flex;
        align-items: center;
        margin: 0.5rem 0;
        margin-left: 1rem;
        font-size: 0.9rem;
      }

      .toc-dots {
        flex: 1;
        border-bottom: 1px dotted #999;
        margin: 0 0.5rem;
      }

      .toc-count {
        font-size: 0.8rem;
        color: #666;
        margin-left: 0.5rem;
      }

      /* Product Catalog */
      .product-catalog {
        padding: 0.5in;
      }

      .category-section {
        page-break-before: always;
        margin-bottom: 2rem;
      }

      .category-header {
        text-align: center;
        margin-bottom: 2rem;
        padding-bottom: 1rem;
        border-bottom: 2px solid #34495e;
      }

      .category-title {
        font-size: 2rem;
        font-weight: bold;
        color: #2c3e50;
        margin-bottom: 0.5rem;
      }

      .category-stats {
        color: #7f8c8d;
        font-size: 1rem;
      }

      .material-section {
        margin-bottom: 2rem;
      }

      .material-title {
        font-size: 1.5rem;
        color: #34495e;
        margin-bottom: 1rem;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid #bdc3c7;
      }

      .product-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
      }

      /* Line Sheet Product Cards */
      .linesheet-product-card {
        border: 1px solid #ddd;
        border-radius: 8px;
        overflow: hidden;
        background: white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        break-inside: avoid;
      }

      .product-image-container {
        width: 100%;
        height: 200px;
        overflow: hidden;
      }

      .product-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .product-info {
        padding: 1rem;
      }

      .product-name {
        font-size: 1.1rem;
        font-weight: bold;
        margin-bottom: 0.5rem;
        color: #2c3e50;
      }

      .product-code {
        font-size: 0.9rem;
        color: #666;
        margin-bottom: 0.25rem;
      }

      .product-material {
        font-size: 0.9rem;
        color: #666;
        margin-bottom: 0.5rem;
      }

      .product-price {
        font-size: 1.1rem;
        font-weight: bold;
        color: #27ae60;
        margin-bottom: 0.5rem;
      }

      .product-description {
        font-size: 0.85rem;
        color: #555;
        line-height: 1.4;
      }

      /* Print Styles */
      @media print {
        .linesheet-document {
          max-width: none;
          margin: 0;
        }
        
        .cover-page {
          height: 100vh;
        }
        
        .category-section {
          page-break-before: always;
        }
        
        .linesheet-product-card {
          break-inside: avoid;
        }
      }
    `;
  }

  /**
   * Show line sheet preview in the UI
   */
  showLinesheetPreview() {
    try {
      const linesheetHTML = this.generateLinesheetHTML();
      const previewPanel = document.getElementById('linesheet-preview-panel');
      const previewContent = document.getElementById('linesheet-preview-content');
      
      if (previewContent) {
        previewContent.innerHTML = linesheetHTML;
      }
      
      if (previewPanel) {
        previewPanel.style.display = 'block';
        previewPanel.scrollIntoView({ behavior: 'smooth' });
      }
      
      this.showSuccess('Line sheet preview generated successfully!');
    } catch (error) {
      console.error('Failed to generate line sheet preview:', error);
      this.showError('Failed to generate line sheet preview. Please ensure products are loaded.');
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