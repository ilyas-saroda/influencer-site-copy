import React, { useState, useRef, useEffect } from 'react';
import { Edit2, Check, X, Loader2 } from 'lucide-react';
import { creatorService } from '../../../services/creatorService';

// Text-heavy columns that need expansion
const TEXT_HEAVY_COLUMNS = ['name', 'city', 'state', 'sheet_source'];

const EditableCell = ({ 
  value, 
  creatorId, 
  field, 
  type = 'text', 
  options = [], 
  onUpdate,
  className = '',
  placeholder = 'N/A'
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const cellRef = useRef(null);

  const isTextHeavy = TEXT_HEAVY_COLUMNS.includes(field);
  const shouldExpand = isEditing && isTextHeavy;

  useEffect(() => {
    setEditValue(value || '');
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
      
      // Expand cell for all columns during edit - Excel-like behavior
      if (cellRef.current) {
        cellRef.current.style.minWidth = '150px';
        cellRef.current.style.width = 'auto';
        cellRef.current.style.position = 'relative';
        cellRef.current.style.zIndex = '50';
      }
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    if (!isEditing) {
      setIsEditing(true);
      setError(null);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const validateField = (fieldType, fieldValue) => {
    switch (fieldType) {
      case 'email':
        if (fieldValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fieldValue)) {
          return 'Please enter a valid email address';
        }
        break;
      case 'whatsapp':
        if (fieldValue && !/^[\d\s,+-]+$/.test(fieldValue)) {
          return 'Please enter valid phone numbers (digits, spaces, commas, +, - only)';
        }
        break;
      case 'url':
        if (fieldValue && !/^https?:\/\/.+/i.test(fieldValue)) {
          return 'Please enter a valid URL starting with http:// or https://';
        }
        break;
      default:
        break;
    }
    return null;
  };

  const handleSave = async () => {
    const validationError = validateField(type, editValue);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Check if value actually changed
    if (editValue === (value || '')) {
      setIsEditing(false);
      resetCellWidth();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const updateData = { [field]: editValue || null };
      const updatedCreator = await creatorService.updateCreator(creatorId, updateData);
      
      if (updatedCreator) {
        onUpdate(updatedCreator);
        setIsEditing(false);
        resetCellWidth();
      }
    } catch (err) {
      console.error('Error updating creator:', err);
      setError(err.message || 'Failed to update field');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value || '');
    setIsEditing(false);
    setError(null);
    resetCellWidth();
  };

  const resetCellWidth = () => {
    if (cellRef.current) {
      cellRef.current.style.minWidth = '';
      cellRef.current.style.width = '';
      cellRef.current.style.position = '';
      cellRef.current.style.zIndex = '';
    }
  };

  const renderInput = () => {
    const baseInputClasses = `
      w-full px-2 py-1 text-sm bg-white border border-blue-500
      focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-600
      ${error ? 'border-2 border-red-400 bg-red-50' : ''}
    `;

    // Add safety check for options
    const safeOptions = Array.isArray(options) ? options : [];

    const inputElement = (() => {
      switch (type) {
        case 'select':
          return (
            <select
              ref={inputRef}
              value={editValue || ''}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className={baseInputClasses}
              disabled={isLoading}
            >
              <option value="">Select...</option>
              {safeOptions.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          );
        
        case 'email':
          return (
            <input
              ref={inputRef}
              type="email"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className={baseInputClasses}
              disabled={isLoading}
              placeholder="email@example.com"
            />
          );
        
        case 'url':
          return (
            <input
              ref={inputRef}
              type="url"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className={baseInputClasses}
              disabled={isLoading}
              placeholder="https://..."
            />
          );
        
        case 'whatsapp':
          return (
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className={baseInputClasses}
              disabled={isLoading}
              placeholder="+1234567890, +0987654321"
              style={{ paddingLeft: '8px', paddingRight: '8px' }}
            />
          );
        
        default:
          return (
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className={baseInputClasses}
              disabled={isLoading}
              placeholder={placeholder}
            />
          );
      }
    })();

    return inputElement;
  };

  const renderDisplayValue = () => {
    if (type === 'url' && value && value !== 'N/A') {
      return (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline truncate block"
          title={value}
        >
          {value}
        </a>
      );
    }
    
    const displayValue = value || placeholder;
    return (
      <span 
        className={`truncate block ${value === 'N/A' || !value ? 'text-gray-400' : ''}`}
        title={displayValue}
      >
        {displayValue}
      </span>
    );
  };

  return (
    <div 
      ref={cellRef}
      className={`relative group flex items-center ${className} ${isEditing ? 'min-w-[150px] w-auto z-50' : ''}`}
      onDoubleClick={handleDoubleClick}
      style={{
        position: isEditing ? 'relative' : 'static',
        zIndex: isEditing ? 50 : 'auto'
      }}
    >
      {isEditing ? (
        // Excel-like inline editing - clean flex layout
        <div className="flex items-center gap-2 w-full min-w-[150px]">
          <div className="flex-1 min-w-[100px]">
            {renderInput()}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            ) : (
              <>
                <button
                  onClick={handleSave}
                  className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors flex-shrink-0"
                  title="Save (Enter)"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  onClick={handleCancel}
                  className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                  title="Cancel (Escape)"
                >
                  <X className="w-3 h-3" />
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            {renderDisplayValue()}
          </div>
          {!isEditing && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDoubleClick();
              }}
              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              title="Double-click or click to edit"
            >
              <Edit2 className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
      
      {error && (
        <div className="absolute top-full left-0 right-0 mt-1 p-1 bg-red-50 border border-red-200 rounded text-xs text-red-600 z-10">
          {error}
        </div>
      )}
    </div>
  );
};

export default EditableCell;
