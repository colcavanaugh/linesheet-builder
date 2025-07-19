// js/features/ProductManager.js
// Product organization and management

import LineSheetOrganizer from '../utils/formatting/linesheet-organizer.js';

export class ProductManager {
  constructor(app) {
    this.app = app;
  }

  // Product Organization (moved from main.js)
  async organizeProducts() {
    try {
      const state = this.app.stateManager.getState();
      if (!state.products || state.products.length === 0) {
        console.warn('No products to organize');
        return;
      }

      // Use LineSheetOrganizer to structure products
      const organizedProducts = LineSheetOrganizer.organizeGiltyBoyProducts(state.products);
      this.app.stateManager.updateState({ organizedProducts });
      
      console.log('✅ Products organized for line sheet:', organizedProducts.summary);
      
    } catch (error) {
      console.error('Failed to organize products:', error);
      this.app.notificationManager.showError('Failed to organize products for line sheet generation.');
    }
  }
}

export default ProductManager;