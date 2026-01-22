/**
 * Mock Audit Service - Professional Audit Logging System
 * Provides comprehensive audit trail functionality with mock data
 */

export const auditService = {
  /**
   * Log a single audit change
   * @param {Object} auditData - Audit data object
   * @returns {Promise<string>} Audit ID
   */
  async logChange(auditData) {
    try {
      console.log('🔍 Mock audit log:', auditData);
      
      // Generate mock audit ID
      const auditId = 'audit_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      
      // Store in localStorage for demo purposes
      const existingLogs = JSON.parse(localStorage.getItem('auditLogs') || '[]');
      const newLog = {
        id: auditId,
        action_type: auditData.actionType,
        table_name: auditData.tableName,
        record_id: auditData.recordId,
        old_value: auditData.oldValue,
        new_value: auditData.newValue,
        changed_by: auditData.changedBy,
        user_email: auditData.userEmail,
        ip_address: auditData.ipAddress || '127.0.0.1',
        user_agent: auditData.userAgent || 'Mock Browser',
        timestamp: new Date().toISOString(),
        session_id: auditData.sessionId,
        transaction_id: auditData.transactionId,
        metadata: auditData.metadata || {}
      };
      
      existingLogs.push(newLog);
      localStorage.setItem('auditLogs', JSON.stringify(existingLogs.slice(-100))); // Keep last 100 logs
      
      return auditId;
    } catch (error) {
      console.error('❌ Mock audit log error:', error);
      throw error;
    }
  },

  /**
   * Log batch audit changes
   * @param {Object} batchAuditData - Batch audit data
   * @returns {Promise<string>} Audit ID
   */
  async logBatchChange(batchAuditData) {
    try {
      console.log('🔍 Mock batch audit log:', batchAuditData);
      
      // Generate mock audit ID
      const auditId = 'batch_audit_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      
      // Store in localStorage for demo purposes
      const existingLogs = JSON.parse(localStorage.getItem('auditLogs') || '[]');
      const newLog = {
        id: auditId,
        action_type: batchAuditData.actionType,
        table_name: batchAuditData.tableName,
        record_id: null, // Batch operations don't have single record ID
        old_value: null,
        new_value: null,
        changed_by: batchAuditData.changedBy,
        user_email: batchAuditData.userEmail,
        ip_address: batchAuditData.ipAddress || '127.0.0.1',
        user_agent: batchAuditData.userAgent || 'Mock Browser',
        timestamp: new Date().toISOString(),
        session_id: batchAuditData.sessionId,
        transaction_id: batchAuditData.transactionId,
        metadata: {
          ...batchAuditData.metadata,
          batch_size: batchAuditData.changes?.length || 0
        }
      };
      
      existingLogs.push(newLog);
      localStorage.setItem('auditLogs', JSON.stringify(existingLogs.slice(-100))); // Keep last 100 logs
      
      return auditId;
    } catch (error) {
      console.error('❌ Mock batch audit log error:', error);
      throw error;
    }
  },

  /**
   * Get audit history for a specific record
   * @param {string} tableName - Table name
   * @param {string} recordId - Record ID
   * @param {number} limit - Limit results
   * @returns {Promise<Array>} Audit history
   */
  async getAuditHistory(tableName, recordId, limit = 50) {
    try {
      const logs = JSON.parse(localStorage.getItem('auditLogs') || '[]');
      
      const filteredLogs = logs.filter(log => 
        log.table_name === tableName && 
        (log.record_id === recordId || 
         (log.metadata?.changes && log.metadata.changes.some(change => 
           change.record_identifier === recordId
         )))
      );
      
      return filteredLogs
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);
    } catch (error) {
      console.error('❌ Mock get audit history error:', error);
      throw error;
    }
  },

  /**
   * Get batch operation details
   * @param {string} auditId - Audit ID
   * @returns {Promise<Array>} Batch details
   */
  async getBatchDetails(auditId) {
    try {
      const logs = JSON.parse(localStorage.getItem('auditLogs') || '[]');
      const batchLog = logs.find(log => log.id === auditId);
      
      if (!batchLog) {
        return [];
      }
      
      // Return mock batch details
      return batchLog.metadata?.changes || [];
    } catch (error) {
      console.error('❌ Mock get batch details error:', error);
      throw error;
    }
  },

  /**
   * Get user's recent activities
   * @param {string} userId - User ID
   * @param {number} limit - Limit results
   * @returns {Promise<Array>} User activities
   */
  async getUserAuditActivities(userId, limit = 100) {
    try {
      const logs = JSON.parse(localStorage.getItem('auditLogs') || '[]');
      
      const userLogs = logs.filter(log => log.changed_by === userId);
      
      return userLogs
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);
    } catch (error) {
      console.error('❌ Mock get user activities error:', error);
      throw error;
    }
  },

  /**
   * Get audit statistics
   * @param {Object} filters - Filters
   * @returns {Promise<Object>} Statistics
   */
  async getAuditStatistics(filters = {}) {
    try {
      const logs = JSON.parse(localStorage.getItem('auditLogs') || '[]');
      
      let filteredLogs = logs;
      
      if (filters.userId) {
        filteredLogs = filteredLogs.filter(log => log.changed_by === filters.userId);
      }
      
      const stats = {
        totalLogs: filteredLogs.length,
        actionTypes: {},
        tableNames: {},
        recentActivity: filteredLogs.slice(0, 10),
        timeRange: {
          earliest: filteredLogs.length > 0 ? filteredLogs[filteredLogs.length - 1].timestamp : null,
          latest: filteredLogs.length > 0 ? filteredLogs[0].timestamp : null
        }
      };
      
      // Count by action types
      filteredLogs.forEach(log => {
        stats.actionTypes[log.action_type] = (stats.actionTypes[log.action_type] || 0) + 1;
        stats.tableNames[log.table_name] = (stats.tableNames[log.table_name] || 0) + 1;
      });
      
      return stats;
    } catch (error) {
      console.error('❌ Mock get audit statistics error:', error);
      throw error;
    }
  },

  /**
   * Generate transaction ID for batch operations
   * @returns {string} Transaction ID
   */
  generateTransactionId() {
    return 'txn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  },

  /**
   * Get client IP address (mock implementation)
   * @returns {Promise<string>} IP address
   */
  async getClientIP() {
    return '127.0.0.1'; // Mock IP for demo
  },

  /**
   * Get user agent (mock implementation)
   * @returns {string} User agent string
   */
  getUserAgent() {
    return navigator.userAgent || 'Mock Browser';
  },

  /**
   * Clear all audit logs (for testing)
   */
  clearAuditLogs() {
    localStorage.removeItem('auditLogs');
    console.log('🗑️ Mock audit logs cleared');
  }
};
