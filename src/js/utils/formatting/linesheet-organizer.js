// src/utils/formatting/linesheet-organizer.js
// Utilities for organizing products into line sheet structure

export class LineSheetOrganizer {
  
  /**
   * Organize products by category and material for line sheet display
   * @param {Array} products - Array of product objects
   * @returns {Object} Organized structure for line sheet
   */
  static organizeProducts(products) {
    // Filter only active products (Line_Sheet = true)
    const activeProducts = products.filter(product => product.active);
    
    // Group by category first
    const byCategory = this.groupByCategory(activeProducts);
    
    // Within each category, group by material
    const organized = {};
    
    Object.keys(byCategory).forEach(category => {
      organized[category] = {
        products: byCategory[category],
        byMaterial: this.groupByMaterial(byCategory[category]),
        totalCount: byCategory[category].length,
        totalWholesaleValue: this.calculateTotalValue(byCategory[category])
      };
    });
    
    return {
      categories: organized,
      summary: this.generateSummary(organized),
      tableOfContents: this.generateTableOfContents(organized)
    };
  }
  
  /**
   * Group products by category
   */
  static groupByCategory(products) {
    return products.reduce((acc, product) => {
      const category = product.category || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(product);
      return acc;
    }, {});
  }
  
  /**
   * Group products by material within a category
   */
  static groupByMaterial(products) {
    return products.reduce((acc, product) => {
      const material = product.material || 'Other';
      if (!acc[material]) {
        acc[material] = [];
      }
      acc[material].push(product);
      return acc;
    }, {});
  }
  
  /**
   * Calculate total wholesale value for a group of products
   */
  static calculateTotalValue(products) {
    return products.reduce((total, product) => {
      return total + (product.wholesalePrice || 0);
    }, 0);
  }
  
  /**
   * Generate summary statistics
   */
  static generateSummary(organizedData) {
    const categories = Object.keys(organizedData);
    let totalProducts = 0;
    let totalValue = 0;
    
    categories.forEach(category => {
      totalProducts += organizedData[category].totalCount;
      totalValue += organizedData[category].totalWholesaleValue;
    });
    
    return {
      totalCategories: categories.length,
      totalProducts,
      totalWholesaleValue: totalValue,
      averageWholesalePrice: totalProducts > 0 ? totalValue / totalProducts : 0,
      categorySummary: categories.map(category => ({
        name: category,
        count: organizedData[category].totalCount,
        value: organizedData[category].totalWholesaleValue,
        materials: Object.keys(organizedData[category].byMaterial)
      }))
    };
  }
  
  /**
   * Generate table of contents structure
   */
  static generateTableOfContents(organizedData) {
    const toc = [];
    let currentPage = 1;
    
    Object.keys(organizedData).sort().forEach(category => {
      const categoryData = organizedData[category];
      
      // Add category header
      toc.push({
        type: 'category',
        name: category,
        page: currentPage,
        count: categoryData.totalCount,
        materials: Object.keys(categoryData.byMaterial)
      });
      
      // Add material subsections
      Object.keys(categoryData.byMaterial).sort().forEach(material => {
        const materialProducts = categoryData.byMaterial[material];
        toc.push({
          type: 'material',
          category,
          name: material,
          page: currentPage,
          count: materialProducts.length,
          products: materialProducts.map(p => ({
            sku: p.productCode,
            name: p.productName,
            price: p.wholesalePrice
          }))
        });
        
        // Estimate pages needed (assuming 6 products per page)
        const pagesNeeded = Math.ceil(materialProducts.length / 6);
        currentPage += pagesNeeded;
      });
    });
    
    return toc;
  }
  
  /**
   * Generate price ranges for categories
   */
  static generatePriceRanges(organizedData) {
    const ranges = {};
    
    Object.keys(organizedData).forEach(category => {
      const products = organizedData[category].products;
      const prices = products.map(p => p.wholesalePrice).filter(p => p > 0);
      
      if (prices.length > 0) {
        ranges[category] = {
          min: Math.min(...prices),
          max: Math.max(...prices),
          average: prices.reduce((a, b) => a + b, 0) / prices.length
        };
      }
    });
    
    return ranges;
  }
  
  /**
   * Sort products within categories (by SKU, then by price)
   */
  static sortProducts(products, sortBy = 'sku') {
    return [...products].sort((a, b) => {
      switch (sortBy) {
        case 'sku':
          return a.productCode.localeCompare(b.productCode);
        case 'name':
          return a.productName.localeCompare(b.productName);
        case 'price':
          return a.wholesalePrice - b.wholesalePrice;
        case 'price-desc':
          return b.wholesalePrice - a.wholesalePrice;
        default:
          return a.productCode.localeCompare(b.productCode);
      }
    });
  }
  
  /**
   * Generate line sheet data specifically for your current products
   */
  static organizeGiltyBoyProducts(products) {
    const organized = this.organizeProducts(products);
    
    // Add specific formatting for Gilty Boy style
    Object.keys(organized.categories).forEach(category => {
      organized.categories[category].displayName = this.formatCategoryName(category);
      
      // Sort products by SKU for consistent ordering
      organized.categories[category].products = this.sortProducts(
        organized.categories[category].products, 
        'sku'
      );
      
      // Sort materials within category
      Object.keys(organized.categories[category].byMaterial).forEach(material => {
        organized.categories[category].byMaterial[material] = this.sortProducts(
          organized.categories[category].byMaterial[material],
          'sku'
        );
      });
    });
    
    return organized;
  }
  
  /**
   * Format category names for display
   */
  static formatCategoryName(category) {
    // Handle plural forms and special cases
    const categoryMap = {
      'Ring': 'RINGS',
      'Rings': 'RINGS', 
      'Necklace': 'NECKLACES',
      'Necklaces': 'NECKLACES',
      'Earring': 'EARRINGS',
      'Earrings': 'EARRINGS',
      'Bracelet': 'BRACELETS',
      'Bracelets': 'BRACELETS'
    };
    
    return categoryMap[category] || category.toUpperCase();
  }
  
  /**
   * Generate line sheet statistics for reporting
   */
  static generateLineSheetStats(organizedData) {
    const stats = {
      timestamp: new Date().toISOString(),
      summary: organizedData.summary,
      priceRanges: this.generatePriceRanges(organizedData.categories),
      categoryBreakdown: [],
      recommendations: []
    };
    
    // Category breakdown
    Object.keys(organizedData.categories).forEach(category => {
      const categoryData = organizedData.categories[category];
      stats.categoryBreakdown.push({
        category,
        productCount: categoryData.totalCount,
        materialCount: Object.keys(categoryData.byMaterial).length,
        averagePrice: categoryData.totalWholesaleValue / categoryData.totalCount,
        priceRange: stats.priceRanges[category]
      });
    });
    
    // Generate recommendations
    if (stats.summary.totalProducts < 10) {
      stats.recommendations.push('Consider adding more products to create a fuller catalog');
    }
    
    if (stats.summary.totalCategories === 1) {
      stats.recommendations.push('Consider expanding into additional product categories');
    }
    
    return stats;
  }
}

export default LineSheetOrganizer;