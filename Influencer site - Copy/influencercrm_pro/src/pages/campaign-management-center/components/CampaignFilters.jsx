import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';

const CampaignFilters = ({ onFilterChange, activeCounts }) => {
  const [filters, setFilters] = useState({
    status: [],
    brand: '',
    dateRange: { start: '', end: '' },
    budgetRange: { min: '', max: '' },
    creatorCount: { min: '', max: '' }
  });

  const [isExpanded, setIsExpanded] = useState({
    status: true,
    brand: true,
    date: false,
    budget: false,
    creators: false
  });

  const statusOptions = [
    { value: 'planning', label: 'Planning', count: activeCounts?.planning || 8, color: 'bg-secondary' },
    { value: 'active', label: 'Active', count: activeCounts?.active || 15, color: 'bg-success' },
    { value: 'completed', label: 'Completed', count: activeCounts?.completed || 42, color: 'bg-primary' },
    { value: 'paused', label: 'Paused', count: activeCounts?.paused || 3, color: 'bg-warning' }
  ];

  const brandOptions = [
    { value: '', label: 'All Brands' },
    { value: 'fashion-nova', label: 'Fashion Nova' },
    { value: 'myntra', label: 'Myntra' },
    { value: 'nykaa', label: 'Nykaa' },
    { value: 'boat', label: 'boAt Lifestyle' },
    { value: 'mamaearth', label: 'Mamaearth' }
  ];

  const toggleSection = (section) => {
    setIsExpanded(prev => ({ ...prev, [section]: !prev?.[section] }));
  };

  const handleStatusChange = (status) => {
    const newStatus = filters?.status?.includes(status)
      ? filters?.status?.filter(s => s !== status)
      : [...filters?.status, status];
    
    const newFilters = { ...filters, status: newStatus };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleBrandChange = (value) => {
    const newFilters = { ...filters, brand: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleDateChange = (field, value) => {
    const newFilters = {
      ...filters,
      dateRange: { ...filters?.dateRange, [field]: value }
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleBudgetChange = (field, value) => {
    const newFilters = {
      ...filters,
      budgetRange: { ...filters?.budgetRange, [field]: value }
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleCreatorCountChange = (field, value) => {
    const newFilters = {
      ...filters,
      creatorCount: { ...filters?.creatorCount, [field]: value }
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      status: [],
      brand: '',
      dateRange: { start: '', end: '' },
      budgetRange: { min: '', max: '' },
      creatorCount: { min: '', max: '' }
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const activeFilterCount = 
    filters?.status?.length +
    (filters?.brand ? 1 : 0) +
    (filters?.dateRange?.start || filters?.dateRange?.end ? 1 : 0) +
    (filters?.budgetRange?.min || filters?.budgetRange?.max ? 1 : 0) +
    (filters?.creatorCount?.min || filters?.creatorCount?.max ? 1 : 0);

  return (
    <div className="h-full bg-card border-r border-border overflow-y-auto custom-scrollbar">
      <div className="sticky top-0 bg-card border-b border-border z-10 p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Icon name="Filter" size={20} />
            Filters
          </h2>
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary">
              {activeFilterCount}
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            iconName="X"
            iconPosition="left"
            className="w-full"
          >
            Clear All Filters
          </Button>
        )}
      </div>
      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <button
            onClick={() => toggleSection('status')}
            className="w-full flex items-center justify-between text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            <span>Campaign Status</span>
            <Icon
              name={isExpanded?.status ? 'ChevronUp' : 'ChevronDown'}
              size={16}
            />
          </button>
          {isExpanded?.status && (
            <div className="space-y-2 pt-2">
              {statusOptions?.map((status) => (
                <div
                  key={status?.value}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-muted transition-colors"
                >
                  <Checkbox
                    label={status?.label}
                    checked={filters?.status?.includes(status?.value)}
                    onChange={() => handleStatusChange(status?.value)}
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{status?.count}</span>
                    <div className={`w-2 h-2 rounded-full ${status?.color}`} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="h-px bg-border" />

        <div className="space-y-2">
          <button
            onClick={() => toggleSection('brand')}
            className="w-full flex items-center justify-between text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            <span>Brand</span>
            <Icon
              name={isExpanded?.brand ? 'ChevronUp' : 'ChevronDown'}
              size={16}
            />
          </button>
          {isExpanded?.brand && (
            <div className="pt-2">
              <Select
                options={brandOptions}
                value={filters?.brand}
                onChange={handleBrandChange}
                placeholder="Select brand"
              />
            </div>
          )}
        </div>

        <div className="h-px bg-border" />

        <div className="space-y-2">
          <button
            onClick={() => toggleSection('date')}
            className="w-full flex items-center justify-between text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            <span>Date Range</span>
            <Icon
              name={isExpanded?.date ? 'ChevronUp' : 'ChevronDown'}
              size={16}
            />
          </button>
          {isExpanded?.date && (
            <div className="space-y-2 pt-2">
              <Input
                type="date"
                label="Start Date"
                value={filters?.dateRange?.start}
                onChange={(e) => handleDateChange('start', e?.target?.value)}
              />
              <Input
                type="date"
                label="End Date"
                value={filters?.dateRange?.end}
                onChange={(e) => handleDateChange('end', e?.target?.value)}
              />
            </div>
          )}
        </div>

        <div className="h-px bg-border" />

        <div className="space-y-2">
          <button
            onClick={() => toggleSection('budget')}
            className="w-full flex items-center justify-between text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            <span>Budget Range (₹)</span>
            <Icon
              name={isExpanded?.budget ? 'ChevronUp' : 'ChevronDown'}
              size={16}
            />
          </button>
          {isExpanded?.budget && (
            <div className="space-y-2 pt-2">
              <Input
                type="number"
                label="Min Budget"
                placeholder="0"
                value={filters?.budgetRange?.min}
                onChange={(e) => handleBudgetChange('min', e?.target?.value)}
              />
              <Input
                type="number"
                label="Max Budget"
                placeholder="1000000"
                value={filters?.budgetRange?.max}
                onChange={(e) => handleBudgetChange('max', e?.target?.value)}
              />
            </div>
          )}
        </div>

        <div className="h-px bg-border" />

        <div className="space-y-2">
          <button
            onClick={() => toggleSection('creators')}
            className="w-full flex items-center justify-between text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            <span>Creator Count</span>
            <Icon
              name={isExpanded?.creators ? 'ChevronUp' : 'ChevronDown'}
              size={16}
            />
          </button>
          {isExpanded?.creators && (
            <div className="space-y-2 pt-2">
              <Input
                type="number"
                label="Min Creators"
                placeholder="0"
                value={filters?.creatorCount?.min}
                onChange={(e) => handleCreatorCountChange('min', e?.target?.value)}
              />
              <Input
                type="number"
                label="Max Creators"
                placeholder="50"
                value={filters?.creatorCount?.max}
                onChange={(e) => handleCreatorCountChange('max', e?.target?.value)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampaignFilters;