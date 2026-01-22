import { supabase } from '../lib/supabase';

class DashboardService {
  async getDashboardSummary(months = 12) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No authenticated session found');
      }

      const { data, error } = await supabase.functions.invoke('admin-dashboard-summary', {
        body: { months },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        console.error('Dashboard service error:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      throw error;
    }
  }

  async refreshDashboard() {
    return this.getDashboardSummary();
  }
}

export const dashboardService = new DashboardService();
