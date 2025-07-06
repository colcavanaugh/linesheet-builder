// src/utils/airtable/smart-field-mapper.js
// Auto-discovery and intelligent field mapping

import { FIELD_MAPPINGS, FIELD_PATTERNS, QUERY_CONFIG } from '../../config/field-mappings.js';

export class SmartFieldMapper {
  constructor() {
    this.fieldCache = new Map();
    this.discoveredMappings = null;
  }

  // Main entry point: Get field mappings with auto-discovery fallback
  async getFieldMappings(airtableClient, force = false) {
    const cacheKey = `${airtableClient.baseId}_${airtableClient.tableName}`;
    
    // Return cached mappings unless forced refresh
    if (!force && this.fieldCache.has(cacheKey)) {
      return this.fieldCache.get(cacheKey);
    }

    try {
      // Step 1: Try to discover fields from sample data
      const discoveredMapping = await this.discoverFields(airtableClient);
      
      // Step 2: Validate discovered mappings
      const validatedMapping = this.validateMappings(discoveredMapping);
      
      // Step 3: Cache and return
      this.fieldCache.set(cacheKey, validatedMapping);
      this.discoveredMappings = validatedMapping;
      
      console.log('🔍 Field mapping discovered:', validatedMapping);
      return validatedMapping;
      
    } catch (error) {
      console.warn('Field discovery failed, using fallback mappings:', error);
      return this.getFallbackMappings();
    }
  }

  // Discover fields by analyzing sample records
  async discoverFields(airtableClient) {
    console.log('🔍 Discovering field mappings...');
    
    // Get a few sample records to analyze
    const sampleRecords = await this.getSampleRecords(airtableClient, 3);
    
    if (sampleRecords.length === 0) {
      throw new Error('No sample records found for field discovery');
    }

    // Analyze field patterns across samples
    const fieldAnalysis = this.analyzeFieldPatterns(sampleRecords);
    
    // Map to standard field names
    return this.inferStandardMappings(fieldAnalysis);
  }

  // Get sample records for analysis
  async getSampleRecords(airtableClient, maxRecords = 3) {
    try {
      // Make a simple request without any field-specific filters
      const url = `https://api.airtable.com/v0/${airtableClient.baseId}/${airtableClient.tableName}?maxRecords=${maxRecords}`;
      const response = await airtableClient.makeRequest(url);
      return response.records || [];
    } catch (error) {
      console.error('Failed to get sample records:', error);
      return [];
    }
  }

  // Analyze patterns in available fields
  analyzeFieldPatterns(records) {
    const fieldAnalysis = {};
    
    records.forEach(record => {
      if (!record.fields) return;
      
      Object.entries(record.fields).forEach(([fieldName, value]) => {
        if (!fieldAnalysis[fieldName]) {
          fieldAnalysis[fieldName] = {
            name: fieldName,
            types: new Set(),
            samples: [],
            hasData: false
          };
        }
        
        const analysis = fieldAnalysis[fieldName];
        analysis.types.add(typeof value);
        analysis.samples.push(value);
        
        if (value !== null && value !== undefined && value !== '') {
          analysis.hasData = true;
        }
      });
    });

    return fieldAnalysis;
  }

  // Infer standard field mappings from analysis
  inferStandardMappings(fieldAnalysis) {
    const mappings = {};
    const availableFields = Object.keys(fieldAnalysis);
    
    // Step 1: Try exact matches from configuration
    for (const [standardName, config] of Object.entries(FIELD_MAPPINGS)) {
      const match = config.candidates.find(candidate => 
        availableFields.includes(candidate)
      );
      
      if (match) {
        mappings[standardName] = {
          airtableField: match,
          confidence: 'exact',
          ...config
        };
      }
    }

    // Step 2: Try pattern matching for unmapped fields
    const unmappedFields = availableFields.filter(field => 
      !Object.values(mappings).some(mapping => mapping.airtableField === field)
    );

    for (const fieldName of unmappedFields) {
      const standardMatch = this.matchFieldPattern(fieldName, fieldAnalysis[fieldName]);
      if (standardMatch) {
        // Only add if we don't already have this standard field
        if (!mappings[standardMatch.standardName]) {
          mappings[standardMatch.standardName] = {
            airtableField: fieldName,
            confidence: 'pattern',
            required: false,
            defaultValue: this.getDefaultForType(standardMatch.type),
            type: standardMatch.type
          };
        }
      }
    }

    return mappings;
  }

  // Match field against known patterns
  matchFieldPattern(fieldName, analysis) {
    for (const [patternName, pattern] of Object.entries(FIELD_PATTERNS)) {
      if (pattern.pattern.test(fieldName)) {
        return {
          standardName: pattern.standardName,
          type: pattern.type,
          confidence: 'pattern'
        };
      }
    }
    return null;
  }

  // Validate discovered mappings
  validateMappings(mappings) {
    const validated = { ...mappings };
    
    // Check for required fields
    for (const [standardName, config] of Object.entries(FIELD_MAPPINGS)) {
      if (config.required && !validated[standardName]) {
        console.warn(`⚠️ Required field '${standardName}' not found in Airtable`);
        
        // Add with null mapping but keep config for defaults
        validated[standardName] = {
          airtableField: null,
          confidence: 'missing',
          ...config
        };
      }
    }

    return validated;
  }

  // Get fallback mappings when discovery fails
  getFallbackMappings() {
    const fallback = {};
    
    for (const [standardName, config] of Object.entries(FIELD_MAPPINGS)) {
      fallback[standardName] = {
        airtableField: config.candidates[0], // Use first candidate as guess
        confidence: 'fallback',
        ...config
      };
    }
    
    return fallback;
  }

  // Build queries using discovered mappings
  buildQuery(mappings, queryType = 'activeProducts', options = {}) {
    const queryTemplate = QUERY_CONFIG[queryType];
    if (!queryTemplate) {
      throw new Error(`Unknown query type: ${queryType}`);
    }

    const query = { ...options };

    // Add filter if template exists
    if (queryTemplate.filterTemplate && mappings.active?.airtableField) {
      query.filterByFormula = queryTemplate.filterTemplate(mappings.active.airtableField);
    }

    // Add sort if template exists
    if (queryTemplate.sortTemplate && mappings.productCode?.airtableField) {
      const sortArray = queryTemplate.sortTemplate(mappings.productCode.airtableField);
      query.sort = JSON.stringify(sortArray); // Convert to JSON string for URL
    }

    return query;
  }

  // Transform record using discovered mappings
  transformRecord(record, mappings) {
    const transformed = {
      id: record.id,
      metadata: {
        airtableId: record.id,
        createdTime: record.createdTime,
        fieldMappings: Object.keys(mappings).filter(key => 
          mappings[key].airtableField && mappings[key].confidence !== 'missing'
        )
      }
    };

    for (const [standardName, mapping] of Object.entries(mappings)) {
      const value = this.extractFieldValue(record.fields, mapping);
      transformed[standardName] = value;
    }

    return transformed;
  }

  // Extract field value with fallbacks
  extractFieldValue(fields, mapping) {
    // If no airtable field mapping, use default
    if (!mapping.airtableField || mapping.confidence === 'missing') {
      return mapping.defaultValue;
    }

    const rawValue = fields[mapping.airtableField];
    
    // If no value, use default
    if (rawValue === undefined || rawValue === null) {
      return mapping.defaultValue;
    }

    // Transform based on type
    return this.transformValue(rawValue, mapping.type, mapping.defaultValue);
  }

  // Transform value based on expected type
  transformValue(value, type, defaultValue) {
    switch (type) {
      case 'currency':
        const num = typeof value === 'string' ? parseFloat(value) : value;
        return isNaN(num) ? defaultValue : num;
      
      case 'checkbox':
        return Boolean(value);
      
      case 'attachment':
        return Array.isArray(value) ? this.transformImages(value) : defaultValue;
      
      case 'select':
        // Handle single select vs multi-select
        if (Array.isArray(value)) {
          return value.length > 0 ? value[0] : defaultValue;
        }
        return value || defaultValue;
      
      case 'text':
      default:
        return String(value || defaultValue);
    }
  }

  // Transform Airtable image attachments
  transformImages(imageFields) {
    if (!Array.isArray(imageFields)) return [];
    
    return imageFields.map(img => ({
      id: img.id,
      url: img.url,
      filename: img.filename,
      size: img.size,
      type: img.type,
      thumbnails: img.thumbnails || {}
    }));
  }

  // Utility methods
  getDefaultForType(type) {
    switch (type) {
      case 'currency': return 0;
      case 'checkbox': return false;
      case 'attachment': return [];
      case 'text': 
      default: return '';
    }
  }

  // Get mapping statistics for debugging
  getMappingStats(mappings) {
    const stats = {
      total: Object.keys(mappings).length,
      exact: 0,
      pattern: 0,
      fallback: 0,
      missing: 0,
      confidence: {}
    };

    for (const mapping of Object.values(mappings)) {
      stats[mapping.confidence]++;
      stats.confidence[mapping.confidence] = (stats.confidence[mapping.confidence] || 0) + 1;
    }

    return stats;
  }

  // Clear cache (useful for development)
  clearCache() {
    this.fieldCache.clear();
    this.discoveredMappings = null;
  }
}

export default SmartFieldMapper;