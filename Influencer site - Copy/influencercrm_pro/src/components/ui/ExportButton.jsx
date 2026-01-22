/**
 * Enterprise Export Button Component
 * Provides comprehensive export functionality with format selection
 * Supports CSV, Excel, JSON, and PDF export formats
 */

import React, { useState, useRef } from 'react';
import { Download, ChevronDown, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { exportService } from '../../services/exportService';
import Button from './Button';

const ExportButton = ({ 
  data, 
  headers, 
  metadata = {},
  onExportComplete,
  onError,
  className = '',
  disabled = false,
  size = 'sm',
  variant = 'outline'
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [showFormatMenu, setShowFormatMenu] = useState(false);
  const [exportProgress, setExportProgress] = useState(null);
  const [exportStatus, setExportStatus] = useState('idle'); // idle, success, error
  const [statusMessage, setStatusMessage] = useState('');
  const menuRef = useRef(null);

  /**
   * Handle export with selected format
   */
  const handleExport = async (format) => {
    if (!data || data.length === 0) {
      setExportStatus('error');
      setStatusMessage('No data available for export');
      return;
    }

    setIsExporting(true);
    setExportStatus('idle');
    setShowFormatMenu(false);
    setExportProgress({ progress: 0, message: 'Preparing export...' });

    try {
      // Validate data
      const validation = exportService.validateExportData(data, headers);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Generate filename based on metadata
      const baseFilename = metadata.fileName 
        ? metadata.fileName.replace(/\.[^/.]+$/, '') // Remove extension
        : `spreadsheet_export_${new Date().toISOString().split('T')[0]}`;

      const options = {
        filename: `${baseFilename}.${format}`,
        title: metadata.sheetName || 'Spreadsheet Export',
        sheetName: metadata.sheetName || 'Export Data',
        includeMetadata: true
      };

      // Export with progress tracking
      const result = await exportService.exportWithProgress(
        data, 
        headers, 
        format, 
        options,
        (progress) => setExportProgress(progress)
      );

      if (result.success) {
        setExportStatus('success');
        setStatusMessage(`Successfully exported ${result.rowCount} rows to ${format.toUpperCase()}`);
        setExportProgress(null);
        
        if (onExportComplete) {
          onExportComplete(result);
        }
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      console.error('Export error:', error);
      setExportStatus('error');
      setStatusMessage(error.message || 'Export failed');
      setExportProgress(null);
      
      if (onError) {
        onError(error);
      }
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Close format menu when clicking outside
   */
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowFormatMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * Get supported formats
   */
  const supportedFormats = exportService.getSupportedFormats();

  return (
    <div className={`export-button ${className}`}>
      {/* Export button */}
      <div className="relative">
        <Button
          onClick={() => !isExporting && setShowFormatMenu(!showFormatMenu)}
          disabled={disabled || isExporting}
          variant={variant}
          size={size}
          className="flex items-center space-x-2"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Exporting...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Export</span>
              <ChevronDown className="w-4 h-4" />
            </>
          )}
        </Button>

        {/* Format selection menu */}
        {showFormatMenu && !isExporting && (
          <div
            ref={menuRef}
            className="absolute top-full left-0 mt-1 z-50 bg-white rounded-lg shadow-lg border border-gray-200 min-w-48"
          >
            <div className="py-1">
              {supportedFormats.map((format) => (
                <button
                  key={format.value}
                  onClick={() => handleExport(format.value)}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors flex items-start space-x-3"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{format.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{format.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Export progress indicator */}
      {exportProgress && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2 text-sm text-blue-800">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{exportProgress.message}</span>
          </div>
          <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${exportProgress.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Status indicator */}
      {exportStatus !== 'idle' && !exportProgress && (
        <div className={`mt-2 p-3 rounded-md flex items-start space-x-2 text-sm ${
          exportStatus === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {exportStatus === 'success' ? (
            <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          )}
          <span className="flex-1">{statusMessage}</span>
        </div>
      )}

      {/* Export info */}
      {data && data.length > 0 && !isExporting && (
        <div className="mt-2 text-xs text-gray-500">
          Ready to export {data.length.toLocaleString()} rows × {headers.length} columns
        </div>
      )}
    </div>
  );
};

export default ExportButton;
