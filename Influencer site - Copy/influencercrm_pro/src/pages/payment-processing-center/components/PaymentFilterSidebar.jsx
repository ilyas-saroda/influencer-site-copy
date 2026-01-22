import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';

const PaymentFilterSidebar = ({ filters, onFilterChange, onClearFilters, savedPresets, onSavePreset }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [showPresetInput, setShowPresetInput] = useState(false);

  const amountRanges = [
    { value: 'all', label: 'All Amounts' },
    { value: '0-5000', label: '₹0 - ₹5,000' },
    { value: '5000-10000', label: '₹5,000 - ₹10,000' },
    { value: '10000-25000', label: '₹10,000 - ₹25,000' },
    { value: '25000-50000', label: '₹25,000 - ₹50,000' },
    { value: '50000+', label: '₹50,000+' }
  ];

  const paymentMethods = [
    { value: 'all', label: 'All Methods' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'upi', label: 'UPI' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'cash', label: 'Cash' },
    { value: 'wallet', label: 'Digital Wallet' }
  ];

  const creators = [
    { value: 'all', label: 'All Creators' },
    { value: 'sarah_johnson', label: 'Sarah Johnson' },
    { value: 'priya_sharma', label: 'Priya Sharma' },
    { value: 'rahul_verma', label: 'Rahul Verma' },
    { value: 'ananya_patel', label: 'Ananya Patel' },
    { value: 'vikram_singh', label: 'Vikram Singh' }
  ];

  const handleSavePreset = () => {
    if (presetName?.trim()) {
      onSavePreset(presetName, filters);
      setPresetName('');
      setShowPresetInput(false);
    }
  };

  return (
    <div className={`bg-card border-r border-border transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-80'} flex-shrink-0`}>
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <Icon name="Filter" size={20} color="var(--color-primary)" />
              <h3 className="font-semibold text-foreground">Filters</h3>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-md hover:bg-muted transition-colors duration-200"
            aria-label={isCollapsed ? 'Expand filters' : 'Collapse filters'}
          >
            <Icon name={isCollapsed ? 'ChevronRight' : 'ChevronLeft'} size={20} />
          </button>
        </div>

        {!isCollapsed && (
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Amount Range
              </label>
              <Select
                options={amountRanges}
                value={filters?.amountRange}
                onChange={(value) => onFilterChange('amountRange', value)}
                placeholder="Select range"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Payment Method
              </label>
              <Select
                options={paymentMethods}
                value={filters?.paymentMethod}
                onChange={(value) => onFilterChange('paymentMethod', value)}
                placeholder="Select method"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Creator
              </label>
              <Select
                options={creators}
                value={filters?.creator}
                onChange={(value) => onFilterChange('creator', value)}
                placeholder="Select creator"
                searchable
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Date Range
              </label>
              <div className="space-y-2">
                <Input
                  type="date"
                  label="From"
                  value={filters?.dateFrom}
                  onChange={(e) => onFilterChange('dateFrom', e?.target?.value)}
                />
                <Input
                  type="date"
                  label="To"
                  value={filters?.dateTo}
                  onChange={(e) => onFilterChange('dateTo', e?.target?.value)}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <h4 className="text-sm font-medium text-foreground mb-3">Saved Presets</h4>
              {savedPresets?.length > 0 ? (
                <div className="space-y-2">
                  {savedPresets?.map((preset, index) => (
                    <button
                      key={index}
                      onClick={() => onFilterChange('preset', preset)}
                      className="w-full flex items-center justify-between p-2 rounded-md hover:bg-muted transition-colors duration-200 text-left"
                    >
                      <span className="text-sm text-foreground">{preset?.name}</span>
                      <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No saved presets</p>
              )}

              {showPresetInput ? (
                <div className="mt-3 space-y-2">
                  <Input
                    type="text"
                    placeholder="Preset name"
                    value={presetName}
                    onChange={(e) => setPresetName(e?.target?.value)}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSavePreset}
                      fullWidth
                    >
                      Save
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowPresetInput(false);
                        setPresetName('');
                      }}
                      fullWidth
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  iconName="Plus"
                  iconPosition="left"
                  onClick={() => setShowPresetInput(true)}
                  fullWidth
                  className="mt-3"
                >
                  Save Current Filters
                </Button>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              iconName="X"
              iconPosition="left"
              onClick={onClearFilters}
              fullWidth
            >
              Clear All Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentFilterSidebar;