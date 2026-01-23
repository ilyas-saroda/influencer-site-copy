// src/components/admin/PermissionGuard.jsx

import React, { useState, useEffect } from 'react';
import { Shield, Lock, AlertTriangle } from 'lucide-react';
import { checkSuperAdminPermission } from '../../services/adminControlService';
import AdminDiagnostics from '../../utils/adminDiagnostics';

const PermissionGuard = ({ children, requiredRole = 'super_admin', fallback = null }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    setLoading(true);
    try {
      const result = await checkSuperAdminPermission();
      if (result?.error) {
        AdminDiagnostics.error('Permission check failed', result.error);
        setHasPermission(false);
      } else {
        setHasPermission(result?.data || false);
        AdminDiagnostics.logPermissionCheck(result?.data || false, 'Current User');
      }
    } catch (error) {
      AdminDiagnostics.error('Error checking permission', error);
      setHasPermission(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying permissions...</p>
        </div>
      </div>
    );
  }

  if (!hasPermission) {
    if (fallback) {
      return fallback;
    }

    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="max-w-md w-full mx-4">
          <div className="bg-card border border-border rounded-lg shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-red-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
            
            <p className="text-muted-foreground mb-6">
              You don't have permission to access the Admin Control Center. 
              This area is restricted to Super Administrators only.
            </p>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">Required Permission</span>
              </div>
              <p className="text-sm text-red-700">
                Super Admin role is required to access this section.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => window.history.back()}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Go Back
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="w-full px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
              >
                Return to Dashboard
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-xs text-muted-foreground">
                If you believe this is an error, please contact your system administrator.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default PermissionGuard;
