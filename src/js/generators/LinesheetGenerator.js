// js/generators/LinesheetGenerator.js
// Complete line sheet document generation with external CSS - UPDATED to use linesheet-document.css

export class LinesheetGenerator {
  constructor(app) {
    this.app = app;
  }

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

    // Generate document sections following linesheet-planning.md structure
    const coverPageHTML = this.generateCoverPage(config);
    const tocHTML = this.generateTableOfContents(organizedProducts);
    const catalogHTML = this.generateProductCatalog(organizedProducts, config);

    // Combine into complete document with external CSS link
    const completeHTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Gilty Boy - Line Sheet</title>
        <!-- Link to external linesheet CSS file -->
        <link rel="stylesheet" href="styles/themes/linesheet-document.css">
        <style>
          /* Only minimal, document-specific overrides here if needed */
          ${this.getDocumentSpecificCSS()}
        </style>
      </head>
      <body class="linesheet-document">
        <div class="linesheet-preview-content">
          ${coverPageHTML}
          ${tocHTML}
          ${catalogHTML}
        </div>
      </body>
      </html>
    `;

    return completeHTML;
  }

  /**
   * Convert categories from object to array format
   * @param {Object} organizedProducts - Organized product data
   * @returns {Array} Categories as array with name and products
   */
  getCategoriesAsArray(organizedProducts) {
    const { categories } = organizedProducts;
    
    // If categories is already an array, return as-is
    if (Array.isArray(categories)) {
      return categories;
    }
    
    // If categories is an object, convert to array
    if (categories && typeof categories === 'object') {
      return Object.keys(categories).map(categoryKey => {
        const categoryData = categories[categoryKey];
        return {
          name: categoryData.displayName || categoryKey,
          products: categoryData.products || [],
          ...categoryData // include other properties like totalCount, totalWholesaleValue
        };
      });
    }
    
    // Fallback: empty array
    console.warn('⚠️ Categories not found in expected format');
    return [];
  }

  /**
   * Generate cover page HTML
   * @param {Object} config - Application configuration
   * @returns {string} Cover page HTML
   */
  generateCoverPage(config) {
    const state = this.app.stateManager.getState();
    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    const productCount = state.products.filter(p => p.active).length;
    
    // FIXED: Handle both array and object categories
    const categoriesArray = this.getCategoriesAsArray(state.organizedProducts);
    const categoryCount = categoriesArray.length;

    return `
  <div class="cover-page">
    <div class="cover-content">
      <h1 class="brand-name">GiltyBoy</h1>
      <p class="brand-tagline">Contemporary queer jewelry design</p>
      
      <div class="brand-statement">
        <p>GiltyBoy is a contemporary fine jewelry brand founded in 2021 by Trevor Mock. Working from their studio in Tucson, Trevor combines traditional lost wax casting and metalsmithing techniques with modern design to create pieces that are both meaningful and beautifully crafted. </p>
        <br>
        <p>The brand's signature collection transforms symbols of queer desire and sexuality into precious wearable art. Alongside these bold statement pieces, GiltyBoy offers a selection of classic, elegant designs that appeal to diverse audiences seeking exceptional handcrafted jewelry with timeless appeal.</p>
      </div>
      
      <div class="contact-section">
        <div class="ordering-instructions">
          <h3>Partnership Guidelines</h3>
          <ol>
            <li>Review our complete collection featuring both signature queer designs and classic pieces</li>
            <li>Minimum opening order: $250 wholesale value</li>
            <li>Standard lead time: 2-3 weeks for most pieces</li>
            <li>Payment terms: Net 30 for approved accounts, 50% deposit for new partners</li>
            <li>Free shipping on wholesale orders over $500</li>
          </ol>
        </div>
      </div>

      <div class="artist-info">
          <p><strong>Artist:</strong> Trevor Mock</p>
          <p><strong>Email:</strong> giltyboyco@gmail.com</p>
          <p><strong>Instagram:</strong> @giltyboy</p>
          <p><strong>Website:</strong> www.giltyboy.com</p>
      </div>
    </div>
  </div>
  `;
  }

  /**
   * Generate table of contents HTML with multi-page support (matches catalog styling)
   * @param {Object} organizedProducts - Organized product data
   * @returns {string} Table of contents HTML (potentially multiple pages)
   */
  generateTableOfContents(organizedProducts) {
    // Convert object categories to array
    const categoriesArray = this.getCategoriesAsArray(organizedProducts);
    const { summary } = organizedProducts;
    
    // Calculate if we need multiple TOC pages
    const tocItems = this.calculateTOCItems(categoriesArray);
    const maxItemsPerPage = 25; // Approximately fits on one page with proper spacing
    const tocPages = Math.ceil(tocItems.length / maxItemsPerPage);
    
    console.log(`📋 Generating TOC: ${tocItems.length} items across ${tocPages} page(s)`);
    
    let tocHTML = '';
    let overallPageNumber = 2; // TOC starts at page 2 (after cover page)
    
    // Generate each TOC page using SAME PATTERN as catalog sections
    for (let pageNum = 1; pageNum <= tocPages; pageNum++) {
      const startIndex = (pageNum - 1) * maxItemsPerPage;
      const endIndex = Math.min(startIndex + maxItemsPerPage, tocItems.length);
      const pageItems = tocItems.slice(startIndex, endIndex);
      
      const isFirstPage = pageNum === 1;
      
      // MATCH catalog section structure exactly
      tocHTML += `
        <div class="category-section" data-category="table-of-contents" data-section-page="${pageNum}">
          <div class="catalog-header">
            <h2 class="category-title">${isFirstPage ? 'Table of Contents' : 'Table of Contents (continued)'}, page ${pageNum}</h2>
          </div>
          
          <div class="toc-body">
            <div class="toc-content">
              ${this.renderTOCItems(pageItems)}
            </div>
          </div>
          
          <div class="catalog-footer">
            <p class="page-number">${overallPageNumber}</p>
          </div>
        </div>
      `;
      
      overallPageNumber++;
    }
    
    return tocHTML;
  }

  // /**
  //  * Generate TOC header (only for first page) - simplified for consistency
  //  * @param {Object} summary - Product summary data
  //  * @param {number} categoryCount - Number of categories
  //  * @returns {string} TOC header HTML
  //  */
  // generateTOCHeader(summary, categoryCount) {
  //   return `
  //     <div class="toc-header">
  //       <p class="toc-summary">Product catalog overview - ${summary.totalProducts} items across ${categoryCount} categories</p>
  //     </div>
  //   `;
  // }

  /**
   * Calculate all TOC items that need to be displayed
   * @param {Array} categoriesArray - Array of categories with products
   * @returns {Array} Array of TOC items with type, content, and page info
   */
  calculateTOCItems(categoriesArray) {
    const tocItems = [];
    let currentPage = 3; // Start after cover (1) and TOC (2)
    
    categoriesArray.forEach((category, categoryIndex) => {
      const { name, products } = category;
      const categoryPageStart = currentPage;
      
      // Add category header item
      tocItems.push({
        type: 'category',
        name: name,
        page: categoryPageStart,
        productCount: products ? products.length : 0
      });
      
      // Add product items for this category
      if (products && Array.isArray(products)) {
        products.forEach((product, productIndex) => {
          const material = product.material || 'Mixed';
          const wholesalePrice = product.wholesalePrice ? `${product.wholesalePrice}` : 'Contact for pricing';
          
          tocItems.push({
            type: 'product',
            category: name,
            sku: product.sku || product.productCode,
            name: product.name || product.productName,
            material: material,
            price: wholesalePrice,
            page: categoryPageStart
          });
        });
      }
      
      // Calculate pages needed for this category (4 products per page)
      const productsCount = products ? products.length : 0;
      const pagesForCategory = Math.ceil(productsCount / 4);
      currentPage += pagesForCategory;
    });
    
    return tocItems;
  }

  /**
   * Render TOC items for a specific page - handles product wrapping for continuation pages
   * @param {Array} items - TOC items for this page
   * @returns {string} Rendered TOC items HTML
   */
  renderTOCItems(items) {
    let html = '';
    let currentCategory = null;
    let needsProductWrapper = false;
    
    // Check if this page starts with products (continuation from previous page)
    const startsWithProduct = items.length > 0 && items[0].type === 'product';
    
    if (startsWithProduct) {
      // If page starts with products, we need to open a wrapper
      html += `<div class="toc-products">`;
      needsProductWrapper = true;
    }
    
    items.forEach((item, index) => {
      if (item.type === 'category') {
        // Close previous category products if exists
        if (currentCategory || needsProductWrapper) {
          html += `</div>`; // Close toc-products
          needsProductWrapper = false;
        }
        
        // Start new category
        currentCategory = item.name;
        html += `
          <div class="toc-category">
            <h3 class="category-name">${item.name}</h3>
            <span class="category-page">Page ${item.page}</span>
          </div>
          <div class="toc-products">
        `;
      } else if (item.type === 'product') {
        // Add product row
        html += `
          <div class="toc-product-row">
            <span class="product-sku">${item.sku}</span>
            <span class="product-name" style="font-weight: 300; font-size: 0.8rem;">${item.name}</span>
            <span class="product-material">${item.material}</span>
            <span class="product-price">
              $${(Number(item.price) || 0) % 1 === 0 
                  ? Number(item.price || 0) 
                  : Number(item.price || 0).toFixed(2)}
            </span>
          </div>
        `;
      }
    });
    
    // Close final category products or continuation wrapper if exists
    if (currentCategory || needsProductWrapper) {
      html += `</div>`; // Close toc-products
    }
    
    return html;
  }

  /**
   * Check if TOC needs pagination based on content volume
   * @param {Array} categoriesArray - Categories data
   * @returns {Object} Pagination info
   */
  calculateTOCPagination(categoriesArray) {
    const totalProducts = categoriesArray.reduce((sum, cat) => {
      return sum + (cat.products ? cat.products.length : 0);
    }, 0);
    
    const categoriesCount = categoriesArray.length;
    
    // Estimate TOC length:
    // - Each category header: ~2 lines
    // - Each product: ~1 line
    // - Spacing and formatting: ~20% overhead
    const estimatedLines = (categoriesCount * 2) + totalProducts;
    const estimatedLinesWithSpacing = Math.ceil(estimatedLines * 1.2);
    
    // Approximate lines per page (with headers, footers, margins)
    const linesPerPage = 40;
    const estimatedPages = Math.ceil(estimatedLinesWithSpacing / linesPerPage);
    
    return {
      totalItems: totalProducts + categoriesCount,
      estimatedLines: estimatedLinesWithSpacing,
      estimatedPages: Math.max(1, estimatedPages),
      needsPagination: estimatedPages > 1
    };
  }

  /**
   * Generate product catalog HTML with section-based rendering
   * @param {Object} organizedProducts - Organized product data  
   * @param {Object} config - Application configuration
   * @returns {string} Product catalog HTML
   */
  generateProductCatalog(organizedProducts, config) {
    // FIXED: Convert object categories to array
    const categoriesArray = this.getCategoriesAsArray(organizedProducts);
    
    let catalogHTML = '';
    let overallPageNumber = 2; // Start after cover page and TOC
    
    categoriesArray.forEach((category, categoryIndex) => {
      const { name, products } = category;
      let sectionPageNumber = 1; // Reset for each category section
      
      // Skip if no products in this category
      if (!products || !Array.isArray(products) || products.length === 0) {
        console.warn(`⚠️ No products found for category: ${name}`);
        return;
      }
      
      // Generate pages for this category (4 products per page as specified in linesheet-planning.md)
      for (let i = 0; i < products.length; i += 4) {
        const pageProducts = products.slice(i, i + 4);
        
        catalogHTML += `
          <div class="category-section" data-category="${name}" data-section-page="${sectionPageNumber}">
            <div class="catalog-header">
              <h2 class="category-title">${name}, page ${sectionPageNumber}</h2>
            </div>
            
            <div class="catalog-body">
              <div class="product-grid">
                ${pageProducts.map(product => this.createLinesheetProductCard(product, config)).join('')}
              </div>
            </div>
            
            <div class="catalog-footer">
              <p class="page-number">${overallPageNumber}</p>
            </div>
          </div>
        `;
        
        sectionPageNumber++;
        overallPageNumber++;
      }
    });
    
    return catalogHTML;
  }

  /**
   * Create print-optimized product card for line sheet
   * @param {Object} product - Product data
   * @param {Object} config - Application configuration
   * @returns {string} Product card HTML
   */
  createLinesheetProductCard(product, config) {
    const { 
      name, 
      productName,
      sku, 
      productCode,
      material, 
      wholesalePrice, 
      description, 
      images,
      imageOrientation 
    } = product;
    
    // Handle different field name variations
    const displayName = name || productName || 'Unnamed Product';
    const displaySKU = sku || productCode || 'NO-SKU';
    
    // Get primary image with fallback
    const primaryImage = images && images.length > 0 ? images[0] : null;
    const imageUrl = primaryImage?.url || 'https://via.placeholder.com/300x300/f5f5f5/888?text=No+Image';
    const imageAlt = primaryImage?.alt || `${displayName} product image`;
    
    // CRITICAL: Determine layout based on image orientation (like UIManager does)
    const orientation = this.getImageOrientation(primaryImage);
    const orientationClass = orientation === 'portrait' ? 'portrait' : 'landscape';
    
    // Format pricing
    const priceDisplay = wholesalePrice ? `${wholesalePrice}` : 'Contact for pricing';
    
    return `
      <div class="linesheet-product-card ${orientationClass}" data-sku="${displaySKU}">
        <div class="product-image-container">
          <img src="${imageUrl}" alt="${imageAlt}" class="product-image" loading="lazy" />
        </div>
        <div class="product-info">
          <div class="product-details">
            <p class="product-code">${displaySKU}</p>
            <h4 class="product-name">${displayName}</h4>
            ${material ? `<p class="product-material">${material}</p>` : ''}
          </div>
          <div class="product-price">
            $${(Number(priceDisplay) || 0) % 1 === 0 
                ? Number(priceDisplay || 0) 
                : Number(priceDisplay || 0).toFixed(2)}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Determine image orientation for layout purposes (matches UIManager.getImageOrientation)
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

  /**
   * Get minimal document-specific CSS overrides
   * Only use this for dynamic values that can't be in the external CSS file
   * @returns {string} Minimal CSS overrides
   */
  getDocumentSpecificCSS() {
    const state = this.app.stateManager.getState();
    
    // Only include CSS that needs to be dynamic based on app state
    return `
      /* Dynamic font family from user configuration */
      .linesheet-preview-content {
        font-family: ${state.config.customization.font || 'Cardo'}, serif;
      }
      
      /* Dynamic brand colors if they exist in config */
      ${state.config.customization.primaryColor ? `
        :root {
          --linesheet-brand-primary: ${state.config.customization.primaryColor};
        }
      ` : ''}
      
      ${state.config.customization.secondaryColor ? `
        :root {
          --linesheet-brand-secondary: ${state.config.customization.secondaryColor};
        }
      ` : ''}
    `;
  }
}

export default LinesheetGenerator;