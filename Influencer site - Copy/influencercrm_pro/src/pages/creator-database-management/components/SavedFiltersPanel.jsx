import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const SavedFiltersPanel = ({ onApplyFilter, currentFilters }) => {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [savedFilters, setSavedFilters] = useState([
    {
      id: 1,
      name: 'Top Fashion Influencers',
      filters: { category: ['fashion'], followers: ['100k-500k'], engagement: ['5-10'] },
      count: 45,
      lastUsed: '2025-12-15'
    },
    {
      id: 2,
      name: 'Mumbai Beauty Creators',
      filters: { category: ['beauty'], city: ['mumbai'], status: ['active'] },
      count: 32,
      lastUsed: '2025-12-14'
    },
    {
      id: 3,
      name: 'High Engagement All Cities',
      filters: { engagement: ['10+'], status: ['active'] },
      count: 56,
      lastUsed: '2025-12-12'
    }
  ]);

  const handleSaveFilter = () => {
    if (filterName?.trim()) {
      const newFilter = {
        id: Date.now(),
        name: filterName,
        filters: currentFilters,
        count: 0,
        lastUsed: new Date()?.toISOString()?.split('T')?.[0]
      };
      setSavedFilters([newFilter, ...savedFilters]);
      setFilterName('');
      setShowSaveDialog(false);
    }
  };

  const handleDeleteFilter = (filterId) => {
    setSavedFilters(savedFilters?.filter(f => f?.id !== filterId));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date?.getDate()?.toString()?.padStart(2, '0');
    const month = (date?.getMonth() + 1)?.toString()?.padStart(2, '0');
    const year = date?.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon name="Star" size={18} color="var(--color-primary)" />
          <h3 className="text-sm font-semibold text-foreground">Saved Filters</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSaveDialog(true)}
          iconName="Plus"
          iconPosition="left"
          iconSize={14}
        >
          Save Current
        </Button>
      </div>
      {showSaveDialog && (
        <div className="mb-4 p-3 bg-muted/30 rounded-md border border-border">
          <Input
            label="Filter Name"
            type="text"
            placeholder="e.g., Top Fashion Influencers"
            value={filterName}
            onChange={(e) => setFilterName(e?.target?.value)}
            className="mb-3"
          />
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={handleSaveFilter}
              iconName="Save"
              iconPosition="left"
              iconSize={14}
            >
              Save Filter
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSaveDialog(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {savedFilters?.length === 0 ? (
          <div className="text-center py-6">
            <Icon name="Inbox" size={32} color="var(--color-muted-foreground)" className="mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No saved filters yet</p>
          </div>
        ) : (
          savedFilters?.map((filter) => (
            <div
              key={filter?.id}
              className="p-3 bg-muted/30 rounded-md border border-border hover:border-primary transition-colors duration-200 cursor-pointer"
              onClick={() => onApplyFilter(filter?.filters)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">
                    {filter?.name}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {filter?.count} creators • Last used {formatDate(filter?.lastUsed)}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e?.stopPropagation();
                    handleDeleteFilter(filter?.id);
                  }}
                  className="flex-shrink-0 p-1 hover:bg-error/10 rounded transition-colors duration-200"
                  aria-label="Delete filter"
                >
                  <Icon name="Trash2" size={14} color="var(--color-error)" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {Object.entries(filter?.filters)?.map(([key, values]) =>
                  values?.map((value, idx) => (
                    <span
                      key={`${key}-${idx}`}
                      className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                    >
                      {value}
                    </span>
                  ))
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SavedFiltersPanel;