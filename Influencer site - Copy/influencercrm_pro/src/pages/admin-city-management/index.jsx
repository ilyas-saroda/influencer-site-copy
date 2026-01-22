import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../../components/ui/Sidebar';
import Header from '../../components/ui/Header';
import Button from '../../components/ui/Button';
import { cityManagementService } from '../../services/cityManagementService';
import { useCityMapping } from '../../hooks/useCityMapping';
import { useAudit } from '../../hooks/useAudit';
import { enhancedFuzzyMatch, batchProcessStates } from '../../utils/fuzzyMatching';
import { ChangeHistoryIcon, ChangeHistoryModal } from '../../components/audit/AuditLogComponents';
import { ChevronLeft, ChevronRight, CheckCircle, AlertCircle, Info, Clock } from 'lucide-react';
import { useToast } from '../../components/ui/ToastContainer';

const STANDARD_INDIAN_CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata', 
  'Surat', 'Pune', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 
  'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri-Chinchwad', 'Patna', 'Vadodara',
  'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot',
  'Kalyan-Dombivali', 'Vasai-Virar', 'Varanasi', 'Srinagar', 'Dhanbad', 'Jodhpur',
  'Coimbatore', 'Kochi', 'Kozhikode', 'Thrissur', 'Guwahati', 'Amritsar', 'Vijayawada',
  'Madurai', 'Navi Mumbai', 'Allahabad', 'Ranchi', 'Gwalior', 'Jabalpur', 'Vijayawada',
  'Tiruchirappalli', 'Raipur', 'Kota', 'Chandigarh', 'Hubli-Dharwad', 'Mysore', 'Tirupur'
];

function AdminCityManagement() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [uncleanedCities, setUncleanedCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processingBatch, setProcessingBatch] = useState(false);
  const [selectedCities, setSelectedCities] = useState(new Set());
  const [bulkAction, setBulkAction] = useState('');
  const [batchResults, setBatchResults] = useState(null);
  const [changeHistoryModal, setChangeHistoryModal] = useState({ isOpen: false, recordId: null });
  
  // Use custom hook for city management
  const {
    mappings,
    confidenceScores,
    pendingChanges,
    isDirty,
    statistics,
    validation,
    initializeMappings,
    updateMapping,
    batchUpdateMappings,
    autoSelectHighConfidence,
    clearAllMappings,
    resetMappings,
    getValidMappings
  } = useCityMapping();

  // Use audit hook for audit logging
  const {
    logBatchCityMapping,
    getAuditHistory,
    loading: auditLoading,
    error: auditError
  } = useAudit();

  useEffect(() => {
    fetchUncleanedCities();
  }, []);

  const fetchUncleanedCities = async () => {
    try {
      setLoading(true);
      const cities = await cityManagementService.getUncleanedCities();
      setUncleanedCities(cities);
      
      // Initialize mappings using custom hook
      initializeMappings(cities);
    } catch (err) {
      toast.error('Failed to fetch uncleaned cities: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCityMappingChange = (uncleanedCity, standardCity) => {
    // Check if uncleaned city contains a slash - if so, disable auto-mapping
    const hasSlash = /\//.test(uncleanedCity);
    if (hasSlash && standardCity) {
      // Allow manual mapping but show warning
      console.warn(`City "${uncleanedCity}" contains a slash - manual mapping recommended`);
    }
    
    // Calculate confidence for the selected mapping
    const confidence = standardCity ? 
      enhancedFuzzyMatch(uncleanedCity, STANDARD_INDIAN_CITIES).confidence : 0;
    
    updateMapping(uncleanedCity, standardCity, confidence);
  };

  const handleCitySelection = (city) => {
    const newSelected = new Set(selectedCities);
    if (newSelected.has(city)) {
      newSelected.delete(city);
    } else {
      newSelected.add(city);
    }
    setSelectedCities(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedCities.size === uncleanedCities.length) {
      setSelectedCities(new Set());
    } else {
      setSelectedCities(new Set(uncleanedCities));
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Validate mappings
      const { isValid, errors, validMappings } = validation;
      
      if (!isValid) {
        toast.warning(errors.join(', '));
        return;
      }

      // Create audit context for this operation
      const auditContext = {
        userId: userProfile?.id || 'anonymous',
        userEmail: userProfile?.email || 'anonymous@example.com',
        sessionId: sessionStorage.getItem('audit_session_id') || 'session_' + Date.now()
      };

      // Use bulk update with audit logging
      const result = await cityManagementService.bulkUpdateCityNames(validMappings, auditContext);
      
      if (result.success) {
        toast(`Successfully updated ${result.total_updated || 0} records across ${validMappings.length} city mappings`, { type: 'success' });
        
        // Update UI immediately without page reload
        const updatedCities = new Set();
        validMappings.forEach(mapping => {
          updatedCities.add(mapping.uncleanedCity);
        });
        
        // Remove mapped cities from uncleaned cities list
        setUncleanedCities(prev => prev.filter(city => !updatedCities.has(city)));
        
        // Clear mappings for updated cities
        Object.keys(mappings).forEach(city => {
          if (updatedCities.has(city)) {
            updateMapping(city, '');
          }
        });
        
        // Clear selected cities
        setSelectedCities(new Set());
        
        // Update sidebar badge count
        setTimeout(() => {
          window.dispatchEvent(new Event('cityMappingsUpdated'));
        }, 100);
        
      } else {
        toast('Failed to update city names', { type: 'error' });
      }
      
    } catch (err) {
      console.error('Save error:', err);
      toast('Failed to update city names: ' + err.message, { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedCities.size === 0) {
      toast('Please select cities and an action', { type: 'warning' });
      return;
    }

    try {
      setSaving(true);
      
      const validMappings = Array.from(selectedCities).map(city => ({
        uncleanedCity: city,
        standardCity: bulkAction,
        confidence: 100,
        autoSelected: false
      }));

      const result = await cityManagementService.bulkUpdateCityNames(validMappings);
      
      if (result.success) {
        toast(`Successfully updated ${result.total_updated || 0} records`, { type: 'success' });
        
        // Update UI immediately
        setUncleanedCities(prev => prev.filter(city => !selectedCities.has(city)));
        setSelectedCities(new Set());
        setBulkAction('');
        
        // Update sidebar badge
        setTimeout(() => {
          window.dispatchEvent(new Event('cityMappingsUpdated'));
        }, 100);
      }
    } catch (err) {
      toast('Bulk action failed: ' + err.message, { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleAutoSelectMatches = async () => {
    try {
      setProcessingBatch(true);
      
      const filteredCities = uncleanedCities.filter(city => !/\//.test(city));
      
      if (filteredCities.length < uncleanedCities.length) {
        const excludedCount = uncleanedCities.length - filteredCities.length;
        toast.warning(`${excludedCount} cities with slashes excluded from auto-mapping`);
      }
      
      // Process filtered cities with fuzzy matching
      const batchResult = batchProcessStates(filteredCities, STANDARD_INDIAN_CITIES, {
        confidenceThreshold: 90,
        autoSelectHighConfidence: true,
        batchSize: 100
      });
      
      // Update mappings with high confidence matches
      const highConfidenceUpdates = batchResult.results
        .filter(result => result.confidence >= 90)
        .map(result => ({
          uncleanedCity: result.uncleanedState,
          standardCity: result.match,
          confidence: result.confidence,
          autoSelected: true
        }));
      
      batchUpdateMappings(highConfidenceUpdates);
      
      // Log batch operation for audit
      try {
        await logBatchCityMapping(highConfidenceUpdates, {
          autoSelected: true,
          confidenceThreshold: 90,
          operation: 'auto_select_matches'
        });
      } catch (auditError) {
        console.warn('Audit logging for auto-select failed:', auditError);
      }
      
      setBatchResults(batchResult);
      
      toast.success(`Auto-selected ${highConfidenceUpdates.length} high-confidence matches (>90%)`);
      
    } catch (err) {
      console.error('Auto-select error:', err);
      toast.error('Failed to auto-select matches: ' + err.message);
    } finally {
      setProcessingBatch(false);
    }
  };

  const handleViewChangeHistory = async (recordId) => {
    try {
      setChangeHistoryModal({ isOpen: true, recordId });
    } catch (err) {
      console.error('Error viewing change history:', err);
      toast.error('Failed to load change history');
    }
  };

  const handleClearAll = () => {
    clearAllMappings();
    setBatchResults(null);
    toast.info('All selections cleared');
  };

  const handleReset = () => {
    resetMappings();
    toast.info('Selections reset to original state');
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar 
          isCollapsed={isSidebarCollapsed}
          onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        <div className="flex-1 flex flex-col">
          <Header title="City Management" />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-lg">Loading cities...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar 
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      
      <div 
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out main-content ${
          isSidebarCollapsed ? 'sidebar-collapsed' : ''
        }`}
      >
        <Header 
          isCollapsed={isSidebarCollapsed}
          title="City Management Dashboard"
          subtitle="Clean up and standardize city names in database"
        />
        
        {/* Sticky Action Bar */}
        <div className="sticky top-16 z-30 bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
          <div className="max-w-7xl mx-auto flex flex-wrap gap-3 items-center justify-between">
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleAutoSelectMatches}
                variant="outline"
                disabled={processingBatch || uncleanedCities.length === 0}
                className="shadow-sm bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
              >
                {processingBatch ? 'Processing...' : 'Auto-Select Matches'}
              </Button>
              <Button
                onClick={handleClearAll}
                variant="outline"
                disabled={uncleanedCities.length === 0}
                className="shadow-sm bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
              >
                Clear All
              </Button>
              <Button
                onClick={handleReset}
                variant="outline"
                disabled={uncleanedCities.length === 0 || !isDirty}
                className="border-gray-300 hover:bg-gray-50 shadow-sm"
              >
                Reset
              </Button>
            </div>
            <Button
              onClick={handleSave}
              disabled={saving || !isDirty || uncleanedCities.length === 0}
              className="bg-blue-600 hover:bg-blue-700 shadow-sm"
            >
              {saving ? 'Saving...' : `Save Changes (${pendingChanges.size})`}
            </Button>
          </div>
        </div>
        
        <main className="flex-1 p-6 pt-8">
          <div className="max-w-7xl mx-auto">

            {/* Statistics */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Total Cities</h3>
                <p className="text-2xl font-bold text-gray-900">{statistics.totalCities}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Mapped Cities</h3>
                <p className="text-2xl font-bold text-green-600">{statistics.mappedCities}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Pending Changes</h3>
                <p className="text-2xl font-bold text-orange-600">{statistics.pendingChanges}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">High Confidence</h3>
                <p className="text-2xl font-bold text-blue-600">{statistics.highConfidenceMatches}</p>
              </div>
            </div>

            {/* Batch Processing Results */}
            {batchResults && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start">
                  <Info className="h-5 w-5 text-blue-400 mt-0.5" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Batch Processing Results</h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>Total Processed: {batchResults.totalProcessed}</p>
                      <p>High Confidence Matches (&ge;90%): {batchResults.highConfidenceMatches}</p>
                      <p>Medium Confidence Matches (70-89%): {batchResults.mediumConfidenceMatches}</p>
                      <p>Low Confidence Matches (&lt;70%): {batchResults.lowConfidenceMatches}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bulk Action Controls */}
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedCities.size === uncleanedCities.length}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Select All ({selectedCities.size}/{uncleanedCities.length})
                  </span>
                </div>
                
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={selectedCities.size === 0}
                >
                  <option value="">Bulk assign to...</option>
                  {STANDARD_INDIAN_CITIES.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                
                <Button
                  onClick={handleBulkAction}
                  disabled={!bulkAction || selectedCities.size === 0 || saving}
                  loading={saving}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {saving ? 'Updating...' : `Update ${selectedCities.size} selected`}
                </Button>
              </div>
            </div>

            {/* City Mappings */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">City Mappings</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Map each uncleaned city name to a standard Indian city name
                </p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedCities.size === uncleanedCities.length}
                          onChange={handleSelectAll}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Uncleaned City Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Confidence Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Standard City Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        History
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {uncleanedCities.map((uncleanedCity, index) => {
                      const confidence = confidenceScores[uncleanedCity] || 0;
                      const isSelected = mappings[uncleanedCity] || '';
                      const hasPendingChange = pendingChanges.has(uncleanedCity);
                      const hasSlash = /\//.test(uncleanedCity);
                      
                      return (
                        <tr 
                          key={uncleanedCity} 
                          className={`hover:bg-gray-50 ${hasPendingChange ? 'bg-yellow-50' : ''} ${hasSlash ? 'bg-orange-50' : ''} ${selectedCities.has(uncleanedCity) ? 'bg-blue-50' : ''}`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedCities.has(uncleanedCity)}
                              onChange={() => handleCitySelection(uncleanedCity)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {uncleanedCity}
                            </div>
                            {hasSlash && (
                              <div className="text-xs text-orange-600 mt-1">
                                <AlertCircle className="inline w-3 h-3 mr-1" />
                                Contains slash - manual mapping recommended
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {confidence > 0 ? (
                              <div className="flex items-center">
                                <div className="flex-1">
                                  <div className="flex items-center">
                                    <span className={`text-sm font-medium ${
                                      confidence >= 90 ? 'text-green-600' : 
                                      confidence >= 70 ? 'text-yellow-600' : 'text-red-600'
                                    }`}>
                                      {confidence}%
                                    </span>
                                    {confidence >= 90 && (
                                      <CheckCircle className="ml-1 h-4 w-4 text-green-500" />
                                    )}
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                    <div 
                                      className={`h-1.5 rounded-full ${
                                        confidence >= 90 ? 'bg-green-500' : 
                                        confidence >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                                      }`}
                                      style={{ width: `${confidence}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              value={isSelected}
                              onChange={(e) => handleCityMappingChange(uncleanedCity, e.target.value)}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            >
                              <option value="">Select a standard city...</option>
                              {STANDARD_INDIAN_CITIES.map(standardCity => (
                                <option key={standardCity} value={standardCity}>
                                  {standardCity}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {hasPendingChange ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Pending
                              </span>
                            ) : isSelected ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Mapped
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Unmapped
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <ChangeHistoryIcon
                              recordId={uncleanedCity}
                              tableName="creators"
                              onClick={() => handleViewChangeHistory(uncleanedCity)}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
      
      {/* Change History Modal */}
      <ChangeHistoryModal
        isOpen={changeHistoryModal.isOpen}
        onClose={() => setChangeHistoryModal({ isOpen: false, recordId: null })}
        recordId={changeHistoryModal.recordId}
        tableName="creators"
        title={`Change History for "${changeHistoryModal.recordId}"`}
      />
    </div>
  );
}

export default AdminCityManagement;
