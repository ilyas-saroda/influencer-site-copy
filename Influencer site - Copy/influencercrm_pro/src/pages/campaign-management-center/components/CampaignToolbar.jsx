import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';

const CampaignToolbar = ({ 
  selectedCount, 
  onBulkStatusUpdate, 
  onExport, 
  onCreateCampaign,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange
}) => {
  const sortOptions = [
    { value: 'name-asc', label: 'Name (A-Z)' },
    { value: 'name-desc', label: 'Name (Z-A)' },
    { value: 'date-newest', label: 'Newest First' },
    { value: 'date-oldest', label: 'Oldest First' },
    { value: 'budget-high', label: 'Budget (High to Low)' },
    { value: 'budget-low', label: 'Budget (Low to High)' },
    { value: 'creators-high', label: 'Most Creators' },
    { value: 'creators-low', label: 'Least Creators' }
  ];

  const statusOptions = [
    { value: 'planning', label: 'Planning' },
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
    { value: 'paused', label: 'Paused' }
  ];

  const [showBulkActions, setShowBulkActions] = useState(false);

  const handleBulkStatusUpdate = (status) => {
    onBulkStatusUpdate(status);
    setShowBulkActions(false);
  };

  return (
    <div className="sticky top-0 bg-card border-b border-border z-10 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-foreground">Campaign Management</h1>
          {selectedCount > 0 && (
            <span className="px-3 py-1 text-sm font-medium rounded-full bg-primary/10 text-primary">
              {selectedCount} selected
            </span>
          )}
        </div>
        <Button
          variant="default"
          iconName="Plus"
          iconPosition="left"
          onClick={onCreateCampaign}
        >
          Create Campaign
        </Button>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <div className="w-64">
            <Select
              options={sortOptions}
              value={sortBy}
              onChange={onSortChange}
              placeholder="Sort by..."
            />
          </div>

          {selectedCount > 0 && (
            <div className="relative">
              <Button
                variant="outline"
                iconName="MoreVertical"
                iconPosition="left"
                onClick={() => setShowBulkActions(!showBulkActions)}
              >
                Bulk Actions
              </Button>
              {showBulkActions && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-popover border border-border rounded-md shadow-lg z-20">
                  <div className="py-1">
                    <div className="px-3 py-2 text-xs font-medium text-muted-foreground">
                      Update Status
                    </div>
                    {statusOptions?.map((status) => (
                      <button
                        key={status?.value}
                        onClick={() => handleBulkStatusUpdate(status?.value)}
                        className="w-full px-3 py-2 text-sm text-left hover:bg-muted transition-colors"
                      >
                        {status?.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <Button
            variant="outline"
            iconName="Download"
            iconPosition="left"
            onClick={onExport}
          >
            Export
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-muted rounded-md">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'grid' ?'bg-background text-foreground' :'text-muted-foreground hover:text-foreground'
              }`}
              aria-label="Grid view"
            >
              <Icon name="LayoutGrid" size={18} />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'list' ?'bg-background text-foreground' :'text-muted-foreground hover:text-foreground'
              }`}
              aria-label="List view"
            >
              <Icon name="List" size={18} />
            </button>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
        <Icon name="Info" size={14} />
        <span>
          <strong>Keyboard shortcuts:</strong> J/K to navigate campaigns, S to change status, A to assign creator
        </span>
      </div>
    </div>
  );
};

export default CampaignToolbar;