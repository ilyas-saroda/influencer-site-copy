import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { getAuditLogs } from '../../../services/userManagementService';
import toast from 'react-hot-toast';

const AuditLogsPanel = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: '',
    entityType: ''
  });

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await getAuditLogs(filters);
      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast?.error('Failed to load audit logs - using sample data');
      // Provide fallback mock data
      const mockLogs = [
        { id: '1', action: 'login', entityType: 'user', description: 'User logged in', createdAt: new Date().toISOString(), users: { email: 'admin@example.com' } },
        { id: '2', action: 'create', entityType: 'campaign', description: 'Campaign created', createdAt: new Date(Date.now() - 3600000).toISOString(), users: { email: 'admin@example.com' } },
        { id: '3', action: 'update', entityType: 'user', description: 'User profile updated', createdAt: new Date(Date.now() - 7200000).toISOString(), users: { email: 'manager@example.com' } }
      ];
      setLogs(mockLogs);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    fetchLogs();
  };

  const clearFilters = () => {
    setFilters({ action: '', entityType: '' });
    setTimeout(() => fetchLogs(), 0);
  };

  const getActionColor = (action) => {
    const colors = {
      create: 'bg-green-100 text-green-700',
      update: 'bg-blue-100 text-blue-700',
      delete: 'bg-red-100 text-red-700',
      login: 'bg-purple-100 text-purple-700',
      logout: 'bg-gray-100 text-gray-700'
    };
    return colors?.[action?.toLowerCase()] || 'bg-gray-100 text-gray-700';
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date?.toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Filters */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Action
            </label>
            <select
              value={filters?.action}
              onChange={(e) => handleFilterChange('action', e?.target?.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Actions</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Entity Type
            </label>
            <select
              value={filters?.entityType}
              onChange={(e) => handleFilterChange('entityType', e?.target?.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Entities</option>
              <option value="user">User</option>
              <option value="campaign">Campaign</option>
              <option value="creator">Creator</option>
              <option value="brand">Brand</option>
              <option value="setting">Setting</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={applyFilters}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Apply
            </button>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Clear
            </button>
            <button
              onClick={fetchLogs}
              className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      {/* Audit Logs Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Timestamp
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Entity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {logs?.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                  No audit logs found
                </td>
              </tr>
            ) : (
              logs?.map((log) => (
                <tr key={log?.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {formatTimestamp(log?.createdAt)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">
                        {log?.users?.fullName || 'System'}
                      </div>
                      <div className="text-gray-500">
                        {log?.users?.email || 'system@crm.com'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getActionColor(log?.action)}`}>
                      {log?.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {log?.entityType}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {log?.ipAddress && (
                      <div>IP: {log?.ipAddress}</div>
                    )}
                    {log?.entityId && (
                      <div className="text-xs text-gray-400">
                        ID: {log?.entityId?.slice(0, 8)}...
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Pagination Info */}
      <div className="mt-4 text-sm text-gray-600 text-center">
        Showing {logs?.length} recent audit log entries
      </div>
    </div>
  );
};

export default AuditLogsPanel;