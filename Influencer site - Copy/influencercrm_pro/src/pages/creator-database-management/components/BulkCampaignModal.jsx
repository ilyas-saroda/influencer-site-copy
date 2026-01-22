import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import { creatorService } from '../../../services/creatorService';

const BulkCampaignModal = ({ isOpen, onClose, selectedCreatorIds, onBulkUpdate }) => {
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Mock campaigns data - in real app, this would come from API
  const campaigns = [
    { value: 'campaign_1', label: 'Summer Fashion 2024' },
    { value: 'campaign_2', label: 'Tech Product Launch' },
    { value: 'campaign_3', label: 'Food & Beverage Festival' },
    { value: 'campaign_4', label: 'Travel & Tourism' },
    { value: 'campaign_5', label: 'Beauty & Skincare' },
    { value: 'none', label: 'Remove from Campaign' }
  ];

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedCampaign('');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!selectedCampaign) {
      setError('Please select a campaign');
      return;
    }

    if (selectedCreatorIds?.length === 0) {
      setError('No creators selected');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Update all selected creators using bulk update for better performance
      await creatorService.bulkUpdate(selectedCreatorIds, { 
        campaign_id: selectedCampaign === 'none' ? null : selectedCampaign 
      });

      // Notify parent component
      onBulkUpdate?.();
      
      // Close modal
      onClose();
    } catch (err) {
      console.error('Error updating campaigns:', err);
      setError(err?.message || 'Failed to update campaigns');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg shadow-lg-custom w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon name="Megaphone" size={20} color="var(--color-primary)" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Assign to Campaign</h2>
              <p className="text-sm text-muted-foreground">
                Assign {selectedCreatorIds?.length} creator{selectedCreatorIds?.length > 1 ? 's' : ''} to campaign
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            iconName="X"
            iconSize={16}
          />
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Select Campaign
            </label>
            <Select
              options={campaigns}
              value={selectedCampaign}
              onChange={setSelectedCampaign}
              placeholder="Choose a campaign..."
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <Icon name="AlertCircle" size={16} color="var(--color-destructive)" />
              <span className="text-sm text-destructive">{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleSubmit}
            loading={loading}
            disabled={!selectedCampaign || loading}
          >
            Assign to Campaign
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BulkCampaignModal;
