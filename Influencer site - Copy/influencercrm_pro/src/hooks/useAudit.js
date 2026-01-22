import { useState, useCallback, useContext, createContext } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { auditService } from '../services/auditService';

/**
 * Audit Context for global audit functionality
 */
const AuditContext = createContext(null);

/**
 * Custom hook for audit logging functionality
 * @param {Object} options - Configuration options
 * @returns {Object} Audit functions and state
 */
export function useAudit(options = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { userProfile } = useAuth();
  
  // Create audit context from user profile
  const auditContext = userProfile ? {
    userId: userProfile.id,
    userEmail: userProfile.email,
    sessionId: sessionStorage.getItem('audit_session_id') || generateSessionId()
  } : null;

  // Generate session ID
  function generateSessionId() {
    const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem('audit_session_id', sessionId);
    return sessionId;
  }

  /**
   * Log single audit change
   * @param {Object} auditData - Audit data object
   * @returns {Promise<string>} Audit ID
   */
  const logChange = useCallback(async (auditData) => {
    if (!auditContext) {
      throw new Error('Audit context not initialized');
    }

    try {
      setLoading(true);
      setError(null);
      
      const auditId = await auditService.logChange({
        ...auditData,
        changedBy: auditContext.userId,
        userEmail: auditContext.userEmail,
        sessionId: auditContext.sessionId
      });
      
      return auditId;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [auditContext]);

  /**
   * Log batch audit changes
   * @param {Object} auditData - Batch audit data object
   * @returns {Promise<string>} Audit ID
   */
  const logBatchChange = useCallback(async (auditData) => {
    if (!auditContext) {
      throw new Error('Audit context not initialized');
    }

    try {
      setLoading(true);
      setError(null);
      
      const auditId = await auditService.logBatchChange({
        ...auditData,
        changedBy: auditContext.userId,
        userEmail: auditContext.userEmail,
        sessionId: auditContext.sessionId
      });
      
      return auditId;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [auditContext]);

  /**
   * Get audit history for a record
   * @param {string} tableName - Table name
   * @param {string} recordId - Record ID
   * @param {number} limit - Limit results
   * @returns {Promise<Array>} Audit history
   */
  const getAuditHistory = useCallback(async (tableName, recordId, limit = 50) => {
    if (!auditContext) {
      throw new Error('Audit context not initialized');
    }

    try {
      setLoading(true);
      setError(null);
      const history = await auditService.getAuditHistory(tableName, recordId, limit);
      return history;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [auditContext]);

  /**
   * Get batch operation details
   * @param {string} auditId - Audit ID
   * @returns {Promise<Array>} Batch details
   */
  const getBatchDetails = useCallback(async (auditId) => {
    if (!auditContext) {
      throw new Error('Audit context not initialized');
    }

    try {
      setLoading(true);
      setError(null);
      const details = await auditService.getBatchDetails(auditId);
      return details;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [auditContext]);

  /**
   * Log state mapping change (specific to state management)
   * @param {string} oldState - Old state name
   * @param {string} newState - New state name
   * @param {Object} options - Additional options
   * @returns {Promise<string>} Audit ID
   */
  const logStateMappingChange = useCallback(async (oldState, newState, options = {}) => {
    return await logChange({
      actionType: 'STATE_MAPPING_UPDATE',
      tableName: 'creators',
      recordId: oldState,
      oldValue: oldState,
      newValue: newState,
      metadata: {
        operation: 'state_mapping',
        confidence: options.confidence || null,
        autoSelected: options.autoSelected || false,
        ...options.metadata
      }
    });
  }, [logChange]);

  /**
   * Log batch state mapping changes
   * @param {Array} mappings - Array of mapping objects
   * @param {Object} options - Additional options
   * @returns {Promise<string>} Audit ID
   */
  const logBatchStateMapping = useCallback(async (mappings, options = {}) => {
    const changes = mappings.map(mapping => ({
      record_identifier: mapping.uncleanedState || mapping.oldValue,
      old_value: mapping.uncleanedState || mapping.oldValue,
      new_value: mapping.standardState || mapping.newValue
    }));

    return await logBatchChange({
      actionType: 'STATE_MAPPING_UPDATE',
      tableName: 'creators',
      changes: changes,
      metadata: {
        operation: 'batch_state_mapping',
        batchSize: mappings.length,
        autoSelected: options.autoSelected || false,
        confidenceThreshold: options.confidenceThreshold || null,
        ...options.metadata
      }
    });
  }, [logBatchChange]);

  /**
   * Log generic data change (reusable across modules)
   * @param {string} actionType - Action type
   * @param {string} tableName - Table name
   * @param {string} recordId - Record ID
   * @param {any} oldValue - Old value
   * @param {any} newValue - New value
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<string>} Audit ID
   */
  const logDataChange = useCallback(async (actionType, tableName, recordId, oldValue, newValue, metadata = {}) => {
    return await logChange({
      actionType,
      tableName,
      recordId,
      oldValue: oldValue ? String(oldValue) : null,
      newValue: newValue ? String(newValue) : null,
      metadata
    });
  }, [logChange]);

  /**
   * Log user action (for security tracking)
   * @param {string} action - Action description
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<string>} Audit ID
   */
  const logUserAction = useCallback(async (action, metadata = {}) => {
    return await logChange({
      actionType: 'USER_ACTION',
      tableName: 'user_actions',
      recordId: null,
      oldValue: null,
      newValue: action,
      metadata: {
        category: 'user_activity',
        ...metadata
      }
    });
  }, [logChange]);

  /**
   * Log system event (for system monitoring)
   * @param {string} event - Event description
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<string>} Audit ID
   */
  const logSystemEvent = useCallback(async (event, metadata = {}) => {
    return await logChange({
      actionType: 'SYSTEM_EVENT',
      tableName: 'system_events',
      recordId: null,
      oldValue: null,
      newValue: event,
      metadata: {
        category: 'system_activity',
        ...metadata
      }
    });
  }, [logChange]);

  /**
   * Get user's recent activities
   * @param {number} limit - Limit
   * @returns {Promise<Array>} User activities
   */
  const getUserActivities = useCallback(async (limit = 100) => {
    if (!auditContext) {
      throw new Error('Audit context not initialized');
    }

    try {
      setLoading(true);
      setError(null);
      const activities = await auditContext.getUserAuditActivities(auditContext.userId, limit);
      return activities;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [auditContext]);

  /**
   * Get audit statistics
   * @param {Object} filters - Filters
   * @returns {Promise<Object>} Statistics
   */
  const getStatistics = useCallback(async (filters = {}) => {
    if (!auditContext) {
      throw new Error('Audit context not initialized');
    }

    try {
      setLoading(true);
      setError(null);
      const stats = await auditContext.getAuditStatistics({
        userId: auditContext.userId,
        ...filters
      });
      return stats;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [auditContext]);

  /**
   * Generate transaction ID for batch operations
   * @returns {string} Transaction ID
   */
  const generateTransactionId = useCallback(() => {
    if (!auditContext) {
      return auditService.generateTransactionId();
    }
    return auditContext.generateTransactionId();
  }, [auditContext]);

  return {
    // State
    loading,
    error,
    auditContext,
    
    // Core methods
    logChange,
    logBatchChange,
    getAuditHistory,
    getBatchDetails,
    
    // Specialized methods
    logStateMappingChange,
    logBatchStateMapping,
    logDataChange,
    logUserAction,
    logSystemEvent,
    
    // Utility methods
    getUserActivities,
    getStatistics,
    generateTransactionId,
    
    // Context info
    userId: auditContext?.userId,
    userEmail: auditContext?.userEmail,
    sessionId: auditContext?.sessionId
  };
}

export { AuditProvider, withAuditLogging } from './useAuditProvider';

/**
 * Hook to consume audit context
 */
export function useAuditContext() {
  const context = useContext(AuditContext);
  if (!context) {
    throw new Error('useAuditContext must be used within an AuditProvider');
  }
  return context;
}
