import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';
import { supabase } from '../../lib/supabase';

const SearchGlobal = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const [mockResults] = useState([]); // keep shape for fallback

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef?.current && !searchRef?.current?.contains(event?.target)) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
      inputRef?.current?.focus();
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  useEffect(() => {
    if (searchQuery?.length > 0) {
      setIsLoading(true);
      const timer = setTimeout(async () => {
        try {
          const q = searchQuery.trim();

          // Search creators
          const { data: creators } = await supabase
            .from('creators')
            .select('id,name,username,instagram_link,followers_count')
            .or(`name.ilike.%${q}%,username.ilike.%${q}%,email.ilike.%${q}%,instagram_link.ilike.%${q}%`)
            .limit(6);

          // Search campaigns
          const { data: campaigns } = await supabase
            .from('campaigns')
            .select('id,name,brand')
            .ilike('name', `%${q}%`)
            .limit(4);

          // Search payments by id (basic)
          const { data: payments } = await supabase
            .from('payments')
            .select('id,amount,creator_id')
            .ilike('id', `%${q}%`)
            .limit(4);

          const results = [];

          if (creators?.length) {
            creators.forEach(c => results.push({
              type: 'creator',
              id: c.id,
              title: c.name,
              subtitle: `${c.username || ''} • ${c.followers_count ? `${c.followers_count} followers` : 'N/A'}`,
              path: `/creator-profile-details/${c.id}`,
              icon: 'User'
            }));
          }

          if (campaigns?.length) {
            campaigns.forEach(c => results.push({
              type: 'campaign',
              id: c.id,
              title: c.name,
              subtitle: `${c.brand || ''}`,
              path: `/campaign-management-center`,
              icon: 'Megaphone'
            }));
          }

          if (payments?.length) {
            payments.forEach(p => results.push({
              type: 'payment',
              id: p.id,
              title: `Payment #${p.id}`,
              subtitle: `₹${p.amount} • ${p.creator_id || ''}`,
              path: `/payment-processing-center`,
              icon: 'CreditCard'
            }));
          }

          setSearchResults(results);
        } catch (err) {
          console.error('Search error', err);
          setSearchResults([]);
        } finally {
          setIsLoading(false);
        }
      }, 350);

      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleSearch = (e) => {
    e?.preventDefault();
    if (searchQuery?.trim()) {
      if (!recentSearches?.includes(searchQuery)) {
        setRecentSearches([searchQuery, ...recentSearches?.slice(0, 3)]);
      }
    }
  };

  const handleResultClick = (result) => {
    navigate(result?.path);
    setIsExpanded(false);
    setSearchQuery('');
  };

  const handleRecentSearchClick = (search) => {
    setSearchQuery(search);
  };

  const handleClearRecent = () => {
    setRecentSearches([]);
  };

  return (
    <div className="relative w-full" ref={searchRef}>
      <form onSubmit={handleSearch} className="relative">
        <div className="relative">
          <Icon
            name="Search"
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e?.target?.value)}
            onFocus={() => setIsExpanded(true)}
            placeholder="Search creators, campaigns, Instagram handles..."
            className="w-full pl-10 pr-10 py-2 bg-muted border border-input rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-200"
            aria-label="Global search"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200"
              aria-label="Clear search"
            >
              <Icon name="X" size={16} />
            </button>
          )}
        </div>
      </form>
      {isExpanded && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-md shadow-lg-custom z-[300] max-h-96 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Icon name="Loader2" size={24} className="animate-spin text-primary" />
            </div>
          ) : searchQuery?.length > 0 ? (
            searchResults?.length > 0 ? (
              <div className="py-2">
                {searchResults?.map((result, index) => (
                  <button
                    key={index}
                    onClick={() => handleResultClick(result)}
                    className="w-full px-4 py-3 hover:bg-muted transition-colors duration-200 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon name={result?.icon} size={16} color="var(--color-primary)" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {result?.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {result?.subtitle}
                        </p>
                      </div>
                      <Icon name="ArrowRight" size={16} className="text-muted-foreground" />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 px-4">
                <Icon name="SearchX" size={48} color="var(--color-muted-foreground)" />
                <p className="mt-3 text-sm text-muted-foreground">No results found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Try searching for creators, campaigns, or Instagram handles
                </p>
              </div>
            )
          ) : (
            <div className="py-2">
              {recentSearches?.length > 0 && (
                <>
                  <div className="flex items-center justify-between px-4 py-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Recent Searches
                    </span>
                    <button
                      onClick={handleClearRecent}
                      className="text-xs text-primary hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                  {recentSearches?.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => handleRecentSearchClick(search)}
                      className="w-full px-4 py-2 hover:bg-muted transition-colors duration-200 text-left flex items-center gap-3"
                    >
                      <Icon name="Clock" size={16} className="text-muted-foreground" />
                      <span className="text-sm text-foreground">{search}</span>
                    </button>
                  ))}
                </>
              )}
              <div className="px-4 py-3 mt-2 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  <strong>Pro tip:</strong> Paste Instagram profile links for quick creator lookup
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchGlobal;