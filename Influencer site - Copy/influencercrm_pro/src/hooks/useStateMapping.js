import { useState, useCallback, useMemo } from 'react';

/**
 * Custom hook for managing state mapping data with validation and batch operations
 */
export function useStateMapping(initialStates = []) {
  const [mappings, setMappings] = useState({});
  const [originalMappings, setOriginalMappings] = useState({});
  const [confidenceScores, setConfidenceScores] = useState({});
  const [pendingChanges, setPendingChanges] = useState(new Set());
  const [isDirty, setIsDirty] = useState(false);

  // Initialize mappings for new states
  const initializeMappings = useCallback((states) => {
    const newMappings = {};
    const newOriginalMappings = {};
    const newConfidenceScores = {};
    
    states.forEach(state => {
      newMappings[state] = '';
      newOriginalMappings[state] = '';
      newConfidenceScores[state] = 0;
    });
    
    setMappings(newMappings);
    setOriginalMappings(newOriginalMappings);
    setConfidenceScores(newConfidenceScores);
    setPendingChanges(new Set());
    setIsDirty(false);
  }, []);

  // Update a single mapping
  const updateMapping = useCallback((uncleanedState, standardState, confidence = 0) => {
    setMappings(prev => {
      const newMappings = { ...prev, [uncleanedState]: standardState };
      
      // Track if this is a change from original
      const hasChanged = standardState !== originalMappings[uncleanedState];
      
      setPendingChanges(prevChanges => {
        const newChanges = new Set(prevChanges);
        if (hasChanged) {
          newChanges.add(uncleanedState);
        } else {
          newChanges.delete(uncleanedState);
        }
        return newChanges;
      });
      
      setIsDirty(Object.keys(newMappings).some(state => 
        newMappings[state] !== originalMappings[state]
      ));
      
      return newMappings;
    });
    
    // Update confidence score
    setConfidenceScores(prev => ({
      ...prev,
      [uncleanedState]: confidence
    }));
  }, [originalMappings]);

  // Batch update multiple mappings
  const batchUpdateMappings = useCallback((mappingUpdates) => {
    const newMappings = { ...mappings };
    const newConfidenceScores = { ...confidenceScores };
    const newPendingChanges = new Set();
    
    mappingUpdates.forEach(({ uncleanedState, standardState, confidence = 0 }) => {
      newMappings[uncleanedState] = standardState;
      newConfidenceScores[uncleanedState] = confidence;
      
      if (standardState !== originalMappings[uncleanedState]) {
        newPendingChanges.add(uncleanedState);
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
        uncleanedState: match.uncleanedState,
        standardState: match.match,
        confidence: match.confidence
      }));
    
    batchUpdateMappings(highConfidenceUpdates);
    return highConfidenceUpdates.length;
  }, [batchUpdateMappings]);

  // Clear all mappings
  const clearAllMappings = useCallback(() => {
    const clearedMappings = {};
    const clearedConfidenceScores = {};
    
    Object.keys(mappings).forEach(state => {
      clearedMappings[state] = '';
      clearedConfidenceScores[state] = 0;
    });
    
    setMappings(clearedMappings);
    setConfidenceScores(clearedConfidenceScores);
    setPendingChanges(new Set(Object.keys(mappings)));
    setIsDirty(true);
  }, [mappings]);

  // Reset to original mappings
  const resetMappings = useCallback(() => {
    setMappings({ ...originalMappings });
    setConfidenceScores(Object.keys(originalMappings).reduce((acc, state) => {
      acc[state] = 0;
      return acc;
    }, {}));
    setPendingChanges(new Set());
    setIsDirty(false);
  }, [originalMappings]);

  // Get valid mappings (non-empty)
  const getValidMappings = useCallback(() => {
    return Object.entries(mappings)
      .filter(([_, standardState]) => standardState)
      .map(([uncleanedState, standardState]) => ({
        uncleanedState,
        standardState,
        confidence: confidenceScores[uncleanedState] || 0
      }));
  }, [mappings, confidenceScores]);

  // Get statistics
  const getStatistics = useCallback(() => {
    const totalStates = Object.keys(mappings).length;
    const mappedStates = Object.values(mappings).filter(Boolean).length;
    const unmappedStates = totalStates - mappedStates;
    const highConfidenceMatches = Object.values(confidenceScores).filter(score => score >= 90).length;
    const mediumConfidenceMatches = Object.values(confidenceScores).filter(score => score >= 70 && score < 90).length;
    const lowConfidenceMatches = Object.values(confidenceScores).filter(score => score < 70).length;
    
    return {
      totalStates,
      mappedStates,
      unmappedStates,
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
      errors.push('Please select at least one state mapping');
    }
    
    // Check for duplicate mappings (multiple uncleaned states mapping to same standard state)
    const standardStateCounts = {};
    validMappings.forEach(({ standardState }) => {
      standardStateCounts[standardState] = (standardStateCounts[standardState] || 0) + 1;
    });
    
    const duplicates = Object.entries(standardStateCounts)
      .filter(([_, count]) => count > 1)
      .map(([state, count]) => `${state} (${count} times)`);
    
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
