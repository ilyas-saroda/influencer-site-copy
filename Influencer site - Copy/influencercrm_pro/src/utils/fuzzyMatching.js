/**
 * Utility functions for Master Data Normalization
 * Implements Levenshtein distance algorithm and fuzzy matching logic
 */

// Levenshtein distance algorithm implementation
export function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  // Initialize matrix
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  // Calculate distance
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

// Calculate similarity score between two strings (0-100)
export function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  
  const normalized1 = str1.toLowerCase().trim();
  const normalized2 = str2.toLowerCase().trim();
  
  // Exact match
  if (normalized1 === normalized2) return 100;
  
  // Calculate Levenshtein distance
  const distance = levenshteinDistance(normalized1, normalized2);
  const maxLength = Math.max(normalized1.length, normalized2.length);
  
  if (maxLength === 0) return 100;
  
  // Convert distance to similarity score
  const similarity = ((maxLength - distance) / maxLength) * 100;
  
  // Apply additional scoring rules for better matching
  let finalScore = similarity;
  
  // Bonus for containing match
  if (normalized2.includes(normalized1) || normalized1.includes(normalized2)) {
    finalScore = Math.max(finalScore, 85);
  }
  
  // Bonus for word overlap
  const words1 = normalized1.split(/\s+/);
  const words2 = normalized2.split(/\s+/);
  const commonWords = words1.filter(word => words2.includes(word));
  
  if (commonWords.length > 0) {
    const wordBonus = (commonWords.length / Math.max(words1.length, words2.length)) * 20;
    finalScore = Math.max(finalScore, similarity + wordBonus);
  }
  
  return Math.min(Math.round(finalScore), 100);
}

// Find best match with confidence score
export function findBestMatch(uncleanedState, standardStates) {
  if (!uncleanedState || !standardStates || standardStates.length === 0) {
    return { match: '', confidence: 0 };
  }
  
  const matches = standardStates.map(standardState => ({
    state: standardState,
    confidence: calculateSimilarity(uncleanedState, standardState)
  }));
  
  // Sort by confidence score (highest first)
  matches.sort((a, b) => b.confidence - a.confidence);
  
  return {
    match: matches[0].state,
    confidence: matches[0].confidence,
    allMatches: matches.filter(m => m.confidence >= 50) // Return all matches with 50%+ confidence
  };
}

// Common Indian state abbreviations and variations
export const STATE_ABBREVIATIONS = {
  'up': 'Uttar Pradesh',
  'uttarpradesh': 'Uttar Pradesh',
  'uk': 'Uttarakhand',
  'uttrakhand': 'Uttarakhand',
  'tn': 'Tamil Nadu',
  'tamilnadu': 'Tamil Nadu',
  'dl': 'Delhi',
  'dlh': 'Delhi',
  'mh': 'Maharashtra',
  'maharashtra': 'Maharashtra',
  'gj': 'Gujarat',
  'gujarat': 'Gujarat',
  'rj': 'Rajasthan',
  'rajasthan': 'Rajasthan',
  'pb': 'Punjab',
  'punjab': 'Punjab',
  'hr': 'Haryana',
  'haryana': 'Haryana',
  'hp': 'Himachal Pradesh',
  'himachalpradesh': 'Himachal Pradesh',
  'jk': 'Jammu and Kashmir',
  'j&k': 'Jammu and Kashmir',
  'ka': 'Karnataka',
  'karnataka': 'Karnataka',
  'kl': 'Kerala',
  'kerala': 'Kerala',
  'ap': 'Andhra Pradesh',
  'andhrapradesh': 'Andhra Pradesh',
  'ts': 'Telangana',
  'wb': 'West Bengal',
  'westbengal': 'West Bengal',
  'br': 'Bihar',
  'bihar': 'Bihar',
  'or': 'Odisha',
  'odisha': 'Odisha',
  'as': 'Assam',
  'assam': 'Assam',
  'mp': 'Madhya Pradesh',
  'madhyapradesh': 'Madhya Pradesh',
  'cg': 'Chhattisgarh',
  'chhattisgarh': 'Chhattisgarh',
  'jh': 'Jharkhand',
  'jharkhand': 'Jharkhand',
  'sk': 'Sikkim',
  'sikkim': 'Sikkim'
};

// Enhanced fuzzy matching with abbreviation support
export function enhancedFuzzyMatch(uncleanedState, standardStates) {
  if (!uncleanedState) return { match: '', confidence: 0 };
  
  const normalized = uncleanedState.toLowerCase().trim();
  
  // Check for exact abbreviation match first
  if (STATE_ABBREVIATIONS[normalized]) {
    return {
      match: STATE_ABBREVIATIONS[normalized],
      confidence: 100,
      type: 'abbreviation'
    };
  }
  
  // Use fuzzy matching for other cases
  const result = findBestMatch(uncleanedState, standardStates);
  result.type = result.confidence >= 90 ? 'high_confidence' : 
                result.confidence >= 70 ? 'medium_confidence' : 'low_confidence';
  
  return result;
}

// Batch processing utilities
export function batchProcessStates(uncleanedStates, standardStates, options = {}) {
  const { 
    confidenceThreshold = 90, 
    autoSelectHighConfidence = true,
    batchSize = 100 
  } = options;
  
  const results = [];
  const autoSelected = [];
  
  for (let i = 0; i < uncleanedStates.length; i += batchSize) {
    const batch = uncleanedStates.slice(i, i + batchSize);
    const batchResults = batch.map(state => {
      const match = enhancedFuzzyMatch(state, standardStates);
      const shouldAutoSelect = autoSelectHighConfidence && match.confidence >= confidenceThreshold;
      
      if (shouldAutoSelect) {
        autoSelected.push(state);
      }
      
      return {
        uncleanedState: state,
        ...match,
        autoSelected: shouldAutoSelect
      };
    });
    
    results.push(...batchResults);
  }
  
  return {
    results,
    autoSelected,
    totalProcessed: uncleanedStates.length,
    highConfidenceMatches: results.filter(r => r.confidence >= confidenceThreshold).length,
    mediumConfidenceMatches: results.filter(r => r.confidence >= 70 && r.confidence < confidenceThreshold).length,
    lowConfidenceMatches: results.filter(r => r.confidence < 70).length
  };
}
