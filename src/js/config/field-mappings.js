// src/config/field-mappings.js
// Flexible field mapping configuration with auto-discovery fallbacks

export const FIELD_MAPPINGS = {
  // Standard field name → possible Airtable field variations
  productCode: {
    candidates: ['SKU', 'Product Code', 'Product_Code', 'Sku', 'sku', 'Code', 'ID'],
    required: true,
    defaultValue: ''
  },
  
  productName: {
    candidates: ['Name', 'Product Name', 'Product_Name', 'Title', 'ProductName'],
    required: true,
    defaultValue: 'Unnamed Product'
  },
  
  wholesalePrice: {
    candidates: ['Wholesale_Price', 'Wholesale Price', 'WholesalePrice', 'Cost', 'Wholesale'],
    required: true,
    defaultValue: 0,
    type: 'currency'
  },
  
  retailPrice: {
    candidates: ['Retail_Price', 'Retail Price', 'RetailPrice', 'MSRP', 'Retail'],
    required: false,
    defaultValue: 0,
    type: 'currency'
  },
  
  active: {
    candidates: ['Line_Sheet', 'Active', 'Include', 'Enabled', 'Show', 'LineSheet', 'Line Sheet'],
    required: false,
    defaultValue: true,
    type: 'checkbox'
  },
  
  material: {
    candidates: ['Material', 'Materials', 'Mat', 'Type'],
    required: false,
    defaultValue: '',
    type: 'text'
  },
  
  category: {
    candidates: ['Category', 'Categories', 'Cat', 'Type', 'Classification'],
    required: false,
    defaultValue: 'Uncategorized',
    type: 'select'
  },
  
  images: {
    candidates: ['Photos', 'Images', 'Pictures', 'Pics', 'Photo', 'Image'],
    required: false,
    defaultValue: [],
    type: 'attachment'
  },
  
  variations: {
    candidates: ['Notes', 'Variations', 'Description', 'Details', 'Desc', 'Comments'],
    required: false,
    defaultValue: '',
    type: 'text'
  },
  
  status: {
    candidates: ['Status', 'State', 'Condition'],
    required: false,
    defaultValue: '',
    type: 'select'
  }
};

// Pattern-based field detection for unknown fields
export const FIELD_PATTERNS = {
  price: {
    pattern: /price|cost|amount|fee|charge/i,
    type: 'currency',
    standardName: 'price'
  },
  
  name: {
    pattern: /name|title|label/i,
    type: 'text',
    standardName: 'name'
  },
  
  code: {
    pattern: /code|sku|id|number/i,
    type: 'text',
    standardName: 'identifier'
  },
  
  active: {
    pattern: /active|enabled|visible|show|include|line.*sheet/i,
    type: 'checkbox',
    standardName: 'active'
  },
  
  category: {
    pattern: /category|type|class|group/i,
    type: 'select',
    standardName: 'category'
  },
  
  image: {
    pattern: /image|photo|picture|pic|attachment/i,
    type: 'attachment',
    standardName: 'images'
  }
};

// Configuration for query building
export const QUERY_CONFIG = {
  activeProducts: {
    filterTemplate: (activeField) => `{${activeField}} = 1`,
    sortTemplate: (codeField) => [{ field: codeField, direction: 'asc' }]
  },
  
  allProducts: {
    filterTemplate: null, // No filter
    sortTemplate: (codeField) => [{ field: codeField, direction: 'asc' }]
  }
};

export default {
  FIELD_MAPPINGS,
  FIELD_PATTERNS,
  QUERY_CONFIG
};