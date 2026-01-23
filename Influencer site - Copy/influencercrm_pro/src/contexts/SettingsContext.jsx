// src/contexts/SettingsContext.jsx

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSystemSettings } from '../services/adminControlService';

const SettingsContext = createContext(null);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === null) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSync, setLastSync] = useState(null);

  // Fetch settings from database
  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await getSystemSettings();
      if (result?.error) {
        console.error('Settings fetch error:', result.error);
        setError(result.error);
      } else {
        const settingsMap = {};
        result.data?.forEach(setting => {
          if (setting?.setting_key) {
            // Parse JSON values appropriately
            let value = setting.setting_value;
            if (typeof value === 'string') {
              try {
                value = JSON.parse(value);
              } catch (e) {
                // If it's not valid JSON, keep as string
                value = value.replace(/"/g, '');
              }
            }
            settingsMap[setting.setting_key] = value;
          }
        });
        setSettings(settingsMap);
        setLastSync(new Date());
        
        // Apply dynamic branding immediately
        applyDynamicBranding(settingsMap);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  // Apply dynamic branding to the DOM
  const applyDynamicBranding = (settingsData) => {
    // Update CSS custom properties for theme
    const root = document.documentElement;
    
    if (settingsData.primary_theme_color) {
      root.style.setProperty('--primary-color', settingsData.primary_theme_color);
      root.style.setProperty('--primary', settingsData.primary_theme_color);
    }
    
    // Update page title
    if (settingsData.platform_name) {
      document.title = `${settingsData.platform_name} - Admin Dashboard`;
      
      // Update meta description if needed
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.content = `${settingsData.platform_name} Admin Dashboard`;
      }
    }
  };

  // Get specific setting value
  const getSetting = (key, defaultValue = null) => {
    return settings[key] ?? defaultValue;
  };

  // Update a setting (this would call an API in a real implementation)
  const updateSetting = async (key, value) => {
    // This would typically call an update API
    // For now, we'll just update local state and refetch
    await fetchSettings();
  };

  // Manual sync function
  const syncWithDatabase = async () => {
    await fetchSettings();
  };

  // Initial fetch
  useEffect(() => {
    fetchSettings();
  }, []);

  // Auto-sync every 5 minutes
  useEffect(() => {
    const interval = setInterval(fetchSettings, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const value = {
    settings,
    loading,
    error,
    lastSync,
    getSetting,
    updateSetting,
    syncWithDatabase,
    fetchSettings,
    // Convenience getters for common settings
    platformName: getSetting('platform_name', 'Uppal Media'),
    primaryThemeColor: getSetting('primary_theme_color', '#3b82f6'),
    maintenanceMode: getSetting('maintenance_mode', false),
    maxImportLimit: getSetting('max_import_limit', 5000),
    defaultCurrency: getSetting('default_currency', 'INR'),
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export default SettingsContext;
