// test-puppeteer-debug.js
// Deep debugging of Puppeteer issues on Windows

import puppeteer from 'puppeteer';

console.log('🔍 Starting Puppeteer debugging...');
console.log('Platform:', process.platform);
console.log('Node version:', process.version);
console.log('Memory usage:', process.memoryUsage());

async function testPuppeteerConfigurations() {
  const configurations = [
    {
      name: 'Default Configuration',
      options: {
        headless: 'new'
      }
    },
    {
      name: 'Minimal Arguments',
      options: {
        headless: 'new',
        args: ['--no-sandbox']
      }
    },
    {
      name: 'Windows-Optimized',
      options: {
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-extensions',
          '--no-first-run',
          '--disable-default-apps',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding'
        ]
      }
    },
    {
      name: 'System Chrome (if available)',
      options: {
        headless: 'new',
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      }
    }
  ];

  for (const config of configurations) {
    console.log(`\n🧪 Testing: ${config.name}`);
    console.log('Options:', JSON.stringify(config.options, null, 2));
    
    let browser = null;
    let page = null;
    
    try {
      console.log('  🚀 Launching browser...');
      browser = await puppeteer.launch(config.options);
      console.log('  ✅ Browser launched successfully');
      
      console.log('  📄 Creating page...');
      page = await browser.newPage();
      console.log('  ✅ Page created');
      
      console.log('  📝 Setting simple content...');
      await page.setContent('<html><body><h1>Test</h1></body></html>', {
        waitUntil: 'domcontentloaded',
        timeout: 10000
      });
      console.log('  ✅ Content set');
      
      console.log('  📊 Generating PDF...');
      const pdf = await page.pdf({
        format: 'Letter',
        printBackground: true,
        timeout: 30000
      });
      console.log('  ✅ PDF generated successfully!', pdf.length, 'bytes');
      
      // Save this working PDF
      const fs = await import('fs');
      fs.writeFileSync(`test-${config.name.replace(/\s+/g, '-').toLowerCase()}.pdf`, pdf);
      console.log(`  💾 Saved as test-${config.name.replace(/\s+/g, '-').toLowerCase()}.pdf`);
      
    } catch (error) {
      console.error(`  ❌ Failed: ${error.message}`);
      if (error.stack) {
        console.error('  Stack:', error.stack.split('\n').slice(0, 3).join('\n'));
      }
    } finally {
      try {
        if (page) await page.close();
        if (browser) await browser.close();
        console.log('  🧹 Cleanup completed');
      } catch (cleanupError) {
        console.error('  ⚠️ Cleanup error:', cleanupError.message);
      }
    }
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

async function checkSystemRequirements() {
  console.log('\n🔍 System Requirements Check:');
  
  // Check Chrome installations
  const fs = await import('fs');
  const chromePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe'
  ];
  
  console.log('Chrome installations:');
  for (const path of chromePaths) {
    const exists = fs.existsSync(path);
    console.log(`  ${exists ? '✅' : '❌'} ${path}`);
  }
  
  // Check Puppeteer installation
  try {
    const puppeteerInfo = await puppeteer.executablePath();
    console.log('✅ Puppeteer Chrome:', puppeteerInfo);
  } catch (error) {
    console.log('❌ Puppeteer Chrome not found:', error.message);
  }
  
  // Memory info
  const usage = process.memoryUsage();
  console.log('Memory usage:');
  console.log(`  RSS: ${Math.round(usage.rss / 1024 / 1024)}MB`);
  console.log(`  Heap Used: ${Math.round(usage.heapUsed / 1024 / 1024)}MB`);
  console.log(`  External: ${Math.round(usage.external / 1024 / 1024)}MB`);
}

// Run the tests
async function runDebug() {
  try {
    await checkSystemRequirements();
    await testPuppeteerConfigurations();
    console.log('\n🎉 Debug complete!');
  } catch (error) {
    console.error('\n💥 Debug failed:', error);
  }
}

runDebug();