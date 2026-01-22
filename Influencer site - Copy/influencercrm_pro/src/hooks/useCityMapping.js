import { useState, useCallback, useMemo } from 'react';

/**
 * Custom hook for managing city mapping data with validation and batch operations
 */
export function useCityMapping(initialCities = []) {
  const [mappings, setMappings] = useState({});
  const [originalMappings, setOriginalMappings] = useState({});
  const [confidenceScores, setConfidenceScores] = useState({});
  const [pendingChanges, setPendingChanges] = useState(new Set());
  const [isDirty, setIsDirty] = useState(false);

  // Initialize mappings for new cities
  const initializeMappings = useCallback((cities) => {
    const newMappings = {};
    const newOriginalMappings = {};
    const newConfidenceScores = {};
    
    cities.forEach(city => {
      newMappings[city] = '';
      newOriginalMappings[city] = '';
      newConfidenceScores[city] = 0;
    });
    
    setMappings(newMappings);
    setOriginalMappings(newOriginalMappings);
    setConfidenceScores(newConfidenceScores);
    setPendingChanges(new Set());
    setIsDirty(false);
  }, []);

  // Update a single mapping
  const updateMapping = useCallback((uncleanedCity, standardCity, confidence = 0) => {
    setMappings(prev => {
      const newMappings = { ...prev, [uncleanedCity]: standardCity };
      
      // Track if this is a change from original
      const hasChanged = standardCity !== originalMappings[uncleanedCity];
      
      setPendingChanges(prevChanges => {
        const newChanges = new Set(prevChanges);
        if (hasChanged) {
          newChanges.add(uncleanedCity);
        } else {
          newChanges.delete(uncleanedCity);
        }
        return newChanges;
      });
      
      setIsDirty(Object.keys(newMappings).some(city => 
        newMappings[city] !== originalMappings[city]
      ));
      
      return newMappings;
    });
    
    // Update confidence score
    setConfidenceScores(prev => ({
      ...prev,
      [uncleanedCity]: confidence
    }));
  }, [originalMappings]);

  // Batch update multiple mappings
  const batchUpdateMappings = useCallback((mappingUpdates) => {
    const newMappings = { ...mappings };
    const newConfidenceScores = { ...confidenceScores };
    const newPendingChanges = new Set();
    
    mappingUpdates.forEach(({ uncleanedCity, standardCity, confidence = 0 }) => {
      newMappings[uncleanedCity] = standardCity;
      newConfidenceScores[uncleanedCity] = confidence;
      
      if (standardCity !== originalMappings[uncleanedCity]) {
        newPendingChanges.add(uncleanedCity);
      }
    });
    
    setMappings(newMappings);
    setConfidenceScores(newConfidenceScores);
    setPendingChanges(newPendingChanges);
    setIsDirty(newPendingChanges.size > 0);
  }, [mappings, confidenceScores, originalMappings]);

  // Auto-select high confidence matches
  const autoSelectHighConfidence = useCallback((matches, threshold = 90) => {
    const highConfidenceUpdates = matches
      .filter(match => match.confidence >= threshold)
      .map(match => ({
        uncleanedCity: match.uncleanedCity,
        standardCity: match.match,
        confidence: match.confidence
      }));
    
    batchUpdateMappings(highConfidenceUpdates);
    return highConfidenceUpdates.length;
  }, [batchUpdateMappings]);

  // Clear all mappings
  const clearAllMappings = useCallback(() => {
    const clearedMappings = {};
    const clearedConfidenceScores = {};
    
    Object.keys(mappings).forEach(city => {
      clearedMappings[city] = '';
      clearedConfidenceScores[city] = 0;
    });
    
    setMappings(clearedMappings);
    setConfidenceScores(clearedConfidenceScores);
    setPendingChanges(new Set(Object.keys(mappings)));
    setIsDirty(true);
  }, [mappings]);

  // Reset to original mappings
  const resetMappings = useCallback(() => {
    setMappings({ ...originalMappings });
    setConfidenceScores(Object.keys(originalMappings).reduce((acc, city) => {
      acc[city] = 0;
      return acc;
    }, {}));
    setPendingChanges(new Set());
    setIsDirty(false);
  }, [originalMappings]);

  // Get valid mappings (non-empty)
  const getValidMappings = useCallback(() => {
    return Object.entries(mappings)
      .filter(([_, standardCity]) => standardCity)
      .map(([uncleanedCity, standardCity]) => ({
        uncleanedCity,
        standardCity,
        confidence: confidenceScores[uncleanedCity] || 0
      }));
  }, [mappings, confidenceScores]);

  // Get statistics
  const getStatistics = useCallback(() => {
    const totalCities = Object.keys(mappings).length;
    const mappedCities = Object.values(mappings).filter(Boolean).length;
    const unmappedCities = totalCities - mappedCities;
    const highConfidenceMatches = Object.values(confidenceScores).filter(score => score >= 90).length;
    const mediumConfidenceMatches = Object.values(confidenceScores).filter(score => score >= 70 && score < 90).length;
    const lowConfidenceMatches = Object.values(confidenceScores).filter(score => score < 70).length;
    
    return {
      totalCities,
      mappedCities,
      unmappedCities,
      pendingChanges: pendingChanges.size,
      highConfidenceMatches,
      mediumConfidenceMatches,
      lowConfidenceMatches,
      isDirty
    };
  }, [mappings, confidenceScores, pendingChanges, isDirty]);

  // Validate mappings before save
  const validateMappings = useCallback(() => {
    const validMappings = getValidMappings();
    const errors = [];
    
    if (validMappings.length === 0) {
      errors.push('Please select at least one city mapping');
    }
    
    // Check for duplicate mappings (multiple uncleaned cities mapping to same standard city)
    const standardCityCounts = {};
    validMappings.forEach(({ standardCity }) => {
      standardCityCounts[standardCity] = (standardCityCounts[standardCity] || 0) + 1;
    });
    
    const duplicates = Object.entries(standardCityCounts)
      .filter(([_, count]) => count > 1)
      .map(([city, count]) => `${city} (${count} times)`);
    
    if (duplicates.length > 0) {
      errors.push(`Duplicate mappings detected: ${duplicates.join(', ')}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      validMappings
    };
  }, [getValidMappings]);

  // Memoized values
  const statistics = useMemo(getStatistics, [getStatistics]);
  const validation = useMemo(validateMappings, [validateMappings]);

  return {
    // State
    mappings,
    confidenceScores,
    pendingChanges,
    isDirty,
    statistics,
    validation,
    
    // Actions
    initializeMappings,
    updateMapping,
    batchUpdateMappings,
    autoSelectHighConfidence,
    clearAllMappings,
    resetMappings,
    getValidMappings,
    getStatistics,
    validateMappings
  };
}
