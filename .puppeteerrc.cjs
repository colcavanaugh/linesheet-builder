// .puppeteerrc.cjs - Windows-compatible configuration
const { join, resolve } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Use absolute path for Windows compatibility
  cacheDirectory: resolve(__dirname, '.cache', 'puppeteer'),
  
  // Don't skip download - ensure Chrome is installed
  skipDownload: false,
  
  // Use specific Chrome version that works on Windows
  browserRevision: '127.0.6533.88',
  
  // Experiments
  experiments: {
    macArmChromiumEnabled: false // Not needed on Windows
  }
};