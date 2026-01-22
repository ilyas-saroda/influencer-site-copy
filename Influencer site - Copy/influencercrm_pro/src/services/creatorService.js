import { supabase } from '../lib/supabase';
import { calculateCreatorsPerformance, getTopPerformers } from '../utils/performanceUtils';

export const creatorService = {
  async getCount() {
    try {
      const { count, error } = await supabase
        ?.from('creators')
        ?.select('*', { count: 'exact', head: true });

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error fetching creator count:', error);
      throw error;
    }
  },

  async getAll(options = {}) {
    try {
      const { limit = 1000, offset = 0 } = options;
      const { data, error } = await supabase
        ?.from('creators')
        ?.select('*')
        ?.order('created_at', { ascending: false })
        ?.range(offset, offset + limit - 1);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching creators:', error);
      throw error;
    }
  },

  async getUniqueValues(column) {
    try {
      console.log(`Fetching unique values for column: ${column}`);
      
      // Try to get all distinct values using RPC function for better performance
      try {
        const { data: rpcData, error: rpcError } = await supabase
          ?.rpc('get_unique_column_values', { column_name: column });
        
        if (!rpcError && rpcData) {
          console.log(`RPC data for ${column}:`, rpcData?.length, 'records');
          const values = rpcData?.filter(Boolean);
          console.log(`Unique values for ${column} via RPC:`, values?.length, 'records');
          return values;
        }
      } catch (rpcErr) {
        console.log('RPC method failed, falling back to standard query');
      }
      
      // Fallback: Get all records in batches if needed
      let allData = [];
      let offset = 0;
      const batchSize = 1000;
      let hasMore = true;
      
      while (hasMore) {
        const { data, error } = await supabase
          ?.from('creators')
          ?.select(column)
          ?.not(column, 'is', null)
          ?.range(offset, offset + batchSize - 1);

        console.log(`Batch data for ${column} (offset ${offset}):`, data?.length, 'records');
        console.log(`Error for ${column}:`, error);

        if (error) throw error;
        
        if (data && data.length > 0) {
          allData = [...allData, ...data];
          offset += batchSize;
          hasMore = data.length === batchSize; // Continue if we got a full batch
        } else {
          hasMore = false;
        }
      }

      console.log(`Total raw data for ${column}:`, allData?.length, 'records');
      
      const values = allData?.map(item => item?.[column])?.filter(Boolean);
      console.log(`Filtered values for ${column}:`, values?.length, 'records');
      
      const uniqueValues = [...new Set(values)];
      console.log(`Unique values for ${column}:`, uniqueValues?.length, 'records');
      console.log(`Sample unique values for ${column}:`, uniqueValues?.slice(0, 10));
      
      return uniqueValues;
    } catch (error) {
      console.error(`Error fetching unique values for ${column}:`, error);
      throw error;
    }
  },

  // Debug function to check followers_tier distribution
  async getFollowersTierDistribution() {
    try {
      console.log('Fetching followers_tier distribution...');
      
      // Get all creators with their followers_tier
      const { data, error } = await supabase
        ?.from('creators')
        ?.select('followers_tier')
        ?.not('followers_tier', 'is', null);

      if (error) throw error;

      // Count occurrences of each followers_tier
      const distribution = {};
      data?.forEach(creator => {
        const tier = creator?.followers_tier?.trim() || 'Unknown';
        distribution[tier] = (distribution[tier] || 0) + 1;
      });

      console.log('Followers tier distribution:', distribution);
      
      // Find all variations that might be "0-10k"
      const variations = Object.keys(distribution).filter(key => 
        key.toLowerCase().includes('0-10k') || 
        key.toLowerCase().includes('10k') ||
        key.toLowerCase().includes('0-10')
      );

      console.log('Possible 0-10k variations found:', variations);
      console.log('Counts for variations:', variations.map(v => ({ [v]: distribution[v] })));

      return distribution;
    } catch (error) {
      console.error('Error fetching followers tier distribution:', error);
      throw error;
    }
  },

  /**
   * Get paginated creators with server-side filtering and sorting
   * @param {Object} options - Pagination, filtering, and sorting options
   * @param {number} options.page - Page number (1-indexed)
   * @param {number} options.pageSize - Records per page (default: 25)
   * @param {string} options.searchQuery - Search query for name, username, or email
   * @param {Object} options.filters - Filter criteria
   * @param {string} options.sortColumn - Column to sort by
   * @param {string} options.sortDirection - 'asc' or 'desc'
   * @returns {Promise<Object>} Object with data, total count, and pagination info
   */
  async getById(id) {
    try {
      const { data, error } = await supabase
        ?.from('creators')
        ?.select('*')
        ?.eq('id', id)
        ?.single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching creator by ID:', error);
      throw error;
    }
  },

  async getPaginated(options = {}) {
    try {
      const {
        page = 1,
        pageSize = 25,
        searchQuery = '',
        filters = {},
        sortColumn = 'created_at',
        sortDirection = 'desc'
      } = options;

      const offset = (page - 1) * pageSize;
      
      // Only select fields needed for table display
      const fields = [
        'id',
        'sr_no',
        'name',
        'instagram_link',
        'followers_tier',
        'state',
        'city',
        'whatsapp',
        'email',
        'gender',
        'username',
        'sheet_source'
      ].join(',');

      // Build query
      let query = supabase
        ?.from('creators')
        ?.select(fields, { count: 'exact' });

      // Apply universal search query - search across ALL columns in table
      if (searchQuery) {
        // Remove @ symbol from search query for username matching
        const cleanSearchQuery = searchQuery.replace('@', '');
        query = query?.or(
          `name.ilike.%${searchQuery}%,instagram_link.ilike.%${searchQuery}%,followers_tier.ilike.%${searchQuery}%,state.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%,whatsapp.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,username.ilike.%${cleanSearchQuery}%,sheet_source.ilike.%${searchQuery}%`
        );
      }

      // Apply filters
      if (filters?.city && filters?.city?.length > 0) {
        query = query?.in('city', filters?.city);
      }

      if (filters?.state && filters?.state?.length > 0) {
        query = query?.in('state', filters?.state);
      }

      if (filters?.followers_tier && filters?.followers_tier?.length > 0) {
        console.log('Applying followers_tier filter:', filters?.followers_tier);
        
        // Check if "Not Found" is in filters to handle NULL values
        const includesNotFound = filters?.followers_tier.some(val => 
          val?.toLowerCase().trim() === 'not found'
        );
        
        // Get all possible followers_tier values from database to check if all are selected
        try {
          const allPossibleValues = await this.getUniqueValues('followers_tier');
          const normalizedFilters = filters?.followers_tier.map(val => val?.toLowerCase().trim());
          const normalizedPossibleValues = allPossibleValues.map(val => val?.toLowerCase().trim()).filter(Boolean);
          
          // Add 'not found' to possible values if we're handling NULLs
          if (includesNotFound) {
            normalizedPossibleValues.push('not found');
          }
          
          // Check if all possible values are selected (allowing for minor variations)
          const allValuesSelected = normalizedPossibleValues.every(value => 
            normalizedFilters.some(filter => filter === value || value.includes(filter) || filter.includes(value))
          );
          
          console.log('All possible values:', normalizedPossibleValues);
          console.log('Selected filters:', normalizedFilters);
          console.log('All values selected:', allValuesSelected);
          
          // If all values are selected, don't apply filter to return complete dataset
          if (allValuesSelected && normalizedPossibleValues.length > 0) {
            console.log('All followers tiers selected - skipping filter to return all records');
          } else {
            // Build filter conditions for exact matching with case-insensitive comparison
            const filterConditions = [];
            
            // Add non-null conditions
            const nonNullFilters = normalizedFilters.filter(val => val !== 'not found');
            if (nonNullFilters.length > 0) {
              // Use exact matching with case-insensitive comparison
              nonNullFilters.forEach(val => {
                // Special handling for "0-10k" to catch variations
                if (val === '0-10k') {
                  filterConditions.push(`followers_tier.ilike.%0-10k%`);
                  filterConditions.push(`followers_tier.ilike.%0-10 K%`);
                  filterConditions.push(`followers_tier.ilike.%0-10K%`);
                } else {
                  filterConditions.push(`followers_tier.ilike.%${val}%`);
                }
              });
            }
            
            // Add NULL condition if "Not Found" is selected
            if (includesNotFound) {
              filterConditions.push('followers_tier.is.null');
            }
            
            if (filterConditions.length > 0) {
              query = query?.or(filterConditions.join(','));
              console.log('Applied filter conditions:', filterConditions);
            }
          }
        } catch (error) {
          console.log('Could not determine all possible values, applying filters normally');
          // Fallback to original logic if we can't get all values
          const normalizedFilters = filters?.followers_tier.map(val => val?.toLowerCase().trim());
          const filterConditions = [];
          
          normalizedFilters.forEach(val => {
            if (val === 'not found') {
              filterConditions.push('followers_tier.is.null');
            } else if (val === '0-10k') {
              // Special handling for "0-10k" variations
              filterConditions.push(`followers_tier.ilike.%0-10k%`);
              filterConditions.push(`followers_tier.ilike.%0-10 K%`);
              filterConditions.push(`followers_tier.ilike.%0-10K%`);
            } else {
              filterConditions.push(`followers_tier.ilike.%${val}%`);
            }
          });
          
          query = query?.or(filterConditions.join(','));
          console.log('Fallback filter conditions:', filterConditions);
        }
      }

      if (filters?.sheet_source && filters?.sheet_source?.length > 0) {
        query = query?.in('sheet_source', filters?.sheet_source);
      }

      // Apply sorting
      query = query?.order(sortColumn, { ascending: sortDirection === 'asc' });

      // Apply pagination
      query = query?.range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      // Debug logging for filtering results
      if (filters?.followers_tier && filters?.followers_tier?.length > 0) {
        console.log('=== FILTERING DEBUG ===');
        console.log('Applied filters:', filters?.followers_tier);
        console.log('Query result count:', count);
        console.log('Expected total count (from getCount):', await this.getCount());
        console.log('====================');
      }

      return {
        data: data || [],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize)
      };
    } catch (error) {
      console.error('Error fetching paginated creators:', error);
      throw error;
    }
  },

  async create(creatorData) {
    try {
      const { data, error } = await supabase
        ?.from('creators')
        ?.insert([creatorData])
        ?.select()
        ?.single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating creator:', error);
      throw error;
    }
  },

  async update(id, updateData) {
    try {
      const { data, error } = await supabase
        ?.from('creators')
        ?.update(updateData)
        ?.eq('id', id)
        ?.select()
        ?.single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating creator:', error);
      throw error;
    }
  },

  async delete(id) {
    try {
      const { error } = await supabase
        ?.from('creators')
        ?.delete()
        ?.eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting creator:', error);
      throw error;
    }
  },

  async bulkDelete(ids) {
    try {
      const { error } = await supabase
        ?.from('creators')
        ?.delete()
        ?.in('id', ids);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error bulk deleting creators:', error);
      throw error;
    }
  },

  async updateCreator(id, updateData) {
    try {
      const { data, error } = await supabase
        ?.from('creators')
        ?.update(updateData)
        ?.eq('id', id)
        ?.select()
        ?.single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating creator:', error);
      throw error;
    }
  },

  async bulkUpdate(ids, updateData) {
    try {
      const { data, error } = await supabase
        ?.from('creators')
        ?.update(updateData)
        ?.in('id', ids)
        ?.select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error bulk updating creators:', error);
      throw error;
    }
  }
};
