import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import { creatorService } from '../../../services/creatorService';

const BulkStatusModal = ({ isOpen, onClose, selectedCreatorIds, onBulkUpdate }) => {
  const [selectedStatus, setSelectedStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Available statuses
  const statuses = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'pending', label: 'Pending' },
    { value: 'blacklisted', label: 'Blacklisted' }
  ];

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedStatus('');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!selectedStatus) {
      setError('Please select a status');
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
      await creatorService.bulkUpdate(selectedCreatorIds, { status: selectedStatus });

      // Notify parent component
      onBulkUpdate?.();
      
      // Close modal
      onClose();
    } catch (err) {
      console.error('Error updating statuses:', err);
      setError(err?.message || 'Failed to update statuses');
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
              <Icon name="Activity" size={20} color="var(--color-primary)" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Change Status</h2>
              <p className="text-sm text-muted-foreground">
                Update status for {selectedCreatorIds?.length} creator{selectedCreatorIds?.length > 1 ? 's' : ''}
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
              Select Status
            </label>
            <Select
              options={statuses}
              value={selectedStatus}
              onChange={setSelectedStatus}
              placeholder="Choose a status..."
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
            disabled={!selectedStatus || loading}
          >
            Update Status
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BulkStatusModal;
