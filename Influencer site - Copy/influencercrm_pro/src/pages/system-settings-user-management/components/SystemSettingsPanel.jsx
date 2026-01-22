import React, { useState, useEffect } from 'react';
import { Settings, Plus, Edit2, Trash2, Globe, Shield, Bell, DollarSign, Mail, RefreshCw } from 'lucide-react';
import { getAllSettings, updateSetting, deleteSetting, createSetting } from '../../../services/systemSettingsService';
import toast from 'react-hot-toast';
import Icon from '../../../components/AppIcon';
import AddSettingModal from './AddSettingModal';


const SystemSettingsPanel = () => {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const categories = [
    { id: 'all', label: 'All Settings', icon: Settings },
    { id: 'general', label: 'General', icon: Globe },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notification', label: 'Notifications', icon: Bell },
    { id: 'payment', label: 'Payment', icon: DollarSign },
    { id: 'email', label: 'Email', icon: Mail }
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await getAllSettings();
      if (error) throw error;
      setSettings(data || []);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast?.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSetting = async (id, updates) => {
    try {
      const { data, error } = await updateSetting(id, updates);
      if (error) throw error;
      
      setSettings(prev => prev?.map(s => s?.id === id ? data : s));
      setEditingId(null);
      toast?.success('Setting updated successfully');
    } catch (error) {
      console.error('Error updating setting:', error);
      toast?.error(error?.message || 'Failed to update setting');
    }
  };

  const handleDeleteSetting = async (id) => {
    if (!confirm('Are you sure you want to delete this setting?')) return;
    
    try {
      const { error } = await deleteSetting(id);
      if (error) throw error;
      
      setSettings(prev => prev?.filter(s => s?.id !== id));
      toast?.success('Setting deleted successfully');
    } catch (error) {
      console.error('Error deleting setting:', error);
      toast?.error(error?.message || 'Failed to delete setting');
    }
  };

  const handleSettingAdded = (newSetting) => {
    setSettings(prev => [newSetting, ...prev]);
    setShowAddModal(false);
    toast?.success('Setting added successfully');
  };

  const filteredSettings = selectedCategory === 'all' 
    ? settings 
    : settings?.filter(s => s?.settingCategory === selectedCategory);

  const getCategoryIcon = (category) => {
    const cat = categories?.find(c => c?.id === category);
    return cat ? cat?.icon : Settings;
  };

  const parseSettingValue = (value) => {
    try {
      if (typeof value === 'string') {
        return JSON.parse(value);
      }
      return value;
    } catch {
      return value;
    }
  };

  const renderSettingValue = (setting) => {
    const value = parseSettingValue(setting?.settingValue);
    
    if (editingId === setting?.id) {
      return (
        <div className="flex items-center gap-2">
          <input
            type="text"
            defaultValue={typeof value === 'object' ? JSON.stringify(value) : value}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            onKeyDown={(e) => {
              if (e?.key === 'Enter') {
                let newValue = e?.target?.value;
                try {
                  newValue = JSON.parse(newValue);
                } catch {}
                handleUpdateSetting(setting?.id, { settingValue: newValue });
              }
            }}
          />
          <button
            onClick={() => setEditingId(null)}
            className="px-3 py-2 text-gray-600 hover:text-gray-900"
          >
            Cancel
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between">
        <span className="text-gray-900 font-medium">
          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
        </span>
        <button
          onClick={() => setEditingId(setting?.id)}
          className="text-purple-600 hover:text-purple-700"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      </div>
    );
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
      {/* Category Filter */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          {categories?.map((category) => {
            const Icon = category?.icon;
            return (
              <button
                key={category?.id}
                onClick={() => setSelectedCategory(category?.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
                  ${selectedCategory === category?.id
                    ? 'bg-purple-600 text-white' :'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {category?.label}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Setting
        </button>
      </div>
      {/* Settings List */}
      <div className="space-y-4">
        {filteredSettings?.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No settings found for this category
          </div>
        ) : (
          filteredSettings?.map((setting) => {
            const Icon = getCategoryIcon(setting?.settingCategory);
            return (
              <div
                key={setting?.id}
                className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-purple-200 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 bg-white rounded-lg">
                      <Icon className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">
                          {setting?.settingKey}
                        </h3>
                        <span className={`
                          px-2 py-1 text-xs font-medium rounded-full
                          ${setting?.isPublic 
                            ? 'bg-green-100 text-green-700' :'bg-red-100 text-red-700'
                          }
                        `}>
                          {setting?.isPublic ? 'Public' : 'Private'}
                        </span>
                      </div>
                      {setting?.description && (
                        <p className="text-sm text-gray-600 mb-2">
                          {setting?.description}
                        </p>
                      )}
                      {renderSettingValue(setting)}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteSetting(setting?.id)}
                    className="text-red-600 hover:text-red-700 ml-4"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Setting Modal */}
      {showAddModal && (
        <AddSettingModal
          onClose={() => setShowAddModal(false)}
          onSettingAdded={handleSettingAdded}
        />
      )}
    </div>
  );
};

export default SystemSettingsPanel;