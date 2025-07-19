// js/generators/LinesheetGenerator.js
// Line sheet HTML document generation

export class LinesheetGenerator {
  constructor(app) {
    this.app = app;
  }

  // LINE SHEET GENERATION METHODS (moved from main.js)
  /**
   * Generate complete line sheet HTML document
   * @returns {string} Complete HTML document for line sheet
   */
  generateLinesheetHTML() {
    const state = this.app.stateManager.getState();
    if (!state.organizedProducts) {
      throw new Error('No organized product data available for line sheet generation');
    }

    const { organizedProducts, config } = state;

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

    const state = this.app.stateManager.getState();

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
              <span class="detail-value">${state.organizedProducts.summary.totalProducts}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Categories:</span>
              <span class="detail-value">${state.organizedProducts.summary.totalCategories}</span>
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
            <p class="category-stats">${categoryData.totalCount} Products | ${categoryData.totalWholesaleValue.toFixed(2)} Total Value</p>
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
    const imageUrl = product.images && product.images.length > 0 ? product.images[0].url : '/api/placeholder/300/300';
    const productName = product.productName || 'Unnamed Product';
    const productCode = product.productCode || 'N/A';
    const wholesalePrice = product.wholesalePrice ? `${product.wholesalePrice.toFixed(2)}` : 'Price on Request';
    const material = product.material || 'Mixed Materials';
    const description = product.variations || '';

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
    const state = this.app.stateManager.getState();
    
    return `
      /* Line Sheet Document Styles */
      .linesheet-document {
        font-family: ${state.config.customization.font}, serif;
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
}

export default LinesheetGenerator;