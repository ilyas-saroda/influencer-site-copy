/**
 * Enterprise Spreadsheet Service
 * Handles Excel/CSV file parsing and Google Sheets integration
 * Provides unified interface for spreadsheet data operations
 */

import * as XLSX from 'xlsx';

class SpreadsheetService {
  constructor() {
    this.supportedFormats = ['.xlsx', '.xls', '.csv'];
    this.maxFileSize = 50 * 1024 * 1024; // 50MB limit
  }

  /**
   * Parse Excel/CSV file and convert to JSON
   * @param {File} file - The uploaded file
   * @returns {Promise<Object>} - Parsed data with metadata
   */
  async parseExcelFile(file) {
    try {
      // Validate file
      this.validateFile(file);

      // Read file using FileReader
      const data = await this.readFileAsArrayBuffer(file);
      
      // Parse with XLSX library
      const workbook = XLSX.read(data, {
        type: 'array',
        cellDates: true,
        dateNF: 'yyyy-mm-dd'
      });

      // Get first sheet name
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        throw new Error('No sheets found in the workbook');
      }

      // Convert first sheet to JSON
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: null,
        blankrows: false
      });

      // Process data structure
      const processedData = this.processSheetData(jsonData);

      return {
        success: true,
        data: processedData.data,
        headers: processedData.headers,
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          sheetName: firstSheetName,
          totalSheets: workbook.SheetNames.length,
          rowCount: processedData.data.length,
          columnCount: processedData.headers.length,
          fileType: file.name.split('.').pop().toUpperCase()
        }
      };

    } catch (error) {
      console.error('Error parsing Excel file:', error);
      return {
        success: false,
        error: error.message || 'Failed to parse Excel file'
      };
    }
  }

  /**
   * Fetch and parse Google Sheets data
   * @param {string} sheetUrl - Google Sheets URL
   * @returns {Promise<Object>} - Parsed data with metadata
   */
  async fetchGoogleSheet(sheetUrl) {
    try {
      // Validate and extract sheet ID
      const sheetId = this.extractGoogleSheetId(sheetUrl);
      if (!sheetId) {
        throw new Error('Invalid Google Sheets URL');
      }

      // Fetch CSV export of the sheet
      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`;
      const response = await fetch(csvUrl);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Google Sheet not found or not publicly accessible');
        } else if (response.status === 403) {
          throw new Error('Google Sheet is private. Please make it publicly accessible or use a shareable link');
        }
        throw new Error(`Failed to fetch Google Sheet: ${response.statusText}`);
      }

      const csvText = await response.text();
      
      // Parse CSV using XLSX
      const workbook = XLSX.read(csvText, { type: 'string' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: null,
        blankrows: false
      });

      // Process data structure
      const processedData = this.processSheetData(jsonData);

      return {
        success: true,
        data: processedData.data,
        headers: processedData.headers,
        metadata: {
          sheetUrl: sheetUrl,
          sheetId: sheetId,
          sheetName: firstSheetName,
          rowCount: processedData.data.length,
          columnCount: processedData.headers.length,
          fileType: 'GOOGLE_SHEETS'
        }
      };

    } catch (error) {
      console.error('Error fetching Google Sheet:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch Google Sheet'
      };
    }
  }

  /**
   * Process raw sheet data into structured format
   * @param {Array} rawData - Raw 2D array from XLSX
   * @returns {Object} - Processed data with headers and rows
   */
  processSheetData(rawData) {
    if (!rawData || rawData.length === 0) {
      return { headers: [], data: [] };
    }

    // First row as headers, clean them up
    const headers = rawData[0].map(header => 
      header && typeof header === 'string' ? header.trim() : `Column ${rawData[0].indexOf(header) + 1}`
    );

    // Process data rows
    const data = rawData.slice(1).map((row, index) => {
      const rowObj = {};
      headers.forEach((header, colIndex) => {
        rowObj[header] = row[colIndex] || null;
      });
      return rowObj;
    }).filter(row => Object.values(row).some(value => value !== null && value !== ''));

    return { headers, data };
  }

  /**
   * Validate uploaded file
   * @param {File} file - The file to validate
   */
  validateFile(file) {
    if (!file) {
      throw new Error('No file provided');
    }

    // Check file extension
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    if (!this.supportedFormats.includes(fileExtension)) {
      throw new Error(`Unsupported file format. Supported formats: ${this.supportedFormats.join(', ')}`);
    }

    // Check file size
    if (file.size > this.maxFileSize) {
      throw new Error(`File size exceeds limit of ${this.maxFileSize / (1024 * 1024)}MB`);
    }

    // Check if file is empty
    if (file.size === 0) {
      throw new Error('File is empty');
    }
  }

  /**
   * Extract Google Sheet ID from URL
   * @param {string} url - Google Sheets URL
   * @returns {string|null} - Sheet ID or null if invalid
   */
  extractGoogleSheetId(url) {
    try {
      const urlObj = new URL(url);
      
      // Handle different Google Sheets URL formats
      if (urlObj.hostname.includes('docs.google.com')) {
        // Format: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
        const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        return match ? match[1] : null;
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Read file as ArrayBuffer
   * @param {File} file - The file to read
   * @returns {Promise<ArrayBuffer>} - File data as ArrayBuffer
   */
  readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('Failed to read file'));
      
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Attempt to open file in system's default Excel application
   * @param {File} file - The file to open
   */
  async openInSystemExcel(file) {
    try {
      // Create download link for the file
      const url = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return { success: true, message: 'File downloaded for system Excel opening' };
    } catch (error) {
      console.error('Error opening in system Excel:', error);
      return { 
        success: false, 
        error: 'Failed to open in system Excel. Please download the file manually.' 
      };
    }
  }

  /**
   * Export data to CSV format
   * @param {Array} data - Data to export
   * @param {Array} headers - Column headers
   * @param {string} filename - Output filename
   * @returns {Promise<void>}
   */
  async exportToCSV(data, headers, filename = 'export.csv') {
    try {
      const csvContent = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => {
            const value = row[header] || '';
            // Escape commas and quotes in CSV
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error exporting to CSV:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const spreadsheetService = new SpreadsheetService();
export default spreadsheetService;
