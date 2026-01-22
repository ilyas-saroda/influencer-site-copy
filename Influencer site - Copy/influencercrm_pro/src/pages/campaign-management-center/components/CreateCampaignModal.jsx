import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { creatorService } from '../../../services/creatorService';
import { campaignService } from '../../../services/campaignService';

const CreateCampaignModal = ({ onClose, onCampaignCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    campaign_name: '',
    creator_id: '',
    start_date: '',
    end_date: '',
    amount: '',
    agreed_amount: '',
    deliverables: '',
    payment_status: 'pending'
  });
  
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCreators, setLoadingCreators] = useState(true);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadCreators();
  }, []);

  const loadCreators = async () => {
    try {
      setLoadingCreators(true);
      const data = await creatorService?.getAll();
      setCreators(data);
    } catch (err) {
      console.error('Error loading creators:', err);
      setError('Failed to load creators');
    } finally {
      setLoadingCreators(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData?.name?.trim()) {
      newErrors.name = 'Campaign name is required';
    }

    if (!formData?.brand?.trim()) {
      newErrors.brand = 'Brand name is required';
    }

    if (!formData?.creator_id) {
      newErrors.creator_id = 'Please select a creator';
    }

    if (!formData?.start_date) {
      newErrors.start_date = 'Start date is required';
    }

    if (!formData?.end_date) {
      newErrors.end_date = 'End date is required';
    }

    if (formData?.start_date && formData?.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      if (end < start) {
        newErrors.end_date = 'End date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);

      const campaignData = {
        name: formData?.name,
        brand: formData?.brand,
        brand_name: formData?.brand,
        campaign_name: formData?.name,
        creator_id: formData?.creator_id,
        start_date: formData?.start_date,
        end_date: formData?.end_date,
        amount: formData?.amount ? parseFloat(formData?.amount) : null,
        agreed_amount: formData?.agreed_amount ? parseFloat(formData?.agreed_amount) : null,
        deliverables: formData?.deliverables || null,
        payment_status: formData?.payment_status
      };

      await campaignService?.create(campaignData);
      onCampaignCreated?.();
      onClose?.();
    } catch (err) {
      console.error('Error creating campaign:', err);
      setError(err?.message || 'Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors?.[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Create New Campaign</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            disabled={loading}
          >
            <Icon name="X" size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Campaign Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Campaign Name *
            </label>
            <Input
              value={formData?.name}
              onChange={(e) => handleChange('name', e?.target?.value)}
              placeholder="Enter campaign name"
              error={errors?.name}
              disabled={loading}
            />
            {errors?.name && (
              <p className="text-red-500 text-xs mt-1">{errors?.name}</p>
            )}
          </div>

          {/* Brand Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Brand Name *
            </label>
            <Input
              value={formData?.brand}
              onChange={(e) => handleChange('brand', e?.target?.value)}
              placeholder="Enter brand name"
              error={errors?.brand}
              disabled={loading}
            />
            {errors?.brand && (
              <p className="text-red-500 text-xs mt-1">{errors?.brand}</p>
            )}
          </div>

          {/* Creator Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Select Creator *
            </label>
            {loadingCreators ? (
              <div className="flex items-center justify-center py-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              </div>
            ) : (
              <select
                value={formData?.creator_id}
                onChange={(e) => handleChange('creator_id', e?.target?.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors?.creator_id ? 'border-red-500' : 'border-input'
                }`}
                disabled={loading}
              >
                <option value="">Choose a creator</option>
                {creators?.map((creator) => (
                  <option key={creator?.id} value={creator?.id}>
                    {creator?.name} ({creator?.username})
                  </option>
                ))}
              </select>
            )}
            {errors?.creator_id && (
              <p className="text-red-500 text-xs mt-1">{errors?.creator_id}</p>
            )}
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Start Date *
              </label>
              <Input
                type="date"
                value={formData?.start_date}
                onChange={(e) => handleChange('start_date', e?.target?.value)}
                error={errors?.start_date}
                disabled={loading}
              />
              {errors?.start_date && (
                <p className="text-red-500 text-xs mt-1">{errors?.start_date}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                End Date *
              </label>
              <Input
                type="date"
                value={formData?.end_date}
                onChange={(e) => handleChange('end_date', e?.target?.value)}
                error={errors?.end_date}
                disabled={loading}
              />
              {errors?.end_date && (
                <p className="text-red-500 text-xs mt-1">{errors?.end_date}</p>
              )}
            </div>
          </div>

          {/* Amount Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Amount
              </label>
              <Input
                type="number"
                value={formData?.amount}
                onChange={(e) => handleChange('amount', e?.target?.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Agreed Amount
              </label>
              <Input
                type="number"
                value={formData?.agreed_amount}
                onChange={(e) => handleChange('agreed_amount', e?.target?.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                disabled={loading}
              />
            </div>
          </div>

          {/* Deliverables */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Deliverables
            </label>
            <textarea
              value={formData?.deliverables}
              onChange={(e) => handleChange('deliverables', e?.target?.value)}
              placeholder="Describe campaign deliverables..."
              rows={3}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              disabled={loading}
            />
          </div>

          {/* Payment Status */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Payment Status
            </label>
            <select
              value={formData?.payment_status}
              onChange={(e) => handleChange('payment_status', e?.target?.value)}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={loading}
            >
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="paid">Paid</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating...
                </div>
              ) : (
                'Create Campaign'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCampaignModal;