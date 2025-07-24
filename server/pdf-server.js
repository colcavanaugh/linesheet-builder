// server/pdf-server.js
// Enhanced PDF server with Microsoft Edge support

import express from 'express';
import cors from 'cors';
import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../src')));

// Serve static assets
app.use('/styles', express.static(path.join(__dirname, '../src/styles')));
app.use('/assets', express.static(path.join(__dirname, '../src/assets')));

let browser = null;
let browserInfo = { type: 'unknown', path: 'unknown' };

// Get Microsoft Edge executable paths for Windows
function getEdgePaths() {
  const edgePaths = [
    // Edge Stable
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    // Edge Beta
    'C:\\Program Files (x86)\\Microsoft\\Edge Beta\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge Beta\\Application\\msedge.exe',
    // Edge Dev
    'C:\\Program Files (x86)\\Microsoft\\Edge Dev\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge Dev\\Application\\msedge.exe',
    // User profile installations
    process.env.LOCALAPPDATA + '\\Microsoft\\Edge\\Application\\msedge.exe',
    process.env.LOCALAPPDATA + '\\Microsoft\\Edge Beta\\Application\\msedge.exe',
    process.env.LOCALAPPDATA + '\\Microsoft\\Edge Dev\\Application\\msedge.exe'
  ];
  
  return edgePaths.filter(path => path && !path.includes('undefined'));
}

// Get Chrome executable paths for Windows
function getChromePaths() {
  const chromePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe'
  ];
  
  return chromePaths.filter(path => path && !path.includes('undefined'));
}

// Check if executable exists
async function executableExists(path) {
  try {
    const fs = await import('fs');
    return fs.existsSync(path);
  } catch (error) {
    return false;
  }
}

// Find best available browser
async function findBestBrowser() {
  console.log('🔍 Searching for available browsers...');
  
  // Try Puppeteer bundled Chrome first
  try {
    const executablePath = puppeteer.executablePath();
    if (await executableExists(executablePath)) {
      console.log('✅ Found Puppeteer bundled Chrome');
      return { type: 'puppeteer-chrome', path: executablePath };
    }
  } catch (error) {
    console.log('⚠️ Puppeteer bundled Chrome not available');
  }
  
  // Try Microsoft Edge (often pre-installed on Windows)
  console.log('🔍 Checking for Microsoft Edge...');
  const edgePaths = getEdgePaths();
  for (const edgePath of edgePaths) {
    if (await executableExists(edgePath)) {
      console.log('✅ Found Microsoft Edge at:', edgePath);
      return { type: 'microsoft-edge', path: edgePath };
    }
  }
  
  // Try Chrome
  console.log('🔍 Checking for Google Chrome...');
  const chromePaths = getChromePaths();
  for (const chromePath of chromePaths) {
    if (await executableExists(chromePath)) {
      console.log('✅ Found Google Chrome at:', chromePath);
      return { type: 'google-chrome', path: chromePath };
    }
  }
  
  throw new Error('No compatible browser found. Please install Chrome or Edge.');
}

// Initialize Puppeteer browser with multi-browser support
async function initializeBrowser() {
  if (!browser) {
    console.log('🚀 Launching Puppeteer browser...');
    
    try {
      // Find the best available browser
      browserInfo = await findBestBrowser();
      
      // Common launch options for both Chrome and Edge
      const launchOptions = {
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-background-timer-throttling', // Better for PDF generation
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding'
        ]
      };

      // Add browser-specific optimizations
      if (browserInfo.type === 'microsoft-edge') {
        // Edge-specific optimizations
        launchOptions.args.push(
          '--disable-extensions',
          '--disable-default-apps',
          '--disable-sync' // Don't sync with Edge profile
        );
      }

      // Launch browser
      browser = await puppeteer.launch({
        ...launchOptions,
        executablePath: browserInfo.path
      });
      
      console.log(`✅ ${browserInfo.type} launched successfully`);
      console.log(`📍 Browser path: ${browserInfo.path}`);
      
    } catch (error) {
      console.error('❌ Failed to launch browser:', error.message);
      console.log('\n🔧 To fix this issue:');
      console.log('1. Install Microsoft Edge: https://www.microsoft.com/edge');
      console.log('2. Or install Chrome: https://www.google.com/chrome/');
      console.log('3. Or run: npm run setup-chrome\n');
      throw error;
    }
  }
  return browser;
}

// Enhanced health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'pdf-server', 
    puppeteer: !!browser,
    platform: process.platform,
    browser: {
      available: !!browser,
      type: browserInfo.type,
      path: browserInfo.path
    }
  });
});

// Browser info endpoint
app.get('/api/browser-info', (req, res) => {
  res.json({
    browser: browserInfo,
    available: !!browser,
    platform: process.platform
  });
});

// PDF generation endpoint (same as before but with better error reporting)
app.post('/api/generate-pdf', async (req, res) => {
  console.log(`📄 PDF generation request received (using ${browserInfo.type})`);
  
  try {
    const { html, options = {} } = req.body;
    
    if (!html) {
      return res.status(400).json({ error: 'HTML content is required' });
    }

    // Ensure browser is initialized
    let browserInstance;
    try {
      browserInstance = await initializeBrowser();
    } catch (error) {
      return res.status(500).json({ 
        error: 'Browser initialization failed',
        message: error.message,
        browserType: browserInfo.type,
        suggestion: 'Install Microsoft Edge or Chrome'
      });
    }

    const page = await browserInstance.newPage();

    try {
      // Set viewport for 8.5" x 11" rendering
      await page.setViewport({
        width: 816,
        height: 1056,
        deviceScaleFactor: 2
      });

      // Process HTML
      const processedHTML = await processHTMLForServer(html, req);

      // Load HTML with appropriate timeout
      const timeout = browserInfo.type === 'microsoft-edge' ? 90000 : 120000; // Edge is often faster
      await page.setContent(processedHTML, {
        waitUntil: ['networkidle0', 'load'],
        timeout: timeout
      });

      // Wait for fonts and images
      await page.evaluateHandle('document.fonts.ready');
      await page.evaluate(() => {
        const images = Array.from(document.images);
        return Promise.all(images.map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise(resolve => {
            const timeout = setTimeout(resolve, 5000);
            img.onload = () => {
              clearTimeout(timeout);
              resolve();
            };
            img.onerror = () => {
              clearTimeout(timeout);
              resolve();
            };
          });
        }));
      });

      // Generate PDF
      const pdfOptions = {
        format: 'Letter',
        printBackground: true,
        preferCSSPageSize: true,
        margin: {
          top: '0.75in',
          bottom: '0.75in',
          left: '0.75in',
          right: '0.75in'
        },
        displayHeaderFooter: false,
        timeout: timeout,
        ...options
      };

      const pdfBuffer = await page.pdf(pdfOptions);

      // Send PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', pdfBuffer.length);
      res.send(pdfBuffer);

      console.log(`✅ PDF generated successfully using ${browserInfo.type}`);

    } finally {
      await page.close();
    }

  } catch (error) {
    console.error('❌ PDF generation failed:', error);
    
    const errorMessage = error.message;
    let suggestion = '';
    
    if (error.message.includes('Target closed')) {
      suggestion = `${browserInfo.type} crashed - try restarting the PDF server`;
    } else if (error.message.includes('timeout')) {
      suggestion = 'Generation timed out - try with fewer products';
    } else if (error.message.includes('Protocol error')) {
      suggestion = `${browserInfo.type} communication error - restart the server`;
    }
    
    res.status(500).json({ 
      error: 'PDF generation failed', 
      message: errorMessage,
      browserType: browserInfo.type,
      suggestion: suggestion
    });
  }
});

// Process HTML for server (same as before)
async function processHTMLForServer(html, req) {
  const serverBaseURL = `${req.protocol}://${req.get('host')}`;
  
  const cssContent = await loadLinesheetCSS();
  
  let processedHTML = html.replace(
    /<link rel="stylesheet" href="styles\/themes\/linesheet-document\.css">/g,
    `<style>${cssContent}</style>`
  );

  processedHTML = processedHTML.replace(
    /src="(?!http|data:)([^"]+)"/g,
    `src="${serverBaseURL}/$1"`
  );

  if (cssContent.includes('Cardo') || cssContent.includes('Inter')) {
    const fontsLink = `<link href="https://fonts.googleapis.com/css2?family=Cardo:wght@400;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">`;
    processedHTML = processedHTML.replace('<head>', `<head>${fontsLink}`);
  }

  return processedHTML;
}

// Load CSS file (same as before)
async function loadLinesheetCSS() {
  try {
    const fs = await import('fs');
    const cssPath = path.join(__dirname, '../src/styles/themes/linesheet-document.css');
    return fs.readFileSync(cssPath, 'utf8');
  } catch (error) {
    console.warn('⚠️ Could not load CSS file, using fallback');
    return getFallbackCSS();
  }
}

// Fallback CSS (same as before)
function getFallbackCSS() {
  return `
    .linesheet-preview-content {
      font-family: 'Cardo', serif;
      font-size: 12pt;
      line-height: 1.4;
      color: #000;
      background-color: #fff;
    }
    .cover-page, .table-of-contents, .category-section {
      width: 100%;
      height: 100vh;
      padding: 0.75in;
      page-break-after: always;
      break-after: page;
    }
    .linesheet-product-card {
      margin-bottom: 12pt;
      padding: 8pt;
      border: 1pt solid #ccc;
      break-inside: avoid;
    }
    @media print {
      * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
    }
  `;
}

// Enhanced graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down PDF server...');
  if (browser) {
    try {
      await browser.close();
      console.log(`✅ ${browserInfo.type} browser closed`);
    } catch (error) {
      console.error('Error closing browser:', error);
    }
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Received SIGTERM, shutting down PDF server...');
  if (browser) {
    try {
      await browser.close();
      console.log(`✅ ${browserInfo.type} browser closed`);
    } catch (error) {
      console.error('Error closing browser:', error);
    }
  }
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 PDF Server running on http://localhost:${PORT}`);
  console.log('📄 Ready to generate PDFs with Puppeteer');
  console.log(`🖥️ Platform: ${process.platform}`);
  
  // Initialize browser on startup
  initializeBrowser()
    .then(() => {
      console.log(`🎉 PDF server fully initialized with ${browserInfo.type}!`);
    })
    .catch((error) => {
      console.error('❌ Failed to initialize browser:', error.message);
      console.log('⚠️ PDF server running but PDF generation will fail until a browser is installed');
    });
});

export default app;