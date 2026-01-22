import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import { creatorService } from '../../../services/creatorService';
import { useFollowersTiers } from '../../../hooks/useFollowersTiers';

const EditCreatorModal = ({ isOpen, onClose, creator, onCreatorUpdated }) => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    instagram_link: '',
    followers_tier: '',
    state: '',
    city: '',
    whatsapp: '',
    email: '',
    gender: '',
    sheet_source: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Fetch followers tiers dynamically
  const { followersTiers, loading: followersLoading } = useFollowersTiers();
  
  // Static gender options
  const genderOptions = [
    { value: 'Female', label: 'Female' },
    { value: 'Male', label: 'Male' },
    { value: 'Other', label: 'Other' },
    { value: 'Prefer not to say', label: 'Prefer not to say' }
  ];

  // Initialize form data when creator changes
  useEffect(() => {
    if (creator) {
      setFormData({
        name: creator?.name || '',
        username: creator?.username || '',
        instagram_link: creator?.instagram_link || '',
        followers_tier: creator?.followers_tier || '',
        state: creator?.state || '',
        city: creator?.city || '',
        whatsapp: creator?.whatsapp || '',
        email: creator?.email || '',
        gender: creator?.gender || '',
        sheet_source: creator?.sheet_source || ''
      });
    }
  }, [creator]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  const validateEmail = (email) => {
    if (!email || email.toLowerCase() === 'n/a') return true; // Email is optional or N/A
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    if (!phone) return true; // Phone is optional
    // Allow multiple numbers separated by slash or comma
    const phoneNumbers = phone.split(/[/,]/).map(p => p.trim());
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    
    // Check each phone number
    return phoneNumbers.every(p => {
      if (!p) return true; // Allow empty segments
      return phoneRegex.test(p) && p.replace(/\D/g, '').length >= 10;
    });
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      // Validate required fields
      if (!formData?.name?.trim()) {
        throw new Error('Name is required');
      }
      if (!formData?.username?.trim()) {
        throw new Error('Username is required');
      }

      // Validate email format if provided
      if (formData?.email && !validateEmail(formData?.email)) {
        throw new Error('Please enter a valid email address');
      }

      // Validate phone format if provided
      if (formData?.whatsapp && !validatePhone(formData?.whatsapp)) {
        throw new Error('Please enter a valid phone number (minimum 10 digits)');
      }

      // Update creator
      const updatedCreator = await creatorService?.update(creator?.id, formData);
      
      // Notify parent component
      onCreatorUpdated?.(updatedCreator);
      
      onClose();
    } catch (err) {
      console.error('Error updating creator:', err);
      setError(err?.message || 'Failed to update creator');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !creator) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[400] p-4">
      <div className="bg-card rounded-lg shadow-lg-custom max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon name="Edit" size={20} color="var(--color-primary)" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Edit Creator</h2>
              <p className="text-xs text-muted-foreground">Update creator information</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-muted transition-colors duration-200"
            aria-label="Close modal"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive rounded-lg p-4 flex items-start gap-3">
              <Icon name="AlertTriangle" size={20} color="var(--color-destructive)" className="flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive mb-1">Error</p>
                <p className="text-xs text-destructive/80">{error}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Name *"
              value={formData?.name}
              onChange={(e) => handleChange('name', e?.target?.value)}
              placeholder="Creator full name"
              required
              disabled={loading}
            />
            <Input
              label="Username *"
              value={formData?.username}
              onChange={(e) => handleChange('username', e?.target?.value)}
              placeholder="Instagram username"
              required
              disabled={loading}
            />
          </div>

          <Input
            label="Instagram Link"
            value={formData?.instagram_link}
            onChange={(e) => handleChange('instagram_link', e?.target?.value)}
            placeholder="https://instagram.com/username"
            disabled={loading}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Followers Tier"
              value={formData?.followers_tier}
              onChange={(value) => handleChange('followers_tier', value)}
              options={followersTiers}
              placeholder="Select followers tier"
              disabled={loading || followersLoading}
              loading={followersLoading}
              searchable={true}
              clearable={true}
            />
            <Select
              label="Gender"
              value={formData?.gender}
              onChange={(value) => handleChange('gender', value)}
              options={genderOptions}
              placeholder="Select gender"
              disabled={loading}
              clearable={true}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="State"
              value={formData?.state}
              onChange={(e) => handleChange('state', e?.target?.value)}
              placeholder="State name"
              disabled={loading}
            />
            <Input
              label="City"
              value={formData?.city}
              onChange={(e) => handleChange('city', e?.target?.value)}
              placeholder="City name"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="WhatsApp"
              value={formData?.whatsapp}
              onChange={(e) => handleChange('whatsapp', e?.target?.value)}
              placeholder="WhatsApp number"
              disabled={loading}
              error={formData?.whatsapp && !validatePhone(formData?.whatsapp) ? 'Invalid phone number' : ''}
            />
            <Input
              label="Email"
              type="email"
              value={formData?.email}
              onChange={(e) => handleChange('email', e?.target?.value)}
              placeholder="email@example.com"
              disabled={loading}
              error={formData?.email && !validateEmail(formData?.email) ? 'Invalid email address' : ''}
            />
          </div>

          <Input
            label="Sheet Source"
            value={formData?.sheet_source}
            onChange={(e) => handleChange('sheet_source', e?.target?.value)}
            placeholder="Source spreadsheet name"
            disabled={loading}
          />

          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              iconName="Save"
              iconPosition="left"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Icon name="Loader2" size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCreatorModal;
