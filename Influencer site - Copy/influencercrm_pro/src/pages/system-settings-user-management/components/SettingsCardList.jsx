// src/pages/system-settings-user-management/components/SettingsCardList.jsx

import React, { useState } from 'react';
import { Settings, Shield, Palette, RefreshCw, Save, Edit2, X, Check } from 'lucide-react';
import { useSettings } from '../../../contexts/SettingsContext';
import { updateSystemSetting } from '../../../services/adminControlService';
import toast from 'react-hot-toast';

const SettingsCardList = () => {
  const { settings, syncWithDatabase, lastSync } = useSettings();
  const [editingKey, setEditingKey] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  const settingsCategories = [
    {
      id: 'general',
      name: 'General Settings',
      icon: Settings,
      description: 'Platform configuration and basic settings',
      color: 'blue',
      settings: [
        { key: 'platform_name', label: 'Platform Name', type: 'text', description: 'Application name displayed in UI header' },
        { key: 'maintenance_mode', label: 'Maintenance Mode', type: 'toggle', description: 'Enable maintenance mode to disable user access' },
        { key: 'max_import_limit', label: 'Max Import Limit', type: 'number', description: 'Maximum rows allowed per Excel import' },
        { key: 'default_currency', label: 'Default Currency', type: 'text', description: 'Default currency for transactions' },
      ]
    },
    {
      id: 'branding',
      name: 'Branding',
      icon: Palette,
      description: 'Visual appearance and theme settings',
      color: 'purple',
      settings: [
        { key: 'primary_theme_color', label: 'Primary Theme Color', type: 'color', description: 'Main color theme for the application' },
      ]
    },
    {
      id: 'security',
      name: 'Security',
      icon: Shield,
      description: 'Security and access control settings',
      color: 'red',
      settings: [
        { key: 'enable_user_registration', label: 'User Registration', type: 'toggle', description: 'Allow new user registration' },
        { key: 'session_timeout_minutes', label: 'Session Timeout', type: 'number', description: 'Session timeout in minutes' },
        { key: 'max_login_attempts', label: 'Max Login Attempts', type: 'number', description: 'Maximum failed login attempts' },
      ]
    }
  ];

  const handleToggle = async (key) => {
    setSaving(true);
    try {
      const currentValue = settings[key];
      const newValue = !currentValue;
      
      const result = await updateSystemSetting(key, newValue);
      if (result?.error) {
        toast.error('Failed to update setting');
      } else {
        toast.success('Setting updated successfully');
        // Refresh settings
        await syncWithDatabase();
      }
    } catch (error) {
      toast.error('Error updating setting');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (key, currentValue) => {
    setEditingKey(key);
    setEditValue(currentValue?.toString() || '');
  };

  const handleSave = async (key) => {
    setSaving(true);
    try {
      let processedValue = editValue;
      
      // Handle different data types
      const setting = settingsCategories
        .flatMap(cat => cat.settings)
        .find(s => s.key === key);
      
      if (setting?.type === 'number') {
        processedValue = parseInt(editValue) || 0;
      } else if (setting?.type === 'color') {
        processedValue = editValue;
      } else {
        processedValue = editValue;
      }

      const result = await updateSystemSetting(key, processedValue);
      if (result?.error) {
        toast.error('Failed to update setting');
      } else {
        toast.success('Setting updated successfully');
        await syncWithDatabase();
        setEditingKey(null);
        setEditValue('');
      }
    } catch (error) {
      toast.error('Error updating setting');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingKey(null);
    setEditValue('');
  };

  const renderSettingValue = (setting) => {
    const value = settings[setting.key];
    const isEditing = editingKey === setting.key;

    if (isEditing) {
      return (
        <div className="flex items-center gap-2">
          {setting.type === 'color' ? (
            <input
              type="color"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-12 h-8 border border-border rounded cursor-pointer"
            />
          ) : setting.type === 'number' ? (
            <input
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="px-2 py-1 border border-border rounded text-sm w-20"
              autoFocus
            />
          ) : (
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="px-2 py-1 border border-border rounded text-sm w-32"
              autoFocus
            />
          )}
          <button
            onClick={() => handleSave(setting.key)}
            disabled={saving}
            className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50"
          >
            <Check size={16} />
          </button>
          <button
            onClick={handleCancel}
            className="p-1 text-red-600 hover:text-red-700"
          >
            <X size={16} />
          </button>
        </div>
      );
    }

    switch (setting.type) {
      case 'toggle':
        return (
          <button
            onClick={() => handleToggle(setting.key)}
            disabled={saving}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              value ? 'bg-blue-600' : 'bg-gray-200'
            } disabled:opacity-50`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                value ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
            {saving && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
              </div>
            )}
          </button>
        );

      case 'color':
        return (
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded border border-border"
              style={{ backgroundColor: value || '#000000' }}
            />
            <span className="text-sm text-muted-foreground font-mono">{value || '#000000'}</span>
            <button
              onClick={() => handleEdit(setting.key, value)}
              className="p-1 text-blue-600 hover:text-blue-700"
            >
              <Edit2 size={14} />
            </button>
          </div>
        );

      default:
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{value || 'Not set'}</span>
            <button
              onClick={() => handleEdit(setting.key, value)}
              className="p-1 text-blue-600 hover:text-blue-700"
            >
              <Edit2 size={14} />
            </button>
          </div>
        );
    }
  };

  const getCategoryColor = (color) => {
    const colors = {
      blue: 'from-blue-500 to-blue-600',
      purple: 'from-purple-500 to-purple-600',
      red: 'from-red-500 to-red-600',
      green: 'from-green-500 to-green-600',
    };
    return colors[color] || 'from-gray-500 to-gray-600';
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">System Settings</h2>
          <p className="text-muted-foreground">
            Manage your platform configuration with our beautiful card-based interface
          </p>
        </div>
        <button
          onClick={syncWithDatabase}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors glass-morphism"
        >
          <RefreshCw className="w-4 h-4" />
          Sync with Database
        </button>
      </div>

      {/* Last Sync Info */}
      {lastSync && (
        <div className="mb-6 text-sm text-muted-foreground">
          Last synchronized: {lastSync.toLocaleString()}
        </div>
      )}

      {/* Settings Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {settingsCategories.map((category) => {
          const Icon = category.icon;
          return (
            <div
              key={category.id}
              className="bg-card border border-border rounded-xl shadow-lg overflow-hidden glass-morphism hover:shadow-xl transition-all duration-300"
            >
              {/* Card Header */}
              <div className={`bg-gradient-to-r ${getCategoryColor(category.color)} p-4 text-white`}>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{category.name}</h3>
                    <p className="text-white/80 text-sm">{category.description}</p>
                  </div>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-4 space-y-4">
                {category.settings.map((setting) => (
                  <div key={setting.key} className="border-b border-border/50 pb-3 last:border-b-0">
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-medium text-foreground text-sm">
                        {setting.label}
                      </label>
                      {renderSettingValue(setting)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {setting.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {Object.keys(settings).length === 0 && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-muted rounded-full mb-4">
            <Settings className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">No Settings Found</h3>
          <p className="text-muted-foreground mb-4">
            System settings could not be loaded. Please check your database connection.
          </p>
          <button
            onClick={syncWithDatabase}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Retry Loading
          </button>
        </div>
      )}
    </div>
  );
};

export default SettingsCardList;
