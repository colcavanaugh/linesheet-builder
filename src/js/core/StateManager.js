// js/core/StateManager.js
// State management for the Line Sheet application

import { APP_CONFIG } from '../config/app.config.js';

export class StateManager {
  constructor() {
    this.state = {
      products: [],
      organizedProducts: null,
      isLoading: false,
      error: null,
      config: {
        template: APP_CONFIG.templates.default,
        customization: {
          font: APP_CONFIG.ui.fonts.brand[0],
          colors: APP_CONFIG.ui.theme,
          branding: null
        }
      },
      ui: {
        currentView: 'dashboard',
        notifications: []
      }
    };
  }

  // Get current state
  getState() {
    return this.state;
  }

  // Update state properties
  updateState(updates) {
    this.state = { ...this.state, ...updates };
  }

  // Update nested state properties
  updateConfig(configUpdates) {
    this.state.config = { ...this.state.config, ...configUpdates };
  }

  updateUI(uiUpdates) {
    this.state.ui = { ...this.state.ui, ...uiUpdates };
  }

  // Configuration Management (moved from main.js)
  saveConfig() {
    try {
      localStorage.setItem('linesheet-config', JSON.stringify(this.state.config));
    } catch (error) {
      console.warn('Failed to save configuration:', error);
    }
  }

  loadSavedConfig() {
    try {
      const saved = localStorage.getItem('linesheet-config');
      if (saved) {
        const config = JSON.parse(saved);
        this.state.config = { ...this.state.config, ...config };
        console.log('Loaded saved configuration');
      }
    } catch (error) {
      console.warn('Failed to load saved configuration:', error);
    }
  }

  // Debug Methods (moved from main.js)
  getDebugInfo() {
    return {
      state: this.state,
      config: APP_CONFIG
    };
  }
}

export default StateManager;