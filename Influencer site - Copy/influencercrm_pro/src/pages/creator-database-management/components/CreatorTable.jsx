import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import EditCreatorModal from './EditCreatorModal';
import EditableCell from './EditableCell';
import { TableSkeleton } from '../../../components/ui/SkeletonLoader';

const CreatorTable = ({ creators, selectedCreators, onSelectionChange, onSort, sortConfig, userRole, onCreatorUpdated, loading = false }) => {
  const navigate = useNavigate();
  const [editingCell, setEditingCell] = useState(null);
  const [editingCreator, setEditingCreator] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Show skeleton loader while loading
  if (loading) {
    return (
      <div className="overflow-x-auto table-container">
        <TableSkeleton rows={10} columns={13} className="min-w-[1400px]" />
      </div>
    );
  }

  // Define column configuration for consistency
  const COLUMN_WIDTHS = {
    checkbox: '60px',
    sr_no: '80px',
    name: '200px',
    actions: '120px'
  };

  // Memoize creators to prevent unnecessary re-renders
  const stableCreators = useMemo(() => {
    if (!creators || !Array.isArray(creators)) return [];
    return creators.filter(creator => creator && creator.id); // Filter out invalid entries
  }, [creators]);

  const handleSelectAll = (e) => {
    if (e?.target?.checked) {
      onSelectionChange(stableCreators?.map(c => c?.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectCreator = (creatorId) => {
    if (selectedCreators?.includes(creatorId)) {
      onSelectionChange(selectedCreators?.filter(id => id !== creatorId));
    } else {
      onSelectionChange([...selectedCreators, creatorId]);
    }
  };

  const handleSort = (column) => {
    onSort(column);
  };

  const handleViewDetails = (creatorId) => {
    if (!creatorId) {
      console.error('❌ Cannot view details: creator ID is missing');
      return;
    }
    // Navigate with ID in URL for better shareability and browser history
    navigate(`/creator-profile-details/${creatorId}`);
  };

  const handleEditCreator = (creator) => {
    setEditingCreator(creator);
    setShowEditModal(true);
  };

  const handleCreatorUpdated = (updatedCreator) => {
    // Notify parent component to update the data
    onCreatorUpdated?.(updatedCreator);
    setShowEditModal(false);
    setEditingCreator(null);
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return `${(num / 1000000)?.toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000)?.toFixed(1)}K`;
    }
    return num?.toString();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const day = date?.getDate()?.toString()?.padStart(2, '0');
    const month = (date?.getMonth() + 1)?.toString()?.padStart(2, '0');
    const year = date?.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-success/10 text-success border-success/20',
      inactive: 'bg-muted text-muted-foreground border-border',
      pending: 'bg-warning/10 text-warning border-warning/20',
      blacklisted: 'bg-error/10 text-error border-error/20'
    };
    return colors?.[status] || colors?.active;
  };

  const getSyncStatusIcon = (syncStatus) => {
    if (syncStatus === 'synced') {
      return <Icon name="CheckCircle2" size={14} color="var(--color-success)" />;
    } else if (syncStatus === 'syncing') {
      return <Icon name="RefreshCw" size={14} color="var(--color-warning)" className="animate-spin" />;
    } else {
      return <Icon name="AlertCircle" size={14} color="var(--color-error)" />;
    }
  };

  const SortableHeader = ({ column, label }) => (
    <th className="px-4 py-3 text-left whitespace-nowrap">
      <button
        onClick={() => handleSort(column)}
        className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
      >
        {label}
        {sortConfig?.column === column && (
          <Icon
            name={sortConfig?.direction === 'asc' ? 'ChevronUp' : 'ChevronDown'}
            size={14}
          />
        )}
      </button>
    </th>
  );

  // Empty state
  if (!stableCreators || stableCreators.length === 0) {
    return (
      <div className="overflow-x-auto table-container">
        <table className="w-full" style={{ tableLayout: 'auto', minWidth: '1400px' }}>
          <colgroup>
            <col style={{ width: COLUMN_WIDTHS.checkbox }} />
            <col style={{ width: COLUMN_WIDTHS.sr_no }} />
            <col style={{ width: COLUMN_WIDTHS.name }} />
            <col style={{ width: '250px', minWidth: '200px' }} />
            <col style={{ width: '120px', minWidth: '100px' }} />
            <col style={{ width: '150px', minWidth: '120px' }} />
            <col style={{ width: '150px', minWidth: '120px' }} />
            <col style={{ width: '150px', minWidth: '120px' }} />
            <col style={{ width: '200px', minWidth: '150px' }} />
            <col style={{ width: '100px', minWidth: '80px' }} />
            <col style={{ width: '150px', minWidth: '120px' }} />
            <col style={{ width: '150px', minWidth: '120px' }} />
            <col style={{ width: COLUMN_WIDTHS.actions }} />
          </colgroup>
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-4 py-3 bg-white border-r border-border/50 shadow-sm" style={{ width: COLUMN_WIDTHS.checkbox }}>
                <input
                  type="checkbox"
                  disabled
                  className="w-4 h-4 rounded border-input text-primary"
                  aria-label="Select all creators"
                />
              </th>
              <th className="px-4 py-3 bg-white border-r border-border/50 shadow-sm" style={{ width: COLUMN_WIDTHS.sr_no }}>
                <button
                  onClick={() => handleSort('sr_no')}
                  className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  sr_no
                  {sortConfig?.column === 'sr_no' && (
                    <Icon
                      name={sortConfig?.direction === 'asc' ? 'ChevronUp' : 'ChevronDown'}
                      size={14}
                    />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 bg-white border-r border-border/50 shadow-sm" style={{ width: COLUMN_WIDTHS.name }}>
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  name
                  {sortConfig?.column === 'name' && (
                    <Icon
                      name={sortConfig?.direction === 'asc' ? 'ChevronUp' : 'ChevronDown'}
                      size={14}
                    />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 bg-white border-r border-border/50 shadow-sm">
                <button
                  onClick={() => handleSort('instagram_link')}
                  className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  instagram_link
                  {sortConfig?.column === 'instagram_link' && (
                    <Icon
                      name={sortConfig?.direction === 'asc' ? 'ChevronUp' : 'ChevronDown'}
                      size={14}
                    />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 bg-white border-r border-border/50 shadow-sm">
                <button
                  onClick={() => handleSort('followers_tier')}
                  className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  followers_tier
                  {sortConfig?.column === 'followers_tier' && (
                    <Icon
                      name={sortConfig?.direction === 'asc' ? 'ChevronUp' : 'ChevronDown'}
                      size={14}
                    />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 bg-white border-r border-border/50 shadow-sm">
                <button
                  onClick={() => handleSort('state')}
                  className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  state
                  {sortConfig?.column === 'state' && (
                    <Icon
                      name={sortConfig?.direction === 'asc' ? 'ChevronUp' : 'ChevronDown'}
                      size={14}
                    />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 bg-white border-r border-border/50 shadow-sm">
                <button
                  onClick={() => handleSort('city')}
                  className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  city
                  {sortConfig?.column === 'city' && (
                    <Icon
                      name={sortConfig?.direction === 'asc' ? 'ChevronUp' : 'ChevronDown'}
                      size={14}
                    />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 bg-white border-r border-border/50 shadow-sm">
                <button
                  onClick={() => handleSort('whatsapp')}
                  className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  whatsapp
                  {sortConfig?.column === 'whatsapp' && (
                    <Icon
                      name={sortConfig?.direction === 'asc' ? 'ChevronUp' : 'ChevronDown'}
                      size={14}
                    />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 bg-white border-r border-border/50 shadow-sm">
                <button
                  onClick={() => handleSort('email')}
                  className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  email
                  {sortConfig?.column === 'email' && (
                    <Icon
                      name={sortConfig?.direction === 'asc' ? 'ChevronUp' : 'ChevronDown'}
                      size={14}
                    />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 bg-white border-r border-border/50 shadow-sm">
                <button
                  onClick={() => handleSort('gender')}
                  className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  gender
                  {sortConfig?.column === 'gender' && (
                    <Icon
                      name={sortConfig?.direction === 'asc' ? 'ChevronUp' : 'ChevronDown'}
                      size={14}
                    />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 bg-white border-r border-border/50 shadow-sm">
                <button
                  onClick={() => handleSort('username')}
                  className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  username
                  {sortConfig?.column === 'username' && (
                    <Icon
                      name={sortConfig?.direction === 'asc' ? 'ChevronUp' : 'ChevronDown'}
                      size={14}
                    />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 bg-white border-r border-border/50 shadow-sm">
                <button
                  onClick={() => handleSort('sheet_source')}
                  className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  sheet_source
                  {sortConfig?.column === 'sheet_source' && (
                    <Icon
                      name={sortConfig?.direction === 'asc' ? 'ChevronUp' : 'ChevronDown'}
                      size={14}
                    />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 bg-white border-l border-border/50 shadow-sm">
                <span className="text-xs font-medium text-muted-foreground">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={13} className="px-4 py-12 text-center">
                <div className="flex flex-col items-center gap-2">
                  <Icon name="Users" size={32} color="var(--color-muted-foreground)" />
                  <p className="text-sm text-muted-foreground">No creators found</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto table-container">
      <table className="w-full" style={{ tableLayout: 'auto', minWidth: '1400px' }}>
        <colgroup>
          <col style={{ width: COLUMN_WIDTHS.checkbox }} />
          <col style={{ width: COLUMN_WIDTHS.sr_no }} />
          <col style={{ width: COLUMN_WIDTHS.name }} />
          <col style={{ width: '250px', minWidth: '200px' }} />
          <col style={{ width: '120px', minWidth: '100px' }} />
          <col style={{ width: '150px', minWidth: '120px' }} />
          <col style={{ width: '150px', minWidth: '120px' }} />
          <col style={{ width: '150px', minWidth: '120px' }} />
          <col style={{ width: '200px', minWidth: '150px' }} />
          <col style={{ width: '100px', minWidth: '80px' }} />
          <col style={{ width: '150px', minWidth: '120px' }} />
          <col style={{ width: '150px', minWidth: '120px' }} />
          <col style={{ width: COLUMN_WIDTHS.actions }} />
        </colgroup>
        <thead className="bg-muted/50 border-b border-border">
          <tr>
            <th className="px-4 py-3 bg-white border-r border-border/50 shadow-sm" style={{ width: COLUMN_WIDTHS.checkbox }}>
              <input
                type="checkbox"
                checked={selectedCreators?.length === stableCreators?.length && stableCreators?.length > 0}
                onChange={handleSelectAll}
                className="w-4 h-4 rounded border-input text-primary focus:ring-2 focus:ring-ring"
                aria-label="Select all creators"
              />
            </th>
            <th className="px-4 py-3 bg-white border-r border-border/50 shadow-sm" style={{ width: COLUMN_WIDTHS.sr_no }}>
              <button
                onClick={() => handleSort('sr_no')}
                className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                sr_no
                {sortConfig?.column === 'sr_no' && (
                  <Icon
                    name={sortConfig?.direction === 'asc' ? 'ChevronUp' : 'ChevronDown'}
                    size={14}
                  />
                )}
              </button>
            </th>
            <th className="px-4 py-3 bg-white border-r border-border/50 shadow-sm" style={{ width: COLUMN_WIDTHS.name }}>
              <button
                onClick={() => handleSort('name')}
                className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                name
                {sortConfig?.column === 'name' && (
                  <Icon
                    name={sortConfig?.direction === 'asc' ? 'ChevronUp' : 'ChevronDown'}
                    size={14}
                  />
                )}
              </button>
            </th>
            <th className="px-4 py-3 bg-white border-r border-border/50 shadow-sm">
              <button
                onClick={() => handleSort('instagram_link')}
                className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                instagram_link
                {sortConfig?.column === 'instagram_link' && (
                  <Icon
                    name={sortConfig?.direction === 'asc' ? 'ChevronUp' : 'ChevronDown'}
                    size={14}
                  />
                )}
              </button>
            </th>
            <th className="px-4 py-3 bg-white border-r border-border/50 shadow-sm">
              <button
                onClick={() => handleSort('followers_tier')}
                className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                followers_tier
                {sortConfig?.column === 'followers_tier' && (
                  <Icon
                    name={sortConfig?.direction === 'asc' ? 'ChevronUp' : 'ChevronDown'}
                    size={14}
                  />
                )}
              </button>
            </th>
            <th className="px-4 py-3 bg-white border-r border-border/50 shadow-sm">
              <button
                onClick={() => handleSort('state')}
                className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                state
                {sortConfig?.column === 'state' && (
                  <Icon
                    name={sortConfig?.direction === 'asc' ? 'ChevronUp' : 'ChevronDown'}
                    size={14}
                  />
                )}
              </button>
            </th>
            <th className="px-4 py-3 bg-white border-r border-border/50 shadow-sm">
              <button
                onClick={() => handleSort('city')}
                className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                city
                {sortConfig?.column === 'city' && (
                  <Icon
                    name={sortConfig?.direction === 'asc' ? 'ChevronUp' : 'ChevronDown'}
                    size={14}
                  />
                )}
              </button>
            </th>
            <th className="px-4 py-3 bg-white border-r border-border/50 shadow-sm">
              <button
                onClick={() => handleSort('whatsapp')}
                className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                whatsapp
                {sortConfig?.column === 'whatsapp' && (
                  <Icon
                    name={sortConfig?.direction === 'asc' ? 'ChevronUp' : 'ChevronDown'}
                    size={14}
                  />
                )}
              </button>
            </th>
            <th className="px-4 py-3 bg-white border-r border-border/50 shadow-sm">
              <button
                onClick={() => handleSort('email')}
                className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                email
                {sortConfig?.column === 'email' && (
                  <Icon
                    name={sortConfig?.direction === 'asc' ? 'ChevronUp' : 'ChevronDown'}
                    size={14}
                  />
                )}
              </button>
            </th>
            <th className="px-4 py-3 bg-white border-r border-border/50 shadow-sm">
              <button
                onClick={() => handleSort('gender')}
                className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                gender
                {sortConfig?.column === 'gender' && (
                  <Icon
                    name={sortConfig?.direction === 'asc' ? 'ChevronUp' : 'ChevronDown'}
                    size={14}
                  />
                )}
              </button>
            </th>
            <th className="px-4 py-3 bg-white border-r border-border/50 shadow-sm">
              <button
                onClick={() => handleSort('username')}
                className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                username
                {sortConfig?.column === 'username' && (
                  <Icon
                    name={sortConfig?.direction === 'asc' ? 'ChevronUp' : 'ChevronDown'}
                    size={14}
                  />
                )}
              </button>
            </th>
            <th className="px-4 py-3 bg-white border-r border-border/50 shadow-sm">
              <button
                onClick={() => handleSort('sheet_source')}
                className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                sheet_source
                {sortConfig?.column === 'sheet_source' && (
                  <Icon
                    name={sortConfig?.direction === 'asc' ? 'ChevronUp' : 'ChevronDown'}
                    size={14}
                  />
                )}
              </button>
            </th>
            <th className="px-4 py-3 bg-white border-l border-border/50 shadow-sm">
              <span className="text-xs font-medium text-muted-foreground">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {stableCreators?.map((creator, index) => {
            // Ensure stable key - use index as fallback only if id is missing
            const rowKey = creator?.id || `creator-${index}`;
            
            return (
              <tr
                key={rowKey}
                className="hover:bg-muted/30 transition-colors duration-200"
              >
                <td className="px-4 py-3 bg-white border-r border-border/50 shadow-sm" style={{ width: COLUMN_WIDTHS.checkbox }}>
                  <input
                    type="checkbox"
                    checked={selectedCreators?.includes(creator?.id)}
                    onChange={() => handleSelectCreator(creator?.id)}
                    className="w-4 h-4 rounded border-input text-primary focus:ring-2 focus:ring-ring"
                    aria-label={`Select ${creator?.name}`}
                  />
                </td>
                <td className="px-4 py-3 bg-white border-r border-border/50 shadow-sm" style={{ width: COLUMN_WIDTHS.sr_no }}>
                  <div className="text-sm text-foreground truncate">{creator?.sr_no || 'N/A'}</div>
                </td>
                <td className="px-4 py-3 bg-white border-r border-border/50 shadow-sm relative" style={{ width: COLUMN_WIDTHS.name }}>
                  <EditableCell
                    value={creator?.name}
                    creatorId={creator?.id}
                    field="name"
                    onUpdate={handleCreatorUpdated}
                    className="text-sm font-medium text-foreground truncate"
                  />
                </td>
                <td className="px-4 py-3 relative" style={{ position: 'relative' }}>
                  <EditableCell
                    value={creator?.instagram_link}
                    creatorId={creator?.id}
                    field="instagram_link"
                    type="url"
                    onUpdate={handleCreatorUpdated}
                    className="text-sm text-primary hover:underline flex items-center gap-1 truncate"
                  />
                </td>
                <td className="px-4 py-3 relative" style={{ position: 'relative' }}>
                  <EditableCell
                    value={creator?.followers_tier}
                    creatorId={creator?.id}
                    field="followers_tier"
                    onUpdate={handleCreatorUpdated}
                    className="text-sm text-foreground truncate"
                  />
                </td>
                <td className="px-4 py-3 relative" style={{ position: 'relative' }}>
                  <EditableCell
                    value={creator?.state}
                    creatorId={creator?.id}
                    field="state"
                    onUpdate={handleCreatorUpdated}
                    className="text-sm text-foreground truncate"
                  />
                </td>
                <td className="px-4 py-3 relative" style={{ position: 'relative' }}>
                  <EditableCell
                    value={creator?.city}
                    creatorId={creator?.id}
                    field="city"
                    onUpdate={handleCreatorUpdated}
                    className="text-sm text-foreground truncate"
                  />
                </td>
                <td className="px-4 py-3 relative" style={{ position: 'relative' }}>
                  <EditableCell
                    value={creator?.whatsapp}
                    creatorId={creator?.id}
                    field="whatsapp"
                    type="whatsapp"
                    onUpdate={handleCreatorUpdated}
                    className="text-sm text-foreground truncate"
                  />
                </td>
                <td className="px-4 py-3 relative" style={{ position: 'relative' }}>
                  <EditableCell
                    value={creator?.email}
                    creatorId={creator?.id}
                    field="email"
                    type="email"
                    onUpdate={handleCreatorUpdated}
                    className="text-sm text-muted-foreground truncate"
                  />
                </td>
                <td className="px-4 py-3 relative" style={{ position: 'relative' }}>
                  <EditableCell
                    value={creator?.gender}
                    creatorId={creator?.id}
                    field="gender"
                    type="select"
                    options={['Male', 'Female', 'Other']}
                    onUpdate={handleCreatorUpdated}
                    className="text-sm text-foreground capitalize truncate"
                  />
                </td>
                <td className="px-4 py-3 relative" style={{ position: 'relative' }}>
                  <EditableCell
                    value={creator?.username}
                    creatorId={creator?.id}
                    field="username"
                    onUpdate={handleCreatorUpdated}
                    className="text-sm text-foreground truncate"
                  />
                </td>
                <td className="px-4 py-3 relative" style={{ position: 'relative' }}>
                  <EditableCell
                    value={creator?.sheet_source}
                    creatorId={creator?.id}
                    field="sheet_source"
                    onUpdate={handleCreatorUpdated}
                    className="text-sm text-muted-foreground truncate"
                  />
                </td>
                <td className="px-4 py-3 sticky right-0 z-30 bg-card border-l border-border/50 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleViewDetails(creator?.id)}
                      iconName="Eye"
                      iconSize={16}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditCreator(creator)}
                      iconName="Edit"
                      iconSize={16}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      <EditCreatorModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        creator={editingCreator}
        onCreatorUpdated={handleCreatorUpdated}
      />
    </div>
  );
};

export default CreatorTable;