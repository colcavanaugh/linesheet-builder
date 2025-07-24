// puppeteer.config.js
// Puppeteer configuration for optimal PDF generation

export const puppeteerConfig = {
  // Launch options for different environments
  launch: {
    development: {
      headless: 'new',
      devtools: false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    },
    production: {
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
        '--memory-pressure-off',
        '--max_old_space_size=4096'
      ]
    }
  },

  // PDF generation settings
  pdf: {
    // High quality settings for professional output
    professional: {
      format: 'Letter',
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: '0.75in',
        bottom: '0.75in',
        left: '0.75in',
        right: '0.75in'
      },
      displayHeaderFooter: false
    },
    
    // Draft quality for quick previews
    draft: {
      format: 'Letter',
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: '0.5in',
        bottom: '0.5in',
        left: '0.5in',
        right: '0.5in'
      },
      displayHeaderFooter: false
    }
  },

  // Page settings
  page: {
    viewport: {
      width: 816,  // 8.5 inches * 96 DPI
      height: 1056, // 11 inches * 96 DPI
      deviceScaleFactor: 2 // High DPI for crisp text
    },
    
    // Wait options for content loading
    waitOptions: {
      waitUntil: ['networkidle0', 'load'],
      timeout: 60000
    }
  },

  // Resource optimization
  resources: {
    // Block unnecessary resources to speed up generation
    blockedResourceTypes: [
      'stylesheet', // We'll inline CSS instead
      'font', // We'll use system fonts or inline font data
      'media'
    ],
    
    // Allowed domains for images and assets
    allowedDomains: ['localhost', '127.0.0.1', window?.location?.hostname].filter(Boolean)
  }
};

// .puppeteerrc.cjs
// Puppeteer download configuration

const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Store Puppeteer cache in project directory
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
  
  // Skip Chromium download if already installed
  skipDownload: false,
  
  // Download specific Chromium version for consistency
  browserRevision: '1108766',
  
  // Experiments
  experiments: {
    macArmChromiumEnabled: true
  }
};