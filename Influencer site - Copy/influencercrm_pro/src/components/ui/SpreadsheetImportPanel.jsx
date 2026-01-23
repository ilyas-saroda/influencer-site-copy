/**
 * Enterprise Spreadsheet Import Panel Component
 * Combines Excel and Google Sheets import functionality with data display
 * Provides unified interface for all spreadsheet import operations
 */

import React, { useState, useCallback } from 'react';
import { X, FileSpreadsheet, Database, AlertCircle } from 'lucide-react';
import SpreadsheetDataTable from './SpreadsheetDataTable';
import Button from './Button';

const SpreadsheetImportPanel = ({ 
  isOpen, 
  onClose, 
  onDataImported,
  className = '',
  title = 'Spreadsheet Import Center'
}) => {
  const [importedData, setImportedData] = useState(null);
  const [activeTab, setActiveTab] = useState('excel'); // excel, google, preview
  const [importError, setImportError] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

  /**
   * Handle successful data import
   */
  const handleDataImported = useCallback((result) => {
    if (!result || !result.data) {
      setImportError('Invalid data format received');
      return;
    }
    
    setImportedData(result);
    setActiveTab('preview');
    setImportError(null);
    setIsImporting(false);
    
    if (onDataImported) {
      onDataImported(result);
    }
  }, [onDataImported]);

  /**
   * Handle import errors
   */
  const handleImportError = useCallback((error) => {
    console.error('Import error:', error);
    setImportError(error?.message || 'Failed to import data');
    setIsImporting(false);
  }, []);

  /**
   * Reset import state
   */
  const resetImport = useCallback(() => {
    setImportedData(null);
    setActiveTab('excel');
    setImportError(null);
    setIsImporting(false);
  }, []);

  /**
   * Close panel and reset state
   */
  const handleClose = () => {
    resetImport();
    if (onClose) {
      onClose();
    }
  };

  if (!isOpen) return null;

  // Fallback component for missing ExcelImportButton
  const ExcelImportFallback = () => (
    <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
      <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Excel Import Coming Soon</h3>
      <p className="text-gray-600 mb-4">Excel import functionality is currently under development.</p>
      <Button 
        onClick={() => setImportError('Excel import not yet implemented')}
        variant="outline"
        disabled
      >
        Import Excel File
      </Button>
    </div>
  );

  // Fallback component for missing GoogleSheetsImportButton
  const GoogleSheetsImportFallback = () => (
    <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
      <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Google Sheets Import Coming Soon</h3>
      <p className="text-gray-600 mb-4">Google Sheets import functionality is currently under development.</p>
      <Button 
        onClick={() => setImportError('Google Sheets import not yet implemented')}
        variant="outline"
        disabled
      >
        Connect to Google Sheets
      </Button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />
      
      {/* Panel */}
      <div className="absolute inset-4 md:inset-8 bg-white rounded-lg shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileSpreadsheet className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
              <p className="text-sm text-gray-600">Import data from Excel, CSV, or Google Sheets</p>
            </div>
          </div>
          
          <Button
            onClick={handleClose}
            variant="ghost"
            size="sm"
            className="p-2"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-gray-200 bg-white">
          <button
            onClick={() => setActiveTab('excel')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'excel'
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            Excel / CSV Import
          </button>
          
          <button
            onClick={() => setActiveTab('google')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'google'
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            Google Sheets Import
          </button>
          
          {importedData?.data && (
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'preview'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Data Preview
              <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                {importedData.data.length} rows
              </span>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {/* Error Display */}
          {importError && (
            <div className="m-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-red-900">Import Error</h4>
                  <p className="text-sm text-red-700 mt-1">{importError}</p>
                </div>
                <Button
                  onClick={() => setImportError(null)}
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
          {/* Excel/CSV Import Tab */}
          {activeTab === 'excel' && (
            <div className="p-6 h-full overflow-y-auto">
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="text-center space-y-4">
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <FileSpreadsheet className="w-8 h-8 text-green-600" />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Import Excel or CSV File</h3>
                    <p className="text-gray-600 mt-1">
                      Upload your spreadsheet file to automatically convert it to JSON and display it in a table.
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Supported Features:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Excel files (.xlsx, .xls) and CSV files</li>
                    <li>• Automatic data type detection and formatting</li>
                    <li>• First row used as column headers</li>
                    <li>• Large file support (up to 50MB)</li>
                    <li>• Automatic system Excel opening attempt</li>
                  </ul>
                </div>

                <div className="flex justify-center">
                  <ExcelImportFallback />
                </div>

                <div className="text-xs text-gray-500 text-center">
                  <p>Files are processed locally in your browser. No data is sent to external servers.</p>
                </div>
              </div>
            </div>
          )}

          {/* Google Sheets Import Tab */}
          {activeTab === 'google' && (
            <div className="p-6 h-full overflow-y-auto">
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="text-center space-y-4">
                  <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <Database className="w-8 h-8 text-blue-600" />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Import Google Sheets</h3>
                    <p className="text-gray-600 mt-1">
                      Connect to a Google Sheet to automatically fetch and display its data.
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Requirements:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Google Sheet must be publicly accessible or published</li>
                    <li>• Use "Publish to web" feature for private sheets</li>
                    <li>• Supports entire document or specific sheets</li>
                    <li>• Real-time data fetching from Google</li>
                  </ul>
                </div>

                <div className="flex justify-center">
                  <GoogleSheetsImportFallback />
                </div>

                <div className="text-xs text-gray-500 text-center">
                  <p>Google Sheets data is fetched directly from Google's servers.</p>
                </div>
              </div>
            </div>
          )}

          {/* Data Preview Tab */}
          {activeTab === 'preview' && importedData?.data && (
            <div className="h-full flex flex-col">
              <div className="flex-1 overflow-hidden">
                <SpreadsheetDataTable
                  data={importedData.data || []}
                  headers={importedData.headers || []}
                  metadata={importedData.metadata || {}}
                  className="h-full"
                  maxHeight="none"
                />
              </div>
              
              <div className="border-t border-gray-200 p-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {importedData?.metadata && (
                      <span>
                        Source: {importedData.metadata.fileType || importedData.metadata.source || 'Unknown'} | 
                        Last imported: {new Date().toLocaleString()}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      onClick={resetImport}
                      variant="outline"
                      size="sm"
                    >
                      Import New File
                    </Button>
                    <Button
                      onClick={handleClose}
                      size="sm"
                    >
                      Done
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpreadsheetImportPanel;
