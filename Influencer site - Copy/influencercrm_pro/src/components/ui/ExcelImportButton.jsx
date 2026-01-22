/**
 * Enterprise Excel Import Button Component
 * Provides automated Excel/CSV file import with JSON conversion and display
 */

import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { spreadsheetService } from '../../services/spreadsheetService';
import Button from './Button';

const ExcelImportButton = ({ onDataImported, onError, className = '' }) => {
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState('idle'); // idle, success, error
  const [statusMessage, setStatusMessage] = useState('');
  const fileInputRef = useRef(null);

  /**
   * Handle file selection and import process
   */
  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsImporting(true);
    setImportStatus('idle');
    setStatusMessage('Processing file...');

    try {
      // Parse the Excel/CSV file
      const result = await spreadsheetService.parseExcelFile(file);

      if (result.success) {
        // Validate data
        if (!result.data || result.data.length === 0) {
          throw new Error('The file appears to be empty or contains no valid data');
        }

        // Attempt to open in system Excel (background operation)
        const excelResult = await spreadsheetService.openInSystemExcel(file);
        
        // Set success status
        setImportStatus('success');
        setStatusMessage(`Successfully imported ${result.metadata.rowCount} rows from ${result.metadata.fileName}`);
        
        // Call parent callback with data
        if (onDataImported) {
          onDataImported({
            data: result.data,
            headers: result.headers,
            metadata: result.metadata,
            systemExcelOpened: excelResult.success
          });
        }

      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      console.error('Excel import error:', error);
      setImportStatus('error');
      setStatusMessage(error.message || 'Failed to import Excel file');
      
      if (onError) {
        onError(error);
      }
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  /**
   * Trigger file selection dialog
   */
  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  /**
   * Handle drag and drop
   */
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      // Validate file type
      const extension = '.' + file.name.split('.').pop().toLowerCase();
      if (['.xlsx', '.xls', '.csv'].includes(extension)) {
        // Create synthetic event for file selection
        const syntheticEvent = { target: { files: [file] } };
        handleFileSelect(syntheticEvent);
      } else {
        setImportStatus('error');
        setStatusMessage('Please upload a valid Excel or CSV file (.xlsx, .xls, .csv)');
      }
    }
  };

  return (
    <div className={`excel-import-button ${className}`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Upload Excel or CSV file"
      />

      {/* Import button */}
      <Button
        onClick={triggerFileSelect}
        disabled={isImporting}
        className="relative overflow-hidden group"
        variant="outline"
        size="sm"
      >
        {isImporting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Importing...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            Open / Import Excel
          </>
        )}
      </Button>

      {/* Status indicator */}
      {importStatus !== 'idle' && (
        <div className={`mt-2 p-3 rounded-md flex items-start space-x-2 text-sm ${
          importStatus === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {importStatus === 'success' ? (
            <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          )}
          <span className="flex-1">{statusMessage}</span>
        </div>
      )}

      {/* Drag and drop overlay */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="hidden"
      />
    </div>
  );
};

export default ExcelImportButton;
