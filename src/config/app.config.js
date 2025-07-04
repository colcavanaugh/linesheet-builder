// Application configuration
export const loadConfig = async () => {
  return {
    app: {
      name: 'Gilty Boy Line Sheet Builder',
      version: '1.0.0'
    },
    airtable: {
      apiKey: import.meta.env.VITE_AIRTABLE_API_KEY,
      baseId: import.meta.env.VITE_AIRTABLE_BASE_ID,
      tableName: import.meta.env.VITE_AIRTABLE_TABLE_NAME || 'Products'
    },
    pdf: {
      format: 'letter',
      margin: '0.5in',
      quality: 'high'
    },
    templates: {
      default: 'modern',
      available: ['modern', 'classic', 'minimal']
    }
  }
}
