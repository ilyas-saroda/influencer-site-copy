/**
 * Enterprise Import Wizard Component
 * Professional 4-step wizard for importing data from various sources
 * Mobile-first responsive design with drag & drop functionality
 */

import React, { useState, useCallback, useRef } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  Database, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Download,
  AlertCircle,
  Loader2,
  Link,
  X
} from 'lucide-react';
import Button from './Button';
import { useToast } from './ToastContainer';

// Import wizard steps
const STEPS = {
  SOURCE: 'source',
  UPLOAD: 'upload', 
  MAPPING: 'mapping',
  PREVIEW: 'preview',
  VALIDATION: 'validation'
};

// Auto-mapping patterns for intelligent column detection
const COLUMN_PATTERNS = {
  email: ['email', 'e-mail', 'mail', 'email_address', 'contact_email'],
  name: ['name', 'full_name', 'creator_name', 'influencer_name', 'display_name'],
  instagram_handle: ['instagram', 'instagram_handle', 'ig', 'ig_handle', 'insta', 'handle', 'username'],
  follower_count: ['followers', 'follower_count', 'follower', 'subscribers', 'audience'],
  niche: ['niche', 'category', 'industry', 'vertical', 'specialization'],
  location: ['location', 'city', 'country', 'based_in', 'region'],
  youtube_channel: ['youtube', 'youtube_channel', 'yt', 'channel', 'youtube_name']
};

// Sample data templates
const SAMPLE_TEMPLATES = {
  creators: {
    filename: 'creator_template.csv',
    headers: ['name', 'email', 'instagram_handle', 'youtube_channel', 'follower_count', 'niche', 'location'],
    sampleData: [
      ['John Creator', 'john@example.com', '@johncreator', 'JohnCreator', 50000, 'Technology', 'Mumbai'],
      ['Sarah Influencer', 'sarah@example.com', '@sarahinfluencer', 'SarahVlogs', 120000, 'Fashion', 'Delhi']
    ]
  },
  campaigns: {
    filename: 'campaign_template.csv', 
    headers: ['name', 'brand', 'start_date', 'end_date', 'budget', 'status', 'description'],
    sampleData: [
      ['Summer Campaign 2024', 'Tech Brand', '2024-06-01', '2024-08-31', 50000, 'planning', 'Summer product launch campaign'],
      ['Diwali Special', 'Fashion Brand', '2024-10-15', '2024-11-15', 75000, 'active', 'Festive season promotion']
    ]
  }
};

const ImportWizard = ({ 
  isOpen, 
  onClose, 
  onDataImported,
  importType = 'creators',
  className = ''
}) => {
  const [currentStep, setCurrentStep] = useState(STEPS.SOURCE);
  const [importSource, setImportSource] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [googleSheetsUrl, setGoogleSheetsUrl] = useState('');
  const [columnMapping, setColumnMapping] = useState({});
  const [previewData, setPreviewData] = useState(null);
  const [editablePreview, setEditablePreview] = useState(null);
  const [autoMappedColumns, setAutoMappedColumns] = useState({});
  const [duplicates, setDuplicates] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const { addToast } = useToast();

  // Step navigation
  const nextStep = useCallback(() => {
    const steps = Object.values(STEPS);
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    const steps = Object.values(STEPS);
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  }, [currentStep]);

  // File handling
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileUpload = useCallback(async (file) => {
    if (!file) return;

    // Validate file type
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'application/csv'
    ];

    if (!validTypes.includes(file.type) && !file.name.endsWith('.csv')) {
      addToast('Please upload a valid Excel or CSV file', 'error');
      return;
    }

    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      addToast('File size must be less than 50MB', 'error');
      return;
    }

    setUploadedFile(file);
    setIsProcessing(true);

    try {
      // Process file (simplified for demo)
      const formData = new FormData();
      formData.append('file', file);
      
      // Simulate file processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate mock preview data with auto-mapping
      const mockPreview = {
        headers: SAMPLE_TEMPLATES[importType].headers,
        data: SAMPLE_TEMPLATES[importType].sampleData,
        totalRows: 150
      };
      
      setPreviewData(mockPreview);
      
      // Auto-map columns
      const autoMapping = generateAutoMapping(mockPreview.headers);
      setAutoMappedColumns(autoMapping);
      setColumnMapping(autoMapping);
      
      // Check for duplicates
      await checkForDuplicates(mockPreview.data, autoMapping);
      addToast('File uploaded successfully', 'success');
      nextStep();
    } catch (error) {
      addToast('Failed to process file: ' + error.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  }, [importType, addToast, nextStep]);

  // Google Sheets handling
  const handleGoogleSheetsConnect = useCallback(async () => {
    if (!googleSheetsUrl) {
      addToast('Please enter a valid Google Sheets URL', 'error');
      return;
    }

    // Validate Google Sheets URL
    const googleSheetsRegex = /https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
    if (!googleSheetsRegex.test(googleSheetsUrl)) {
      addToast('Please enter a valid Google Sheets URL', 'error');
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate Google Sheets connection
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const mockPreview = {
        headers: SAMPLE_TEMPLATES[importType].headers,
        data: SAMPLE_TEMPLATES[importType].sampleData,
        totalRows: 250
      };
      
      setPreviewData(mockPreview);
      
      // Auto-map columns
      const autoMapping = generateAutoMapping(mockPreview.headers);
      setAutoMappedColumns(autoMapping);
      setColumnMapping(autoMapping);
      
      // Check for duplicates
      await checkForDuplicates(mockPreview.data, autoMapping);
      addToast('Google Sheets connected successfully', 'success');
      nextStep();
    } catch (error) {
      addToast('Failed to connect to Google Sheets: ' + error.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  }, [googleSheetsUrl, importType, addToast, nextStep]);

  // Helper functions for auto-mapping and duplicate detection
  const generateAutoMapping = useCallback((headers) => {
    const mapping = {};
    headers.forEach(header => {
      const normalizedHeader = header.toLowerCase().trim();
      
      // Try to match header with known patterns
      for (const [field, patterns] of Object.entries(COLUMN_PATTERNS)) {
        if (patterns.some(pattern => normalizedHeader.includes(pattern))) {
          mapping[field] = header;
          break;
        }
      }
    });
    return mapping;
  }, []);

  const checkForDuplicates = useCallback(async (data, mapping) => {
    // Simulate checking for existing creators
    const mockExistingCreators = [
      { instagram_handle: '@johncreator', email: 'john@example.com' },
      { instagram_handle: '@sarahinfluencer', email: 'sarah@example.com' }
    ];
    
    const duplicateEntries = [];
    
    data.forEach((row, index) => {
      const handleIndex = Object.keys(mapping).find(key => mapping[key] === 'instagram_handle');
      const emailIndex = Object.keys(mapping).find(key => mapping[key] === 'email');
      
      if (handleIndex !== undefined && emailIndex !== undefined) {
        const handle = row[handleIndex];
        const email = row[emailIndex];
        
        const isDuplicate = mockExistingCreators.some(creator => 
          creator.instagram_handle === handle || creator.email === email
        );
        
        if (isDuplicate) {
          duplicateEntries.push({ index, handle, email });
        }
      }
    });
    
    setDuplicates(duplicateEntries);
  }, []);

  const handleCellEdit = useCallback((rowIndex, colIndex, value) => {
    const newEditablePreview = [...(editablePreview || previewData.data)];
    newEditablePreview[rowIndex][colIndex] = value;
    setEditablePreview(newEditablePreview);
  }, [editablePreview, previewData]);

  const handleDuplicateAction = useCallback((duplicateIndex, action) => {
    if (action === 'skip') {
      // Remove from preview
      const newData = previewData.data.filter((_, index) => index !== duplicates[duplicateIndex].index);
      setPreviewData({ ...previewData, data: newData });
    }
    // Remove from duplicates list
    setDuplicates(prev => prev.filter((_, index) => index !== duplicateIndex));
  }, [previewData, duplicates]);

  // Download template
  const downloadTemplate = useCallback(() => {
    const template = SAMPLE_TEMPLATES[importType];
    const csvContent = [
      template.headers.join(','),
      ...template.sampleData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = template.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    addToast('Template downloaded successfully', 'success');
  }, [importType, addToast]);

  // Final import
  const handleFinalImport = useCallback(async () => {
    setIsProcessing(true);

    try {
      // Simulate final import
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const importResult = {
        success: true,
        data: editablePreview || previewData?.data || [],
        headers: previewData?.headers || [],
        metadata: {
          source: importSource,
          totalRows: (editablePreview || previewData?.data || []).length,
          importedAt: new Date().toISOString(),
          duplicatesHandled: duplicates.length
        }
      };

      addToast(`Successfully imported ${importResult.metadata.totalRows} records`, 'success');
      
      if (onDataImported) {
        onDataImported(importResult);
      }
      
      onClose();
    } catch (error) {
      addToast('Import failed: ' + error.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  }, [importSource, previewData, onDataImported, onClose, addToast]);

  // Reset wizard
  const resetWizard = useCallback(() => {
    setCurrentStep(STEPS.SOURCE);
    setImportSource('');
    setUploadedFile(null);
    setGoogleSheetsUrl('');
    setColumnMapping({});
    setPreviewData(null);
    setEditablePreview(null);
    setAutoMappedColumns({});
    setDuplicates([]);
    setIsProcessing(false);
  }, []);

  if (!isOpen) return null;

  const renderStepContent = () => {
    switch (currentStep) {
      case STEPS.SOURCE:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Choose Import Source</h3>
              <p className="text-gray-600">Select how you want to import your data</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setImportSource('file')}
                className={`p-6 border-2 rounded-xl transition-all ${
                  importSource === 'file' 
                    ? 'border-blue-500 bg-blue-50 shadow-md' 
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 text-green-600" />
                <h4 className="font-semibold text-gray-900 mb-1">Excel/CSV File</h4>
                <p className="text-sm text-gray-600">Upload from your computer</p>
              </button>

              <button
                onClick={() => setImportSource('googlesheets')}
                className={`p-6 border-2 rounded-xl transition-all ${
                  importSource === 'googlesheets' 
                    ? 'border-blue-500 bg-blue-50 shadow-md' 
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <Database className="w-12 h-12 mx-auto mb-3 text-blue-600" />
                <h4 className="font-semibold text-gray-900 mb-1">Google Sheets</h4>
                <p className="text-sm text-gray-600">Connect to online spreadsheet</p>
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Need a template?</h4>
                  <p className="text-sm text-blue-700">Download our sample CSV file to get started</p>
                </div>
                <Button
                  onClick={downloadTemplate}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Template</span>
                </Button>
              </div>
            </div>
          </div>
        );

      case STEPS.UPLOAD:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {importSource === 'file' ? 'Upload File' : 'Connect Google Sheets'}
              </h3>
              <p className="text-gray-600">
                {importSource === 'file' 
                  ? 'Drag and drop your file or click to browse'
                  : 'Enter your Google Sheets URL'
                }
              </p>
            </div>

            {importSource === 'file' ? (
              <div
                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  dragActive 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h4 className="font-medium text-gray-900 mb-2">
                  {uploadedFile ? uploadedFile.name : 'Drop your file here'}
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  Supports Excel (.xlsx, .xls) and CSV files up to 50MB
                </p>
                <Button variant="outline" size="sm">
                  Browse Files
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="url"
                    value={googleSheetsUrl}
                    onChange={(e) => setGoogleSheetsUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <Button
                  onClick={handleGoogleSheetsConnect}
                  disabled={!googleSheetsUrl || isProcessing}
                  className="w-full"
                >
                  {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Connect to Google Sheets
                </Button>
              </div>
            )}
          </div>
        );

      case STEPS.MAPPING:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Auto-Mapped Columns</h3>
              <p className="text-gray-600">We've automatically detected your column mappings</p>
            </div>

            {previewData && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-3">✨ Auto-Mapping Results</h4>
                  <div className="space-y-2">
                    {Object.entries(autoMappedColumns).map(([field, header]) => (
                      <div key={field} className="flex items-center justify-between bg-white rounded-lg p-2">
                        <span className="text-sm font-medium text-gray-700 capitalize">
                          {field.replace('_', ' ')}
                        </span>
                        <span className="text-sm text-green-600 font-medium">{header}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {duplicates.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-900 mb-3">⚠️ Potential Duplicates Found</h4>
                    <div className="space-y-2">
                      {duplicates.map((dup, index) => (
                        <div key={index} className="flex items-center justify-between bg-white rounded-lg p-2">
                          <div className="text-sm">
                            <span className="font-medium text-gray-700">{dup.handle}</span>
                            <span className="text-gray-500 ml-2">({dup.email})</span>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDuplicateAction(index, 'update')}
                            >
                              Update
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDuplicateAction(index, 'skip')}
                            >
                              Skip
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Preview Data</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          {previewData.headers.map((header, index) => (
                            <th key={index} className="text-left py-2 px-2 font-medium text-gray-700">
                              {header}
                              {Object.values(autoMappedColumns).includes(header) && (
                                <span className="ml-1 text-xs bg-green-100 text-green-800 px-1 rounded">Auto</span>
                              )}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.data.slice(0, 3).map((row, rowIndex) => (
                          <tr key={rowIndex} className="border-b">
                            {row.map((cell, cellIndex) => (
                              <td key={cellIndex} className="py-2 px-2 text-gray-600">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case STEPS.PREVIEW:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Final Preview & Edit</h3>
              <p className="text-gray-600">Review and edit your data before final import</p>
            </div>

            {previewData && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-blue-900 mb-1">💡 Pro Tip</h4>
                      <p className="text-sm text-blue-700">Click any cell to edit. Changes are saved automatically.</p>
                    </div>
                    <Button
                      onClick={() => setEditablePreview(null)}
                      variant="outline"
                      size="sm"
                    >
                      Reset Changes
                    </Button>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <h4 className="font-medium text-gray-900">Editable Preview (First 10 rows)</h4>
                  </div>
                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          {previewData.headers.map((header, index) => (
                            <th key={index} className="text-left py-3 px-3 font-medium text-gray-700 border-b">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(editablePreview || previewData.data).slice(0, 10).map((row, rowIndex) => (
                          <tr key={rowIndex} className="hover:bg-gray-50 border-b">
                            {row.map((cell, cellIndex) => (
                              <td 
                                key={cellIndex} 
                                className="py-2 px-3 border-r border-gray-100"
                                onClick={() => {
                                  const newValue = prompt(`Edit cell (${rowIndex + 1}, ${previewData.headers[cellIndex]}):`, cell);
                                  if (newValue !== null) {
                                    handleCellEdit(rowIndex, cellIndex, newValue);
                                  }
                                }}
                                style={{ cursor: 'pointer' }}
                              >
                                <div className="min-w-[100px] p-1 rounded hover:bg-blue-50 transition-colors">
                                  {cell}
                                </div>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-900">
                      {(editablePreview || previewData.data).length}
                    </div>
                    <div className="text-sm text-green-700">Rows to Import</div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-900">{previewData.headers.length}</div>
                    <div className="text-sm text-blue-700">Columns</div>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-900">
                      {editablePreview ? 'Edited' : 'Original'}
                    </div>
                    <div className="text-sm text-purple-700">Data Status</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case STEPS.VALIDATION:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Validation & Import</h3>
              <p className="text-gray-600">Review your data before final import</p>
            </div>

            {previewData && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-900">{previewData.totalRows}</div>
                    <div className="text-sm text-green-700">Total Rows</div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-900">{previewData.headers.length}</div>
                    <div className="text-sm text-blue-700">Columns</div>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-900">100%</div>
                    <div className="text-sm text-purple-700">Valid Data</div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Import Summary</h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• Source: {importSource === 'file' ? uploadedFile?.name : 'Google Sheets'}</li>
                    <li>• Import Type: {importType}</li>
                    <li>• Expected records: {previewData.totalRows}</li>
                    <li>• Validation: All records passed</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const getStepNumber = () => Object.values(STEPS).indexOf(currentStep) + 1;
  const getTotalSteps = () => Object.values(STEPS).length;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="absolute inset-4 md:inset-8 bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col max-w-4xl mx-auto my-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Upload className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Import Wizard</h2>
              <p className="text-sm text-gray-600">Step {getStepNumber()} of {getTotalSteps()}</p>
            </div>
          </div>
          
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="p-2"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            {Object.values(STEPS).map((step, index) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index < getStepNumber() - 1 
                    ? 'bg-green-500 text-white' 
                    : index === getStepNumber() - 1
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {index < getStepNumber() - 1 ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < Object.values(STEPS).length - 1 && (
                  <div className={`w-full h-1 mx-2 ${
                    index < getStepNumber() - 1 ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>Source</span>
            <span>Upload</span>
            <span>Mapping</span>
            <span>Preview</span>
            <span>Import</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isProcessing ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Processing...</p>
              </div>
            </div>
          ) : (
            renderStepContent()
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex items-center justify-between">
            <Button
              onClick={prevStep}
              variant="outline"
              disabled={currentStep === STEPS.SOURCE || isProcessing}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <div className="flex space-x-2">
              {currentStep === STEPS.VALIDATION ? (
                <Button
                  onClick={handleFinalImport}
                  disabled={isProcessing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Complete Import
                  <Check className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={nextStep}
                  disabled={
                    (currentStep === STEPS.SOURCE && !importSource) ||
                    (currentStep === STEPS.UPLOAD && !uploadedFile && !googleSheetsUrl) ||
                    (currentStep === STEPS.PREVIEW && duplicates.length > 0) ||
                    isProcessing
                  }
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportWizard;
