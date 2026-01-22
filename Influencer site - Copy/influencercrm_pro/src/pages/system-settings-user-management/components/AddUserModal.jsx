// src/pages/system-settings-user-management/components/AddUserModal.jsx

import React, { useState, useEffect } from 'react';
import { X, UserPlus, Eye, EyeOff, AlertCircle, Check } from 'lucide-react';
import { createUser, checkUserExists } from '../../../services/userManagementService';

const AddUserModal = ({ roles, onClose, onUserAdded }) => {
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    password: '',
    roleId: '',
    isActive: true
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailValidation, setEmailValidation] = useState({
    checking: false,
    exists: false,
    message: ''
  });
  const [emailCheckTimeout, setEmailCheckTimeout] = useState(null);

  // Debug: Log roles when component mounts or roles change
  useEffect(() => {
    console.log('=== ADD USER MODAL DEBUG ===');
    console.log('Roles received:', roles);
    console.log('Roles type:', typeof roles);
    console.log('Is array:', Array.isArray(roles));
    console.log('Roles length:', roles?.length);
    
    // Check if roles is null, undefined, or empty
    if (roles === null) {
      console.error('ROLES IS NULL - This indicates an error in fetch!');
    } else if (roles === undefined) {
      console.error('ROLES IS UNDEFINED - Component not receiving props!');
    } else if (!Array.isArray(roles)) {
      console.error('ROLES IS NOT AN ARRAY:', roles);
      console.error('Type:', typeof roles);
    } else if (roles.length === 0) {
      console.warn('ROLES ARRAY IS EMPTY - Database might be empty or RLS blocking access');
    } else {
      console.log('✅ ROLES LOADED SUCCESSFULLY');
      console.log('First role:', roles[0]);
      console.log('Role keys:', Object.keys(roles[0]));
      
      // Check if role has expected properties
      const firstRole = roles[0];
      console.log('Has id:', !!firstRole.id);
      console.log('Has roleName:', !!firstRole.roleName);
      console.log('Has displayName:', !!firstRole.displayName);
      console.log('Has role_name:', !!firstRole.role_name);
      console.log('Has display_name:', !!firstRole.display_name);
    }
    console.log('=== END DEBUG ===');
  }, [roles]);

  // Check if email exists (debounced)
  const checkEmailExists = async (email) => {
    if (!email || !email.includes('@')) {
      setEmailValidation({ checking: false, exists: false, message: '' });
      return;
    }

    setEmailValidation(prev => ({ ...prev, checking: true, message: '' }));
    
    try {
      const { exists, source } = await checkUserExists(email);
      if (exists) {
        const message = source === 'auth' 
          ? 'This email is already registered in the authentication system.'
          : 'This email already exists in the database.';
        setEmailValidation({ checking: false, exists: true, message });
      } else {
        setEmailValidation({ checking: false, exists: false, message: 'Email is available' });
      }
    } catch (error) {
      console.error('Error checking email:', error);
      setEmailValidation({ checking: false, exists: false, message: '' });
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e?.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Handle email validation with debounce
    if (name === 'email') {
      // Clear existing timeout
      if (emailCheckTimeout) {
        clearTimeout(emailCheckTimeout);
      }
      
      // Set new timeout for debounced check
      const timeout = setTimeout(() => {
        checkEmailExists(value);
      }, 800); // 800ms debounce
      
      setEmailCheckTimeout(timeout);
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');

    if (!formData?.email || !formData?.fullName || !formData?.password || !formData?.roleId) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData?.password?.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    // Check if email already exists
    if (emailValidation.exists) {
      setError('This email address is already registered. Please use a different email.');
      return;
    }

    setLoading(true);
    try {
      console.log('🔄 Attempting to create user...');
      const { data, error } = await createUser(formData);
      
      if (error) {
        console.error('❌ User creation failed:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        // Provide better error messages for common issues
        if (error.message?.includes('Authentication failed') || error.message?.includes('No active session')) {
          setError('Authentication required. Please log out and log back in with an admin account.');
        } else if (error.message?.includes('permission') || error.message?.includes('403') || error.code === '42501') {
          setError('Permission denied. You need admin privileges to create users.');
        } else if (error.message?.includes('User already registered') || 
                   error.message?.includes('A user with this email address has already been registered') ||
                   error.code === 'duplicate_key' ||
                   error.code === '23505') {
          setError('A user with this email address already exists. Please use a different email or check if user is already in system.');
        } else if (error.message?.includes('weak password')) {
          setError('Password is too weak. Please choose a stronger password.');
        } else if (error.message?.includes('Database error creating new user')) {
          setError('Database error occurred. This might be due to a duplicate email or a database connection issue. Please try again.');
        } else if (error.message?.includes('duplicate') || error.message?.includes('unique constraint')) {
          setError('This email address is already registered in the system. Please use a different email.');
        } else {
          setError(error.message || 'Failed to create user. Please try again.');
        }
        return;
      }

      console.log('✅ User created successfully:', data);
      onUserAdded(data);
    } catch (err) {
      console.error('❌ Unexpected error:', err);
      setError(err?.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <UserPlus className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Add New User</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                name="email"
                value={formData?.email}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-10 ${
                  emailValidation.exists 
                    ? 'border-red-300 bg-red-50' 
                    : emailValidation.message === 'Email is available'
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-300'
                }`}
                placeholder="user@example.com"
                required
              />
              {emailValidation.checking && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                </div>
              )}
              {!emailValidation.checking && formData.email && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {emailValidation.exists ? (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  ) : emailValidation.message === 'Email is available' ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : null}
                </div>
              )}
            </div>
            {emailValidation.message && (
              <div className={`mt-1 text-xs ${
                emailValidation.exists ? 'text-red-600' : 'text-green-600'
              }`}>
                {emailValidation.message}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="fullName"
              value={formData?.fullName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData?.password}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-10"
                placeholder="Enter password (min 6 characters)"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              name="roleId"
              value={formData?.roleId || ''}
              onChange={(e) => {
                console.log('Role selected:', e.target.value);
                handleChange(e);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
              required
              disabled={!roles || !Array.isArray(roles) || roles.length === 0}
            >
              <option value="">
                {!roles ? 'Loading roles...' : 
                 !Array.isArray(roles) ? 'Error loading roles' :
                 roles.length === 0 ? 'No roles available' :
                 'Select a role'}
              </option>
              {roles && Array.isArray(roles) && roles.length > 0 ? (
                roles.map(role => {
                  const roleId = role?.id || role?.roleId;
                  const displayName = role?.displayName || role?.display_name || role?.description || role?.roleName || role?.role_name || 'Unknown Role';
                  if (!roleId) {
                    console.warn('Role missing ID:', role);
                    return null;
                  }
                  return (
                    <option key={roleId} value={roleId}>
                      {displayName}
                    </option>
                  );
                }).filter(Boolean)
              ) : null}
            </select>
            {roles && Array.isArray(roles) && roles.length === 0 && (
              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-800 font-medium mb-1">⚠️ No roles available</p>
                <p className="text-xs text-yellow-700">
                  The user_roles table appears to be empty. Please ensure the database migration has been run and roles have been seeded.
                </p>
              </div>
            )}
            {roles === null && (
              <p className="text-xs text-red-500 mt-1">Failed to load roles. Please check the console for errors.</p>
            )}
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="isActive"
              checked={formData?.isActive}
              onChange={handleChange}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <label className="ml-2 text-sm text-gray-700">
              Active user
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;