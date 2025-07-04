# Project Architecture

## Overview

The Gilty Boy Line Sheet Builder is a single-page web application designed to generate professional wholesale catalogs from Airtable data. The architecture prioritizes simplicity, reliability, and ease of use for a single business user.

## Directory Structure & Purpose

### `/src/` - Application Source Code
The heart of the application containing all business logic and user interface components.

```
src/
├── components/          # Reusable UI components
│   ├── LineSheet/      # Line sheet rendering components
│   ├── ProductCard/    # Individual product display
│   ├── TableOfContents/# TOC generation and formatting
│   └── CoverPage/      # Brand cover page component
├── utils/              # Business logic utilities
│   ├── airtable/       # Airtable API integration
│   ├── pdf/            # PDF generation logic
│   ├── markdown/       # Markdown export functionality
│   └── formatting/     # Data transformation utilities
├── styles/             # CSS and styling
├── config/             # Application configuration
└── js/                 # Main application logic
```

**Data Flow:** User input → Airtable fetch → Data transformation → Component rendering → Export generation

### `/public/` - Static Assets
Contains all static files served directly to the browser.

```
public/
├── assets/             # General static assets
│   ├── icons/         # UI icons and favicons
│   └── logos/         # Brand logos and graphics
├── fonts/              # Custom typography files
└── images/             # Default images and placeholders
```

**Purpose:** Houses all non-code assets that need to be publicly accessible, including custom fonts for brand consistency.

### `/templates/` - Line Sheet Templates
Modular template system for different line sheet styles.

```
templates/
├── linesheet/
│   ├── modern/         # Clean, contemporary design
│   ├── classic/        # Traditional wholesale catalog
│   └── minimal/        # Simple, text-focused layout
├── email/              # Email templates for sending line sheets
└── export/             # Export format templates
```

**Data Flow:** User selects template → Template loads → Product data populates template → Rendered output

### `/config/` - Environment Configuration
Environment-specific settings and deployment configurations.

```
config/
├── development/        # Local development settings
├── production/         # Production deployment config
└── staging/            # Testing environment config
```

### `/docs/` - Documentation
Comprehensive project documentation for development and usage.

```
docs/
├── api/                # Technical API documentation
├── user-guide/         # End-user instructions
├── deployment/         # Hosting and deployment guides
└── development/        # Development process docs
```

### `/tests/` - Testing Suite
Automated testing to ensure reliability and catch regressions.

```
tests/
├── unit/               # Individual function testing
├── integration/        # Component interaction testing
└── e2e/                # Full user workflow testing
```

### `/scripts/` - Automation Scripts
Build, deployment, and utility scripts for development workflow.

```
scripts/
├── build/              # Build process automation
├── deploy/             # Deployment automation
└── data/               # Data migration and setup scripts
```

## Core Data Flows

### 1. Product Data Flow
```
Airtable Database → API Fetch → Data Validation → State Management → UI Rendering
```

**Process:**
1. User clicks "Connect Airtable"
2. App fetches data using API credentials
3. Data is validated and transformed
4. Products are stored in application state
5. UI components render updated product list

### 2. Line Sheet Generation Flow
```
Product Data → Template Selection → Component Rendering → Layout Generation → Export
```

**Process:**
1. User selects template and customization options
2. Product data is mapped to template structure
3. React components render individual sections
4. CSS handles layout and typography
5. Export utilities generate PDF/Markdown

### 3. Configuration Flow
```
Environment Variables → App Config → Component Props → UI State
```

**Process:**
1. Environment variables loaded at startup
2. Configuration object created
3. Settings passed to relevant components
4. UI reflects current configuration state

## Component Architecture

### Core Components
- **App.js** - Main application container and state management
- **Dashboard.js** - Primary user interface
- **LineSheetBuilder.js** - Line sheet composition and preview
- **ExportManager.js** - Handle PDF and Markdown generation

### Utility Modules
- **AirtableClient.js** - API communication and data fetching
- **PDFGenerator.js** - PDF creation using Puppeteer/jsPDF
- **TemplateRenderer.js** - Dynamic template loading and rendering
- **DataFormatter.js** - Product data transformation and validation

## State Management Strategy

### Application State
```javascript
{
  config: {
    airtable: { apiKey, baseId, tableName },
    templates: { selected, available },
    branding: { fonts, colors, logos }
  },
  products: {
    data: [...],
    loading: false,
    error: null,
    lastFetch: timestamp
  },
  linesheet: {
    template: 'modern',
    customization: {...},
    preview: {...}
  },
  ui: {
    currentView: 'dashboard',
    notifications: [...],
    modals: {...}
  }
}
```

### Data Persistence
- **Local Storage** - User preferences and recent configurations
- **Session Storage** - Temporary line sheet drafts
- **Airtable** - Source of truth for product data

## Security Considerations

### API Security
- Airtable API key stored in environment variables
- No sensitive data in client-side code
- API calls made from secure context

### Data Validation
- Input sanitization for all user data
- Airtable response validation
- Error handling for malformed data

## Performance Optimization

### Image Handling
- Lazy loading for product images
- Image compression for PDF export
- Fallback images for missing assets

### Data Caching
- Product data cached in application state
- Template assets cached by browser
- Incremental updates when data changes

### Bundle Optimization
- Code splitting for templates
- Tree shaking unused utilities
- Optimized build process with Vite

## Error Handling Strategy

### API Errors
- Network timeout handling
- Invalid credentials messaging
- Rate limit management

### User Errors
- Form validation with clear messaging
- Graceful degradation for missing data
- Undo functionality for destructive actions

### System Errors
- Comprehensive logging
- Error boundary components
- Fallback UI states

## Deployment Architecture

### Build Process
1. Environment variable validation
2. Asset optimization and minification
3. Template compilation
4. Static file generation

### Hosting Strategy
- **Static hosting** on Netlify/Vercel
- **Environment variables** managed through hosting platform
- **Custom domain** for professional appearance
- **HTTPS** enforcement for security

This architecture prioritizes simplicity and reliability over scalability, making it perfect for a single-user MVP while maintaining the flexibility to expand later if needed.
