// server/pdf-server.js - MINIMAL TEST VERSION
console.log('🚀 PDF Server starting...');
console.log('📁 Working directory:', process.cwd());

try {
  console.log('📦 Importing Express...');
  const express = (await import('express')).default;
  console.log('✅ Express imported');

  console.log('📦 Creating Express app...');
  const app = express();
  console.log('✅ Express app created');

  console.log('🎯 Starting server on port 3001...');
  const server = app.listen(3001, () => {
    console.log('🎉 MINIMAL PDF SERVER RUNNING!');
    console.log('📍 http://localhost:3001');
  });

} catch (error) {
  console.error('❌ CRITICAL ERROR:', error);
  console.error('Error details:', error.message);
  console.error('Stack trace:', error.stack);
}

// Add this after the Express test above
console.log('📦 Importing Puppeteer...');
const puppeteer = (await import('puppeteer')).default;
console.log('✅ Puppeteer imported');

console.log('🌐 Testing Puppeteer browser launch...');
const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});
console.log('✅ Puppeteer browser launched successfully');
await browser.close();
console.log('✅ Puppeteer browser closed');