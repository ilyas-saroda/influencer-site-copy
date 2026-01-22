import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { creatorService } from '../../../services/creatorService';

const BulkDeleteModal = ({ isOpen, onClose, selectedCreatorIds, onBulkUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setError(null);
    }
  }, [isOpen]);

  const handleDelete = async () => {
    if (selectedCreatorIds?.length === 0) {
      setError('No creators selected');
      return;
    }

    // Confirmation check
    const confirmMessage = `Are you sure you want to delete ${selectedCreatorIds.length} creator${selectedCreatorIds.length > 1 ? 's' : ''}? This action cannot be undone.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Delete all selected creators using bulk delete for better performance
      await creatorService.bulkDelete(selectedCreatorIds);

      // Notify parent component
      onBulkUpdate?.();
      
      // Close modal
      onClose();
    } catch (err) {
      console.error('Error deleting creators:', err);
      setError(err?.message || 'Failed to delete creators');
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
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <Icon name="Trash2" size={20} color="var(--color-destructive)" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Delete Creators</h2>
              <p className="text-sm text-muted-foreground">
                Remove {selectedCreatorIds?.length} creator{selectedCreatorIds?.length > 1 ? 's' : ''}
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
          <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
            <Icon name="AlertTriangle" size={20} color="var(--color-destructive)" />
            <div>
              <p className="text-sm font-medium text-destructive">Warning</p>
              <p className="text-xs text-destructive">
                This action cannot be undone. All data for the selected creators will be permanently deleted.
              </p>
            </div>
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
            variant="destructive"
            onClick={handleDelete}
            loading={loading}
            disabled={loading}
          >
            Delete {selectedCreatorIds?.length} Creator{selectedCreatorIds?.length > 1 ? 's' : ''}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BulkDeleteModal;
