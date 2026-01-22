import React, { useState, useEffect } from 'react';
import { Settings, Users, Activity, Shield } from 'lucide-react';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import SystemSettingsPanel from './components/SystemSettingsPanel';
import UserManagementPanel from './components/UserManagementPanel';
import AuditLogsPanel from './components/AuditLogsPanel';
import Icon from '../../components/AppIcon';



const SystemSettingsUserManagement = () => {
  const [activeTab, setActiveTab] = useState('settings');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const tabs = [
    { id: 'settings', label: 'System Settings', icon: Settings },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'audit', label: 'Audit Logs', icon: Activity }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
      />
      <Header isCollapsed={isSidebarCollapsed} />
      
      <main className={`main-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="p-6 max-w-[1600px] mx-auto">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3 mb-2">
              <Shield className="w-8 h-8 text-primary" />
              System Settings & User Management
            </h1>
            <p className="text-muted-foreground">
              Configure system settings and manage user access controls
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="bg-card border border-border rounded-lg shadow-sm mb-6">
            <div className="border-b border-border">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                {tabs?.map((tab) => {
                  const TabIcon = tab?.icon;
                  return (
                    <button
                      key={tab?.id}
                      onClick={() => setActiveTab(tab?.id)}
                      className={`
                        flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                        ${activeTab === tab?.id
                          ? 'border-primary text-primary' 
                          : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                        }
                      `}
                    >
                      <TabIcon className="w-5 h-5" />
                      {tab?.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-card border border-border rounded-lg shadow-sm">
            {activeTab === 'settings' && <SystemSettingsPanel />}
            {activeTab === 'users' && <UserManagementPanel />}
            {activeTab === 'audit' && <AuditLogsPanel />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SystemSettingsUserManagement;