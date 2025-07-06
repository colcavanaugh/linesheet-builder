// src/config/app.config.js
// Core application configuration

export const APP_CONFIG = {
  // Application metadata
  name: 'Gilty Boy Line Sheet Builder',
  version: '1.0.0',
  description: 'Professional wholesale catalog generator',
  
  // Environment settings
  environment: import.meta.env.MODE || 'development',
  isDevelopment: import.meta.env.MODE === 'development',
  isProduction: import.meta.env.MODE === 'production',
  
  // API configuration
  api: {
    airtable: {
      baseUrl: 'https://api.airtable.com/v0',
      version: 'v0',
      rateLimit: {
        requestsPerSecond: 5,
        maxRetries: 3,
        retryDelay: 1000
      }
    }
  },
  
  // Template settings
  templates: {
    default: 'modern',
    available: ['modern', 'classic', 'minimal'],
    paths: {
      modern: '/templates/linesheet/modern',
      classic: '/templates/linesheet/classic',
      minimal: '/templates/linesheet/minimal'
    }
  },
  
  // Export settings
  export: {
    pdf: {
      format: 'Letter',
      margins: {
        top: '0.5in',
        bottom: '0.5in',
        left: '0.5in',
        right: '0.5in'
      },
      quality: 'high',
      printBackground: true
    },
    markdown: {
      includeImages: true,
      includeMetadata: true
    }
  },
  
  // UI settings
  ui: {
    theme: {
      primary: '#64748b',
      secondary: '#f8fafc',
      accent: '#0f172a'
    },
    fonts: {
      brand: ['Playfair Display', 'serif'],
      body: ['Inter', 'sans-serif']
    },
    layout: {
      maxWidth: '1200px',
      breakpoints: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px'
      }
    }
  },
  
  // Feature flags
  features: {
    multipleTemplates: true,
    customFonts: true,
    bulkExport: false, // Future feature
    emailIntegration: false, // Future feature
    inventoryTracking: false // Future feature
  },
  
  // Data validation rules
  validation: {
    product: {
      // FIXED: Use standardized field names that match the smart field mapper output
      requiredFields: ['productCode', 'productName', 'wholesalePrice'],
      optionalFields: ['material', 'retailPrice', 'variations', 'images', 'category', 'active', 'status'],
      imageFormats: ['jpg', 'jpeg', 'png', 'webp'],
      maxImageSize: 5 * 1024 * 1024 // 5MB
    }
  },
  
  // Cache settings
  cache: {
    airtableData: {
      ttl: 5 * 60 * 1000, // 5 minutes
      maxSize: 100 // max products to cache
    },
    images: {
      ttl: 30 * 60 * 1000, // 30 minutes
      maxSize: 50 // max images to cache
    }
  },
  
  // Error messages
  messages: {
    errors: {
      airtable: {
        connection: 'Unable to connect to Airtable. Please check your API credentials.',
        rateLimit: 'Too many requests. Please wait a moment and try again.',
        notFound: 'Product data not found. Please verify your base and table settings.',
        invalidData: 'Invalid product data received from Airtable.'
      },
      export: {
        pdfGeneration: 'Failed to generate PDF. Please try again.',
        noProducts: 'No products available to export. Please check your Airtable data.',
        templateError: 'Template loading failed. Please try a different template.'
      },
      general: {
        networkError: 'Network connection error. Please check your internet connection.',
        unknownError: 'An unexpected error occurred. Please refresh and try again.'
      }
    },
    success: {
      dataLoaded: 'Product data loaded successfully!',
      pdfExported: 'Line sheet exported successfully!',
      configSaved: 'Settings saved successfully!'
    }
  }
};

// Environment-specific overrides
if (APP_CONFIG.isDevelopment) {
  APP_CONFIG.api.airtable.rateLimit.requestsPerSecond = 10; // More relaxed for dev
  APP_CONFIG.cache.airtableData.ttl = 1 * 60 * 1000; // 1 minute for faster dev iteration
}

// Helper functions
export const getApiUrl = (endpoint) => {
  return `${APP_CONFIG.api.airtable.baseUrl}${endpoint}`;
};

export const getTemplatePath = (templateName) => {
  return APP_CONFIG.templates.paths[templateName] || APP_CONFIG.templates.paths[APP_CONFIG.templates.default];
};

export const isFeatureEnabled = (featureName) => {
  return APP_CONFIG.features[featureName] || false;
};

export const getErrorMessage = (category, type) => {
  return APP_CONFIG.messages.errors[category]?.[type] || APP_CONFIG.messages.errors.general.unknownError;
};

export const getSuccessMessage = (type) => {
  return APP_CONFIG.messages.success[type] || 'Operation completed successfully!';
};

export default APP_CONFIG;