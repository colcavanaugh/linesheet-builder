// server/debug-pdf-server.js
console.log('🔍 Debug wrapper starting...');

try {
  console.log('📦 Importing PDF server...');
  const PDFServer = (await import('./pdf-server.js')).default;
  console.log('✅ PDF server imported successfully');
  
  console.log('🏗️ Creating PDF server instance...');
  const server = new PDFServer();
  console.log('✅ PDF server instance created');
  
  console.log('🚀 Starting PDF server...');
  await server.start();
  
} catch (error) {
  console.error('❌ ERROR CAUGHT:');
  console.error('Message:', error.message);
  console.error('Stack:', error.stack);
  console.error('Full error:', error);
}