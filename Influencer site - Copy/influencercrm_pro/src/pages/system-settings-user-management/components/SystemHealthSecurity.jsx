// src/pages/system-settings-user-management/components/SystemHealthSecurity.jsx

import React, { useState, useEffect } from 'react';
import { Activity, Server, Users, Database, Shield, AlertTriangle, CheckCircle, XCircle, RefreshCw, Power, Trash2 } from 'lucide-react';
import { getSystemHealth, forceLogoutAllUsers, clearSystemCache, getUserStatistics } from '../../../services/adminControlService';
import toast from 'react-hot-toast';

const SystemHealthSecurity = () => {
  const [healthData, setHealthData] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [healthResult, statsResult] = await Promise.all([
        getSystemHealth(),
        getUserStatistics()
      ]);

      if (healthResult.error) {
        toast.error('Failed to load system health: ' + healthResult.error.message);
      } else {
        setHealthData(healthResult.data);
      }

      if (statsResult.error) {
        toast.error('Failed to load user statistics: ' + statsResult.error.message);
      } else {
        setUserStats(statsResult.data);
      }
    } catch (error) {
      toast.error('Error loading data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForceLogoutAll = async () => {
    if (!confirm('Are you sure you want to force logout all users? This will immediately terminate all active sessions.')) {
      return;
    }

    setActionLoading(prev => ({ ...prev, logout: true }));
    try {
      const result = await forceLogoutAllUsers();
      if (result.error) {
        toast.error('Failed to force logout: ' + result.error.message);
      } else {
        toast.success('All users have been logged out successfully');
        fetchData(); // Refresh data
      }
    } catch (error) {
      toast.error('Error forcing logout: ' + error.message);
    } finally {
      setActionLoading(prev => ({ ...prev, logout: false }));
    }
  };

  const handleClearCache = async () => {
    if (!confirm('Are you sure you want to clear the system cache? This may temporarily affect performance.')) {
      return;
    }

    setActionLoading(prev => ({ ...prev, cache: true }));
    try {
      const result = await clearSystemCache();
      if (result.error) {
        toast.error('Failed to clear cache: ' + result.error.message);
      } else {
        toast.success('System cache cleared successfully');
        fetchData(); // Refresh data
      }
    } catch (error) {
      toast.error('Error clearing cache: ' + error.message);
    } finally {
      setActionLoading(prev => ({ ...prev, cache: false }));
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
      case 'active':
      case true:
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'error':
      case 'inactive':
      case false:
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <RefreshCw className="w-5 h-5 text-gray-600" />;
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp * 1000).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">System Health & Security</h2>
        <p className="text-muted-foreground">Monitor system performance and manage security settings</p>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">System Status</span>
            {getStatusIcon(healthData?.status)}
          </div>
          <div className="text-2xl font-bold text-foreground capitalize">
            {healthData?.status || 'Unknown'}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Last checked: {formatTimestamp(healthData?.timestamp)}
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Active Sessions</span>
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {healthData?.active_sessions || 0}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Currently online
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Database</span>
            {getStatusIcon(healthData?.database_connection)}
          </div>
          <div className="text-2xl font-bold text-foreground capitalize">
            {healthData?.database_connection ? 'Connected' : 'Disconnected'}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Connection status
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Cache</span>
            {getStatusIcon(healthData?.cache_status === 'active' ? 'healthy' : 'error')}
          </div>
          <div className="text-2xl font-bold text-foreground capitalize">
            {healthData?.cache_status || 'Unknown'}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Cache status
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Information */}
        <div className="bg-card border border-border rounded-lg">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
              <Server className="w-5 h-5" />
              System Information
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Users</span>
              <span className="text-sm font-medium text-foreground">{userStats?.total_users || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Active Users</span>
              <span className="text-sm font-medium text-foreground">{userStats?.active_users || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Recent Campaigns (30 days)</span>
              <span className="text-sm font-medium text-foreground">{healthData?.recent_campaigns || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Last Backup</span>
              <span className="text-sm font-medium text-foreground">
                {formatTimestamp(healthData?.last_backup)}
              </span>
            </div>
          </div>
        </div>

        {/* User Roles Distribution */}
        <div className="bg-card border border-border rounded-lg">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
              <Shield className="w-5 h-5" />
              User Roles Distribution
            </h3>
          </div>
          <div className="p-6">
            {userStats?.users_by_role?.length > 0 ? (
              <div className="space-y-3">
                {userStats.users_by_role.map((roleData, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-primary rounded-full"></div>
                      <span className="text-sm text-foreground capitalize">
                        {roleData.role?.replace('_', ' ') || 'Unknown'}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-foreground">{roleData.count || 0}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-4">
                No role data available
              </div>
            )}
          </div>
        </div>

        {/* Security Actions */}
        <div className="bg-card border border-border rounded-lg">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Security Actions
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-3">
              <button
                onClick={handleForceLogoutAll}
                disabled={actionLoading.logout}
                className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {actionLoading.logout ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Power className="w-4 h-4" />
                )}
                Force Logout All Users
              </button>
              <p className="text-xs text-muted-foreground">
                Immediately terminate all active user sessions. Use this in case of security breach.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleClearCache}
                disabled={actionLoading.cache}
                className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {actionLoading.cache ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Clear System Cache
              </button>
              <p className="text-xs text-muted-foreground">
                Clear all system cache. This may temporarily affect performance.
              </p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-card border border-border rounded-lg">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent User Activity
            </h3>
          </div>
          <div className="p-6">
            {userStats?.recent_logins?.length > 0 ? (
              <div className="space-y-3">
                {userStats.recent_logins.slice(0, 5).map((login, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div>
                      <div className="font-medium text-foreground">{login.email}</div>
                      <div className="text-xs text-muted-foreground">
                        Last login: {formatTimestamp(login.last_login)}
                      </div>
                    </div>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-4">
                No recent activity
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={fetchData}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Health Status
        </button>
      </div>
    </div>
  );
};

export default SystemHealthSecurity;
