import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Icon from '../../../components/AppIcon';
import { Checkbox } from '../../../components/ui/Checkbox';
import { creatorService } from '../../../services/creatorService';

// Move FilterSection outside and memoize to prevent re-creation on every render
const FilterSection = React.memo(({ 
  title, 
  items, 
  filterKey, 
  icon, 
  loading = false, 
  showSearch = false, 
  searchQuery, 
  onSearchChange, 
  expandedSections, 
  toggleSection, 
  filters, 
  handleCheckboxChange,
  handleSelectAll 
}) => {
  const currentValues = filters?.[filterKey] || [];
  const isAllSelected = items?.length > 0 && currentValues?.length === items?.length;
  const isPartiallySelected = currentValues?.length > 0 && currentValues?.length < items?.length;

  const handleSelectAllChange = () => {
    handleSelectAll(filterKey, items?.map(item => item?.value) || []);
  };

  return (
    <div className="border-b border-border">
      <button
        onClick={() => toggleSection(filterKey)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted transition-colors duration-200"
      >
        <div className="flex items-center gap-2">
          <Icon name={icon} size={18} color="var(--color-primary)" />
          <span className="text-sm font-medium text-foreground">{title}</span>
          {filters?.[filterKey]?.length > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary text-primary-foreground">
              {filters?.[filterKey]?.length}
            </span>
          )}
        </div>
        <Icon
          name={expandedSections?.[filterKey] ? 'ChevronUp' : 'ChevronDown'}
          size={16}
          className="text-muted-foreground"
        />
      </button>
      {expandedSections?.[filterKey] && (
        <div className="px-4 py-3 space-y-2 bg-muted/30">
          {showSearch && (
            <div className="relative mb-3">
              <input
                type="text"
                placeholder={`Search ${title.toLowerCase()}...`}
                value={searchQuery}
                onChange={onSearchChange}
                className="w-full px-3 py-2 pl-9 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <Icon 
                name="Search" 
                size={16} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" 
              />
            </div>
          )}
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
              <span className="text-xs text-muted-foreground">Loading...</span>
            </div>
          ) : items?.length === 0 ? (
            <div className="text-center py-4">
              <span className="text-xs text-muted-foreground">No {title.toLowerCase()} available</span>
            </div>
          ) : (
            <>
              {/* Select All Checkbox */}
              {items?.length > 0 && (
                <div className="flex items-center justify-between pb-2 border-b border-border/50">
                  <Checkbox
                    label="Select All"
                    checked={isAllSelected}
                    onChange={handleSelectAllChange}
                    size="sm"
                    indeterminate={isPartiallySelected}
                  />
                  <span className="text-xs text-muted-foreground">
                    {currentValues?.length}/{items?.length} selected
                  </span>
                </div>
              )}
              <div className="max-h-64 overflow-y-auto space-y-2 custom-scrollbar">
                {items?.map((item) => (
                  <div key={item?.value} className="flex items-center justify-between">
                    <Checkbox
                      label={item?.label}
                      checked={filters?.[filterKey]?.includes(item?.value) || false}
                      onChange={() => handleCheckboxChange(filterKey, item?.value)}
                      size="sm"
                    />
                    {item?.count !== null && (
                      <span className="text-xs text-muted-foreground">{item?.count}</span>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
});

const FilterSidebar = ({ filters, onFilterChange, creatorCounts }) => {
  const [expandedSections, setExpandedSections] = useState({
    category: false,
    city: false,
    state: false,
    followers: false,
    engagement: false,
    tags: false,
    status: false
  });

  // Global state for managing all filter accordions
  const [isAllFiltersExpanded, setIsAllFiltersExpanded] = useState(false);

  // Provided categories from sheet_source column
  const allCategories = [
    'Artist', 'Anchor', 'Barter skincare', 'Barter Skincare 2', 'Beauty', 'BizTalk', 'Blue', 'Bold', 'Brown', 'Child Creator', 'Comedian', 'Cooking', 'Couple Influ.', 'Couple and Love pages', 'Confusion', 'Creators', 'Cricket Influ.', 'Dance', 'Decor', 'Delhi Pages', 'Doctors', 'Down creator', 'Educator', 'eYellow', 'Fan Pages', 'Farmers', 'Female Creator', 'Female Model', 'Finance', 'Fitness', 'Food Vlogger', 'Gaming', 'Gods Pages', 'Gurugram Pages', 'Hyper-active influencer', 'Insta Celebs', 'Insta Edit Pages', 'Islamic Pages', 'Liners', 'Link error', 'LifestyleFashion', 'Makeup Artist', 'Male Creator', 'Male Model', 'Marketing Pages', 'Medical and Health Awareness Pages', 'Meme Pages', 'Mixed', 'Mom influencer', 'Moto Insta', 'Motivational Speaker', 'Music Pages', 'News', 'Nutritionist', 'Nutritionist Pages', 'Pet Influencer', 'PhotoGrapher', 'Postcast & Info', 'Quotes & Motivation Pages', 'Red', 'Shopping Pages', 'Shopping/Product Review', 'Singer', 'Song lipsing', 'South creators', 'Tech', 'Travel', 'UGC CREATORS', 'Views Pages', 'Voice edit', 'Vlogger'
  ];

  // Filter out categories containing "Pages"
  const providedCategories = allCategories.filter(category => !category.includes('Pages'));

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');

  const [cities, setCities] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(true);
  const [citySearchQuery, setCitySearchQuery] = useState('');

  const [states, setStates] = useState([]);
  const [statesLoading, setStatesLoading] = useState(true);
  const [stateSearchQuery, setStateSearchQuery] = useState('');

  const [followers, setFollowers] = useState([]);
  const [followersLoading, setFollowersLoading] = useState(true);
  const [followersSearchQuery, setFollowersSearchQuery] = useState('');

  useEffect(() => {
    // Transform provided categories into the required format
    const categoryOptions = providedCategories.map(category => ({
      value: category, // Use the actual category name for API filtering
      label: category,
      count: null // We'll implement count later if needed
    }));
    
    setCategories(categoryOptions);
    setCategoriesLoading(false);
  }, []);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        console.log('Fetching cities from database...');
        const uniqueCities = await creatorService.getUniqueValues('city');
        console.log('Raw cities from database:', uniqueCities);
        console.log('Number of cities found:', uniqueCities.length);
        
        const cityOptions = uniqueCities
          .filter(city => city && city.trim() !== '')
          .map(city => ({
            value: city, // Use actual city name for API filtering
            label: city,
            count: null
          }))
          .sort((a, b) => a.label.localeCompare(b.label));
        
        console.log('Processed city options:', cityOptions);
        console.log('Number of processed cities:', cityOptions.length);
        
        setCities(cityOptions);
      } catch (error) {
        console.error('Error fetching cities:', error);
        setCities([]);
      } finally {
        setCitiesLoading(false);
      }
    };

    fetchCities();
  }, []);

  useEffect(() => {
    const fetchStates = async () => {
      try {
        console.log('Fetching states from database...');
        const uniqueStates = await creatorService.getUniqueValues('state');
        console.log('Raw states from database:', uniqueStates);
        console.log('Number of states found:', uniqueStates.length);
        
        const stateOptions = uniqueStates
          .filter(state => state && state.trim() !== '')
          .map(state => ({
            value: state, // Use actual state name for API filtering
            label: state,
            count: null
          }))
          .sort((a, b) => a.label.localeCompare(b.label));
        
        console.log('Processed state options:', stateOptions);
        console.log('Number of processed states:', stateOptions.length);
        
        setStates(stateOptions);
      } catch (error) {
        console.error('Error fetching states:', error);
        setStates([]);
      } finally {
        setStatesLoading(false);
      }
    };

    fetchStates();
  }, []);

  useEffect(() => {
    const fetchFollowers = async () => {
      try {
        console.log('Fetching followers tiers from database...');
        const uniqueFollowers = await creatorService.getUniqueValues('followers_tier');
        console.log('Raw followers tiers from database:', uniqueFollowers);
        console.log('Number of followers tiers found:', uniqueFollowers.length);
        
        // Debug: Check distribution
        try {
          const distribution = await creatorService.getFollowersTierDistribution();
          console.log('Complete followers tier distribution:', distribution);
        } catch (distError) {
          console.log('Could not fetch distribution:', distError);
        }
        
        // Define the desired order for followers tiers
        const desiredOrder = [
          '0-10k',
          '10K-50K', 
          '50K-100K',
          '100K-250K',
          '250K-500K',
          '500K-1M',
          '1M+',
          'Not Found'
        ];
        
        const followerOptions = uniqueFollowers
          .filter(follower => follower && follower.trim() !== '')
          .map(follower => {
            const normalizedValue = follower.trim();
            return {
              value: normalizedValue, // Use normalized value for API filtering
              label: normalizedValue,
              count: null
            };
          })
          .filter((option, index, self) => 
            index === self.findIndex((opt) => opt.value.toLowerCase() === option.value.toLowerCase())
          ) // Remove duplicates (case-insensitive)
          .sort((a, b) => {
            // Custom sorting based on desired order
            const aIndex = desiredOrder.findIndex(order => 
              order.toLowerCase() === a.value.toLowerCase()
            );
            const bIndex = desiredOrder.findIndex(order => 
              order.toLowerCase() === b.value.toLowerCase()
            );
            
            // If both items are in desired order, sort by their position
            if (aIndex !== -1 && bIndex !== -1) {
              return aIndex - bIndex;
            }
            
            // If only one item is in desired order, prioritize it
            if (aIndex !== -1) return -1;
            if (bIndex !== -1) return 1;
            
            // If neither is in desired order, sort alphabetically
            return a.label.localeCompare(b.label);
          });
        
        // Add "Not Found" option for NULL values only if it doesn't already exist
        const hasNotFound = followerOptions.some(option => 
          option.value.toLowerCase() === 'not found'
        );
        if (!hasNotFound) {
          followerOptions.push({
            value: 'Not Found',
            label: 'Not Found',
            count: null
          });
        }
        
        console.log('Processed follower options:', followerOptions);
        console.log('Number of processed followers:', followerOptions.length);
        
        setFollowers(followerOptions);
      } catch (error) {
        console.error('Error fetching followers:', error);
        setFollowers([]);
      } finally {
        setFollowersLoading(false);
      }
    };

    fetchFollowers();
  }, []);

  const engagementRates = [
    { value: '0-2', label: '0% - 2%', count: 67 },
    { value: '2-5', label: '2% - 5%', count: 189 },
    { value: '5-10', label: '5% - 10%', count: 234 },
    { value: '10+', label: '10%+', count: 56 }
  ];

  const tags = [
    { value: 'verified', label: 'Verified', count: 234 },
    { value: 'top-performer', label: 'Top Performer', count: 89 },
    { value: 'new', label: 'New Creator', count: 45 },
    { value: 'exclusive', label: 'Exclusive', count: 23 },
    { value: 'reliable', label: 'Reliable', count: 167 },
    { value: 'high-engagement', label: 'High Engagement', count: 98 }
  ];

  const statusOptions = [
    { value: 'active', label: 'Active', count: 423 },
    { value: 'inactive', label: 'Inactive', count: 78 },
    { value: 'pending', label: 'Pending Review', count: 34 },
    { value: 'blacklisted', label: 'Blacklisted', count: 12 }
  ];

  const handleCheckboxChange = (filterType, value) => {
    const currentValues = filters?.[filterType] || [];
    const newValues = currentValues?.includes(value)
      ? currentValues?.filter(v => v !== value)
      : [...currentValues, value];
    
    // Debug logging for followers filter
    if (filterType === 'followers') {
      console.log('Followers filter change:', {
        filterType,
        value,
        currentValues,
        newValues,
        valueType: typeof value,
        valueTrimmed: `"${value}"`,
        valueLength: value.length
      });
    }
    
    onFilterChange(filterType, newValues);
  };

  const handleClearAll = () => {
    onFilterChange('clearAll');
  };

  const activeFilterCount = Object.values(filters)?.reduce((acc, curr) => {
    return acc + (Array.isArray(curr) ? curr?.length : 0);
  }, 0);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Global toggle function for all filters
  const toggleAllFilters = () => {
    const newExpandedState = !isAllFiltersExpanded;
    setIsAllFiltersExpanded(newExpandedState);
    
    setExpandedSections({
      category: newExpandedState,
      city: newExpandedState,
      state: newExpandedState,
      followers: newExpandedState,
      engagement: newExpandedState,
      tags: newExpandedState,
      status: newExpandedState
    });
  };

  // Select all function for a specific filter category
  const handleSelectAll = (filterKey, allValues) => {
    const currentValues = filters?.[filterKey] || [];
    
    // If all items are already selected, deselect all
    if (currentValues?.length === allValues?.length && allValues?.length > 0) {
      onFilterChange(filterKey, []);
    } else {
      // Otherwise, select all
      onFilterChange(filterKey, allValues);
    }
  };

  const handleCategorySearch = (e) => {
    setCategorySearchQuery(e.target.value);
  };

  const handleCitySearch = (e) => {
    setCitySearchQuery(e.target.value);
  };

  const handleStateSearch = (e) => {
    setStateSearchQuery(e.target.value);
  };

  const handleFollowersSearch = (e) => {
    setFollowersSearchQuery(e.target.value);
  };

  const filteredCategories = useMemo(() => 
    categories.filter(category =>
      category.label.toLowerCase().includes(categorySearchQuery.toLowerCase())
    ), [categories, categorySearchQuery]
  );

  const filteredCities = useMemo(() => 
    cities.filter(city =>
      city.label.toLowerCase().includes(citySearchQuery.toLowerCase())
    ), [cities, citySearchQuery]
  );

  const filteredStates = useMemo(() => 
    states.filter(state =>
      state.label.toLowerCase().includes(stateSearchQuery.toLowerCase())
    ), [states, stateSearchQuery]
  );

  const filteredFollowers = useMemo(() => 
    followers.filter(follower =>
      follower.label.toLowerCase().includes(followersSearchQuery.toLowerCase())
    ), [followers, followersSearchQuery]
  );

  return (
    <div className="h-full flex flex-col bg-card border-r border-border">
      <div 
        className="flex items-center justify-between px-4 py-4 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={toggleAllFilters}
      >
        <div className="flex items-center gap-2">
          <Icon name="Filter" size={20} color="var(--color-primary)" />
          <h2 className="text-lg font-semibold text-foreground">Filters</h2>
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClearAll();
              }}
              className="text-xs text-primary hover:underline"
            >
              Clear All
            </button>
          )}
          <Icon
            name={isAllFiltersExpanded ? 'ChevronUp' : 'ChevronDown'}
            size={16}
            className={`text-muted-foreground transition-transform duration-200 ${isAllFiltersExpanded ? '' : 'rotate-180'}`}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <FilterSection
          title="Category"
          items={filteredCategories}
          filterKey="category"
          icon="Tag"
          loading={categoriesLoading}
          showSearch={true}
          searchQuery={categorySearchQuery}
          onSearchChange={handleCategorySearch}
          expandedSections={expandedSections}
          toggleSection={toggleSection}
          filters={filters}
          handleCheckboxChange={handleCheckboxChange}
          handleSelectAll={handleSelectAll}
        />
        <FilterSection
          title="City"
          items={filteredCities}
          filterKey="city"
          icon="MapPin"
          loading={citiesLoading}
          showSearch={true}
          searchQuery={citySearchQuery}
          onSearchChange={handleCitySearch}
          expandedSections={expandedSections}
          toggleSection={toggleSection}
          filters={filters}
          handleCheckboxChange={handleCheckboxChange}
          handleSelectAll={handleSelectAll}
        />
        <FilterSection
          title="State"
          items={filteredStates}
          filterKey="state"
          icon="Map"
          loading={statesLoading}
          showSearch={true}
          searchQuery={stateSearchQuery}
          onSearchChange={handleStateSearch}
          expandedSections={expandedSections}
          toggleSection={toggleSection}
          filters={filters}
          handleCheckboxChange={handleCheckboxChange}
          handleSelectAll={handleSelectAll}
        />
        <FilterSection
          title="Followers"
          items={filteredFollowers}
          filterKey="followers"
          icon="Users"
          loading={followersLoading}
          showSearch={true}
          searchQuery={followersSearchQuery}
          onSearchChange={handleFollowersSearch}
          expandedSections={expandedSections}
          toggleSection={toggleSection}
          filters={filters}
          handleCheckboxChange={handleCheckboxChange}
          handleSelectAll={handleSelectAll}
        />
        <FilterSection
          title="Engagement Rate"
          items={engagementRates}
          filterKey="engagement"
          icon="TrendingUp"
          expandedSections={expandedSections}
          toggleSection={toggleSection}
          filters={filters}
          handleCheckboxChange={handleCheckboxChange}
          handleSelectAll={handleSelectAll}
        />
        <FilterSection
          title="Tags"
          items={tags}
          filterKey="tags"
          icon="Bookmark"
          expandedSections={expandedSections}
          toggleSection={toggleSection}
          filters={filters}
          handleCheckboxChange={handleCheckboxChange}
          handleSelectAll={handleSelectAll}
        />
        <FilterSection
          title="Status"
          items={statusOptions}
          filterKey="status"
          icon="Activity"
          expandedSections={expandedSections}
          toggleSection={toggleSection}
          filters={filters}
          handleCheckboxChange={handleCheckboxChange}
          handleSelectAll={handleSelectAll}
        />
      </div>
      <div className="px-4 py-3 border-t border-border bg-muted/30">
        <div className="text-xs text-muted-foreground">
          <div className="flex items-center justify-between mb-1">
            <span>Total Creators:</span>
            <span className="font-medium text-foreground">{creatorCounts?.total}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Filtered Results:</span>
            <span className="font-medium text-foreground">{creatorCounts?.filtered}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterSidebar;