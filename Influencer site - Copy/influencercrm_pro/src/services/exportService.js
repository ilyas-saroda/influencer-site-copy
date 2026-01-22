/**
 * Enterprise Export Service
 * Handles data export in multiple formats (CSV, Excel, JSON, PDF)
 * Provides comprehensive export functionality with progress tracking
 */

import * as XLSX from 'xlsx';

class ExportService {
  constructor() {
    this.supportedFormats = ['csv', 'xlsx', 'json', 'pdf'];
    this.maxExportSize = 100000; // Maximum rows for export
  }

  /**
   * Export data to CSV format
   * @param {Array} data - Data to export
   * @param {Array} headers - Column headers
   * @param {Object} options - Export options
   * @returns {Promise<Object>} - Export result
   */
  async exportToCSV(data, headers, options = {}) {
    try {
      const filename = options.filename || `export_${new Date().toISOString().split('T')[0]}.csv`;
      
      // Validate data
      if (!data || data.length === 0) {
        throw new Error('No data available for export');
      }

      // Create CSV content
      const csvHeaders = headers.join(',');
      const csvRows = data.map(row => {
        return headers.map(header => {
          const value = row[header] || '';
          
          // Handle different data types
          if (value === null || value === undefined) {
            return '';
          }
          
          const stringValue = value.toString();
          
          // Escape commas, quotes, and newlines
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          
          return stringValue;
        }).join(',');
      });
      
      const csvContent = [csvHeaders, ...csvRows].join('\n');
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      this.downloadFile(blob, filename);
      
      return {
        success: true,
        format: 'csv',
        filename,
        rowCount: data.length,
        columnCount: headers.length,
        fileSize: blob.size,
        message: 'CSV export completed successfully'
      };
      
    } catch (error) {
      console.error('CSV export error:', error);
      return {
        success: false,
        error: error.message,
        format: 'csv'
      };
    }
  }

  /**
   * Export data to Excel format (.xlsx)
   * @param {Array} data - Data to export
   * @param {Array} headers - Column headers
   * @param {Object} options - Export options
   * @returns {Promise<Object>} - Export result
   */
  async exportToExcel(data, headers, options = {}) {
    try {
      const filename = options.filename || `export_${new Date().toISOString().split('T')[0]}.xlsx`;
      const sheetName = options.sheetName || 'Export Data';
      
      // Validate data
      if (!data || data.length === 0) {
        throw new Error('No data available for export');
      }

      // Create workbook
      const workbook = XLSX.utils.book_new();
      
      // Convert data to worksheet format
      const worksheetData = [headers];
      data.forEach(row => {
        const rowData = headers.map(header => {
          const value = row[header];
          
          // Handle different data types for Excel
          if (value === null || value === undefined) {
            return '';
          }
          
          if (typeof value === 'boolean') {
            return value ? 'TRUE' : 'FALSE';
          }
          
          if (typeof value === 'number') {
            return value;
          }
          
          if (value instanceof Date) {
            return value;
          }
          
          return value.toString();
        });
        worksheetData.push(rowData);
      });
      
      // Create worksheet
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      
      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      
      // Create and download file
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      this.downloadFile(blob, filename);
      
      return {
        success: true,
        format: 'xlsx',
        filename,
        rowCount: data.length,
        columnCount: headers.length,
        fileSize: blob.size,
        message: 'Excel export completed successfully'
      };
      
    } catch (error) {
      console.error('Excel export error:', error);
      return {
        success: false,
        error: error.message,
        format: 'xlsx'
      };
    }
  }

  /**
   * Export data to JSON format
   * @param {Array} data - Data to export
   * @param {Array} headers - Column headers
   * @param {Object} options - Export options
   * @returns {Promise<Object>} - Export result
   */
  async exportToJSON(data, headers, options = {}) {
    try {
      const filename = options.filename || `export_${new Date().toISOString().split('T')[0]}.json`;
      const includeMetadata = options.includeMetadata !== false;
      
      // Validate data
      if (!data || data.length === 0) {
        throw new Error('No data available for export');
      }

      // Create export object
      const exportData = {
        data: data,
        headers: headers,
        metadata: includeMetadata ? {
          exportedAt: new Date().toISOString(),
          rowCount: data.length,
          columnCount: headers.length,
          format: 'json',
          version: '1.0'
        } : undefined
      };

      // Convert to JSON string
      const jsonString = JSON.stringify(exportData, null, 2);
      
      // Create and download file
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
      this.downloadFile(blob, filename);
      
      return {
        success: true,
        format: 'json',
        filename,
        rowCount: data.length,
        columnCount: headers.length,
        fileSize: blob.size,
        message: 'JSON export completed successfully'
      };
      
    } catch (error) {
      console.error('JSON export error:', error);
      return {
        success: false,
        error: error.message,
        format: 'json'
      };
    }
  }

  /**
   * Export data to PDF format (basic implementation)
   * @param {Array} data - Data to export
   * @param {Array} headers - Column headers
   * @param {Object} options - Export options
   * @returns {Promise<Object>} - Export result
   */
  async exportToPDF(data, headers, options = {}) {
    try {
      const filename = options.filename || `export_${new Date().toISOString().split('T')[0]}.pdf`;
      const title = options.title || 'Data Export';
      
      // Validate data
      if (!data || data.length === 0) {
        throw new Error('No data available for export');
      }

      // Create HTML content for PDF
      const htmlContent = this.generatePDFHTML(data, headers, title, options);
      
      // Create blob
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
      this.downloadFile(blob, filename);
      
      return {
        success: true,
        format: 'pdf',
        filename,
        rowCount: data.length,
        columnCount: headers.length,
        fileSize: blob.size,
        message: 'PDF export completed successfully (HTML format)'
      };
      
    } catch (error) {
      console.error('PDF export error:', error);
      return {
        success: false,
        error: error.message,
        format: 'pdf'
      };
    }
  }

  /**
   * Generate HTML content for PDF export
   * @param {Array} data - Data to export
   * @param {Array} headers - Column headers
   * @param {string} title - Document title
   * @param {Object} options - Export options
   * @returns {string} - HTML content
   */
  generatePDFHTML(data, headers, title, options) {
    const timestamp = new Date().toLocaleString();
    
    let html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${title}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background-color: #f5f5f5; padding: 8px; text-align: left; border: 1px solid #ddd; font-weight: bold; }
        td { padding: 8px; border: 1px solid #ddd; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .metadata { margin-top: 30px; font-size: 12px; color: #666; }
        @media print { body { margin: 0; } }
    </style>
</head>
<body>
    <h1>${title}</h1>
    <div class="metadata">
        <p><strong>Exported:</strong> ${timestamp}</p>
        <p><strong>Rows:</strong> ${data.length}</p>
        <p><strong>Columns:</strong> ${headers.length}</p>
    </div>
    <table>
        <thead>
            <tr>
    `;
    
    // Add headers
    headers.forEach(header => {
      html += `<th>${this.escapeHtml(header)}</th>`;
    });
    
    html += `
            </tr>
        </thead>
        <tbody>
    `;
    
    // Add data rows
    data.forEach(row => {
      html += '<tr>';
      headers.forEach(header => {
        const value = row[header] || '';
        html += `<td>${this.escapeHtml(value.toString())}</td>`;
      });
      html += '</tr>';
    });
    
    html += `
        </tbody>
    </table>
</body>
</html>`;
    
    return html;
  }

  /**
   * Escape HTML characters
   * @param {string} text - Text to escape
   * @returns {string} - Escaped text
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Download file to user's computer
   * @param {Blob} blob - File blob
   * @param {string} filename - File name
   */
  downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Export data with progress tracking
   * @param {Array} data - Data to export
   * @param {Array} headers - Column headers
   * @param {string} format - Export format
   * @param {Object} options - Export options
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object>} - Export result
   */
  async exportWithProgress(data, headers, format, options = {}, onProgress) {
    try {
      // Validate format
      if (!this.supportedFormats.includes(format)) {
        throw new Error(`Unsupported export format: ${format}`);
      }

      // Validate data size
      if (data.length > this.maxExportSize) {
        throw new Error(`Data exceeds maximum export size of ${this.maxExportSize} rows`);
      }

      // Simulate progress for large datasets
      if (onProgress && data.length > 1000) {
        const steps = 5;
        for (let i = 0; i <= steps; i++) {
          onProgress({ progress: (i / steps) * 100, message: `Processing export... ${i}/${steps}` });
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Export based on format
      switch (format) {
        case 'csv':
          return await this.exportToCSV(data, headers, options);
        case 'xlsx':
          return await this.exportToExcel(data, headers, options);
        case 'json':
          return await this.exportToJSON(data, headers, options);
        case 'pdf':
          return await this.exportToPDF(data, headers, options);
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
      
    } catch (error) {
      console.error('Export error:', error);
      return {
        success: false,
        error: error.message,
        format
      };
    }
  }

  /**
   * Get supported export formats
   * @returns {Array} - Supported formats
   */
  getSupportedFormats() {
    return this.supportedFormats.map(format => ({
      value: format,
      label: format.toUpperCase(),
      description: this.getFormatDescription(format)
    }));
  }

  /**
   * Get format description
   * @param {string} format - Format code
   * @returns {string} - Description
   */
  getFormatDescription(format) {
    const descriptions = {
      csv: 'Comma-separated values, compatible with Excel and other spreadsheet applications',
      xlsx: 'Microsoft Excel format with full formatting support',
      json: 'Structured data format for developers and APIs',
      pdf: 'Portable Document Format for sharing and printing'
    };
    return descriptions[format] || 'Unknown format';
  }

  /**
   * Validate export data
   * @param {Array} data - Data to validate
   * @param {Array} headers - Headers to validate
   * @returns {Object} - Validation result
   */
  validateExportData(data, headers) {
    const errors = [];
    
    if (!Array.isArray(data)) {
      errors.push('Data must be an array');
    }
    
    if (!Array.isArray(headers)) {
      errors.push('Headers must be an array');
    }
    
    if (data.length === 0) {
      errors.push('Data array cannot be empty');
    }
    
    if (headers.length === 0) {
      errors.push('Headers array cannot be empty');
    }
    
    if (data.length > this.maxExportSize) {
      errors.push(`Data exceeds maximum export size of ${this.maxExportSize} rows`);
    }
    
    // Check data structure
    data.forEach((row, index) => {
      if (typeof row !== 'object' || row === null) {
        errors.push(`Row ${index + 1} must be an object`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Create singleton instance
export const exportService = new ExportService();
export default exportService;
