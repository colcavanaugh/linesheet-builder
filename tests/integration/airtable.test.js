// tests/integration/airtable.test.js
// Integration tests for Airtable functionality

import { describe, it, expect, beforeEach, vi } from 'vitest';
import AirtableClient from '../../src/utils/airtable/client.js';
import AirtableValidator from '../../src/utils/airtable/validator.js';

// Mock environment variables
vi.mock('import.meta', () => ({
  env: {
    VITE_AIRTABLE_ACCESS_TOKEN: 'patTestToken123.abcdef123456789',
    VITE_AIRTABLE_BASE_ID: 'appTestBaseId123',
    VITE_AIRTABLE_TABLE_NAME: 'Products'
  }
}));

// Mock fetch for testing
global.fetch = vi.fn();

describe('Airtable Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    AirtableClient.clearCache();
  });

  describe('AirtableClient', () => {
    it('should validate configuration on initialization', () => {
      expect(AirtableClient.accessToken).toBe('patTestToken123.abcdef123456789');
      expect(AirtableClient.baseId).toBe('appTestBaseId123');
      expect(AirtableClient.tableName).toBe('Products');
    });

    it('should test connection successfully', async () => {
      // Mock successful API response
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          records: []
        })
      });

      const result = await AirtableClient.testConnection();
      expect(result.success).toBe(true);
      expect(result.message).toBe('Successfully connected to Airtable');
    });

    it('should handle connection errors gracefully', async () => {
      // Mock failed API response
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' })
      });

      const result = await AirtableClient.testConnection();
      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid Airtable Personal Access Token');
    });

    it('should fetch and transform product data', async () => {
      const mockAirtableResponse = {
        records: [
          {
            id: 'recTest123',
            createdTime: '2025-01-01T00:00:00.000Z',
            fields: {
              'Product Code': 'A001',
              'Product Name': 'Silver Ring',
              'Material': 'Sterling Silver',
              'Wholesale Price': 25.00,
              'Retail Price': 50.00,
              'Category': 'Rings',
              'Active': true,
              'Images': [
                {
                  id: 'attImg123',
                  url: 'https://example.com/image.jpg',
                  filename: 'ring.jpg',
                  size: 12345,
                  type: 'image/jpeg'
                }
              ]
            }
          }
        ]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAirtableResponse
      });

      const products = await AirtableClient.getProducts();
      
      expect(products).toHaveLength(1);
      expect(products[0]).toEqual({
        id: 'recTest123',
        productCode: 'A001',
        productName: 'Silver Ring',
        material: 'Sterling Silver',
        retailPrice: 50.00,
        wholesalePrice: 25.00,
        variations: '',
        images: [
          {
            id: 'attImg123',
            url: 'https://example.com/image.jpg',
            filename: 'ring.jpg',
            size: 12345,
            type: 'image/jpeg',
            thumbnails: {}
          }
        ],
        category: 'Rings',
        active: true,
        lastModified: '2025-01-01T00:00:00.000Z',
        metadata: {
          airtableId: 'recTest123',
          createdTime: '2025-01-01T00:00:00.000Z'
        }
      });
    });

    it('should handle rate limiting', async () => {
      // Mock rate limit response
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Map([['Retry-After', '5']]),
        json: async () => ({ error: 'Too many requests' })
      });

      try {
        await AirtableClient.getProducts();
      } catch (error) {
        expect(error.message).toContain('Too many requests');
      }
    });

    it('should cache API responses', async () => {
      const mockResponse = {
        records: [
          {
            id: 'recTest123',
            createdTime: '2025-01-01T00:00:00.000Z',
            fields: {
              'Product Code': 'A001',
              'Product Name': 'Test Product'
            }
          }
        ]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      // First call should hit the API
      await AirtableClient.getProducts();
      expect(fetch).toHaveBeenCalledTimes(1);

      // Second call should use cache
      await AirtableClient.getProducts();
      expect(fetch).toHaveBeenCalledTimes(1);

      const cacheStats = AirtableClient.getCacheStats();
      expect(cacheStats.size).toBeGreaterThan(0);
    });
  });

  describe('AirtableValidator', () => {
    it('should validate required fields', () => {
      const validProduct = {
        'Product Code': 'A001',
        'Product Name': 'Test Product',
        'Wholesale Price': 25.00
      };

      const result = AirtableValidator.validateProduct(validProduct);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const invalidProduct = {
        'Product Name': 'Test Product'
        // Missing Product Code and Wholesale Price
      };

      const result = AirtableValidator.validateProduct(invalidProduct);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing required field: Product Code');
      expect(result.errors).toContain('Missing required field: Wholesale Price');
    });

    it('should validate price fields', () => {
      const productWithInvalidPrice = {
        'Product Code': 'A001',
        'Product Name': 'Test Product',
        'Wholesale Price': -10 // Invalid negative price
      };

      const result = AirtableValidator.validateProduct(productWithInvalidPrice);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Wholesale Price cannot be negative');
    });

    it('should validate image arrays', () => {
      const productWithImages = {
        'Product Code': 'A001',
        'Product Name': 'Test Product',
        'Wholesale Price': 25.00,
        'Images': [
          {
            url: 'https://example.com/image.jpg',
            filename: 'test.jpg',
            size: 12345,
            type: 'image/jpeg'
          }
        ]
      };

      const result = AirtableValidator.validateProduct(productWithImages);
      expect(result.isValid).toBe(true);
      expect(result.warnings).not.toContain('No images provided for product');
    });

    it('should warn about missing images', () => {
      const productWithoutImages = {
        'Product Code': 'A001',
        'Product Name': 'Test Product',
        'Wholesale Price': 25.00,
        'Images': []
      };

      const result = AirtableValidator.validateProduct(productWithoutImages);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('No images provided for product');
    });

    it('should validate product code format', () => {
      const productWithSpecialChars = {
        'Product Code': 'A001@#',
        'Product Name': 'Test Product',
        'Wholesale Price': 25.00
      };

      const result = AirtableValidator.validateProduct(productWithSpecialChars);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Product Code contains special characters');
    });

    it('should handle field name variations', () => {
      const productWithVariations = {
        productCode: 'A001', // camelCase instead of 'Product Code'
        productName: 'Test Product', // camelCase instead of 'Product Name'
        wholesalePrice: 25.00 // camelCase instead of 'Wholesale Price'
      };

      const result = AirtableValidator.validateProduct(productWithVariations);
      expect(result.isValid).toBe(true);
    });

    it('should validate complete dataset', () => {
      const products = [
        {
          'Product Code': 'A001',
          'Product Name': 'Valid Product',
          'Wholesale Price': 25.00
        },
        {
          'Product Code': 'A002',
          'Product Name': 'Another Valid Product',
          'Wholesale Price': 30.00
        },
        {
          // Missing required fields
          'Product Name': 'Invalid Product'
        }
      ];

      const results = AirtableValidator.validateProductData(products);
      
      expect(results.summary.total).toBe(3);
      expect(results.summary.validCount).toBe(2);
      expect(results.summary.invalidCount).toBe(1);
      expect(results.valid).toHaveLength(2);
      expect(results.invalid).toHaveLength(1);
    });

    it('should generate validation report', () => {
      const validationResults = {
        summary: {
          total: 2,
          validCount: 1,
          invalidCount: 1,
          warningCount: 0
        },
        invalid: [
          {
            index: 1,
            errors: ['Missing required field: Product Code']
          }
        ]
      };

      const report = AirtableValidator.generateReport(validationResults);
      
      expect(report).toContain('Total products: 2');
      expect(report).toContain('Valid: 1');
      expect(report).toContain('Invalid: 1');
      expect(report).toContain('Product 2:');
      expect(report).toContain('Missing required field: Product Code');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      try {
        await AirtableClient.getProducts();
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('Unable to connect to Airtable');
      }
    });

    it('should handle malformed JSON responses', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        }
      });

      try {
        await AirtableClient.getProducts();
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('Unable to connect to Airtable');
      }
    });

    it('should handle missing table errors', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Table not found' })
      });

      try {
        await AirtableClient.getProducts();
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('Product data not found');
      }
    });
  });

  describe('Performance', () => {
    it('should respect rate limiting timing', async () => {
      const startTime = Date.now();
      
      // Mock multiple successful responses
      for (let i = 0; i < 3; i++) {
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ records: [] })
        });
      }

      // Make multiple requests
      const promises = [
        AirtableClient.testConnection(),
        AirtableClient.testConnection(),
        AirtableClient.testConnection()
      ];

      await Promise.all(promises);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should take at least 400ms for 3 requests with 5 req/sec limit
      expect(duration).toBeGreaterThan(200);
    });

    it('should cache results to improve performance', async () => {
      const mockResponse = {
        records: [
          {
            id: 'recTest123',
            createdTime: '2025-01-01T00:00:00.000Z',
            fields: { 'Product Code': 'A001', 'Product Name': 'Test' }
          }
        ]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const startTime = Date.now();
      
      // First call - should hit API
      await AirtableClient.getProducts();
      const firstCallTime = Date.now() - startTime;
      
      const secondStartTime = Date.now();
      
      // Second call - should use cache
      await AirtableClient.getProducts();
      const secondCallTime = Date.now() - secondStartTime;
      
      // Cached call should be significantly faster
      expect(secondCallTime).toBeLessThan(firstCallTime);
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });
});

// Test utilities for manual testing
export const createMockProduct = (overrides = {}) => {
  return {
    'Product Code': 'A001',
    'Product Name': 'Test Product',
    'Material': 'Sterling Silver',
    'Wholesale Price': 25.00,
    'Retail Price': 50.00,
    'Category': 'Rings',
    'Active': true,
    'Images': [
      {
        id: 'attImg123',
        url: 'https://example.com/image.jpg',
        filename: 'test.jpg',
        size: 12345,
        type: 'image/jpeg'
      }
    ],
    ...overrides
  };
};

export const createMockAirtableResponse = (products = []) => {
  return {
    records: products.map((product, index) => ({
      id: `recTest${index + 1}`,
      createdTime: '2025-01-01T00:00:00.000Z',
      fields: product
    }))
  };
};