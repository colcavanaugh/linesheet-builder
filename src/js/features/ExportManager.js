// js/features/ExportManager.js
// Export operations (PDF, Markdown, etc.)

import { getErrorMessage } from '../config/app.config.js';

export class ExportManager {
  constructor(app) {
    this.app = app;
  }

  // Export Operations (moved from main.js)
  async exportPDF() {
    const state = this.app.stateManager.getState();
    if (state.products.length === 0) {
      this.app.notificationManager.showError(getErrorMessage('export', 'noProducts'));
      return;
    }

    this.app.uiManager.updateLoadingState(true, 'Generating PDF...');
    
    try {
      // This will be implemented in Phase 3
      this.app.notificationManager.showInfo('PDF export will be available in the next development phase.');
      
    } catch (error) {
      console.error('PDF export failed:', error);
      this.app.notificationManager.showError(getErrorMessage('export', 'pdfGeneration'));
    } finally {
      this.app.uiManager.updateLoadingState(false);
    }
  }

  async exportMarkdown() {
    const state = this.app.stateManager.getState();
    if (state.products.length === 0) {
      this.app.notificationManager.showError(getErrorMessage('export', 'noProducts'));
      return;
    }

    this.app.uiManager.updateLoadingState(true, 'Generating Markdown...');
    
    try {
      // This will be implemented in Phase 3
      this.app.notificationManager.showInfo('Markdown export will be available in the next development phase.');
      
    } catch (error) {
      console.error('Markdown export failed:', error);
      this.app.notificationManager.showError('Failed to generate Markdown export.');
    } finally {
      this.app.uiManager.updateLoadingState(false);
    }
  }
}

export default ExportManager;