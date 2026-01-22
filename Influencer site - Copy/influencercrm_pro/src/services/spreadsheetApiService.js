/**
 * Enterprise Spreadsheet API Service
 * Handles backend communication for spreadsheet data operations
 * Provides RESTful API endpoints for data persistence and processing
 */

import axios from 'axios';

class SpreadsheetApiService {
  constructor() {
    // Base API URL - adjust according to your backend configuration
    this.baseURL = process.env.REACT_APP_API_URL || '/api';
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000, // 30 seconds timeout
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for authentication
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error);
        if (error.response?.status === 401) {
          // Handle unauthorized access
          this.handleUnauthorized();
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Handle unauthorized access
   */
  handleUnauthorized() {
    // Clear auth tokens and redirect to login
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
    window.location.href = '/login';
  }

  /**
   * Save spreadsheet data to backend
   * @param {Object} spreadsheetData - The spreadsheet data to save
   * @returns {Promise<Object>} - API response
   */
  async saveSpreadsheetData(spreadsheetData) {
    try {
      const response = await this.client.post('/spreadsheet/import', {
        data: spreadsheetData.data,
        headers: spreadsheetData.headers,
        metadata: spreadsheetData.metadata,
        timestamp: new Date().toISOString(),
        userId: this.getCurrentUserId(),
      });

      return {
        success: true,
        data: response.data,
        message: 'Spreadsheet data saved successfully',
      };
    } catch (error) {
      console.error('Error saving spreadsheet data:', error);
      return {
        success: false,
        error: this.getErrorMessage(error),
        message: 'Failed to save spreadsheet data',
      };
    }
  }

  /**
   * Get all saved spreadsheets for current user
   * @param {Object} options - Query options (pagination, filters, etc.)
   * @returns {Promise<Object>} - API response
   */
  async getSavedSpreadsheets(options = {}) {
    try {
      const params = {
        page: options.page || 1,
        limit: options.limit || 20,
        sortBy: options.sortBy || 'createdAt',
        sortOrder: options.sortOrder || 'desc',
        ...options.filters,
      };

      const response = await this.client.get('/spreadsheet/list', { params });

      return {
        success: true,
        data: response.data.spreadsheets || [],
        pagination: response.data.pagination || {},
        message: 'Spreadsheets retrieved successfully',
      };
    } catch (error) {
      console.error('Error fetching spreadsheets:', error);
      return {
        success: false,
        error: this.getErrorMessage(error),
        message: 'Failed to fetch spreadsheets',
      };
    }
  }

  /**
   * Get specific spreadsheet by ID
   * @param {string} spreadsheetId - The spreadsheet ID
   * @returns {Promise<Object>} - API response
   */
  async getSpreadsheetById(spreadsheetId) {
    try {
      const response = await this.client.get(`/spreadsheet/${spreadsheetId}`);

      return {
        success: true,
        data: response.data,
        message: 'Spreadsheet retrieved successfully',
      };
    } catch (error) {
      console.error('Error fetching spreadsheet:', error);
      return {
        success: false,
        error: this.getErrorMessage(error),
        message: 'Failed to fetch spreadsheet',
      };
    }
  }

  /**
   * Update spreadsheet data
   * @param {string} spreadsheetId - The spreadsheet ID
   * @param {Object} updateData - The data to update
   * @returns {Promise<Object>} - API response
   */
  async updateSpreadsheet(spreadsheetId, updateData) {
    try {
      const response = await this.client.put(`/spreadsheet/${spreadsheetId}`, {
        ...updateData,
        updatedAt: new Date().toISOString(),
        updatedBy: this.getCurrentUserId(),
      });

      return {
        success: true,
        data: response.data,
        message: 'Spreadsheet updated successfully',
      };
    } catch (error) {
      console.error('Error updating spreadsheet:', error);
      return {
        success: false,
        error: this.getErrorMessage(error),
        message: 'Failed to update spreadsheet',
      };
    }
  }

  /**
   * Delete spreadsheet
   * @param {string} spreadsheetId - The spreadsheet ID
   * @returns {Promise<Object>} - API response
   */
  async deleteSpreadsheet(spreadsheetId) {
    try {
      await this.client.delete(`/spreadsheet/${spreadsheetId}`);

      return {
        success: true,
        message: 'Spreadsheet deleted successfully',
      };
    } catch (error) {
      console.error('Error deleting spreadsheet:', error);
      return {
        success: false,
        error: this.getErrorMessage(error),
        message: 'Failed to delete spreadsheet',
      };
    }
  }

  /**
   * Export spreadsheet data in different formats
   * @param {string} spreadsheetId - The spreadsheet ID
   * @param {string} format - Export format (csv, xlsx, json)
   * @returns {Promise<Object>} - API response
   */
  async exportSpreadsheet(spreadsheetId, format = 'csv') {
    try {
      const response = await this.client.get(`/spreadsheet/${spreadsheetId}/export`, {
        params: { format },
        responseType: format === 'json' ? 'json' : 'blob',
      });

      if (format === 'json') {
        return {
          success: true,
          data: response.data,
          message: 'Spreadsheet exported successfully',
        };
      } else {
        // Handle file download for binary formats
        const blob = new Blob([response.data], {
          type: response.headers['content-type'],
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `spreadsheet_${spreadsheetId}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        return {
          success: true,
          message: `Spreadsheet exported as ${format.toUpperCase()}`,
        };
      }
    } catch (error) {
      console.error('Error exporting spreadsheet:', error);
      return {
        success: false,
        error: this.getErrorMessage(error),
        message: 'Failed to export spreadsheet',
      };
    }
  }

  /**
   * Validate spreadsheet data
   * @param {Object} spreadsheetData - The data to validate
   * @param {Object} validationRules - Validation rules to apply
   * @returns {Promise<Object>} - Validation results
   */
  async validateSpreadsheetData(spreadsheetData, validationRules = {}) {
    try {
      const response = await this.client.post('/spreadsheet/validate', {
        data: spreadsheetData.data,
        headers: spreadsheetData.headers,
        validationRules,
      });

      return {
        success: true,
        data: response.data,
        message: 'Data validation completed',
      };
    } catch (error) {
      console.error('Error validating spreadsheet data:', error);
      return {
        success: false,
        error: this.getErrorMessage(error),
        message: 'Failed to validate spreadsheet data',
      };
    }
  }

  /**
   * Get current user ID from auth context or localStorage
   * @returns {string|null} - User ID or null if not available
   */
  getCurrentUserId() {
    // Try to get user ID from various sources
    return (
      localStorage.getItem('userId') ||
      sessionStorage.getItem('userId') ||
      null
    );
  }

  /**
   * Extract meaningful error message from error object
   * @param {Error} error - The error object
   * @returns {string} - Error message
   */
  getErrorMessage(error) {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    if (error.message) {
      return error.message;
    }
    return 'An unexpected error occurred';
  }

  /**
   * Health check for API service
   * @returns {Promise<Object>} - Health status
   */
  async healthCheck() {
    try {
      const response = await this.client.get('/health');
      return {
        success: true,
        data: response.data,
        message: 'API service is healthy',
      };
    } catch (error) {
      console.error('API health check failed:', error);
      return {
        success: false,
        error: this.getErrorMessage(error),
        message: 'API service is unavailable',
      };
    }
  }
}

// Create singleton instance
export const spreadsheetApiService = new SpreadsheetApiService();
export default spreadsheetApiService;
