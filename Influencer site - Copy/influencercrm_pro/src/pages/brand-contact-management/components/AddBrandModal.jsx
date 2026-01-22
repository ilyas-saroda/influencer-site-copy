import React, { useState } from 'react';
import { X } from 'lucide-react';
import { brandService } from '../../../services/brandService';

export default function AddBrandModal({ isOpen, onClose, onBrandAdded }) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'other',
    website: '',
    description: '',
    industry: '',
    headquarters: '',
    employeeCount: '',
    annualRevenue: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError('');

    try {
      const newBrand = await brandService?.create({
        name: formData?.name,
        category: formData?.category,
        website: formData?.website,
        description: formData?.description,
        industry: formData?.industry,
        headquarters: formData?.headquarters,
        employeeCount: formData?.employeeCount ? parseInt(formData?.employeeCount) : null,
        annualRevenue: formData?.annualRevenue ? parseFloat(formData?.annualRevenue) : null,
        notes: formData?.notes
      });

      onBrandAdded(newBrand);
      onClose();
      setFormData({
        name: '',
        category: 'other',
        website: '',
        description: '',
        industry: '',
        headquarters: '',
        employeeCount: '',
        annualRevenue: '',
        notes: ''
      });
    } catch (err) {
      setError(err?.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Add New Brand</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brand Name *
            </label>
            <input
              type="text"
              required
              value={formData?.name}
              onChange={(e) => setFormData({ ...formData, name: e?.target?.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter brand name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={formData?.category}
              onChange={(e) => setFormData({ ...formData, category: e?.target?.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="fashion">Fashion</option>
              <option value="beauty">Beauty</option>
              <option value="technology">Technology</option>
              <option value="food">Food</option>
              <option value="lifestyle">Lifestyle</option>
              <option value="sports">Sports</option>
              <option value="entertainment">Entertainment</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Industry
              </label>
              <input
                type="text"
                value={formData?.industry}
                onChange={(e) => setFormData({ ...formData, industry: e?.target?.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Fashion & Retail"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Headquarters
              </label>
              <input
                type="text"
                value={formData?.headquarters}
                onChange={(e) => setFormData({ ...formData, headquarters: e?.target?.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Mumbai, India"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Website
            </label>
            <input
              type="url"
              value={formData?.website}
              onChange={(e) => setFormData({ ...formData, website: e?.target?.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData?.description}
              onChange={(e) => setFormData({ ...formData, description: e?.target?.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Brief description about the brand"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employee Count
              </label>
              <input
                type="number"
                value={formData?.employeeCount}
                onChange={(e) => setFormData({ ...formData, employeeCount: e?.target?.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 150"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Annual Revenue
              </label>
              <input
                type="number"
                step="0.01"
                value={formData?.annualRevenue}
                onChange={(e) => setFormData({ ...formData, annualRevenue: e?.target?.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 5000000"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData?.notes}
              onChange={(e) => setFormData({ ...formData, notes: e?.target?.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Brand'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}