// src/utils/airtable/validator.js
// Data validation utilities for Airtable responses

import { APP_CONFIG } from '../../config/app.config.js';

export class AirtableValidator {
  constructor() {
    this.requiredFields = APP_CONFIG.validation.product.requiredFields;
    this.optionalFields = APP_CONFIG.validation.product.optionalFields;
    this.validImageFormats = APP_CONFIG.validation.product.imageFormats;
    this.maxImageSize = APP_CONFIG.validation.product.maxImageSize;
  }

  // Validate complete product dataset
  validateProductData(products) {
    if (!Array.isArray(products)) {
      throw new Error('Products data must be an array');
    }

    const results = {
      valid: [],
      invalid: [],
      warnings: [],
      summary: {
        total: products.length,
        validCount: 0,
        invalidCount: 0,
        warningCount: 0
      }
    };

    products.forEach((product, index) => {
      try {
        const validation = this.validateProduct(product);
        
        if (validation.isValid) {
          results.valid.push({ index, product, warnings: validation.warnings });
          results.summary.validCount++;
        } else {
          results.invalid.push({ index, product, errors: validation.errors });
          results.summary.invalidCount++;
        }

        if (validation.warnings.length > 0) {
          results.summary.warningCount++;
        }

      } catch (error) {
        results.invalid.push({ 
          index, 
          product, 
          errors: [`Validation error: ${error.message}`] 
        });
        results.summary.invalidCount++;
      }
    });

    return results;
  }

  // Validate individual product
  validateProduct(product) {
    const errors = [];
    const warnings = [];

    // Check if product is an object
    if (!product || typeof product !== 'object') {
      return {
        isValid: false,
        errors: ['Product must be a valid object'],
        warnings: []
      };
    }

    // Validate required fields
    this.requiredFields.forEach(field => {
      const value = this.getFieldValue(product, field);
      
      if (value === null || value === undefined || value === '') {
        errors.push(`Missing required field: ${field}`);
      } else {
        // Field-specific validation
        const fieldValidation = this.validateField(field, value);
        if (!fieldValidation.isValid) {
          errors.push(...fieldValidation.errors);
        }
        warnings.push(...fieldValidation.warnings);
      }
    });

    // Validate optional fields (if present)
    this.optionalFields.forEach(field => {
      const value = this.getFieldValue(product, field);
      
      if (value !== null && value !== undefined && value !== '') {
        const fieldValidation = this.validateField(field, value);
        warnings.push(...fieldValidation.warnings);
        
        // Optional fields can still have errors (like invalid format)
        if (!fieldValidation.isValid) {
          warnings.push(...fieldValidation.errors.map(err => `Optional field ${field}: ${err}`));
        }
      }
    });

    // Check for unexpected fields
    const allValidFields = [...this.requiredFields, ...this.optionalFields, 'id', 'metadata'];
    const productFields = Object.keys(product);
    
    productFields.forEach(field => {
      if (!allValidFields.includes(field) && !this.isMetadataField(field)) {
        warnings.push(`Unexpected field: ${field}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.filter(w => w) // Remove empty warnings
    };
  }

  // Get field value with case-insensitive lookup
  getFieldValue(product, fieldName) {
    // Direct match first
    if (product[fieldName] !== undefined) {
      return product[fieldName];
    }

    // Convert field name to common variations
    const variations = this.getFieldVariations(fieldName);
    
    for (const variation of variations) {
      if (product[variation] !== undefined) {
        return product[variation];
      }
    }

    return null;
  }

  // Generate field name variations
  getFieldVariations(fieldName) {
    return [
      fieldName,
      fieldName.toLowerCase(),
      fieldName.replace(/\s+/g, ''),
      fieldName.replace(/\s+/g, '').toLowerCase(),
      fieldName.replace(/\s+/g, '_'),
      fieldName.replace(/\s+/g, '_').toLowerCase(),
      this.toCamelCase(fieldName),
      this.toPascalCase(fieldName)
    ];
  }

  // Field-specific validation
  validateField(fieldName, value) {
    const errors = [];
    const warnings = [];

    switch (fieldName) {
      case 'SKU':
      case 'Product Code':
        return this.validateProductCode(value);
      
      case 'Name':
      case 'Product Name':
        return this.validateProductName(value);
      
      case 'Wholesale_Price':
      case 'Wholesale Price':
      case 'Retail_Price':
      case 'Retail Price':
        return this.validatePrice(value, fieldName);
      
      case 'Material':
        return this.validateMaterial(value);
      
      case 'Category':
        return this.validateCategory(value);
      
      case 'Photos':
      case 'Images':
        return this.validateImages(value);
      
      case 'Notes':
      case 'Variations':
        return this.validateVariations(value);
      
      case 'Line_Sheet':
      case 'Active':
        return this.validateActive(value);
      
      case 'Status':
        return this.validateStatus(value);
      
      default:
        return { isValid: true, errors: [], warnings: [] };
    }
  }

  validateProductCode(value) {
    const errors = [];
    const warnings = [];

    if (typeof value !== 'string') {
      errors.push('Product Code must be a string');
      return { isValid: false, errors, warnings };
    }

    if (value.length === 0) {
      errors.push('Product Code cannot be empty');
    } else if (value.length > 50) {
      warnings.push('Product Code is unusually long (>50 characters)');
    }

    // Check for special characters that might cause issues
    if (!/^[a-zA-Z0-9-_\s]+$/.test(value)) {
      warnings.push('Product Code contains special characters');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  validateProductName(value) {
    const errors = [];
    const warnings = [];

    if (typeof value !== 'string') {
      errors.push('Product Name must be a string');
      return { isValid: false, errors, warnings };
    }

    if (value.trim().length === 0) {
      errors.push('Product Name cannot be empty');
    } else if (value.length > 200) {
      warnings.push('Product Name is very long (>200 characters)');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  validatePrice(value, fieldName) {
    const errors = [];
    const warnings = [];

    // Accept numbers or strings that can be converted to numbers
    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numValue)) {
      errors.push(`${fieldName} must be a valid number`);
      return { isValid: false, errors, warnings };
    }

    if (numValue < 0) {
      errors.push(`${fieldName} cannot be negative`);
    } else if (numValue === 0) {
      warnings.push(`${fieldName} is set to zero`);
    } else if (numValue > 10000) {
      warnings.push(`${fieldName} is unusually high (>${numValue})`);
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  validateMaterial(value) {
    const warnings = [];

    if (typeof value !== 'string') {
      return { isValid: true, errors: [], warnings: ['Material should be a string'] };
    }

    // Common material types for jewelry
    const commonMaterials = [
      'sterling silver', 'gold', '14k gold', '18k gold', 'rose gold',
      'bronze', 'copper', 'brass', 'platinum', 'titanium', 'stainless steel'
    ];

    if (value && !commonMaterials.some(material => 
      value.toLowerCase().includes(material.toLowerCase())
    )) {
      warnings.push('Material type not recognized as common jewelry material');
    }

    return { isValid: true, errors: [], warnings };
  }

  validateCategory(value) {
    const warnings = [];

    if (typeof value !== 'string') {
      return { isValid: true, errors: [], warnings: ['Category should be a string'] };
    }

    // Common jewelry categories
    const commonCategories = [
      'rings', 'necklaces', 'earrings', 'bracelets', 'pendants',
      'charms', 'anklets', 'pins', 'brooches', 'cufflinks'
    ];

    if (value && !commonCategories.some(category => 
      value.toLowerCase().includes(category.toLowerCase())
    )) {
      warnings.push('Category not recognized as common jewelry category');
    }

    return { isValid: true, errors: [], warnings };
  }

  validateImages(value) {
    const errors = [];
    const warnings = [];

    if (!Array.isArray(value)) {
      warnings.push('Images should be an array');
      return { isValid: true, errors, warnings };
    }

    if (value.length === 0) {
      warnings.push('No images provided for product');
      return { isValid: true, errors, warnings };
    }

    value.forEach((image, index) => {
      if (!image.url) {
        errors.push(`Image ${index + 1} missing URL`);
        return;
      }

      if (image.size && image.size > this.maxImageSize) {
        warnings.push(`Image ${index + 1} exceeds recommended size (${this.maxImageSize} bytes)`);
      }

      if (image.filename) {
        const extension = image.filename.split('.').pop()?.toLowerCase();
        if (extension && !this.validImageFormats.includes(extension)) {
          warnings.push(`Image ${index + 1} has unsupported format: ${extension}`);
        }
      }
    });

    return { isValid: errors.length === 0, errors, warnings };
  }

  validateVariations(value) {
    const warnings = [];

    if (typeof value !== 'string') {
      return { isValid: true, errors: [], warnings: ['Variations should be a string'] };
    }

    if (value.length > 500) {
      warnings.push('Variations text is very long (>500 characters)');
    }

    return { isValid: true, errors: [], warnings };
  }

  validateActive(value) {
    const warnings = [];

    if (typeof value !== 'boolean' && value !== undefined && value !== null) {
      warnings.push('Line_Sheet/Active field should be a checkbox (true/false)');
    }

    return { isValid: true, errors: [], warnings };
  }

  validateStatus(value) {
    const warnings = [];

    if (typeof value !== 'string' && value !== undefined && value !== null) {
      return { isValid: true, errors: [], warnings: ['Status should be text'] };
    }

    return { isValid: true, errors: [], warnings };
  }

  // Utility methods
  isMetadataField(fieldName) {
    const metadataFields = ['id', 'lastModified', 'metadata', 'createdTime'];
    return metadataFields.includes(fieldName);
  }

  toCamelCase(str) {
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    }).replace(/\s+/g, '');
  }

  toPascalCase(str) {
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => {
      return word.toUpperCase();
    }).replace(/\s+/g, '');
  }

  // Generate validation report
  generateReport(validationResults) {
    const { summary, invalid, warnings } = validationResults;
    
    let report = `Validation Report\n`;
    report += `================\n\n`;
    report += `Total products: ${summary.total}\n`;
    report += `Valid: ${summary.validCount}\n`;
    report += `Invalid: ${summary.invalidCount}\n`;
    report += `With warnings: ${summary.warningCount}\n\n`;

    if (invalid.length > 0) {
      report += `Invalid Products:\n`;
      report += `-----------------\n`;
      invalid.forEach(({ index, errors }) => {
        report += `Product ${index + 1}:\n`;
        errors.forEach(error => report += `  - ${error}\n`);
        report += `\n`;
      });
    }

    return report;
  }
}

// Export singleton instance
export default new AirtableValidator();