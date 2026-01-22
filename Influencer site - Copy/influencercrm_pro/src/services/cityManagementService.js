import { supabase } from '../lib/supabase';
import { mockStates, mockAuditLogs } from '../lib/mockData';
import { enhancedFuzzyMatch, batchProcessStates } from '../utils/fuzzyMatching';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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

class CityManagementService {
  constructor() {
    this.isSupabaseAvailable = this.checkSupabaseAvailability();
  }

  checkSupabaseAvailability() {
    try {
      return !!(supabase && import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
    } catch (error) {
      console.warn('⚠️ Supabase not available, using mock data:', error);
      return false;
    }
  }

  async getUncleanedCities() {
    if (!this.isSupabaseAvailable) {
      console.log('📋 Using mock cities data');
      return mockStates;
    }

    try {
      // Try RPC function first
      const { data, error } = await supabase.rpc('get_unique_column_values', { 
        column_name: 'city' 
      });
      
      if (error) {
        console.warn('⚠️ RPC failed, trying direct query:', error);
        // Fallback to direct query
        const { data: directData, error: directError } = await supabase
          .from('creators')
          .select('city')
          .not('isnull', 'city', true);
        
        if (directError) {
          console.error('❌ Direct query also failed:', directError);
          throw directError;
        }
        
        const uniqueCities = [...new Set(directData.map(item => item.city))];
        return uniqueCities.filter(city => 
          city && city.trim() !== '' && 
          !STANDARD_INDIAN_CITIES.includes(city)
        );
      }
      
      return data || [];
    } catch (error) {
      console.error('❌ Error fetching uncleaned cities:', error);
      // Return mock data as fallback
      return mockStates;
    }
  }

  filterUncleanedCities(cities) {
    return cities.filter(city => 
      !STANDARD_INDIAN_CITIES.includes(city)
    );
  }

  async bulkUpdateCityNames(mappings, auditContext = null) {
    console.log('🔄 Direct update:', mappings);

    if (!this.isSupabaseAvailable) {
      console.log('✅ Mock success');
      return {
        success: true,
        total_updated: mappings.length,
        results: mappings.map(mapping => ({
          uncleaned_city: mapping.uncleanedCity,
          standard_city: mapping.standardCity,
          updated_count: 1,
          status: 'success'
        }))
      };
    }

    try {
      let totalUpdated = 0;
      
      for (const mapping of mappings) {
        const { data, error } = await supabase
          .from('creators')
          .update({ 
            city: mapping.standardCity
          })
          .eq('city', mapping.uncleanedCity);
          
        if (!error) {
          totalUpdated += (data?.length || 0);
          console.log('✅ Updated:', mapping.uncleanedCity, '→', mapping.standardCity);
        }
      }
      
      return {
        success: true,
        total_updated: totalUpdated,
        results: mappings.map(mapping => ({
          uncleaned_city: mapping.uncleanedCity,
          standard_city: mapping.standardCity,
          updated_count: 1,
          status: 'success'
        }))
      };
      
    } catch (error) {
      console.error('❌ Update error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async bulkUpdateCityNamesWithManualAudit(mappings, auditContext) {
    if (!this.isSupabaseAvailable) {
      console.log('📋 Mock bulk update with manual audit:', mappings);
      return {
        success: true,
        transaction_id: 'mock-txn-' + Date.now(),
        total_updated: mappings.length,
        results: mappings.map(mapping => ({
          uncleaned_city: mapping.uncleanedCity,
          standard_city: mapping.standardCity,
          updated_count: Math.floor(Math.random() * 10) + 1,
          status: 'success'
        }))
      };
    }

    try {
      // First perform the bulk update
      const updateResult = await this.bulkUpdateCityNames(mappings);
      
      if (updateResult.success) {
        // Then manually log the audit
        const auditData = mappings.map(mapping => ({
          action_type: 'CITY_MAPPING_UPDATE',
          table_name: 'creators',
          record_id: mapping.uncleanedCity,
          old_value: mapping.uncleanedCity,
          new_value: mapping.standardCity,
          changed_by: auditContext.userId,
          user_email: auditContext.userEmail,
          metadata: {
            confidence: mapping.confidence,
            autoSelected: mapping.autoSelected || false,
            transaction_id: updateResult.transaction_id
          }
        }));

        // Insert audit logs
        const { error: auditError } = await supabase
          .from('audit_logs')
          .insert(auditData);

        if (auditError) {
          console.warn('⚠️ Manual audit logging failed:', auditError);
        }
      }

      return updateResult;
    } catch (error) {
      console.error('❌ Error in bulk update with manual audit:', error);
      throw error;
    }
  }
}

export const cityManagementService = new CityManagementService();
