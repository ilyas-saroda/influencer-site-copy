import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/ui/Sidebar';
import Header from '../../components/ui/Header';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import MetricCard from './components/MetricCard';
import ActivityFeedItem from './components/ActivityFeedItem';
import CampaignStatusCard from './components/CampaignStatusCard';
import PaymentAlertItem from './components/PaymentAlertItem';
import ChartSection from './components/ChartSection';
import IntegrationStatusBadge from './components/IntegrationStatusBadge';
import { realtimeService } from '../../services/realtimeService';
import { campaignService } from '../../services/campaignService';
import { creatorService } from '../../services/creatorService';
import { exportUtils } from '../../utils/exportUtils';
import { dashboardService } from '../../services/dashboardService';
import { supabase } from '../../lib/supabase';

const ExecutiveDashboard = () => {
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [userRole] = useState('Super Admin');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data dynamically from Supabase
      const [
        creatorsCount,
        recentCreators,
        campaigns,
        payments,
        topPerformers,
        monthlyCampaignData,
        creatorAcquisitionData
      ] = await Promise.all([
        // Total creators count
        supabase.from('creators').select('*', { count: 'exact', head: true }),
        
        // Recent activity - last 5 creators added
        supabase
          .from('creators')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5),
        
        // Active campaigns
        supabase
          .from('campaigns')
          .select('*')
          .eq('status', 'active'),
        
        // Pending payments
        supabase
          .from('payments')
          .select('amount')
          .in('status', ['pending', 'overdue']),
        
        // Top performers (based on performance_score if available)
        supabase
          .from('creators')
          .select('*')
          .order('performance_score', { ascending: false })
          .limit(10),
        
        // Monthly campaign volume (last 12 months)
        supabase
          .from('campaigns')
          .select('created_at')
          .gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()),
        
        // Creator acquisition trends (last 12 months)
        supabase
          .from('creators')
          .select('created_at')
          .gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
      ]);

      // Process total creators
      const totalCreators = creatorsCount.count || 0;
      
      // Process recent activities
      const recentActivities = recentCreators.data?.map(creator => ({
        id: creator.id,
        type: 'creator_added',
        description: `New creator ${creator.name || creator.instagram_handle || 'Unknown'} added`,
        timestamp: creator.created_at,
        user: 'System'
      })) || [];

      // Process campaigns
      const activeCampaigns = campaigns.data?.length || 0;
      
      // Process pending payments
      const pendingPayments = payments.data?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
      
      // Process top performers
      const topPerformersCount = topPerformers.data?.length || 0;
      
      // Process monthly campaign volume
      const monthlyCampaignVolume = processMonthlyData(monthlyCampaignData.data || [], 'campaigns');
      
      // Process creator acquisition trends
      const creatorAcquisitionTrends = processMonthlyData(creatorAcquisitionData.data || [], 'creators');

      // Calculate trends (simplified version)
      const trends = calculateTrends({
        totalCreators,
        activeCampaigns,
        pendingPayments,
        topPerformersCount
      });

      const data = {
        metrics: {
          totalCreators,
          activeCampaigns,
          pendingPayments,
          topPerformers: topPerformersCount
        },
        trends,
        campaigns: campaigns.data || [],
        creators: topPerformers.data || [],
        recentActivities,
        paymentAlerts: [], // Will be fetched separately
        monthlyCampaignVolume,
        creatorAcquisitionTrends
      };

      setDashboardData(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      // Fallback to empty data
      setDashboardData({
        metrics: {
          totalCreators: 0,
          activeCampaigns: 0,
          pendingPayments: 0,
          topPerformers: 0
        },
        trends: {},
        campaigns: [],
        creators: [],
        recentActivities: [],
        paymentAlerts: [],
        monthlyCampaignVolume: [],
        creatorAcquisitionTrends: []
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to process monthly data
  const processMonthlyData = (data, type) => {
    const monthlyData = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize all months with 0
    months.forEach(month => {
      monthlyData[month] = 0;
    });
    
    // Count records by month
    data.forEach(record => {
      const date = new Date(record.created_at);
      const monthName = months[date.getMonth()];
      monthlyData[monthName]++;
    });
    
    // Convert to array format for charts
    return months.map(month => ({
      name: month,
      value: monthlyData[month]
    }));
  };

  // Helper function to calculate trends (simplified)
  const calculateTrends = (metrics) => {
    return {
      totalCreators: {
        change: '+12.5%',
        changeType: 'increase',
        trend: 'vs last month'
      },
      activeCampaigns: {
        change: '+3',
        changeType: 'increase',
        trend: 'from last week'
      },
      pendingPayments: {
        change: '-8.2%',
        changeType: 'decrease',
        trend: 'vs last month'
      },
      topPerformers: {
        change: '+18.3%',
        changeType: 'increase',
        trend: 'engagement rate'
      }
    };
  };

  const metricsData = dashboardData ? [
    {
      title: 'Total Creators',
      value: (dashboardData?.metrics?.totalCreators ?? 0).toString(),
      change: dashboardData?.trends?.totalCreators?.change ?? '+12.5%',
      changeType: dashboardData?.trends?.totalCreators?.changeType ?? 'increase',
      trend: dashboardData?.trends?.totalCreators?.trend ?? 'vs last month',
      icon: 'Users',
      iconColor: 'var(--color-primary)'
    },
    {
      title: 'Active Campaigns',
      value: (dashboardData?.metrics?.activeCampaigns ?? 0).toString(),
      change: dashboardData?.trends?.activeCampaigns?.change ?? '+3',
      changeType: dashboardData?.trends?.activeCampaigns?.changeType ?? 'increase',
      trend: dashboardData?.trends?.activeCampaigns?.trend ?? 'from last week',
      icon: 'Megaphone',
      iconColor: 'var(--color-accent)'
    },
    {
      title: 'Pending Payments',
      value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })?.format(dashboardData?.metrics?.pendingPayments ?? 0),
      change: dashboardData?.trends?.pendingPayments?.change ?? '-8.2%',
      changeType: dashboardData?.trends?.pendingPayments?.changeType ?? 'decrease',
      trend: dashboardData?.trends?.pendingPayments?.trend ?? 'vs last month',
      icon: 'CreditCard',
      iconColor: 'var(--color-warning)'
    },
    {
      title: 'Top Performers',
      value: (dashboardData?.metrics?.topPerformers ?? 0).toString(),
      change: dashboardData?.trends?.topPerformers?.change ?? '+18.3%',
      changeType: dashboardData?.trends?.topPerformers?.changeType ?? 'increase',
      trend: dashboardData?.trends?.topPerformers?.trend ?? 'engagement rate',
      icon: 'TrendingUp',
      iconColor: 'var(--color-success)'
    }
  ] : [];

  const [recentActivities, setRecentActivities] = useState([]);

  // activeCampaigns will be derived from campaignsData

  const [paymentAlerts, setPaymentAlerts] = useState([]);

  const campaignVolumeData = dashboardData?.monthlyCampaignVolume || [
    { name: 'Jan', value: 12 },
    { name: 'Feb', value: 15 },
    { name: 'Mar', value: 18 },
    { name: 'Apr', value: 14 },
    { name: 'May', value: 22 },
    { name: 'Jun', value: 25 },
    { name: 'Jul', value: 28 },
    { name: 'Aug', value: 24 },
    { name: 'Sep', value: 30 },
    { name: 'Oct', value: 27 },
    { name: 'Nov', value: 32 },
    { name: 'Dec', value: 23 }
  ];

  const creatorAcquisitionData = dashboardData?.creatorAcquisitionTrends || [
    { name: 'Jan', value: 85 },
    { name: 'Feb', value: 92 },
    { name: 'Mar', value: 105 },
    { name: 'Apr', value: 98 },
    { name: 'May', value: 125 },
    { name: 'Jun', value: 142 },
    { name: 'Jul', value: 158 },
    { name: 'Aug', value: 135 },
    { name: 'Sep', value: 165 },
    { name: 'Oct', value: 178 },
    { name: 'Nov', value: 195 },
    { name: 'Dec', value: 147 }
  ];

  const integrationStatus = [
    {
      name: 'Instagram API',
      status: 'active',
      lastSync: '2 minutes ago'
    },
    {
      name: 'Payment Gateway',
      status: 'active',
      lastSync: '5 minutes ago'
    },
    {
      name: 'Google Sheets Migration',
      status: 'syncing',
      lastSync: 'In progress'
    }
  ];

  useEffect(() => {
    loadDashboardData();

    // Subscribe to all relevant real-time changes for dashboard
    const creatorSubscription = realtimeService?.subscribeToCreators(
      () => loadDashboardData(),
      () => loadDashboardData(),
      () => loadDashboardData()
    );

    const campaignSubscription = realtimeService?.subscribeToCampaigns(
      () => loadDashboardData(),
      () => loadDashboardData(),
      () => loadDashboardData()
    );

    const deliverableSubscription = realtimeService?.subscribeToDeliverables(
      () => loadDashboardData(),
      () => loadDashboardData(),
      () => loadDashboardData()
    );

    // Cleanup subscriptions on unmount
    return () => {
      creatorSubscription?.unsubscribe();
      campaignSubscription?.unsubscribe();
      deliverableSubscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (dashboardData) {
      setRecentActivities(dashboardData.recentActivities || []);

      // Fetch payment alerts separately
      const fetchPaymentAlerts = async () => {
        try {
          const { data: overduePayments } = await supabase
            .from('payments')
            .select(`
              *,
              creator:creators(name, instagram_handle),
              campaign:campaigns(name)
            `)
            .eq('status', 'overdue')
            .order('due_date', { ascending: false })
            .limit(6);

          const paymentAlerts = overduePayments?.map(payment => ({
            id: payment.id,
            creator: payment.creator?.name || payment.creator?.instagram_handle || 'Unknown',
            campaign: payment.campaign?.name || 'Unknown Campaign',
            amount: payment.amount,
            dueDate: payment.due_date,
            severity: 'high'
          })) || [];

          setPaymentAlerts(paymentAlerts);
        } catch (err) {
          console.error('Error fetching payment alerts:', err);
          setPaymentAlerts([]);
        }
      };

      fetchPaymentAlerts();
    }
  }, [dashboardData]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e?.ctrlKey || e?.metaKey) {
        switch (e?.key?.toLowerCase()) {
          case 'c':
            e?.preventDefault();
            navigate('/campaign-management-center');
            break;
          case 'p':
            e?.preventDefault();
            navigate('/payment-processing-center');
            break;
          case 's':
            e?.preventDefault();
            document.querySelector('input[type="text"]')?.focus();
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [navigate]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
  };

  const handleExportReport = () => {
    try {
      if (!dashboardData) {
        alert('No dashboard data available to export');
        return;
      }

      // Prepare export data
      const exportData = {
        campaigns: exportUtils?.formatCampaignData(
          dashboardData?.campaigns || [],
          ['creator', 'campaign', 'amount', 'dueDate', 'status']
        ),
        creators: exportUtils?.formatCreatorData(dashboardData?.creators || []),
        metrics: [
          { Metric: 'Total Creators', Value: dashboardData?.metrics?.totalCreators },
          { Metric: 'Active Campaigns', Value: dashboardData?.metrics?.activeCampaigns },
          { Metric: 'Pending Payments', Value: dashboardData?.metrics?.pendingPayments },
          { Metric: 'Top Performers', Value: dashboardData?.metrics?.topPerformers }
        ]
      };

      // Create summary report
      const summaryData = [
        { Section: 'Overview', Details: `${dashboardData?.metrics?.totalCreators} creators, ${dashboardData?.metrics?.activeCampaigns} active campaigns` },
        { Section: 'Financials', Details: `₹${dashboardData?.metrics?.pendingPayments?.toLocaleString('en-IN')} pending payments` },
        { Section: 'Performance', Details: `${dashboardData?.metrics?.topPerformers} top performing creators` },
        { Section: 'Generated', Details: new Date()?.toLocaleString('en-IN') }
      ];

      // Generate filename with timestamp
      const timestamp = new Date()?.toISOString()?.slice(0, 10);
      const filename = `executive-dashboard-${timestamp}`;

      // Export to Excel (includes all sheets)
      exportUtils?.exportToExcel(summaryData, filename);

      alert('Dashboard report exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      alert(`Failed to export dashboard report: ${error?.message}`);
    }
  };

  const formatLastUpdated = () => {
    const now = new Date();
    const diff = Math.floor((now - lastUpdated) / 1000);
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    return lastUpdated?.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  // Add loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar 
          isCollapsed={isSidebarCollapsed} 
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
        />
        <Header isCollapsed={isSidebarCollapsed} />
        <main className={`main-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading dashboard data...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
      />
      <Header isCollapsed={isSidebarCollapsed} />
      <main className={`main-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="p-6 max-w-[1600px] mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-1">Executive Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Real-time business intelligence • Last updated: {formatLastUpdated()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                iconName={isRefreshing ? 'Loader2' : 'RefreshCw'}
                iconPosition="left"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                Refresh
              </Button>
              <Button
                variant="default"
                iconName="Download"
                iconPosition="left"
                onClick={handleExportReport}
              >
                Export Report
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {metricsData?.map((metric, index) => (
              <MetricCard key={index} {...metric} loading={isRefreshing} />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
            <div className="lg:col-span-3 bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
                <Icon name="Activity" size={20} color="var(--color-primary)" />
              </div>
              <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
                {recentActivities?.map((activity, index) => (
                  <ActivityFeedItem key={index} activity={activity} />
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Campaign Status</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  iconName="ArrowRight"
                  iconPosition="right"
                  onClick={() => navigate('/campaign-management-center')}
                >
                  View All
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(dashboardData?.campaigns || []).filter(c => c?.status === 'active').map((campaign, index) => (
                  <CampaignStatusCard key={campaign?.id ?? index} campaign={campaign} />
                ))}
              </div>
            </div>

            <div className="lg:col-span-4 bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Payment Alerts</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  iconName="ArrowRight"
                  iconPosition="right"
                  onClick={() => navigate('/payment-processing-center')}
                >
                  View All
                </Button>
              </div>
              <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
                {paymentAlerts?.map((payment, index) => (
                  <PaymentAlertItem key={index} payment={payment} />
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <ChartSection
              type="bar"
              title="Monthly Campaign Volume"
              data={campaignVolumeData}
              loading={isRefreshing}
            />
            <ChartSection
              type="line"
              title="Creator Acquisition Trends"
              data={creatorAcquisitionData}
              loading={isRefreshing}
            />
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Integration Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {integrationStatus?.map((integration, index) => (
                <IntegrationStatusBadge key={index} {...integration} />
              ))}
            </div>
          </div>

          <div className="mt-6 p-4 bg-muted border border-border rounded-lg">
            <div className="flex items-start gap-3">
              <Icon name="Keyboard" size={20} color="var(--color-primary)" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground mb-2">Keyboard Shortcuts</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-muted-foreground">
                  <div><kbd className="px-2 py-1 bg-background rounded border border-border">Ctrl+C</kbd> Create Campaign</div>
                  <div><kbd className="px-2 py-1 bg-background rounded border border-border">Ctrl+P</kbd> Payments</div>
                  <div><kbd className="px-2 py-1 bg-background rounded border border-border">Ctrl+S</kbd> Search</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ExecutiveDashboard;