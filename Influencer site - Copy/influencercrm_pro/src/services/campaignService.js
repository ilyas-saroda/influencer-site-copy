import { supabase } from '../lib/supabase';

export const campaignService = {
  async getAll() {
    try {
      const { data, error } = await supabase?.from('campaigns')?.select(`
          *,
          campaign_creators (
            id,
            status,
            assigned_at,
            commission_rate,
            fixed_amount,
            total_value,
            payment_status,
            paid_amount,
            deliverables,
            completed_deliverables,
            actual_reach,
            actual_engagement,
            conversion_rate,
            notes,
            metadata,
            creators (
              id,
              name,
              email,
              instagram_handle,
              instagram_link,
              followers_count,
              followers_tier,
              engagement_rate,
              performance_score,
              niche,
              state,
              city,
              profile_image_url
            )
          )
        `)?.order('created_at', { ascending: false });

      if (error) {
        // Fallback: Try without relationship if junction table doesn't exist
        if (error?.message?.includes('relationship') || error?.message?.includes('schema cache')) {
          console.warn('⚠️ Campaign-creators relationship not found, fetching campaigns without creators');
          const { data: fallbackData, error: fallbackError } = await supabase?.from('campaigns')?.select('*')?.order('created_at', { ascending: false });
          if (fallbackError) throw fallbackError;
          return fallbackData || [];
        }
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      throw error;
    }
  },

  async getById(id) {
    try {
      const { data, error } = await supabase?.from('campaigns')?.select(`
          *,
          campaign_creators (
            id,
            status,
            assigned_at,
            commission_rate,
            fixed_amount,
            total_value,
            payment_status,
            paid_amount,
            deliverables,
            completed_deliverables,
            actual_reach,
            actual_engagement,
            conversion_rate,
            notes,
            metadata,
            creators (
              id,
              name,
              email,
              instagram_handle,
              instagram_link,
              followers_count,
              followers_tier,
              engagement_rate,
              performance_score,
              niche,
              state,
              city,
              profile_image_url
            )
          )
        `)?.eq('id', id)?.single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching campaign:', error);
      throw error;
    }
  },

  async create(campaignData) {
    try {
      const { data, error } = await supabase?.from('campaigns')?.insert([campaignData])?.select()?.single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating campaign:', error);
      throw error;
    }
  },

  async update(id, updates) {
    try {
      const { data, error } = await supabase?.from('campaigns')?.update(updates)?.eq('id', id)?.select()?.single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating campaign:', error);
      throw error;
    }
  },

  async delete(id) {
    try {
      const { error } = await supabase?.from('campaigns')?.delete()?.eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting campaign:', error);
      throw error;
    }
  },

  async bulkUpdateStatus(campaignIds, status) {
    try {
      const updates = campaignIds?.map(id => 
        supabase
          ?.from('campaigns')
          ?.update({ payment_status: status })
          ?.eq('id', id)
      );

      await Promise.all(updates);
      return true;
    } catch (error) {
      console.error('Error in bulk status update:', error);
      throw error;
    }
  }
};