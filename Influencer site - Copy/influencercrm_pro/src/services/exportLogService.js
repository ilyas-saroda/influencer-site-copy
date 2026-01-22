import { supabase } from '../lib/supabase';

export const exportLogService = {
  /**
   * Log an export activity to the export_log table
   * @param {Object} exportData - Export information
   * @param {string} exportData.username - Username of the user performing export
   * @param {string} exportData.exportType - Type of export (excel, csv, pdf)
   * @param {string} exportData.exportScope - Scope of export (selected, all)
   * @param {number} exportData.recordCount - Number of records exported
   * @param {string} exportData.fileName - Name of the exported file
   * @param {string} exportData.additionalDetails - Any additional export details
   * @returns {Promise<Object>} Result of the log operation
   */
  async logExport({
    username,
    exportType,
    exportScope,
    recordCount,
    fileName,
    additionalDetails = ''
  }) {
    try {
      // Build export details string
      const exportDetails = this.buildExportDetailsString({
        exportType,
        exportScope,
        recordCount,
        fileName,
        additionalDetails
      });

      // Insert log entry into export_log table
      const { data, error } = await supabase
        ?.from('export_log')
        ?.insert([
          {
            username: username || 'Unknown User',
            export_date: new Date().toISOString(),
            export_details: exportDetails
          }
        ])
        ?.select()
        ?.single();

      if (error) {
        console.error('Error logging export:', error);
        throw error;
      }

      console.log('Export logged successfully:', data);
      return { success: true, data, error: null };
    } catch (error) {
      console.error('Failed to log export activity:', error);
      return { 
        success: false, 
        data: null, 
        error: error.message || 'Failed to log export activity' 
      };
    }
  },

  /**
   * Build a formatted export details string
   * @param {Object} details - Export details
   * @returns {string} Formatted export details string
   */
  buildExportDetailsString({
    exportType,
    exportScope,
    recordCount,
    fileName,
    additionalDetails
  }) {
    const details = [];
    
    if (exportType) {
      details.push(`Type: ${exportType.toUpperCase()}`);
    }
    
    if (exportScope) {
      details.push(`Scope: ${exportScope === 'selected' ? 'Selected Records' : 'All Records'}`);
    }
    
    if (recordCount !== undefined && recordCount !== null) {
      details.push(`Records: ${recordCount}`);
    }
    
    if (fileName) {
      details.push(`File: ${fileName}`);
    }
    
    if (additionalDetails) {
      details.push(`Additional: ${additionalDetails}`);
    }

    return details.join(' | ');
  },

  /**
   * Get export logs for a specific user or all users
   * @param {Object} options - Query options
   * @param {string} options.username - Filter by username (optional)
   * @param {number} options.limit - Maximum number of records to return
   * @param {number} options.offset - Offset for pagination
   * @param {string} options.startDate - Filter by start date (ISO string)
   * @param {string} options.endDate - Filter by end date (ISO string)
   * @returns {Promise<Object>} Export logs data
   */
  async getExportLogs(options = {}) {
    try {
      const {
        username,
        limit = 100,
        offset = 0,
        startDate,
        endDate
      } = options;

      let query = supabase
        ?.from('export_log')
        ?.select('*', { count: 'exact' })
        ?.order('export_date', { ascending: false });

      // Apply filters
      if (username) {
        query = query?.eq('username', username);
      }

      if (startDate) {
        query = query?.gte('export_date', startDate);
      }

      if (endDate) {
        query = query?.lte('export_date', endDate);
      }

      // Apply pagination
      query = query?.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data || [],
        total: count || 0,
        limit,
        offset
      };
    } catch (error) {
      console.error('Error fetching export logs:', error);
      throw error;
    }
  },

  /**
   * Get export statistics
   * @param {Object} options - Query options
   * @param {string} options.username - Filter by username (optional)
   * @param {string} options.startDate - Filter by start date (optional)
   * @param {string} options.endDate - Filter by end date (optional)
   * @returns {Promise<Object>} Export statistics
   */
  async getExportStatistics(options = {}) {
    try {
      const { username, startDate, endDate } = options;

      let query = supabase
        ?.from('export_log')
        ?.select('*');

      // Apply filters
      if (username) {
        query = query?.eq('username', username);
      }

      if (startDate) {
        query = query?.gte('export_date', startDate);
      }

      if (endDate) {
        query = query?.lte('export_date', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      const logs = data || [];
      
      // Calculate statistics
      const stats = {
        totalExports: logs.length,
        exportsByType: {},
        exportsByUser: {},
        exportsByDate: {},
        totalRecordsExported: 0
      };

      logs.forEach(log => {
        const details = log.export_details || '';
        
        // Count by type
        const typeMatch = details.match(/Type: (\w+)/);
        if (typeMatch) {
          const type = typeMatch[1];
          stats.exportsByType[type] = (stats.exportsByType[type] || 0) + 1;
        }

        // Count by user
        stats.exportsByUser[log.username] = (stats.exportsByUser[log.username] || 0) + 1;

        // Count by date (group by day)
        const date = new Date(log.export_date).toISOString().split('T')[0];
        stats.exportsByDate[date] = (stats.exportsByDate[date] || 0) + 1;

        // Count total records
        const recordMatch = details.match(/Records: (\d+)/);
        if (recordMatch) {
          stats.totalRecordsExported += parseInt(recordMatch[1], 10);
        }
      });

      return stats;
    } catch (error) {
      console.error('Error fetching export statistics:', error);
      throw error;
    }
  }
};
