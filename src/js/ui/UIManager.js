// js/ui/UIManager.js
// UI update and rendering methods

import { APP_CONFIG } from '../config/app.config.js';

export class UIManager {
  constructor(app) {
    this.app = app;
  }

  // Loading and Status Updates (moved from main.js)
  updateLoadingState(isLoading, message = '') {
    this.app.stateManager.updateState({ isLoading });
    
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

  /**
   * Update loading message without changing loading state
   */
  updateLoadingMessage(message) {
    const loadingMessage = document.getElementById('loading-message');
    if (loadingMessage) {
      loadingMessage.textContent = message;
    }
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
    const state = this.app.stateManager.getState();
    const activeCount = state.products.filter(p => p.active).length;
    
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

  // Template and Font Selectors (moved from main.js)
  renderTemplateSelector() {
    const selector = document.getElementById('template-selector');
    if (!selector) return;

    selector.innerHTML = '';
    APP_CONFIG.templates.available.forEach(template => {
      const option = document.createElement('option');
      option.value = template;
      option.textContent = template.charAt(0).toUpperCase() + template.slice(1);
      option.selected = template === this.app.stateManager.getState().config.template;
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
      option.selected = font === this.app.stateManager.getState().config.customization.font;
      selector.appendChild(option);
    });
  }

  // Product Grid Rendering (moved from main.js)
  renderProductGrid() {
    const container = document.getElementById('product-grid');
    if (!container) return;

    const state = this.app.stateManager.getState();
    if (state.products.length === 0) {
      container.innerHTML = '<p class="no-products">No products to display. Connect to Airtable to load your products.</p>';
      return;
    }

    container.innerHTML = '';
    state.products.forEach(product => {
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

  // Preview and Font Methods (moved from main.js)
  renderPreview() {
    // Placeholder for preview rendering
    console.log('Preview rendering will be implemented in Phase 2');
  }

  updateFontPreview() {
    const previewElement = document.getElementById('font-preview');
    if (previewElement) {
      previewElement.style.fontFamily = this.app.stateManager.getState().config.customization.font;
    }
  }

  // Initialize UI (moved from main.js)
  initializeUI() {
    this.updateLoadingState(false);
    this.updateProductCount(0);
    this.renderTemplateSelector();
    this.renderFontSelector();
    this.updateConnectionStatus('disconnected');
  }

  // Utility Methods (moved from main.js)
  hasAirtableCredentials() {
    return !!(import.meta.env.VITE_AIRTABLE_ACCESS_TOKEN && import.meta.env.VITE_AIRTABLE_BASE_ID);
  }
}

export default UIManager;