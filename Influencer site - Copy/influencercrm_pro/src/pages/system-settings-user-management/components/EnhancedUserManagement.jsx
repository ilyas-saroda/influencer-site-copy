// src/pages/system-settings-user-management/components/EnhancedUserManagement.jsx

import React, { useState, useEffect } from 'react';
import { Users, Edit2, Shield, ShieldOff, Search, RefreshCw, CheckCircle, XCircle, UserCheck, UserX, AlertTriangle } from 'lucide-react';
import { getAllUsersEnhanced, getAllUserRoles, updateUserRole, deactivateUser } from '../../../services/adminControlService';
import toast from 'react-hot-toast';

const EnhancedUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [updatingUserId, setUpdatingUserId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersResult, rolesResult] = await Promise.all([
        getAllUsersEnhanced(),
        getAllUserRoles()
      ]);

      if (usersResult?.error) {
        console.error('Users fetch error:', usersResult.error);
        toast.error('Failed to load users: ' + usersResult.error?.message);
        setUsers([]);
      } else {
        setUsers(usersResult?.data || []);
      }

      if (rolesResult?.error) {
        console.error('Roles fetch error:', rolesResult.error);
        toast.error('Failed to load roles: ' + rolesResult.error?.message);
        setRoles([]);
      } else {
        setRoles(rolesResult?.data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error loading data: ' + error.message);
      setUsers([]);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRoleId) => {
    setUpdatingUserId(userId);
    try {
      const result = await updateUserRole(userId, newRoleId);
      if (result?.error) {
        console.error('Role update error:', result.error);
        toast.error('Failed to update role: ' + result.error?.message);
      } else if (result?.data?.success) {
        toast.success(result.data.message || 'User role updated successfully');
        fetchData(); // Refresh data
      } else {
        toast.error('Unexpected response from server');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Error updating role: ' + error.message);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    setUpdatingUserId(userId);
    try {
      const result = await deactivateUser(userId);
      if (result?.error) {
        console.error('User status update error:', result.error);
        toast.error('Failed to update user status: ' + result.error?.message);
      } else {
        toast.success(`User ${currentStatus ? 'deactivated' : 'activated'} successfully`);
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Error updating user status: ' + error.message);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role_name === selectedRole || user.name === selectedRole;
    return matchesSearch && matchesRole;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'online':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Online</span>;
      case 'recent':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><RefreshCw className="w-3 h-3 mr-1" />Recent</span>;
      default:
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"><XCircle className="w-3 h-3 mr-1" />Offline</span>;
    }
  };

  const getRoleBadge = (roleName) => {
    const roleColors = {
      super_admin: 'bg-red-100 text-red-800',
      admin: 'bg-orange-100 text-orange-800',
      manager: 'bg-blue-100 text-blue-800',
      user: 'bg-green-100 text-green-800',
      viewer: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${roleColors[roleName] || 'bg-gray-100 text-gray-800'}`}>
        <Shield className="w-3 h-3 mr-1" />
        {roleName?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-96"></div>
        </div>
        
        {/* Loading skeleton for filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded w-32"></div>
          <div className="h-10 bg-gray-200 rounded w-24"></div>
        </div>

        {/* Loading skeleton for table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-4 bg-gray-200 rounded w-8"></div>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show error state with retry button if both users and roles are empty
  if (!loading && users.length === 0 && roles.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">Failed to Load Data</h3>
          <p className="text-muted-foreground mb-6">
            Unable to fetch user data. This could be due to permission issues or network problems.
          </p>
          <button
            onClick={fetchData}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Retry Loading Data
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">User Management</h2>
        <p className="text-muted-foreground">Manage user roles, permissions, and account status</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <select
          className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
        >
          <option value="all">All Roles</option>
          {roles.map(role => (
            <option key={role.id} value={role.name || role.role_name}>
              {role.display_name || role.name}
            </option>
          ))}
        </select>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Last Login</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-muted-foreground">
                    {searchTerm || selectedRole !== 'all' ? 'No users found matching your filters.' : 'No users found.'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-foreground">{user.full_name || 'Unknown'}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(user.status)}
                        {user.is_active ? (
                          <UserCheck className="w-4 h-4 text-green-600" />
                        ) : (
                          <UserX className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {updatingUserId === user.id ? (
                        <div className="animate-pulse bg-muted rounded h-6 w-24"></div>
                      ) : (
                        <select
                          value={user.role_id || ''}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className="text-sm border border-border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary"
                          disabled={updatingUserId === user.id}
                        >
                          {roles.map(role => (
                            <option key={role.id} value={role.id}>
                              {role.display_name || role.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                          disabled={updatingUserId === user.id}
                          className={`p-2 rounded-lg transition-colors ${
                            user.is_active 
                              ? 'text-red-600 hover:bg-red-50' 
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                          title={user.is_active ? 'Deactivate User' : 'Activate User'}
                        >
                          {user.is_active ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Users</p>
              <p className="text-2xl font-bold text-foreground">{users.length}</p>
            </div>
            <Users className="w-8 h-8 text-primary" />
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Users</p>
              <p className="text-2xl font-bold text-green-600">
                {users.filter(u => u.is_active).length}
              </p>
            </div>
            <UserCheck className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Online Now</p>
              <p className="text-2xl font-bold text-blue-600">
                {users.filter(u => u.status === 'online').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedUserManagement;
