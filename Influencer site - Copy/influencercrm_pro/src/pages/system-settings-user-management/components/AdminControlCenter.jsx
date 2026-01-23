// src/pages/system-settings-user-management/components/AdminControlCenter.jsx

import React, { useState, useEffect } from 'react';
import { Settings, Users, Activity, Shield, Globe, Database } from 'lucide-react';
import EnhancedUserManagement from './EnhancedUserManagement';
import GlobalConfiguration from './GlobalConfiguration';
import SystemHealthSecurity from './SystemHealthSecurity';
import PermissionGuard from '../../../components/admin/PermissionGuard';
import AdminDiagnostics, { PerformanceMonitor } from '../../../utils/adminDiagnostics';

const AdminControlCenter = () => {
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    const timer = PerformanceMonitor.startTimer('Admin Control Center Initialization');
    
    // Log initialization
    AdminDiagnostics.logInitialization([
      'Permission Guard',
      'Enhanced User Management', 
      'Global Configuration',
      'System Health & Security',
      'Admin Services'
    ]);
    
    timer.end();
  }, []);

  const tabs = [
    { 
      id: 'general', 
      label: 'General Settings', 
      icon: Settings,
      description: 'Platform configuration and basic settings'
    },
    { 
      id: 'users', 
      label: 'User Management', 
      icon: Users,
      description: 'Manage users, roles, and permissions'
    },
    { 
      id: 'security', 
      label: 'Security & Health', 
      icon: Shield,
      description: 'System monitoring and security controls'
    },
    { 
      id: 'integrations', 
      label: 'Integrations', 
      icon: Database,
      description: 'External services and API configurations'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return <GlobalConfiguration />;
      case 'users':
        return <EnhancedUserManagement />;
      case 'security':
        return <SystemHealthSecurity />;
      case 'integrations':
        return (
          <div className="p-6">
            <div className="text-center py-12">
              <Database className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Integrations</h3>
              <p className="text-muted-foreground">
                Integration management will be available in the next update.
              </p>
            </div>
          </div>
        );
      default:
        return <GlobalConfiguration />;
    }
  };

  return (
    <PermissionGuard>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-card border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold text-foreground">Admin Control Center</h1>
              </div>
              <p className="text-muted-foreground">
                Complete administrative control over system settings, users, and security
              </p>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-8 overflow-x-auto">
              {tabs.map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap
                      ${activeTab === tab.id
                        ? 'border-primary text-primary' 
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                      }
                    `}
                  >
                    <TabIcon className="w-5 h-5" />
                    <div className="text-left">
                      <div>{tab.label}</div>
                      <div className="text-xs opacity-75">{tab.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-card border border-border rounded-lg shadow-sm">
            {renderTabContent()}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-card border-t border-border mt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div>
                Admin Control Center v2.0
              </div>
              <div>
                Last sync: {new Date().toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
};

export default AdminControlCenter;
