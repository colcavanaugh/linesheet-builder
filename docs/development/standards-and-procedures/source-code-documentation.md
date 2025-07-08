# Source Code Documentation Standards

## Table of Contents

- [Overview](#overview)
- [JavaScript Documentation](#javascript-documentation)
  - [Documentation Tool](#documentation-tool)
  - [File Structure Documentation](#file-structure-documentation)
  - [Function Documentation](#function-documentation)
  - [Class Documentation](#class-documentation)
  - [Method Documentation](#method-documentation)
  - [Special Documentation Tags](#special-documentation-tags)
  - [Code Examples in Documentation](#code-examples-in-documentation)
  - [Error Documentation](#error-documentation)
  - [Constants and Configuration](#constants-and-configuration)
- [HTML Documentation](#html-documentation)
- [CSS Documentation](#css-documentation)
- [Configuration File Documentation](#configuration-file-documentation)
- [Documentation Quality Standards](#documentation-quality-standards)
- [Maintenance Guidelines](#maintenance-guidelines)
- [Integration with Development Workflow](#integration-with-development-workflow)

## Overview

This document establishes the standards and conventions for documenting source code in the Gilty Boy Line Sheet Builder project. While the project is primarily JavaScript-based, this guide covers documentation approaches for all file types used in the project to ensure maintainability, readability, and ease of onboarding for future developers.

## JavaScript Documentation

We use **JSDoc** as our primary documentation standard. JSDoc is the most widely adopted JavaScript documentation tool and integrates well with modern IDEs and development workflows.

### Why JSDoc?

- **Industry Standard**: Most widely used JavaScript documentation format
- **IDE Integration**: Excellent support in VS Code, WebStorm, and other editors
- **Type Safety**: Provides type hints for better development experience
- **Auto-Generation**: Can generate HTML documentation automatically
- **Tooling**: Works seamlessly with ESLint, TypeScript, and other tools

### File Structure Documentation

#### File Header
Every JavaScript file should begin with a comprehensive header comment:

```javascript
/**
 * @fileoverview Brief description of the file's purpose and functionality
 * 
 * This file handles [specific responsibility]. It provides [key capabilities]
 * and is used by [main consumers of this module].
 * 
 * @author Gilty Boy Line Sheet Builder
 * @version 1.0.0
 * @since 2025-01-01
 * @module ModuleName
 */
```

#### Import/Export Documentation
Document imports and exports to clarify dependencies:

```javascript
// External dependencies
import AirtableClient from '../utils/airtable/client.js';
import { APP_CONFIG } from '../config/app.config.js';

// Internal utilities
import { formatPrice, sanitizeString } from './helpers.js';

/**
 * @exports {Class} LineSheetBuilder - Main class for building line sheets
 * @exports {Function} generatePDF - Utility function for PDF generation
 */
```

### Function Documentation

#### Function Header Structure
Every function should include comprehensive JSDoc comments:

```javascript
/**
 * Brief description of what the function does
 * 
 * More detailed description if needed. Explain the purpose,
 * algorithm, or business logic. Include usage notes or
 * important behavior details.
 * 
 * @async (if function is async)
 * @param {Type} paramName - Description of parameter
 * @param {Type} [optionalParam] - Description of optional parameter
 * @param {Object} [options={}] - Configuration object
 * @param {boolean} [options.flag=true] - Description of option property
 * 
 * @returns {Promise<Type>|Type} Description of return value
 * @throws {Error} When specific error conditions occur
 * 
 * @example
 * // Basic usage
 * const result = await functionName(param1, param2);
 * 
 * // Advanced usage with options
 * const result = await functionName(param1, param2, {
 *   flag: false,
 *   customOption: 'value'
 * });
 * 
 * @see {@link RelatedFunction} for related functionality
 * @since 1.0.0
 */
```

#### Parameter Types
Use specific, descriptive types:

```javascript
/**
 * @param {string} productId - Unique product identifier
 * @param {Array<Object>} products - Array of product objects
 * @param {Object} product - Product object
 * @param {string} product.name - Product name
 * @param {number} product.price - Product price in dollars
 * @param {boolean} [product.active=true] - Whether product is active
 * @param {('small'|'medium'|'large')} size - Product size options
 * @param {Function} callback - Callback function to execute
 * @param {RegExp} pattern - Regular expression for validation
 */
```

### Class Documentation

#### Class Header
Classes require comprehensive documentation:

```javascript
/**
 * Class description explaining purpose and responsibilities
 * 
 * Detailed explanation of the class functionality, its role in the
 * application, and key usage patterns. Include information about
 * state management, lifecycle, and important behaviors.
 * 
 * @class
 * @classdesc Extended description if needed
 * 
 * @example
 * // Basic instantiation
 * const instance = new ClassName(config);
 * 
 * // Using main methods
 * const result = await instance.mainMethod(data);
 * 
 * @since 1.0.0
 */
class ClassName {
  /**
   * Creates an instance of ClassName
   * 
   * @constructor
   * @param {Object} config - Configuration object
   * @param {string} config.apiKey - API key for authentication
   * @param {boolean} [config.enableCache=true] - Whether to enable caching
   * @throws {Error} When required configuration is missing
   */
  constructor(config) {
    // Implementation
  }
}
```

#### Property Documentation
Document important class properties:

```javascript
class ClassName {
  constructor(config) {
    /** @type {string} The API key for authentication */
    this.apiKey = config.apiKey;
    
    /** @type {Map<string, Object>} Cache for API responses */
    this.cache = new Map();
    
    /** @type {number} Cache expiry time in milliseconds */
    this.cacheExpiry = 5 * 60 * 1000;
  }
}
```

### Method Documentation

#### Public Methods
All public methods require full documentation:

```javascript
/**
 * Fetches product data from the API
 * 
 * Retrieves all products matching the specified criteria. Results
 * are cached for 5 minutes to improve performance. Use the refresh
 * option to bypass cache when needed.
 * 
 * @async
 * @public
 * @param {Object} [criteria={}] - Search criteria
 * @param {string} [criteria.category] - Filter by category
 * @param {boolean} [criteria.activeOnly=true] - Only active products
 * @param {Object} [options={}] - Request options
 * @param {boolean} [options.useCache=true] - Whether to use cached data
 * @param {boolean} [options.refresh=false] - Force refresh from API
 * 
 * @returns {Promise<Array<Object>>} Array of product objects
 * @throws {Error} When API request fails
 * @throws {ValidationError} When criteria format is invalid
 * 
 * @example
 * // Get all active products
 * const products = await client.getProducts();
 * 
 * // Get products in specific category
 * const rings = await client.getProducts({ category: 'Rings' });
 * 
 * // Force refresh from API
 * const fresh = await client.getProducts({}, { refresh: true });
 */
async getProducts(criteria = {}, options = {}) {
  // Implementation
}
```

#### Private Methods
Private methods need basic documentation:

```javascript
/**
 * Validates API response format
 * 
 * @private
 * @param {Object} response - API response object
 * @returns {boolean} Whether response is valid
 */
_validateResponse(response) {
  // Implementation
}
```

### Special Documentation Tags

#### Important Tags to Use

- `@deprecated` - Mark deprecated functions with replacement info
- `@todo` - Note planned improvements or fixes needed
- `@see` - Reference related functions or documentation
- `@example` - Always include usage examples for public APIs
- `@throws` - Document all possible error conditions
- `@since` - Version when feature was added
- `@version` - Current version of the function/class

#### Custom Tags for This Project

```javascript
/**
 * @airtable - Functions that interact with Airtable API
 * @business - Functions containing business logic
 * @ui - Functions that manipulate the DOM
 * @export - Functions that handle data export (PDF/Markdown)
 * @cache - Functions that implement caching logic
 */
```

### Code Examples in Documentation

#### Example Standards
- Include realistic, working examples
- Show both basic and advanced usage
- Demonstrate error handling when relevant
- Use actual data structures from the project

```javascript
/**
 * @example
 * // Basic usage
 * const organizer = new LineSheetOrganizer();
 * const organized = organizer.organizeProducts(products);
 * 
 * // With custom grouping
 * const organized = organizer.organizeProducts(products, {
 *   groupBy: 'material',
 *   sortBy: 'price',
 *   includeInactive: false
 * });
 * 
 * // Error handling
 * try {
 *   const organized = organizer.organizeProducts(invalidData);
 * } catch (error) {
 *   console.error('Organization failed:', error.message);
 * }
 */
```

### Error Documentation

#### Error Handling
Document all error conditions:

```javascript
/**
 * @throws {ValidationError} When product data is missing required fields
 * @throws {NetworkError} When Airtable API is unreachable
 * @throws {AuthenticationError} When API token is invalid
 * @throws {RateLimitError} When API rate limit is exceeded
 */
```

### Constants and Configuration

#### Document Constants
```javascript
/**
 * Default configuration for Airtable client
 * @constant {Object}
 * @property {number} CACHE_DURATION - Cache duration in milliseconds
 * @property {number} MAX_RECORDS - Maximum records per API request
 * @property {string} DEFAULT_VIEW - Default Airtable view to use
 */
const AIRTABLE_DEFAULTS = {
  CACHE_DURATION: 5 * 60 * 1000,
  MAX_RECORDS: 100,
  DEFAULT_VIEW: 'Line Sheet View'
};
```

## HTML Documentation

### File Structure Comments
HTML files should include clear section comments and metadata:

```html
<!DOCTYPE html>
<!--
  Gilty Boy Line Sheet Builder - Main Application Interface
  
  This file provides the primary user interface for the line sheet builder
  application. It includes sections for connection setup, product display,
  customization options, and export controls.
  
  Key sections:
  - Connection setup and status
  - Product grid and filtering
  - Line sheet customization
  - Export and download controls
  
  @author Gilty Boy Line Sheet Builder
  @version 1.0.0
  @since 2025-01-01
-->
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gilty Boy Line Sheet Builder</title>
  
  <!-- Application Styles -->
  <link rel="stylesheet" href="styles/main.css">
  <!-- Custom Fonts for Brand Consistency -->
  <link rel="stylesheet" href="styles/fonts.css">
</head>
<body>
  <!-- Main Application Container -->
  <div id="app" class="min-h-screen bg-gray-50">
    
    <!-- Header Section: Branding and Navigation -->
    <header class="bg-white shadow-sm border-b">
      <!-- Header content -->
    </header>
    
    <!-- Main Content: Connection and Product Management -->
    <main class="container mx-auto px-4 py-8">
      
      <!-- Connection Setup Section -->
      <section id="connection-section" class="mb-8">
        <!-- Connection form and status -->
      </section>
      
      <!-- Product Display Section -->
      <section id="products-section" class="mb-8">
        <!-- Product grid and controls -->
      </section>
      
      <!-- Customization Section -->
      <section id="customization-section" class="mb-8">
        <!-- Template and styling options -->
      </section>
      
      <!-- Export Section -->
      <section id="export-section">
        <!-- Export controls and download buttons -->
      </section>
      
    </main>
    
  </div>
  
  <!-- Application JavaScript -->
  <script type="module" src="js/main.js"></script>
</body>
</html>
```

### Semantic HTML Documentation
- Use semantic HTML5 elements (`<header>`, `<main>`, `<section>`, `<article>`)
- Include ARIA labels for accessibility
- Document complex form structures
- Comment dynamic content areas

### Accessibility Documentation
```html
<!-- 
  Accessibility Features:
  - ARIA labels for screen readers
  - Keyboard navigation support
  - High contrast color scheme
  - Focus management for dynamic content
-->
<button 
  type="button" 
  id="connect-btn"
  aria-describedby="connection-help"
  class="btn btn-primary">
  Connect to Airtable
</button>
<div id="connection-help" class="sr-only">
  This button will test your Airtable connection using the provided credentials
</div>
```

## CSS Documentation

### File Header Documentation
```css
/**
 * Main Application Styles
 * 
 * This file contains the core styling for the Gilty Boy Line Sheet Builder
 * application. It includes base styles, component styles, utility classes,
 * and print-specific styling for line sheet generation.
 * 
 * Structure:
 * 1. CSS Variables and Design Tokens
 * 2. Base Styles and Typography
 * 3. Layout Components
 * 4. UI Components
 * 5. Print Styles
 * 6. Responsive Design
 * 
 * @author Gilty Boy Line Sheet Builder
 * @version 1.0.0
 * @since 2025-01-01
 */

/* ===== CSS VARIABLES AND DESIGN TOKENS ===== */
:root {
  /* Brand Colors */
  --color-primary: #8b4513;      /* Gilty Boy brand brown */
  --color-secondary: #d4af37;    /* Gold accent */
  --color-accent: #f5f5dc;       /* Beige background */
  
  /* Typography */
  --font-primary: 'Playfair Display', serif;  /* Brand headers */
  --font-secondary: 'Inter', sans-serif;      /* Body text */
  
  /* Spacing Scale */
  --space-xs: 0.25rem;    /* 4px */
  --space-sm: 0.5rem;     /* 8px */
  --space-md: 1rem;       /* 16px */
  --space-lg: 2rem;       /* 32px */
  --space-xl: 4rem;       /* 64px */
}
```

### Component Documentation
```css
/**
 * Product Card Component
 * 
 * Displays individual product information in a card format.
 * Includes product image, name, pricing, and material details.
 * 
 * Usage:
 * <div class="product-card">
 *   <div class="product-card__image">...</div>
 *   <div class="product-card__content">...</div>
 * </div>
 * 
 * Modifiers:
 * .product-card--featured  - Larger size for featured products
 * .product-card--compact   - Smaller size for dense layouts
 */
.product-card {
  /* Base card styles */
  background: white;
  border-radius: var(--space-sm);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.2s ease;
}

.product-card:hover {
  /* Hover state for interactivity */
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.product-card__image {
  /* Product image container */
  aspect-ratio: 1 / 1;
  overflow: hidden;
  background: var(--color-accent);
}

.product-card__content {
  /* Product details area */
  padding: var(--space-md);
}
```

### Print Styles Documentation
```css
/**
 * Print Styles for Line Sheet Generation
 * 
 * These styles are applied when generating PDF line sheets.
 * They ensure proper formatting, spacing, and layout for
 * professional wholesale catalogs.
 * 
 * Print Requirements:
 * - High contrast for readability
 * - Proper page breaks
 * - Consistent spacing
 * - Professional typography
 */
@media print {
  /* Remove interactive elements for print */
  .no-print,
  button,
  .btn {
    display: none !important;
  }
  
  /* Ensure proper page formatting */
  @page {
    margin: 1in;
    size: letter;
  }
  
  /* Control page breaks */
  .product-card {
    break-inside: avoid;
    page-break-inside: avoid;
  }
  
  /* High contrast for print */
  body {
    color: #000;
    background: #fff;
  }
}
```

### Responsive Design Documentation
```css
/**
 * Responsive Breakpoints
 * 
 * Mobile-first approach with progressive enhancement
 * 
 * Breakpoints:
 * - sm: 640px   (tablet portrait)
 * - md: 768px   (tablet landscape)
 * - lg: 1024px  (desktop)
 * - xl: 1280px  (large desktop)
 */
 
/* Mobile styles (default) */
.product-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-md);
}

/* Tablet and up */
@media (min-width: 640px) {
  .product-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .product-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

## Configuration File Documentation

### Environment Configuration
```javascript
// config/development/.env.development
/**
 * Development Environment Configuration
 * 
 * This file contains environment-specific settings for the development
 * environment. These values are used during local development and testing.
 * 
 * SECURITY NOTE: This file should contain only non-sensitive configuration.
 * Actual API keys and tokens should be stored in .env.local (gitignored).
 * 
 * @author Gilty Boy Line Sheet Builder
 * @version 1.0.0
 * @since 2025-01-01
 */

# Airtable Configuration
# These are template values - replace with your actual credentials
VITE_AIRTABLE_ACCESS_TOKEN=your_pat_token_here
VITE_AIRTABLE_BASE_ID=your_base_id_here
VITE_AIRTABLE_TABLE_NAME=Products

# Application Settings
NODE_ENV=development
VITE_APP_NAME=Gilty Boy Line Sheet Builder
VITE_APP_VERSION=1.0.0

# Development Features
VITE_ENABLE_DEBUG=true
VITE_ENABLE_MOCK_DATA=false
```

### JavaScript Configuration Files
```javascript
/**
 * @fileoverview Application configuration constants and settings
 * 
 * This file contains all configuration values used throughout the application.
 * It provides centralized configuration management and type definitions for
 * all settings that control application behavior.
 * 
 * @author Gilty Boy Line Sheet Builder
 * @version 1.0.0
 * @since 2025-01-01
 * @module AppConfig
 */

/**
 * Core application configuration object
 * @constant {Object}
 */
export const APP_CONFIG = {
  /**
   * Application metadata
   * @property {Object} app
   */
  app: {
    name: 'Gilty Boy Line Sheet Builder',
    version: '1.0.0',
    description: 'Professional wholesale catalog generator'
  },
  
  /**
   * Data validation rules
   * @property {Object} validation
   */
  validation: {
    product: {
      requiredFields: ['productCode', 'name', 'wholesalePrice'],
      optionalFields: ['material', 'category', 'retailPrice', 'notes'],
      imageFormats: ['jpg', 'jpeg', 'png', 'webp'],
      maxImageSize: 5 * 1024 * 1024 // 5MB
    }
  }
};
```

## Documentation Quality Standards

### Required Elements
1. **File headers** - Every file must have a comprehensive header
2. **Function purpose** - Clear explanation of what the function does
3. **Parameters** - All parameters with types and descriptions
4. **Return values** - What the function returns and when
5. **Error conditions** - All possible errors and when they occur
6. **Usage examples** - At least one working example
7. **Business context** - Why this function exists in the system

### Quality Checklist
- [ ] Is the purpose clear to someone unfamiliar with the code?
- [ ] Are all parameters documented with correct types?
- [ ] Are optional parameters marked with square brackets?
- [ ] Are error conditions clearly described?
- [ ] Do examples show realistic usage?
- [ ] Are complex algorithms explained?
- [ ] Is business logic context provided?

## Maintenance Guidelines

### Keeping Documentation Current
1. **Update on code changes** - Documentation changes with every code change
2. **Version tracking** - Use `@since` and `@version` tags appropriately
3. **Deprecation notices** - Mark deprecated code with replacement guidance
4. **Review process** - Include documentation review in code reviews

### Automated Validation
- ESLint rules to require JSDoc comments on public functions
- Automated checks for parameter documentation completeness
- CI/CD integration to validate documentation quality

## Integration with Development Workflow

### IDE Configuration
Configure VS Code/WebStorm for optimal JSDoc support:
- Enable JSDoc IntelliSense
- Configure auto-completion for JSDoc tags
- Set up documentation generation shortcuts

### Documentation Generation
Use JSDoc to generate HTML documentation:
```bash
# Generate documentation
npx jsdoc src/**/*.js -d docs/api/

# Watch mode for development
npx jsdoc src/**/*.js -d docs/api/ --watch
```

This documentation standard ensures that our JavaScript codebase remains maintainable, accessible to new developers, and provides excellent developer experience through comprehensive inline documentation.