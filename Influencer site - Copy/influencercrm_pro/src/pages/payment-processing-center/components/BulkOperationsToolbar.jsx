import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';

const BulkOperationsToolbar = ({ selectedCount, onBulkAction, userRole }) => {
  const [bulkAction, setBulkAction] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  const bulkActions = userRole === 'Super Admin' ? [
    { value: '', label: 'Select Action' },
    { value: 'mark_processing', label: 'Mark as Processing' },
    { value: 'mark_paid', label: 'Mark as Paid' },
    { value: 'change_method', label: 'Change Payment Method' },
    { value: 'send_reminder', label: 'Send Payment Reminder' },
    { value: 'export_selected', label: 'Export Selected' },
    { value: 'delete', label: 'Delete Selected' }
  ] : [
    { value: '', label: 'Select Action' },
    { value: 'mark_processing', label: 'Mark as Processing' },
    { value: 'mark_paid', label: 'Mark as Paid' },
    { value: 'send_reminder', label: 'Send Payment Reminder' },
    { value: 'export_selected', label: 'Export Selected' }
  ];

  const handleApplyAction = () => {
    if (bulkAction) {
      setShowConfirmation(true);
    }
  };

  const handleConfirm = () => {
    onBulkAction(bulkAction);
    setBulkAction('');
    setShowConfirmation(false);
  };

  const handleCancel = () => {
    setShowConfirmation(false);
  };

  return (
    <>
      <div className="bg-primary/5 border-b border-primary/20 px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Icon name="CheckSquare" size={20} color="var(--color-primary)" />
              <span className="text-sm font-medium text-foreground">
                {selectedCount} payment{selectedCount !== 1 ? 's' : ''} selected
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              (Max 100 at a time)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-64">
              <Select
                options={bulkActions}
                value={bulkAction}
                onChange={setBulkAction}
                placeholder="Select bulk action"
              />
            </div>
            <Button
              variant="default"
              size="sm"
              iconName="Play"
              iconPosition="left"
              onClick={handleApplyAction}
              disabled={!bulkAction || selectedCount === 0}
            >
              Apply
            </Button>
          </div>
        </div>
      </div>

      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[400]">
          <div className="bg-card rounded-lg shadow-lg-custom max-w-md w-full mx-4 p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
                <Icon name="AlertTriangle" size={24} color="var(--color-warning)" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Confirm Bulk Action
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Are you sure you want to apply this action to {selectedCount} payment{selectedCount !== 1 ? 's' : ''}? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleConfirm}
                    fullWidth
                  >
                    Confirm
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    fullWidth
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BulkOperationsToolbar;