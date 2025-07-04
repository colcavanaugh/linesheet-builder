// Gilty Boy Line Sheet Builder - Main Entry Point
import { initializeApp } from './app.js'
import { loadConfig } from '../config/app.config.js'

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🎨 Initializing Gilty Boy Line Sheet Builder...')
  
  try {
    const config = await loadConfig()
    await initializeApp(config)
    console.log('✅ Application initialized successfully')
  } catch (error) {
    console.error('❌ Failed to initialize application:', error)
  }
})
