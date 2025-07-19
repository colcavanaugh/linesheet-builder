// js/features/AirtableManager.js
// Airtable connection and data operations

import AirtableClient from '../utils/airtable/client.js';
import { getSuccessMessage } from '../config/app.config.js';

export class AirtableManager {
  constructor(app) {
    this.app = app;
    this.airtableClient = AirtableClient;
  }

  // Airtable Operations (moved from main.js)
  async connectToAirtable() {
    if (!this.app.uiManager.hasAirtableCredentials()) {
      this.app.notificationManager.showError('Please configure your Airtable Personal Access Token and Base ID in the environment variables.');
      return;
    }

    this.app.uiManager.updateLoadingState(true, 'Connecting to Airtable...');
    
    try {
      // Test connection first
      const connectionTest = await this.airtableClient.testConnection();
      
      if (!connectionTest.success) {
        throw new Error(connectionTest.message);
      }

      // Fetch products
      await this.fetchProducts();
      
      this.app.uiManager.updateConnectionStatus('connected');
      this.app.notificationManager.showSuccess(getSuccessMessage('dataLoaded'));
      
    } catch (error) {
      console.error('Airtable connection failed:', error);
      this.app.notificationManager.showError(error.message);
      this.app.uiManager.updateConnectionStatus('error');
    } finally {
      this.app.uiManager.updateLoadingState(false);
    }
  }

  async testAirtableConnection() {
    try {
      const result = await this.airtableClient.testConnection();
      if (result.success) {
        this.app.uiManager.updateConnectionStatus('ready');
      } else {
        this.app.uiManager.updateConnectionStatus('error');
      }
    } catch (error) {
      this.app.uiManager.updateConnectionStatus('error');
    }
  }

  async fetchProducts() {
    try {
      this.app.uiManager.updateLoadingState(true, 'Loading products from Airtable...');
      
      // Load products from Airtable
      const products = await this.airtableClient.getProducts();
      
      if (!products || products.length === 0) {
        this.app.notificationManager.showWarning('No products found in Airtable. Please check your data.');
        return;
      }

      // Update state
      this.app.stateManager.updateState({ products });
      
      // Organize products for line sheet
      await this.app.productManager.organizeProducts();
      
      // Update UI
      this.app.uiManager.renderProductGrid();
      this.app.uiManager.updateProductCount(products.length);
      
      // Update line sheet stats if products are organized
      const state = this.app.stateManager.getState();
      if (state.organizedProducts) {
        this.app.uiManager.updateLineSheetStats(state.organizedProducts);
      }
      
      this.app.notificationManager.showSuccess(`Successfully loaded ${products.length} products`);
      
    } catch (error) {
      console.error('Failed to load products:', error);
      this.app.notificationManager.showError('Failed to load products. Please check your connection and try again.');
    } finally {
      this.app.uiManager.updateLoadingState(false);
    }
  }

  async refreshData() {
    try {
      this.app.uiManager.updateLoadingState(true, 'Refreshing product data...');
      
      // Clear cache to ensure fresh data
      this.airtableClient.clearCache();
      
      // Reload products
      await this.fetchProducts();
      
      // If preview is currently shown, refresh it
      const previewPanel = document.getElementById('linesheet-preview-panel');
      if (previewPanel && previewPanel.style.display !== 'none') {
        setTimeout(() => {
          this.app.previewManager.showLinesheetPreview();
        }, 500);
      }
      
    } catch (error) {
      console.error('Failed to refresh products:', error);
      this.app.notificationManager.showError('Failed to refresh products. Please try again.');
    } finally {
      this.app.uiManager.updateLoadingState(false);
    }
  }
}

export default AirtableManager;