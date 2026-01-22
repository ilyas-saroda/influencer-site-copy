import React, { useState } from 'react';
import { X, Settings } from 'lucide-react';
import { createSetting } from '../../../services/systemSettingsService';
import toast from 'react-hot-toast';

const AddSettingModal = ({ onClose, onSettingAdded }) => {
  const [formData, setFormData] = useState({
    settingKey: '',
    settingValue: '',
    settingCategory: 'general',
    description: '',
    isPublic: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const categories = [
    { id: 'general', label: 'General' },
    { id: 'security', label: 'Security' },
    { id: 'notification', label: 'Notifications' },
    { id: 'payment', label: 'Payment' },
    { id: 'email', label: 'Email' }
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e?.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');

    if (!formData?.settingKey || !formData?.settingValue) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      let value = formData?.settingValue;
      // Try to parse as JSON, otherwise keep as string
      try {
        value = JSON.parse(value);
      } catch {}

      const { data, error } = await createSetting({
        ...formData,
        settingValue: value
      });
      if (error) throw error;

      onSettingAdded(data);
      toast?.success('Setting created successfully');
      onClose();
    } catch (err) {
      console.error('Error creating setting:', err);
      setError(err?.message || 'Failed to create setting');
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
              <Settings className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Add New Setting</h2>
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
              Setting Key <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="settingKey"
              value={formData?.settingKey}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., app_name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              name="settingCategory"
              value={formData?.settingCategory}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            >
              {categories?.map(cat => (
                <option key={cat?.id} value={cat?.id}>
                  {cat?.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Value <span className="text-red-500">*</span>
            </label>
            <textarea
              name="settingValue"
              value={formData?.settingValue}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder={'e.g., true or {"key": "value"}'}
              rows={3}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData?.description}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Optional description"
              rows="2"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="isPublic"
              checked={formData?.isPublic}
              onChange={handleChange}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <label className="ml-2 text-sm text-gray-700">
              Public setting
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
              {loading ? 'Creating...' : 'Create Setting'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSettingModal;
