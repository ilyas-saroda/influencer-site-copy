import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { creatorService } from '../../../services/creatorService';

const AddCreatorModal = ({ isOpen, onClose, onCreatorAdded }) => {
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

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
      if (!formData?.name || !formData?.username) {
        throw new Error('Name and username are required');
      }

      // Validate email format if provided
      if (formData?.email && !validateEmail(formData?.email)) {
        throw new Error('Please enter a valid email address or N/A');
      }

      // Validate phone format if provided
      if (formData?.whatsapp && !validatePhone(formData?.whatsapp)) {
        throw new Error('Please enter valid phone number(s) (minimum 10 digits each)');
      }

      // Create creator
      const newCreator = await creatorService?.create(formData);
      
      // Notify parent component
      onCreatorAdded?.(newCreator);
      
      // Reset form and close
      setFormData({
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
      onClose();
    } catch (err) {
      console.error('Error adding creator:', err);
      setError(err?.message || 'Failed to add creator');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[400] p-4">
      <div className="bg-card rounded-lg shadow-lg-custom max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon name="UserPlus" size={20} color="var(--color-primary)" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Add New Creator</h2>
              <p className="text-xs text-muted-foreground">Fill in the creator details</p>
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
            />
            <Input
              label="Username *"
              value={formData?.username}
              onChange={(e) => handleChange('username', e?.target?.value)}
              placeholder="Instagram username"
              required
            />
          </div>

          <Input
            label="Instagram Link"
            value={formData?.instagram_link}
            onChange={(e) => handleChange('instagram_link', e?.target?.value)}
            placeholder="https://instagram.com/username"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Followers Tier"
              value={formData?.followers_tier}
              onChange={(e) => handleChange('followers_tier', e?.target?.value)}
              placeholder="e.g., 10K, 50K, 100K+"
            />
            <Input
              label="Gender"
              value={formData?.gender}
              onChange={(e) => handleChange('gender', e?.target?.value)}
              placeholder="Male/Female/Other"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="State"
              value={formData?.state}
              onChange={(e) => handleChange('state', e?.target?.value)}
              placeholder="State name"
            />
            <Input
              label="City"
              value={formData?.city}
              onChange={(e) => handleChange('city', e?.target?.value)}
              placeholder="City name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="WhatsApp"
              value={formData?.whatsapp}
              onChange={(e) => handleChange('whatsapp', e?.target?.value)}
              placeholder="WhatsApp number"
              error={formData?.whatsapp && !validatePhone(formData?.whatsapp) ? 'Invalid phone number' : ''}
            />
            <Input
              label="Email"
              type="email"
              value={formData?.email}
              onChange={(e) => handleChange('email', e?.target?.value)}
              placeholder="email@example.com"
              error={formData?.email && !validateEmail(formData?.email) ? 'Invalid email address' : ''}
            />
          </div>

          <Input
            label="Sheet Source"
            value={formData?.sheet_source}
            onChange={(e) => handleChange('sheet_source', e?.target?.value)}
            placeholder="Source spreadsheet name"
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
              iconName="UserPlus"
              iconPosition="left"
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add Creator'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCreatorModal;