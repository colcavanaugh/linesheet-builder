// src/utils/pdf/ClientPDFGenerator.js
// Client-side PDF generator that communicates with local Node.js server

export class ClientPDFGenerator {
  constructor() {
    this.serverURL = 'http://localhost:3001';
    this.isServerAvailable = false;
  }

  /**
   * Initialize and check server availability
   */
  async initialize() {
    try {
      const response = await fetch(`${this.serverURL}/api/health`, {
        method: 'GET',
        timeout: 2000
      });
      
      if (response.ok) {
        const data = await response.json();
        this.isServerAvailable = data.status === 'ok';
        console.log('✅ PDF server is available');
      }
    } catch (error) {
      console.warn('⚠️ PDF server not available:', error.message);
      this.isServerAvailable = false;
    }
  }

  /**
   * Generate PDF using the local server
   * @param {string} linesheetHTML - Complete HTML from LinesheetGenerator
   * @param {Object} options - PDF generation options
   * @returns {ArrayBuffer} PDF data
   */
  async generatePDF(linesheetHTML, options = {}) {
    // Check server availability first
    if (!this.isServerAvailable) {
      await this.initialize();
    }

    if (!this.isServerAvailable) {
      throw new Error('PDF server is not available. Please ensure the PDF server is running.');
    }

    try {
      console.log('🔄 Sending PDF generation request to server...');
      
      const response = await fetch(`${this.serverURL}/api/generate-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          html: linesheetHTML,
          options: {
            format: 'Letter',
            printBackground: true,
            margin: {
              top: '0.75in',
              bottom: '0.75in',
              left: '0.75in',
              right: '0.75in'
            },
            ...options
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Server error: ${errorData.message || response.statusText}`);
      }

      const pdfBuffer = await response.arrayBuffer();
      console.log('✅ PDF generated successfully by server');
      
      return pdfBuffer;

    } catch (error) {
      console.error('❌ PDF generation failed:', error);
      throw new Error(`PDF generation failed: ${error.message}`);
    }
  }

  /**
   * Check if the PDF server is running
   * @returns {boolean} True if server is available
   */
  async isServerRunning() {
    try {
      const response = await fetch(`${this.serverURL}/api/health`, {
        method: 'GET',
        timeout: 1000
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get server status information
   * @returns {Object} Server status
   */
  async getServerStatus() {
    try {
      const response = await fetch(`${this.serverURL}/api/health`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      return { status: 'unavailable', error: error.message };
    }
  }
}