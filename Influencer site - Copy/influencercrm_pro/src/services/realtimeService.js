import { supabase } from '../lib/supabase';

/**
 * Real-time Service - Provides real-time database subscription functionality
 * for all tables in the application
 */
export const realtimeService = {
  /**
   * Subscribe to changes on creators table
   * @param {Function} onInsert - Callback for INSERT events
   * @param {Function} onUpdate - Callback for UPDATE events
   * @param {Function} onDelete - Callback for DELETE events
   * @returns {Object} Channel object with unsubscribe method
   */
  subscribeToCreators(onInsert, onUpdate, onDelete) {
    const channel = supabase?.channel('creators_changes')?.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'creators'
        },
        (payload) => {
          if (onInsert) {
            // Convert snake_case to camelCase
            const creator = {
              id: payload?.new?.id,
              name: payload?.new?.name,
              email: payload?.new?.email,
              username: payload?.new?.username,
              instagramLink: payload?.new?.instagram_link,
              whatsapp: payload?.new?.whatsapp,
              city: payload?.new?.city,
              state: payload?.new?.state,
              gender: payload?.new?.gender,
              followersTier: payload?.new?.followers_tier,
              sheetSource: payload?.new?.sheet_source,
              srNo: payload?.new?.sr_no,
              createdAt: payload?.new?.created_at
            };
            onInsert(creator);
          }
        }
      )?.on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'creators'
        },
        (payload) => {
          if (onUpdate) {
            const creator = {
              id: payload?.new?.id,
              name: payload?.new?.name,
              email: payload?.new?.email,
              username: payload?.new?.username,
              instagramLink: payload?.new?.instagram_link,
              whatsapp: payload?.new?.whatsapp,
              city: payload?.new?.city,
              state: payload?.new?.state,
              gender: payload?.new?.gender,
              followersTier: payload?.new?.followers_tier,
              sheetSource: payload?.new?.sheet_source,
              srNo: payload?.new?.sr_no,
              createdAt: payload?.new?.created_at
            };
            onUpdate(creator);
          }
        }
      )?.on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'creators'
        },
        (payload) => {
          if (onDelete) {
            onDelete(payload?.old?.id);
          }
        }
      )?.subscribe();

    return {
      unsubscribe: () => supabase?.removeChannel(channel)
    };
  },

  /**
   * Subscribe to changes on campaigns table
   * @param {Function} onInsert - Callback for INSERT events
   * @param {Function} onUpdate - Callback for UPDATE events
   * @param {Function} onDelete - Callback for DELETE events
   * @returns {Object} Channel object with unsubscribe method
   */
  subscribeToCampaigns(onInsert, onUpdate, onDelete) {
    const channel = supabase?.channel('campaigns_changes')?.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'campaigns'
        },
        (payload) => {
          if (onInsert) {
            const campaign = {
              id: payload?.new?.id,
              name: payload?.new?.name,
              campaignName: payload?.new?.campaign_name,
              brand: payload?.new?.brand,
              brandName: payload?.new?.brand_name,
              creatorId: payload?.new?.creator_id,
              amount: payload?.new?.amount,
              agreedAmount: payload?.new?.agreed_amount,
              paymentStatus: payload?.new?.payment_status,
              deliverables: payload?.new?.deliverables,
              startDate: payload?.new?.start_date,
              endDate: payload?.new?.end_date,
              createdAt: payload?.new?.created_at
            };
            onInsert(campaign);
          }
        }
      )?.on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'campaigns'
        },
        (payload) => {
          if (onUpdate) {
            const campaign = {
              id: payload?.new?.id,
              name: payload?.new?.name,
              campaignName: payload?.new?.campaign_name,
              brand: payload?.new?.brand,
              brandName: payload?.new?.brand_name,
              creatorId: payload?.new?.creator_id,
              amount: payload?.new?.amount,
              agreedAmount: payload?.new?.agreed_amount,
              paymentStatus: payload?.new?.payment_status,
              deliverables: payload?.new?.deliverables,
              startDate: payload?.new?.start_date,
              endDate: payload?.new?.end_date,
              createdAt: payload?.new?.created_at
            };
            onUpdate(campaign);
          }
        }
      )?.on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'campaigns'
        },
        (payload) => {
          if (onDelete) {
            onDelete(payload?.old?.id);
          }
        }
      )?.subscribe();

    return {
      unsubscribe: () => supabase?.removeChannel(channel)
    };
  },

  /**
   * Subscribe to changes on campaign_deliverables table
   * @param {Function} onInsert - Callback for INSERT events
   * @param {Function} onUpdate - Callback for UPDATE events
   * @param {Function} onDelete - Callback for DELETE events
   * @returns {Object} Channel object with unsubscribe method
   */
  subscribeToDeliverables(onInsert, onUpdate, onDelete) {
    const channel = supabase?.channel('deliverables_changes')?.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'campaign_deliverables'
        },
        (payload) => {
          if (onInsert) {
            const deliverable = {
              id: payload?.new?.id,
              campaignId: payload?.new?.campaign_id,
              deliverableType: payload?.new?.deliverable_type,
              status: payload?.new?.status,
              dueDate: payload?.new?.due_date,
              postedDate: payload?.new?.posted_date,
              postLink: payload?.new?.post_link,
              revisionRequired: payload?.new?.revision_required,
              createdAt: payload?.new?.created_at
            };
            onInsert(deliverable);
          }
        }
      )?.on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'campaign_deliverables'
        },
        (payload) => {
          if (onUpdate) {
            const deliverable = {
              id: payload?.new?.id,
              campaignId: payload?.new?.campaign_id,
              deliverableType: payload?.new?.deliverable_type,
              status: payload?.new?.status,
              dueDate: payload?.new?.due_date,
              postedDate: payload?.new?.posted_date,
              postLink: payload?.new?.post_link,
              revisionRequired: payload?.new?.revision_required,
              createdAt: payload?.new?.created_at
            };
            onUpdate(deliverable);
          }
        }
      )?.on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'campaign_deliverables'
        },
        (payload) => {
          if (onDelete) {
            onDelete(payload?.old?.id);
          }
        }
      )?.subscribe();

    return {
      unsubscribe: () => supabase?.removeChannel(channel)
    };
  },

  /**
   * Generic subscribe to any table
   * @param {string} tableName - Name of the table to subscribe to
   * @param {Function} onChange - Callback function that receives the payload
   * @returns {Object} Channel object with unsubscribe method
   */
  subscribeToTable(tableName, onChange) {
    const channel = supabase?.channel(`${tableName}_changes`)?.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName
        },
        (payload) => {
          if (onChange) {
            onChange(payload);
          }
        }
      )?.subscribe();

    return {
      unsubscribe: () => supabase?.removeChannel(channel)
    };
  }
};