/**
 * Enterprise Global Search Component
 * Command-K (Cmd+K) activated global search with fuzzy matching
 * Searches across Creators, Brands, and Campaigns
 * Mobile-first responsive design
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Search, 
  Command, 
  User, 
  Building2, 
  Target, 
  ArrowRight,
  Loader2,
  X
} from 'lucide-react';
import { calculateSimilarity } from '../../utils/fuzzyMatching';
import { useToast } from './ToastContainer';
import Button from './Button';
import { supabase } from '../../lib/supabase';

// Search result types
const RESULT_TYPES = {
  CREATOR: 'creator',
  BRAND: 'brand', 
  CAMPAIGN: 'campaign'
};

const GlobalSearch = ({ isOpen, onClose, onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const { addToast } = useToast();

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      // Escape to close
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Arrow navigation
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % searchResults.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => prev === 0 ? searchResults.length - 1 : prev - 1);
      }

      // Enter to select
      if (e.key === 'Enter' && searchResults[selectedIndex]) {
        handleResultClick(searchResults[selectedIndex]);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, searchResults, selectedIndex, onClose]);

  // Search function with real Supabase data
  const performSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);

    try {
      const results = [];
      const queryLower = query.toLowerCase();

      // Search creators from Supabase with better error handling
      let creators = [];
      try {
        const { data, error } = await supabase
          .from('creators')
          .select('id, name, email, instagram_handle, follower_count, niche, category, profile_image_url')
          .or(`name.ilike.%${query}%,email.ilike.%${query}%,instagram_handle.ilike.%${query}%,niche.ilike.%${query}%,category.ilike.%${query}%`)
          .limit(10);
        
        if (error) throw error;
        creators = data || [];
      } catch (creatorError) {
        console.error('Creator search error:', creatorError);
      }

      creators?.forEach(creator => {
        try {
          const nameScore = calculateSimilarity(queryLower, creator.name?.toLowerCase() || '');
          const emailScore = calculateSimilarity(queryLower, creator.email?.toLowerCase() || '');
          const handleScore = calculateSimilarity(queryLower, creator.instagram_handle?.toLowerCase() || '');
          const nicheScore = calculateSimilarity(queryLower, creator.niche?.toLowerCase() || '');
          const categoryScore = calculateSimilarity(queryLower, creator.category?.toLowerCase() || '');
          
          const maxScore = Math.max(nameScore, emailScore, handleScore, nicheScore, categoryScore);
          
          if (maxScore >= 60) {
            results.push({
              ...creator,
              type: RESULT_TYPES.CREATOR,
              score: maxScore,
              displayName: creator.name || 'Unknown Creator',
              subtitle: creator.instagram_handle || creator.email || 'No contact info',
              description: `${creator.niche || creator.category || 'General'} • ${creator.follower_count ? formatNumber(creator.follower_count) + ' followers' : ''}`
            });
          }
        } catch (processingError) {
          console.error('Error processing creator:', creator, processingError);
        }
      });

      // Search campaigns from Supabase with better error handling
      let campaigns = [];
      try {
        const { data, error } = await supabase
          .from('campaigns')
          .select('id, name, brand, status, budget, creator_id')
          .or(`name.ilike.%${query}%,brand.ilike.%${query}%,status.ilike.%${query}%`)
          .limit(10);
        
        if (error) throw error;
        campaigns = data || [];
      } catch (campaignError) {
        console.error('Campaign search error:', campaignError);
      }

      campaigns?.forEach(campaign => {
        try {
          const nameScore = calculateSimilarity(queryLower, campaign.name?.toLowerCase() || '');
          const brandScore = calculateSimilarity(queryLower, campaign.brand?.toLowerCase() || '');
          const statusScore = calculateSimilarity(queryLower, campaign.status?.toLowerCase() || '');
          
          const maxScore = Math.max(nameScore, brandScore, statusScore);
          
          if (maxScore >= 60) {
            results.push({
              ...campaign,
              type: RESULT_TYPES.CAMPAIGN,
              score: maxScore,
              displayName: campaign.name || 'Unknown Campaign',
              subtitle: campaign.brand || 'Unknown Brand',
              description: `${campaign.status || 'Unknown Status'} • ${campaign.budget ? formatCurrency(campaign.budget) : ''}`
            });
          }
        } catch (processingError) {
          console.error('Error processing campaign:', campaign, processingError);
        }
      });

      // Sort by score and take top results
      const sortedResults = results.sort((a, b) => b.score - a.score).slice(0, 8);
      setSearchResults(sortedResults);
      setSelectedIndex(0);

    } catch (error) {
      console.error('Search error:', error);
      addToast('Search failed. Please try again.', 'error');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [addToast]);

  // Helper function to format numbers
  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num?.toString();
  };

  // Helper function to format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, performSearch]);

  // Handle result click
  const handleResultClick = (result) => {
    if (result.type === RESULT_TYPES.CREATOR) {
      onNavigate(`/creator-profile-details/${result.id}`);
    } else if (result.type === RESULT_TYPES.CAMPAIGN) {
      onNavigate('/campaign-management-center');
    } else if (result.type === RESULT_TYPES.BRAND) {
      onNavigate('/brand-contact-management');
    }
    onClose();
  };

  // Get result type label
  const getResultTypeLabel = (type) => {
    switch (type) {
      case RESULT_TYPES.CREATOR:
        return 'Creator';
      case RESULT_TYPES.BRAND:
        return 'Brand';
      case RESULT_TYPES.CAMPAIGN:
        return 'Campaign';
      default:
        return 'Unknown';
    }
  };

  // Get result icon
  const getResultIcon = (type) => {
    switch (type) {
      case RESULT_TYPES.CREATOR:
        return <User className="w-4 h-4" />;
      case RESULT_TYPES.BRAND:
        return <Building2 className="w-4 h-4" />;
      case RESULT_TYPES.CAMPAIGN:
        return <Target className="w-4 h-4" />;
      default:
        return <Search className="w-4 h-4" />;
    }
  };

  // Get status badge color for campaigns
  const getStatusBadgeColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-600';
    
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case 'active':
      case 'running':
        return 'bg-green-100 text-green-700';
      case 'completed':
      case 'finished':
        return 'bg-blue-100 text-blue-700';
      case 'paused':
      case 'on hold':
        return 'bg-yellow-100 text-yellow-700';
      case 'cancelled':
      case 'stopped':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  // Get category badge color for creators
  const getCategoryBadgeColor = (category) => {
    if (!category) return 'bg-gray-100 text-gray-600';
    
    const colors = [
      'bg-purple-100 text-purple-700',
      'bg-pink-100 text-pink-700',
      'bg-indigo-100 text-indigo-700',
      'bg-teal-100 text-teal-700',
      'bg-orange-100 text-orange-700'
    ];
    
    const hash = category.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // Format result subtitle
  const getResultSubtitle = (result) => {
    switch (result.type) {
      case RESULT_TYPES.CREATOR:
        return `${result.instagram_handle} • ${result.follower_count?.toLocaleString()} followers`;
      case RESULT_TYPES.BRAND:
        return `${result.industry} • ${result.status}`;
      case RESULT_TYPES.CAMPAIGN:
        return `${result.brand} • $${result.budget?.toLocaleString()}`;
      default:
        return '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9998] overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Search Modal */}
      <div className="absolute inset-4 md:inset-8 md:inset-x-auto md:left-1/2 md:transform md:-translate-x-1/2 md:max-w-2xl md:top-20">
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Search Header */}
          <div className="flex items-center space-x-3 p-4 border-b border-gray-200">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search creators, brands, campaigns..."
              className="flex-1 outline-none text-gray-900 placeholder-gray-500"
            />
            {isSearching && (
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span className="text-xs text-gray-500">Searching...</span>
              </div>
            )}
            <div className="flex items-center space-x-1 text-gray-400">
              <kbd className="px-2 py-1 text-xs bg-gray-100 rounded border border-gray-300">ESC</kbd>
            </div>
          </div>

          {/* Search Results */}
          <div className="max-h-96 overflow-y-auto">
            {searchQuery && !isSearching && searchResults.length === 0 && (
              <div className="p-8 text-center">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No results found for "{searchQuery}"</p>
                <p className="text-sm text-gray-400 mt-2">Try different keywords or check spelling</p>
              </div>
            )}

            {!searchQuery && !isSearching && (
              <div className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Command className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Quick Actions</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <button
                    onClick={() => handleResultClick({ type: RESULT_TYPES.CREATOR, name: 'All Creators' })}
                    className="flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <User className="w-4 h-4 text-blue-600" />
                    <div>
                      <div className="font-medium text-gray-900">View All Creators</div>
                      <div className="text-sm text-gray-500">Browse creator database</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => handleResultClick({ type: RESULT_TYPES.BRAND, name: 'All Brands' })}
                    className="flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Building2 className="w-4 h-4 text-green-600" />
                    <div>
                      <div className="font-medium text-gray-900">View All Brands</div>
                      <div className="text-sm text-gray-500">Browse brand directory</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => handleResultClick({ type: RESULT_TYPES.CAMPAIGN, name: 'All Campaigns' })}
                    className="flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Target className="w-4 h-4 text-purple-600" />
                    <div>
                      <div className="font-medium text-gray-900">View All Campaigns</div>
                      <div className="text-sm text-gray-500">Browse campaign list</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => {
                      addToast('Import wizard opened', 'info');
                      onClose();
                    }}
                    className="flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Search className="w-4 h-4 text-orange-600" />
                    <div>
                      <div className="font-medium text-gray-900">Import Data</div>
                      <div className="text-sm text-gray-500">Import creators or campaigns</div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="py-2">
                {searchResults.map((result, index) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleResultClick(result)}
                    className={`w-full flex items-center space-x-3 p-3 hover:bg-gray-50 transition-colors ${
                      index === selectedIndex ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                    }`}
                  >
                    {/* Avatar/Icon section */}
                    <div className="flex-shrink-0">
                      {result.type === RESULT_TYPES.CREATOR && result.profile_image_url ? (
                        <img 
                          src={result.profile_image_url} 
                          alt={result.displayName}
                          className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        result.type === RESULT_TYPES.CREATOR ? 'bg-blue-100 text-blue-600' :
                        result.type === RESULT_TYPES.BRAND ? 'bg-green-100 text-green-600' :
                        'bg-purple-100 text-purple-600'
                      } ${result.profile_image_url ? 'hidden' : ''}`}>
                        {getResultIcon(result.type)}
                      </div>
                    </div>
                    
                    {/* Main content */}
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-gray-900 truncate">{result.displayName}</span>
                        <span className="text-xs text-gray-400 flex-shrink-0">({Math.round(result.score)}% match)</span>
                      </div>
                      
                      {/* Badges and subtitle */}
                      <div className="flex items-center space-x-2 text-sm">
                        {result.type === RESULT_TYPES.CREATOR && result.category && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryBadgeColor(result.category)}`}>
                            {result.category}
                          </span>
                        )}
                        {result.type === RESULT_TYPES.CAMPAIGN && result.status && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(result.status)}`}>
                            {result.status}
                          </span>
                        )}
                        <span className="text-gray-500 truncate">{result.subtitle}</span>
                      </div>
                      
                      {result.description && (
                        <div className="text-xs text-gray-400 mt-1 truncate">{result.description}</div>
                      )}
                    </div>
                    
                    {/* Type label and arrow */}
                    <div className="flex flex-col items-end space-y-2">
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded whitespace-nowrap">
                        {getResultTypeLabel(result.type)}
                      </span>
                      <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-3 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span>Press <kbd className="px-1 py-0.5 bg-white rounded border border-gray-300">↑↓</kbd> to navigate</span>
              <span>Press <kbd className="px-1 py-0.5 bg-white rounded border border-gray-300">Enter</kbd> to select</span>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;
