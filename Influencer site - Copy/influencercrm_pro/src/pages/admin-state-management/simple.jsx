import React, { useState, useEffect } from 'react';
import { stateManagementService } from '../services/stateManagementService';
import { STANDARD_INDIAN_STATES } from '../data/standardStates';

export default function AdminStateManagement() {
  const [uncleanedStates, setUncleanedStates] = useState([
    'U.P.', 'M.P.', 'Delhi', 'Bangalore', 'Mumbai', 'Kolkata', 'Chennai',
    'Pune', 'Hyderabad', 'Jaipur', 'Lucknow', 'Ahmedabad', 'Surat',
    'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Patna',
    'Vadodara', 'Agra', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot',
    'Kalyan-Dombivali', 'Vasai-Virar', 'Varanasi', 'Srinagar', 'Dhanbad',
    'Jodhpur', 'Amritsar', 'Raipur', 'Allahabad', 'Coimbatore',
    'Jabalpur', 'Gwalior', 'Vijayawada', 'Madurai', 'Guwahati',
    'Chandigarh', 'Hubli-Dharwad', 'Mysore', 'Tiruchirappalli', 'Nellore',
    'Thiruvananthapuram', 'Bhiwandi', 'Saharanpur', 'Gulbarga',
    'Navi Mumbai', 'Kochi', 'Kozhikode', 'Kurnool', 'Bellary', 'Bikaner'
  ]);
  
  const [mappings, setMappings] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Simulate loading
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  const handleMappingChange = (uncleanedState, standardState) => {
    setMappings(prev => ({
      ...prev,
      [uncleanedState]: standardState
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const mappingsArray = Object.entries(mappings).map(([uncleanedState, standardState]) => ({
        uncleanedState,
        standardState
      }));
      
      const result = await stateManagementService.bulkUpdateStateNames(mappingsArray);
      
      if (result.success) {
        setSuccess(`Successfully updated ${result.total_updated} records!`);
        setMappings({});
      } else {
        setError(result.error || 'Update failed');
      }
    } catch (err) {
      setError('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAutoSelect = () => {
    const autoMappings = {};
    uncleanedStates.forEach(state => {
      const match = STANDARD_INDIAN_STATES.find(standard => 
        standard.toLowerCase().includes(state.toLowerCase()) ||
        state.toLowerCase().includes(standard.toLowerCase())
      );
      if (match) {
        autoMappings[state] = match;
      }
    });
    setMappings(autoMappings);
  };

  const handleClear = () => {
    setMappings({});
    setSuccess(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            State Management System
          </h1>
          
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Uncleaned States Found: {uncleanedStates.length}
            </h2>
            
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded mb-4">
                {success}
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
          </div>

          <div className="mb-6">
            <div className="flex gap-4 mb-4">
              <button
                onClick={handleAutoSelect}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Auto-Select Matches
              </button>
              
              <button
                onClick={handleClear}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Clear All
              </button>
              
              <button
                onClick={handleSave}
                disabled={saving || Object.keys(mappings).length === 0}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : `Save Changes (${Object.keys(mappings).length})`}
              </button>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uncleaned State
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Standard State
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {uncleanedStates.map((state, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {state}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <select
                        value={mappings[state] || ''}
                        onChange={(e) => handleMappingChange(state, e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                      >
                        <option value="">Select state...</option>
                        {STANDARD_INDIAN_STATES.map(standardState => (
                          <option key={standardState} value={standardState}>
                            {standardState}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => handleMappingChange(state, '')}
                        className="text-red-600 hover:text-red-900"
                      >
                        Clear
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
