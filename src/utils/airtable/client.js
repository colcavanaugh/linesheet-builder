// src/utils/airtable/client.js
// Airtable API client with error handling and caching

import { APP_CONFIG, getApiUrl, getErrorMessage } from '../../config/app.config.js';

class AirtableClient {
  constructor() {
    this.accessToken = import.meta.env.VITE_AIRTABLE_ACCESS_TOKEN;
    this.baseId = import.meta.env.VITE_AIRTABLE_BASE_ID;
    this.tableName = import.meta.env.VITE_AIRTABLE_TABLE_NAME || 'Products';
    
    // Request queue for rate limiting
    this.requestQueue = [];
    this.isProcessingQueue = false;
    this.lastRequestTime = 0;
    
    // Cache for API responses
    this.cache = new Map();
    
    // Validate configuration
    this.validateConfig();
  }

  validateConfig() {
    if (!this.accessToken) {
      throw new Error('VITE_AIRTABLE_ACCESS_TOKEN environment variable is required');
    }
    if (!this.baseId) {
      throw new Error('VITE_AIRTABLE_BASE_ID environment variable is required');
    }
    
    // Validate PAT format
    if (!this.accessToken.startsWith('pat')) {
      console.warn('Airtable Personal Access Token should start with "pat"');
    }
    
    // Validate base ID format
    if (!this.baseId.startsWith('app')) {
      console.warn('Airtable base ID should start with "app"');
    }
  }

  // Rate-limited request wrapper
  async makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ url, options, resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const { url, options, resolve, reject } = this.requestQueue.shift();
      
      try {
        // Enforce rate limiting
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        const minInterval = 1000 / APP_CONFIG.api.airtable.rateLimit.requestsPerSecond;
        
        if (timeSinceLastRequest < minInterval) {
          await this.delay(minInterval - timeSinceLastRequest);
        }

        const response = await this.executeRequest(url, options);
        this.lastRequestTime = Date.now();
        resolve(response);
        
      } catch (error) {
        reject(error);
      }
    }

    this.isProcessingQueue = false;
  }

  async executeRequest(url, options = {}) {
    const requestOptions = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    let retries = 0;
    const maxRetries = APP_CONFIG.api.airtable.rateLimit.maxRetries;

    while (retries <= maxRetries) {
      try {
        const response = await fetch(url, requestOptions);
        
        if (!response.ok) {
          await this.handleErrorResponse(response, retries, maxRetries);
          retries++;
          continue;
        }

        const data = await response.json();
        return data;
        
      } catch (error) {
        if (retries === maxRetries) {
          throw new Error(getErrorMessage('airtable', 'connection'));
        }
        
        retries++;
        await this.delay(APP_CONFIG.api.airtable.rateLimit.retryDelay * retries);
      }
    }
  }

  async handleErrorResponse(response, retries, maxRetries) {
    const errorData = await response.json().catch(() => ({}));
    
    switch (response.status) {
      case 401:
        throw new Error('Invalid Airtable Personal Access Token or insufficient permissions');
      case 403:
        throw new Error('Access forbidden. Please check your PAT scopes and base permissions');
      case 404:
        throw new Error(getErrorMessage('airtable', 'notFound'));
      case 422:
        throw new Error('Invalid request format');
      case 429:
        if (retries < maxRetries) {
          const retryAfter = response.headers.get('Retry-After') || 5;
          await this.delay(parseInt(retryAfter) * 1000);
          return;
        }
        throw new Error(getErrorMessage('airtable', 'rateLimit'));
      default:
        if (retries === maxRetries) {
          throw new Error(`Airtable API error: ${response.status} ${response.statusText}`);
        }
    }
  }

  // Fetch all products with pagination
  async getProducts(options = {}) {
    const cacheKey = `products_${JSON.stringify(options)}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < APP_CONFIG.cache.airtableData.ttl) {
        console.log('Returning cached product data');
        return cached.data;
      }
    }

    try {
      const allRecords = [];
      let offset = options.offset;

      do {
        const params = new URLSearchParams({
          maxRecords: options.maxRecords || 100,
          view: options.view || 'Grid view',
          ...options.filterByFormula && { filterByFormula: options.filterByFormula },
          ...options.sort && { sort: JSON.stringify(options.sort) },
          ...offset && { offset }
        });

        const url = getApiUrl(`/${this.baseId}/${this.tableName}?${params}`);
        const response = await this.makeRequest(url);
        
        allRecords.push(...response.records);
        offset = response.offset;
        
      } while (offset);

      const transformedData = this.transformProductData(allRecords);
      
      // Cache the results
      this.cache.set(cacheKey, {
        data: transformedData,
        timestamp: Date.now()
      });

      // Clean up old cache entries
      this.cleanupCache();

      return transformedData;
      
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  // Fetch single product by ID
  async getProduct(recordId) {
    const cacheKey = `product_${recordId}`;
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < APP_CONFIG.cache.airtableData.ttl) {
        return cached.data;
      }
    }

    try {
      const url = getApiUrl(`/${this.baseId}/${this.tableName}/${recordId}`);
      const response = await this.makeRequest(url);
      const transformedData = this.transformProductRecord(response);
      
      this.cache.set(cacheKey, {
        data: transformedData,
        timestamp: Date.now()
      });

      return transformedData;
      
    } catch (error) {
      console.error('Error fetching product:', error);
      throw error;
    }
  }

  // Transform raw Airtable data to application format
  transformProductData(records) {
    return records.map(record => this.transformProductRecord(record));
  }

  transformProductRecord(record) {
    const fields = record.fields;
    
    return {
      id: record.id,
      productCode: fields['SKU'] || fields['Product Code'] || '',
      productName: fields['Name'] || fields['Product Name'] || 'Unnamed Product',
      material: fields['Material'] || '',
      retailPrice: fields['Retail_Price'] || fields['Retail Price'] || 0,
      wholesalePrice: fields['Wholesale_Price'] || fields['Wholesale Price'] || 0,
      variations: fields['Notes'] || fields['Variations'] || '',
      images: this.transformImages(fields['Photos'] || fields['Images'] || []),
      category: fields['Category'] || 'Uncategorized',
      active: fields['Line_Sheet'] !== false && fields['Active'] !== false, // Include if Line_Sheet is checked or Active is true
      status: fields['Status'] || '',
      lastModified: record.createdTime,
      metadata: {
        airtableId: record.id,
        createdTime: record.createdTime
      }
    };
  }

  transformImages(imageFields) {
    if (!Array.isArray(imageFields)) return [];
    
    return imageFields.map(img => ({
      id: img.id,
      url: img.url,
      filename: img.filename,
      size: img.size,
      type: img.type,
      thumbnails: img.thumbnails || {}
    }));
  }

  // Test connection to Airtable
  async testConnection() {
    try {
      const url = getApiUrl(`/${this.baseId}/${this.tableName}?maxRecords=1`);
      await this.makeRequest(url);
      return { success: true, message: 'Successfully connected to Airtable' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Get table schema
  async getTableSchema() {
    try {
      const url = getApiUrl(`/meta/bases/${this.baseId}/tables`);
      const response = await this.makeRequest(url);
      
      const table = response.tables.find(t => t.name === this.tableName);
      if (!table) {
        throw new Error(`Table "${this.tableName}" not found in base`);
      }
      
      return table.fields;
    } catch (error) {
      console.error('Error fetching table schema:', error);
      throw error;
    }
  }

  // Utility methods
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  cleanupCache() {
    if (this.cache.size <= APP_CONFIG.cache.airtableData.maxSize) return;
    
    // Remove oldest entries
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    const toRemove = entries.slice(0, entries.length - APP_CONFIG.cache.airtableData.maxSize);
    toRemove.forEach(([key]) => this.cache.delete(key));
  }

  clearCache() {
    this.cache.clear();
  }

  // Get cache statistics
  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: APP_CONFIG.cache.airtableData.maxSize,
      entries: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export default new AirtableClient();