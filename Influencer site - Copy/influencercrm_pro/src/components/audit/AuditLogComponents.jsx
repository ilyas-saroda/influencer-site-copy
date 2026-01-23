import React, { useState, useEffect, useMemo } from 'react';
import { Clock, User, Globe, AlertCircle, CheckCircle, XCircle, FileText, ChevronDown, ChevronUp, Filter, Search, AlertTriangle, Shield, Users, Settings, Database } from 'lucide-react';
import { useAudit } from '../../hooks/useAudit';

/**
 * Component to display a single audit log entry
 */
export function AuditLogEntry({ log, showDetails = false, onViewDetails = null }) {
  const [expanded, setExpanded] = useState(false);
  
  const getStatusIcon = (actionType) => {
    switch (actionType) {
      case 'STATE_MAPPING_UPDATE':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'STATE_MAPPING_UPDATE_FAILED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'USER_ACTION':
        return <User className="h-4 w-4 text-blue-500" />;
      case 'SYSTEM_EVENT':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'MASS_DELETE':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'BULK_UPDATE':
        return <Settings className="h-4 w-4 text-orange-500" />;
      case 'PERMISSIONS_CHANGE':
        return <Shield className="h-4 w-4 text-purple-500" />;
      case 'DATA_EXPORT':
        return <Database className="h-4 w-4 text-indigo-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const isHighRiskAction = (actionType) => {
    const highRiskActions = ['MASS_DELETE', 'BULK_UPDATE', 'PERMISSIONS_CHANGE', 'DATA_EXPORT', 'DELETE_ALL'];
    return highRiskActions.includes(actionType);
  };

  const getRiskLevel = (actionType) => {
    if (isHighRiskAction(actionType)) return 'high';
    if (actionType.includes('DELETE') || actionType.includes('UPDATE')) return 'medium';
    return 'low';
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatMetadata = (metadata) => {
    if (!metadata || Object.keys(metadata).length === 0) return null;
    
    return (
      <div className="mt-2 text-xs text-gray-500">
        {Object.entries(metadata).map(([key, value]) => (
          <div key={key}>
            <span className="font-medium">{key}:</span> {JSON.stringify(value)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={`border-b p-4 hover:bg-gray-50 ${isHighRiskAction(log.action_type) ? 'border-l-4 border-l-red-500 bg-red-50' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className="relative">
            {getStatusIcon(log.action_type)}
            {isHighRiskAction(log.action_type) && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className={`text-sm font-medium ${isHighRiskAction(log.action_type) ? 'text-red-800' : 'text-gray-900'}`}>
                {log.action_type.replace(/_/g, ' ')}
              </span>
              {isHighRiskAction(log.action_type) && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  High Risk
                </span>
              )}
              {log.table_name && (
                <span className="text-xs text-gray-500">
                  on {log.table_name}
                </span>
              )}
            </div>
            
            {log.old_value && log.new_value && (
              <div className="mt-1 text-sm">
                <span className="text-red-600 line-through">{log.old_value}</span>
                <span className="mx-2 text-gray-500">→</span>
                <span className="text-green-600">{log.new_value}</span>
              </div>
            )}
            
            {formatMetadata(log.metadata)}
            
            <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <User className="h-3 w-3" />
                <span>{log.user_email || 'Unknown User'}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>{formatDate(log.timestamp)}</span>
              </div>
              {log.ip_address && (
                <div className="flex items-center space-x-1">
                  <Globe className="h-3 w-3" />
                  <span>{log.ip_address}</span>
                </div>
              )}
              <div className="flex items-center space-x-1">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  getRiskLevel(log.action_type) === 'high' ? 'bg-red-100 text-red-800' :
                  getRiskLevel(log.action_type) === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {getRiskLevel(log.action_type)} risk
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {onViewDetails && (
          <button
            onClick={() => onViewDetails(log)}
            className="ml-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View Details
          </button>
        )}
        
        {showDetails && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="ml-4 text-gray-500 hover:text-gray-700"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        )}
      </div>
      
      {expanded && showDetails && (
        <div className="mt-4 pl-7 border-l-2 border-gray-200">
          <div className="space-y-2">
            <div className="text-sm">
              <span className="font-medium">Record ID:</span> {log.record_id || 'N/A'}
            </div>
            <div className="text-sm">
              <span className="font-medium">Transaction ID:</span> {log.metadata?.transaction_id || 'N/A'}
            </div>
            <div className="text-sm">
              <span className="font-medium">Session ID:</span> {log.metadata?.session_id || 'N/A'}
            </div>
            <div className="text-sm">
              <span className="font-medium">User Agent:</span> {log.metadata?.user_agent || 'N/A'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Component to display a list of audit logs
 */
export function AuditLogList({ 
  logs = [], 
  loading = false, 
  error = null,
  showDetails = false,
  onViewDetails = null,
  title = "Audit Logs"
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading audit logs...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <span className="ml-2 text-red-800">Error loading audit logs: {error}</span>
        </div>
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No audit logs found</h3>
        <p className="mt-1 text-sm text-gray-500">No audit activity has been recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500 mt-1">
          Showing {logs.length} audit entr{logs.length === 1 ? 'y' : 'ies'}
        </p>
      </div>
      
      <div className="divide-y divide-gray-200">
        {logs.map((log) => (
          <AuditLogEntry
            key={log.id}
            log={log}
            showDetails={showDetails}
            onViewDetails={onViewDetails}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Component to display batch operation details
 */
export function BatchAuditDetails({ auditId, details = [], loading = false, error = null }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading batch details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <span className="ml-2 text-red-800">Error loading batch details: {error}</span>
        </div>
      </div>
    );
  }

  const successCount = details.filter(d => d.status === 'completed').length;
  const errorCount = details.filter(d => d.status === 'error').length;

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Batch Operation Details</h3>
        <div className="mt-2 flex items-center space-x-4 text-sm">
          <span className="text-green-600">✓ {successCount} successful</span>
          {errorCount > 0 && (
            <span className="text-red-600">✗ {errorCount} failed</span>
          )}
          <span className="text-gray-500">Total: {details.length} operations</span>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Record
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Change
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {details.map((detail, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {detail.sequence_number}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {detail.record_identifier}
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="text-red-600 line-through text-xs">
                      {detail.old_value}
                    </span>
                    <span className="text-gray-500">→</span>
                    <span className="text-green-600 text-xs">
                      {detail.new_value}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {detail.status === 'completed' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Success
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Failed
                    </span>
                  )}
                  {detail.error_message && (
                    <div className="mt-1 text-xs text-red-600">
                      {detail.error_message}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Small icon component to show change history for a specific record
 */
export function ChangeHistoryIcon({ recordId, tableName, onClick, size = "small" }) {
  const sizeClasses = {
    small: "h-4 w-4",
    medium: "h-5 w-5",
    large: "h-6 w-6"
  };

  return (
    <button
      onClick={onClick}
      className="text-gray-400 hover:text-blue-600 transition-colors duration-200"
      title="View Change History"
    >
      <Clock className={sizeClasses[size]} />
    </button>
  );
}

/**
 * Modal component to display change history
 */
export function ChangeHistoryModal({ 
  isOpen, 
  onClose, 
  recordId, 
  tableName, 
  title = "Change History" 
}) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { getAuditHistory } = useAudit();

  useEffect(() => {
    if (isOpen && recordId && tableName) {
      fetchChangeHistory();
    }
  }, [isOpen, recordId, tableName]);

  const fetchChangeHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const history = await getAuditHistory(tableName, recordId);
      setLogs(history);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Change history for <span className="font-medium">{recordId}</span>
          </p>
        </div>
        
        <AuditLogList
          logs={logs}
          loading={loading}
          error={error}
          showDetails={true}
        />
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Enhanced System Activity Monitor with filtering and pagination
 */
export function SystemActivityMonitor({ 
  logs = [], 
  loading = false, 
  error = null,
  title = "System Activity Monitor"
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedActionType, setSelectedActionType] = useState('all');
  const [selectedRiskLevel, setSelectedRiskLevel] = useState('all');
  const [selectedUserRole, setSelectedUserRole] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [logsPerPage] = useState(20);

  // Get unique action types, user roles, and risk levels for filters
  const { uniqueActionTypes, uniqueUserRoles, filteredLogs } = useMemo(() => {
    const actionTypes = [...new Set(logs.map(log => log.action_type))].sort();
    const userRoles = [...new Set(logs.map(log => log.user_role || 'Unknown'))].sort();
    
    let filtered = logs;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.action_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.table_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply action type filter
    if (selectedActionType !== 'all') {
      filtered = filtered.filter(log => log.action_type === selectedActionType);
    }
    
    // Apply risk level filter
    if (selectedRiskLevel !== 'all') {
      filtered = filtered.filter(log => {
        if (selectedRiskLevel === 'high') {
          return ['MASS_DELETE', 'BULK_UPDATE', 'PERMISSIONS_CHANGE', 'DATA_EXPORT', 'DELETE_ALL'].includes(log.action_type);
        } else if (selectedRiskLevel === 'medium') {
          return log.action_type.includes('DELETE') || log.action_type.includes('UPDATE');
        } else {
          return !['MASS_DELETE', 'BULK_UPDATE', 'PERMISSIONS_CHANGE', 'DATA_EXPORT', 'DELETE_ALL'].includes(log.action_type) &&
                 !log.action_type.includes('DELETE') && !log.action_type.includes('UPDATE');
        }
      });
    }
    
    // Apply user role filter
    if (selectedUserRole !== 'all') {
      filtered = filtered.filter(log => (log.user_role || 'Unknown') === selectedUserRole);
    }
    
    return {
      uniqueActionTypes: actionTypes,
      uniqueUserRoles: userRoles,
      filteredLogs: filtered
    };
  }, [logs, searchTerm, selectedActionType, selectedRiskLevel, selectedUserRole]);

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);
  const startIndex = (currentPage - 1) * logsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + logsPerPage);

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedActionType('all');
    setSelectedRiskLevel('all');
    setSelectedUserRole('all');
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading system activity...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <span className="ml-2 text-red-800">Error loading system activity: {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500 mt-1">
              Showing {paginatedLogs.length} of {filteredLogs.length} activities 
              {filteredLogs.length !== logs.length && ` (filtered from ${logs.length} total)`}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {filteredLogs.filter(log => ['MASS_DELETE', 'BULK_UPDATE', 'PERMISSIONS_CHANGE', 'DATA_EXPORT', 'DELETE_ALL'].includes(log.action_type)).length} High Risk
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Action Type Filter */}
          <select
            value={selectedActionType}
            onChange={(e) => {
              setSelectedActionType(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Actions</option>
            {uniqueActionTypes.map(type => (
              <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>
            ))}
          </select>

          {/* Risk Level Filter */}
          <select
            value={selectedRiskLevel}
            onChange={(e) => {
              setSelectedRiskLevel(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Risk Levels</option>
            <option value="high">High Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="low">Low Risk</option>
          </select>

          {/* User Role Filter */}
          <select
            value={selectedUserRole}
            onChange={(e) => {
              setSelectedUserRole(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All User Roles</option>
            {uniqueUserRoles.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>

          {/* Reset Filters */}
          <button
            onClick={resetFilters}
            className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Logs List */}
      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {paginatedLogs.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No activities found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          paginatedLogs.map((log) => (
            <AuditLogEntry
              key={log.id}
              log={log}
              showDetails={true}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
