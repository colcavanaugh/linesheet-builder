// scripts/dev-helpers.js
// Development utilities and testing helpers

import AirtableClient from '../src/js/utils/airtable/client.js';
import AirtableValidator from '../src/js/utils/airtable/validator.js';
import LineSheetOrganizer from '../src/js/utils/formatting/linesheet-organizer.js';

// Sample test data for development
export const SAMPLE_PRODUCTS = [
  {
    'SKU': 'R001',
    'Name': 'Sterling Silver Band Ring',
    'Material': 'Sterling Silver',
    'Wholesale_Price': 25.00,
    'Retail_Price': 50.00,
    'Category': 'Rings',
    'Line_Sheet': true,
    'Notes': 'Sizes 5-10 available',
    'Photos': [],
    'Status': 'Active'
  },
  {
    'SKU': 'N002',
    'Name': 'Gold Chain Necklace',
    'Material': '14k Gold',
    'Wholesale_Price': 85.00,
    'Retail_Price': 170.00,
    'Category': 'Necklaces',
    'Line_Sheet': true,
    'Notes': '16", 18", 20" lengths',
    'Photos': [],
    'Status': 'Active'
  },
  {
    'SKU': 'E003',
    'Name': 'Pearl Drop Earrings',
    'Material': 'Sterling Silver, Freshwater Pearl',
    'Wholesale_Price': 35.00,
    'Retail_Price': 70.00,
    'Category': 'Earrings',
    'Line_Sheet': true,
    'Notes': 'White or cream pearls',
    'Photos': [],
    'Status': 'Active'
  },
  {
    'SKU': 'B004',
    'Name': 'Bronze Cuff Bracelet',
    'Material': 'Bronze',
    'Wholesale_Price': 20.00,
    'Retail_Price': 40.00,
    'Category': 'Bracelets',
    'Line_Sheet': false, // Not included in line sheet
    'Notes': 'One size fits most',
    'Photos': [],
    'Status': 'Discontinued'
  }
];

// Development testing functions
export class DevHelpers {
  
  static async testAirtableConnection() {
    console.log('🔍 Testing Airtable connection...');
    
    try {
      const result = await AirtableClient.testConnection();
      if (result.success) {
        console.log('✅ Airtable connection successful');
        return true;
      } else {
        console.log('❌ Airtable connection failed:', result.message);
        return false;
      }
    } catch (error) {
      console.log('❌ Airtable connection error:', error.message);
      return false;
    }
  }

  static async loadTestData() {
    console.log('📊 Loading test data...');
    
    try {
      const products = await AirtableClient.getProducts();
      console.log(`✅ Loaded ${products.length} products from Airtable`);
      
      // Validate the data
      const validation = AirtableValidator.validateProductData(products);
      console.log('📋 Validation Results:');
      console.log(`  - Total: ${validation.summary.total}`);
      console.log(`  - Valid: ${validation.summary.validCount}`);
      console.log(`  - Invalid: ${validation.summary.invalidCount}`);
      console.log(`  - With warnings: ${validation.summary.warningCount}`);
      
      if (validation.summary.invalidCount > 0) {
        console.log('⚠️  Invalid products found:');
        validation.invalid.forEach((item, index) => {
          console.log(`   ${index + 1}. Product ${item.index + 1}:`);
          item.errors.forEach(error => console.log(`      - ${error}`));
        });
      }
      
      return products;
      
    } catch (error) {
      console.log('❌ Failed to load test data:', error.message);
      return [];
    }
  }

  static async checkEnvironmentSetup() {
    console.log('🔧 Checking environment setup...');
    
    const checks = [
      {
        name: 'Airtable Access Token (PAT)',
        check: () => !!import.meta.env.VITE_AIRTABLE_ACCESS_TOKEN,
        value: import.meta.env.VITE_AIRTABLE_ACCESS_TOKEN ? 'Set' : 'Missing'
      },
      {
        name: 'Airtable Base ID',
        check: () => !!import.meta.env.VITE_AIRTABLE_BASE_ID,
        value: import.meta.env.VITE_AIRTABLE_BASE_ID ? 'Set' : 'Missing'
      },
      {
        name: 'Airtable Table Name',
        check: () => !!import.meta.env.VITE_AIRTABLE_TABLE_NAME,
        value: import.meta.env.VITE_AIRTABLE_TABLE_NAME || 'Using default: Products'
      },
      {
        name: 'Development Mode',
        check: () => import.meta.env.MODE === 'development',
        value: import.meta.env.MODE
      }
    ];

    let allGood = true;
    
    checks.forEach(({ name, check, value }) => {
      const status = check();
      const icon = status ? '✅' : '❌';
      console.log(`  ${icon} ${name}: ${value}`);
      if (!status && name.includes('Airtable')) {
        allGood = false;
      }
    });

    if (!allGood) {
      console.log('\n⚠️  Please set up your Airtable credentials in .env file:');
      console.log('   VITE_AIRTABLE_ACCESS_TOKEN=your_personal_access_token_here');
      console.log('   VITE_AIRTABLE_BASE_ID=your_base_id_here');
      console.log('   VITE_AIRTABLE_TABLE_NAME=Products');
    }

    return allGood;
  }

  static async testFieldMapping() {
    console.log('🔍 Testing Smart Field Mapping...');
    
    try {
      // Test field discovery
      const mappings = await AirtableClient.refreshFieldMappings();
      console.log('✅ Field mappings discovered:', mappings);
      
      // Show mapping statistics
      const stats = AirtableClient.getMappingStats();
      console.log('📊 Mapping Statistics:', stats);
      
      // Test if all required fields are mapped
      const requiredFields = ['productCode', 'productName', 'wholesalePrice'];
      const missingFields = requiredFields.filter(field => 
        !mappings[field] || mappings[field].confidence === 'missing'
      );
      
      if (missingFields.length > 0) {
        console.warn('⚠️ Missing required fields:', missingFields);
      } else {
        console.log('✅ All required fields successfully mapped');
      }
      
      return mappings;
      
    } catch (error) {
      console.log('❌ Field mapping test failed:', error.message);
      return null;
    }
  }

  static async testSmartQuery() {
    console.log('🧠 Testing Smart Query Building...');
    
    try {
      // Test loading products with smart queries
      console.time('smart-query-time');
      const products = await AirtableClient.getProducts();
      console.timeEnd('smart-query-time');
      
      console.log(`✅ Smart query successful: loaded ${products.length} products`);
      
      // Check if any products are using fallback transformation
      const fallbackProducts = products.filter(p => p.metadata?.usingFallback);
      if (fallbackProducts.length > 0) {
        console.warn(`⚠️ ${fallbackProducts.length} products using fallback transformation`);
      }
      
      return products;
      
    } catch (error) {
      console.log('❌ Smart query test failed:', error.message);
      return [];
    }
  }

  static async runFullTest() {
    console.log('🚀 Running full development test suite...\n');
    
    // 1. Check environment
    const envOk = await this.checkEnvironmentSetup();
    console.log('');
    
    if (!envOk) {
      console.log('❌ Environment setup incomplete. Please configure Airtable credentials.');
      return false;
    }

    // 2. Test connection
    const connectionOk = await this.testAirtableConnection();
    console.log('');
    
    if (!connectionOk) {
      console.log('❌ Cannot proceed without Airtable connection.');
      return false;
    }

    // 3. Load and validate data
    const products = await this.loadTestData();
    console.log('');

    // 4. Test smart field mapping
    console.log('🧠 Testing smart field mapping...');
    const mappings = await this.testFieldMapping();
    if (mappings) {
      console.log('✅ Smart field mapping working');
    }
    console.log('');

    // 5. Test smart queries
    console.log('🔍 Testing smart query system...');
    const smartProducts = await this.testSmartQuery();
    console.log(`✅ Smart queries: ${smartProducts.length} products loaded`);
    console.log('');

    // 6. Test validation with sample data
    console.log('🧪 Testing validation with sample data...');
    const sampleValidation = AirtableValidator.validateProductData(SAMPLE_PRODUCTS);
    console.log(`✅ Sample data validation: ${sampleValidation.summary.validCount}/${sampleValidation.summary.total} valid`);
    console.log('');

    // 7. Test line sheet organization
    console.log('📋 Testing line sheet organization...');
    const organized = LineSheetOrganizer.organizeGiltyBoyProducts(products);
    console.log(`✅ Organized into ${organized.summary.totalCategories} categories`);
    console.log(`📊 Line sheet summary:`, organized.summary);
    console.log('');

    // 8. Test caching
    console.log('💾 Testing cache functionality...');
    const cacheStatsBefore = AirtableClient.getCacheStats();
    await AirtableClient.getProducts(); // Should hit cache
    const cacheStatsAfter = AirtableClient.getCacheStats();
    console.log(`✅ Cache working: ${cacheStatsAfter.size} entries cached`);
    console.log('');

    console.log('🎉 All tests completed successfully!');
    console.log(`📊 Summary: ${products.length} products loaded with smart mapping`);
    
    return true;
  }

  static generateSampleAirtableStructure() {
    console.log('📋 Airtable Base Structure for Gilty Boy:');
    console.log('');
    console.log('Base ID: appmDNXTcMaDH4rPF');
    console.log('Table Name: Products (or your current table name)');
    console.log('');
    console.log('Required Fields:');
    console.log('  - SKU (Single line text) - Product identifier');
    console.log('  - Name (Single line text) - Product name');
    console.log('  - Wholesale_Price (Currency) - Your wholesale cost');
    console.log('');
    console.log('Optional Fields:');
    console.log('  - Material (Single select) - Sterling Silver, 14k Gold, etc.');
    console.log('  - Retail_Price (Currency) - MSRP');
    console.log('  - Category (Single select) - Ring, Necklace, etc.');
    console.log('  - Line_Sheet (Checkbox) - Include in line sheet');
    console.log('  - Photos (Attachment) - Product images');
    console.log('  - Notes (Long text) - Variations, special notes');
    console.log('  - Status (Single select) - Active, Discontinued, etc.');
    console.log('');
    console.log('Your Current Categories:');
    console.log('  - Ring');
    console.log('');
    console.log('Your Current Materials:');
    console.log('  - Sterling Silver');
    console.log('');
    console.log('Suggested Status Options:');
    console.log('  - Active');
    console.log('  - Discontinued');
    console.log('  - Coming Soon');
    console.log('  - Seasonal');
  }

  static async benchmarkPerformance() {
    console.log('⚡ Running performance benchmarks...');
    
    const tests = [
      {
        name: 'API Connection Test',
        test: () => AirtableClient.testConnection()
      },
      {
        name: 'Data Fetch (First Call)',
        test: () => {
          AirtableClient.clearCache();
          return AirtableClient.getProducts();
        }
      },
      {
        name: 'Data Fetch (Cached)',
        test: () => AirtableClient.getProducts()
      },
      {
        name: 'Data Validation',
        test: () => AirtableValidator.validateProductData(SAMPLE_PRODUCTS)
      }
    ];

    for (const { name, test } of tests) {
      const startTime = performance.now();
      try {
        await test();
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);
        console.log(`  ✅ ${name}: ${duration}ms`);
      } catch (error) {
        console.log(`  ❌ ${name}: Failed (${error.message})`);
      }
    }
  }

  static async testGiltyBoyData() {
    console.log('💍 Testing Gilty Boy Ring Collection...');
    
    try {
      const products = await AirtableClient.getProducts();
      
      if (products.length === 0) {
        console.log('❌ No products found. Check your Airtable connection.');
        return false;
      }
      
      console.log(`✅ Found ${products.length} total products`);
      
      // Filter active products (Line_Sheet = true)
      const activeProducts = products.filter(p => p.active);
      console.log(`✅ ${activeProducts.length} products active for line sheet`);
      
      // Organize for line sheet
      const organized = LineSheetOrganizer.organizeGiltyBoyProducts(products);
      
      console.log('📋 Line Sheet Organization:');
      Object.keys(organized.categories).forEach(category => {
        const categoryData = organized.categories[category];
        console.log(`  ${category}: ${categoryData.totalCount} products`);
        
        Object.keys(categoryData.byMaterial).forEach(material => {
          const materialProducts = categoryData.byMaterial[material];
          console.log(`    ${material}: ${materialProducts.length} items`);
          
          materialProducts.forEach(product => {
            console.log(`      ${product.productCode} - ${product.productName} ($${product.wholesalePrice})`);
          });
        });
      });
      
      console.log('');
      console.log('💰 Price Analysis:');
      const prices = activeProducts.map(p => p.wholesalePrice).filter(p => p > 0);
      if (prices.length > 0) {
        console.log(`  Min: $${Math.min(...prices)}`);
        console.log(`  Max: $${Math.max(...prices)}`);
        console.log(`  Average: $${(prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2)}`);
        console.log(`  Total Value: $${organized.summary.totalWholesaleValue.toFixed(2)}`);
      }
      
      console.log('');
      console.log('🎯 Expected Line Sheet Structure:');
      organized.tableOfContents.forEach(item => {
        if (item.type === 'category') {
          console.log(`${item.name} ......................... ${item.count}`);
        } else if (item.type === 'material') {
          console.log(`  ${item.name} (${item.count} pieces)`);
        }
      });
      
      return organized;
      
    } catch (error) {
      console.log('❌ Error testing Gilty Boy data:', error.message);
      return false;
    }
  }

  static logDebugInfo() {
    console.log('🐛 Debug Information:');
    console.log('');
    console.log('Environment:', import.meta.env.MODE);
    console.log('Cache Stats:', AirtableClient.getCacheStats());
    console.log('Field Mappings:', AirtableClient.getFieldMappings());
    console.log('Mapping Stats:', AirtableClient.getMappingStats());
    console.log('');
    console.log('Available Commands:');
    console.log('  DevHelpers.testAirtableConnection()');
    console.log('  DevHelpers.loadTestData()');
    console.log('  DevHelpers.testGiltyBoyData()');
    console.log('  DevHelpers.testFieldMapping()');
    console.log('  DevHelpers.testSmartQuery()');
    console.log('  DevHelpers.checkEnvironmentSetup()');
    console.log('  DevHelpers.runFullTest()');
    console.log('  DevHelpers.benchmarkPerformance()');
    console.log('  DevHelpers.generateSampleAirtableStructure()');
  }
}

// Auto-run basic checks when in development mode
if (import.meta.env.MODE === 'development') {
  // Make DevHelpers available globally for console testing
  window.DevHelpers = DevHelpers;
  
  // Log helpful info
  console.log('🎨 Gilty Boy Line Sheet Builder - Development Mode');
  console.log('💡 Run DevHelpers.runFullTest() to test your setup');
  console.log('📋 Run DevHelpers.generateSampleAirtableStructure() for setup help');
}

export default DevHelpers;