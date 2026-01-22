// Test script to verify Executive Dashboard data fetching
// Run this in browser console or as a Node.js script

const testDashboardData = async () => {
  console.log('🔍 Testing Executive Dashboard Data Fetching...\n');

  try {
    // Import supabase (adjust path as needed)
    const { supabase } = await import('./src/lib/supabase.js');

    // Test 1: Total Creators Count
    console.log('📊 Test 1: Total Creators Count');
    const { count: totalCreators, error: creatorsError } = await supabase
      .from('creators')
      .select('*', { count: 'exact', head: true });
    
    if (creatorsError) {
      console.error('❌ Creators count error:', creatorsError);
    } else {
      console.log(`✅ Total Creators: ${totalCreators}`);
    }

    // Test 2: Recent Activity (Last 5 Creators)
    console.log('\n📝 Test 2: Recent Activity (Last 5 Creators)');
    const { data: recentCreators, error: recentError } = await supabase
      .from('creators')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentError) {
      console.error('❌ Recent creators error:', recentError);
    } else {
      console.log(`✅ Recent Creators: ${recentCreators?.length || 0} found`);
      recentCreators?.forEach((creator, index) => {
        console.log(`   ${index + 1}. ${creator.name || creator.instagram_handle || 'Unknown'} - ${new Date(creator.created_at).toLocaleDateString()}`);
      });
    }

    // Test 3: Active Campaigns
    console.log('\n🚀 Test 3: Active Campaigns');
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('status', 'active');

    if (campaignsError) {
      console.error('❌ Campaigns error:', campaignsError);
    } else {
      console.log(`✅ Active Campaigns: ${campaigns?.length || 0}`);
      campaigns?.forEach((campaign, index) => {
        console.log(`   ${index + 1}. ${campaign.name || 'Unnamed Campaign'}`);
      });
    }

    // Test 4: Pending Payments
    console.log('\n💰 Test 4: Pending Payments');
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('amount')
      .in('status', ['pending', 'overdue']);

    if (paymentsError) {
      console.error('❌ Payments error:', paymentsError);
    } else {
      const totalPending = payments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
      console.log(`✅ Pending Payments: ${payments?.length || 0} payments totaling ₹${totalPending.toLocaleString('en-IN')}`);
    }

    // Test 5: Top Performers
    console.log('\n⭐ Test 5: Top Performers');
    const { data: topPerformers, error: performersError } = await supabase
      .from('creators')
      .select('*')
      .order('performance_score', { ascending: false })
      .limit(10);

    if (performersError) {
      console.error('❌ Top performers error:', performersError);
    } else {
      console.log(`✅ Top Performers: ${topPerformers?.length || 0} found`);
      topPerformers?.forEach((creator, index) => {
        const score = creator.performance_score || 'N/A';
        const name = creator.name || creator.instagram_handle || 'Unknown';
        console.log(`   ${index + 1}. ${name} - Score: ${score}`);
      });
    }

    // Test 6: Monthly Campaign Volume (Last 12 Months)
    console.log('\n📈 Test 6: Monthly Campaign Volume (Last 12 Months)');
    const twelveMonthsAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
    const { data: monthlyCampaigns, error: monthlyCampaignsError } = await supabase
      .from('campaigns')
      .select('created_at')
      .gte('created_at', twelveMonthsAgo);

    if (monthlyCampaignsError) {
      console.error('❌ Monthly campaigns error:', monthlyCampaignsError);
    } else {
      console.log(`✅ Campaigns in last 12 months: ${monthlyCampaigns?.length || 0}`);
      
      // Group by month
      const monthlyData = {};
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      months.forEach(month => monthlyData[month] = 0);
      
      monthlyCampaigns?.forEach(campaign => {
        const date = new Date(campaign.created_at);
        const monthName = months[date.getMonth()];
        monthlyData[monthName]++;
      });
      
      console.log('   Monthly Breakdown:');
      months.forEach(month => {
        if (monthlyData[month] > 0) {
          console.log(`     ${month}: ${monthlyData[month]} campaigns`);
        }
      });
    }

    // Test 7: Creator Acquisition Trends (Last 12 Months)
    console.log('\n👥 Test 7: Creator Acquisition Trends (Last 12 Months)');
    const { data: creatorAcquisitions, error: acquisitionError } = await supabase
      .from('creators')
      .select('created_at')
      .gte('created_at', twelveMonthsAgo);

    if (acquisitionError) {
      console.error('❌ Creator acquisitions error:', acquisitionError);
    } else {
      console.log(`✅ Creators added in last 12 months: ${creatorAcquisitions?.length || 0}`);
      
      // Group by month
      const acquisitionData = {};
      months.forEach(month => acquisitionData[month] = 0);
      
      creatorAcquisitions?.forEach(creator => {
        const date = new Date(creator.created_at);
        const monthName = months[date.getMonth()];
        acquisitionData[monthName]++;
      });
      
      console.log('   Monthly Breakdown:');
      months.forEach(month => {
        if (acquisitionData[month] > 0) {
          console.log(`     ${month}: ${acquisitionData[month]} creators`);
        }
      });
    }

    // Test 8: Payment Alerts (Overdue Payments)
    console.log('\n⚠️ Test 8: Payment Alerts (Overdue Payments)');
    const { data: overduePayments, error: overdueError } = await supabase
      .from('payments')
      .select(`
        *,
        creator:creators(name, instagram_handle),
        campaign:campaigns(name)
      `)
      .eq('status', 'overdue')
      .order('due_date', { ascending: false })
      .limit(6);

    if (overdueError) {
      console.error('❌ Overdue payments error:', overdueError);
    } else {
      console.log(`✅ Overdue Payments: ${overduePayments?.length || 0} alerts`);
      overduePayments?.forEach((payment, index) => {
        const creator = payment.creator?.name || payment.creator?.instagram_handle || 'Unknown';
        const campaign = payment.campaign?.name || 'Unknown Campaign';
        console.log(`   ${index + 1}. ${creator} - ₹${payment.amount?.toLocaleString('en-IN')} for "${campaign}"`);
      });
    }

    console.log('\n🎉 Dashboard Data Testing Complete!');
    console.log('✨ All metrics are now dynamically fetched from Supabase tables');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Export for use in different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = testDashboardData;
} else {
  // Browser environment
  window.testDashboardData = testDashboardData;
  console.log('💡 Run testDashboardData() in console to test dashboard data fetching');
}
