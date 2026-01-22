import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';


const BulkActionsToolbar = ({ selectedCount, onBulkAction, onClearSelection }) => {
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [selectedAction, setSelectedAction] = useState('');

  const bulkActions = [
    { value: 'export', label: 'Export Selected', icon: 'Download' },
    { value: 'categorize', label: 'Change Category', icon: 'Tag' },
    { value: 'addTags', label: 'Add Tags', icon: 'Bookmark' },
    { value: 'changeStatus', label: 'Change Status', icon: 'Activity' },
    { value: 'assignCampaign', label: 'Assign to Campaign', icon: 'Megaphone' },
    { value: 'delete', label: 'Delete Selected', icon: 'Trash2' }
  ];

  const handleActionSelect = (action) => {
    setSelectedAction(action);
    onBulkAction(action);
    setShowActionMenu(false);
  };

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-card border border-border rounded-lg shadow-lg-custom px-6 py-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon name="CheckSquare" size={18} color="var(--color-primary)" />
          </div>
          <div>
            <div className="text-sm font-medium text-foreground">
              {selectedCount} creator{selectedCount > 1 ? 's' : ''} selected
            </div>
            <div className="text-xs text-muted-foreground">
              Choose an action to apply
            </div>
          </div>
        </div>

        <div className="h-8 w-px bg-border" />

        <div className="flex items-center gap-2">
          {bulkActions?.slice(0, 3)?.map((action) => (
            <Button
              key={action?.value}
              variant="outline"
              size="sm"
              onClick={() => handleActionSelect(action?.value)}
              iconName={action?.icon}
              iconPosition="left"
              iconSize={16}
            >
              {action?.label}
            </Button>
          ))}

          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowActionMenu(!showActionMenu)}
              iconName="MoreHorizontal"
              iconSize={16}
            />
            {showActionMenu && (
              <div className="absolute bottom-full right-0 mb-2 w-56 bg-popover border border-border rounded-md shadow-lg-custom overflow-hidden">
                {bulkActions?.slice(3)?.map((action) => (
                  <button
                    key={action?.value}
                    onClick={() => handleActionSelect(action?.value)}
                    className="w-full px-4 py-2 text-left text-sm text-popover-foreground hover:bg-muted transition-colors duration-200 flex items-center gap-3"
                  >
                    <Icon name={action?.icon} size={16} />
                    {action?.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="h-8 w-px bg-border" />

        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          iconName="X"
          iconSize={16}
        >
          Clear
        </Button>
      </div>
    </div>
  );
};

export default BulkActionsToolbar;