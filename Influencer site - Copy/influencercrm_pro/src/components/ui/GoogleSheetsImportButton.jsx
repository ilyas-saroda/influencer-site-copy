/**
 * Enterprise Google Sheets Import Button Component
 * Provides automated Google Sheets import with URL input and data fetching
 */

import React, { useState, useRef } from 'react';
import { Link, ExternalLink, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { spreadsheetService } from '../../services/spreadsheetService';
import Button from './Button';

const GoogleSheetsImportButton = ({ onDataImported, onError, className = '' }) => {
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState('idle'); // idle, success, error
  const [statusMessage, setStatusMessage] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [sheetUrl, setSheetUrl] = useState('');
  const urlInputRef = useRef(null);

  /**
   * Handle Google Sheets URL import
   */
  const handleUrlImport = async () => {
    if (!sheetUrl.trim()) {
      setImportStatus('error');
      setStatusMessage('Please enter a valid Google Sheets URL');
      return;
    }

    setIsImporting(true);
    setImportStatus('idle');
    setStatusMessage('Fetching Google Sheet data...');

    try {
      // Fetch and parse Google Sheets data
      const result = await spreadsheetService.fetchGoogleSheet(sheetUrl.trim());

      if (result.success) {
        // Validate data
        if (!result.data || result.data.length === 0) {
          throw new Error('The Google Sheet appears to be empty or contains no valid data');
        }

        // Set success status
        setImportStatus('success');
        setStatusMessage(`Successfully imported ${result.metadata.rowCount} rows from Google Sheet`);
        
        // Call parent callback with data
        if (onDataImported) {
          onDataImported({
            data: result.data,
            headers: result.headers,
            metadata: result.metadata,
            source: 'google_sheets'
          });
        }

        // Reset form
        setSheetUrl('');
        setShowUrlInput(false);

      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      console.error('Google Sheets import error:', error);
      setImportStatus('error');
      setStatusMessage(error.message || 'Failed to import Google Sheet');
      
      if (onError) {
        onError(error);
      }
    } finally {
      setIsImporting(false);
    }
  };

  /**
   * Handle Enter key in URL input
   */
  const handleUrlKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleUrlImport();
    }
  };

  /**
   * Toggle URL input visibility
   */
  const toggleUrlInput = () => {
    setShowUrlInput(!showUrlInput);
    setImportStatus('idle');
    setStatusMessage('');
    
    // Focus input when opening
    if (!showUrlInput && urlInputRef.current) {
      setTimeout(() => urlInputRef.current?.focus(), 100);
    }
  };

  /**
   * Validate Google Sheets URL format
   */
  const isValidGoogleSheetsUrl = (url) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.includes('docs.google.com') && urlObj.pathname.includes('/spreadsheets/');
    } catch {
      return false;
    }
  };

  return (
    <div className={`google-sheets-import-button ${className}`}>
      {/* Main button */}
      <Button
        onClick={toggleUrlInput}
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
            <Link className="w-4 h-4 mr-2" />
            Open / Import Google Sheet
          </>
        )}
      </Button>

      {/* URL Input Modal */}
      {showUrlInput && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-4 min-w-96">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Google Sheets URL
              </label>
              <div className="relative">
                <input
                  ref={urlInputRef}
                  type="url"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  onKeyPress={handleUrlKeyPress}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isImporting}
                />
                {sheetUrl && (
                  <button
                    onClick={() => window.open(sheetUrl, '_blank')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    title="Open in new tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                )}
              </div>
              {sheetUrl && !isValidGoogleSheetsUrl(sheetUrl) && (
                <p className="mt-1 text-xs text-red-600">
                  Please enter a valid Google Sheets URL
                </p>
              )}
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={handleUrlImport}
                disabled={isImporting || !sheetUrl.trim() || !isValidGoogleSheetsUrl(sheetUrl)}
                size="sm"
                className="flex-1"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  'Import Sheet'
                )}
              </Button>
              <Button
                onClick={toggleUrlInput}
                variant="outline"
                size="sm"
                disabled={isImporting}
              >
                Cancel
              </Button>
            </div>

            {/* Help text */}
            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
              <p className="font-medium mb-1">How to get the URL:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Open your Google Sheet</li>
                <li>Click "Share" → "Publish to web"</li>
                <li>Under "Link", select "Entire document"</li>
                <li>Click "Publish" and copy the URL</li>
              </ol>
            </div>
          </div>
        </div>
      )}

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

      {/* Overlay to close modal when clicking outside */}
      {showUrlInput && (
        <div
          className="fixed inset-0 z-40"
          onClick={toggleUrlInput}
        />
      )}
    </div>
  );
};

export default GoogleSheetsImportButton;
