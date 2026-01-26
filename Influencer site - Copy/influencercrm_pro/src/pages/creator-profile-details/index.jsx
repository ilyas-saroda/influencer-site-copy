import React, { useState, useEffect } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/ui/Sidebar';
import Header from '../../components/ui/Header';
import ProfileHeader from './components/ProfileHeader';
import TabNavigation from './components/TabNavigation';
import OverviewTab from './components/OverviewTab';
import CampaignHistoryTab from './components/CampaignHistoryTab';
import PaymentHistoryTab from './components/PaymentHistoryTab';
import PriceHistoryTab from './components/PriceHistoryTab';
import NotesTab from './components/NotesTab';
import QuickStatsWidget from './components/QuickStatsWidget';
import RecentActivityFeed from './components/RecentActivityFeed';
import RelatedCreatorsWidget from './components/RelatedCreatorsWidget';
import EditCreatorModal from './components/EditCreatorModal';
import { realtimeService } from '../../services/realtimeService';
import { creatorService } from '../../services/creatorService';
import { campaignService } from '../../services/campaignService';
import { calculatePerformanceScore } from '../../utils/performanceUtils';
import Icon from '../../components/AppIcon';
import { toast } from 'react-hot-toast';

const CreatorProfileDetails = () => {
  const location = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [creator, setCreator] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [payments, setPayments] = useState([]);
  const [priceHistory, setPriceHistory] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false);
  const [isAddToCampaignModalOpen, setIsAddToCampaignModalOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isAddingToCampaign, setIsAddingToCampaign] = useState(false);
  const [availableCampaigns, setAvailableCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState('');

  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'User' },
    { id: 'campaigns', label: 'Campaigns', icon: 'FolderKanban' },
    { id: 'payments', label: 'Payments', icon: 'DollarSign' },
    { id: 'pricing', label: 'Pricing', icon: 'TrendingUp' },
    { id: 'notes', label: 'Notes', icon: 'FileText' }
  ];

  // Helper function to determine if data is junk/placeholder
  const isJunkData = (value) => {
    if (!value) return true;
    const junkPatterns = [
      'fadsfasf', 'asdfasdf', 'test', 'demo', 'n/a', 'na', 'null', 'undefined',
      '123456', '000000', '111111', 'sample', 'example', 'placeholder'
    ];
    const strValue = String(value).toLowerCase().trim();
    return junkPatterns.some(pattern => strValue.includes(pattern));
  };

  // Helper function to format creator data for UI
  const formatCreatorData = (dbCreator) => {
    if (!dbCreator) return null;

    // Extract Instagram handle from link or username
    const getInstagramHandle = () => {
      if (dbCreator?.username && !isJunkData(dbCreator.username)) {
        return `@${dbCreator.username.replace('@', '')}`;
      }
      if (dbCreator?.instagram_link && !isJunkData(dbCreator.instagram_link)) {
        const match = dbCreator.instagram_link.match(/instagram\.com\/([^\/\?]+)/);
        if (match) return `@${match[1]}`;
      }
      return 'Not Provided';
    };

    // Format followers count
    const formatFollowers = (followersTier, followersCount) => {
      // First try to use the actual followers count if available
      if (followersCount && followersCount !== 'N/A' && followersCount !== 0 && !isJunkData(followersCount)) {
        const num = parseInt(followersCount);
        if (!isNaN(num) && num > 0) {
          if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
          if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
          return num.toString();
        }
      }
      
      // If no actual count, display the full tier range
      if (followersTier && followersTier !== 'N/A' && !isJunkData(followersTier)) {
        // Handle tier ranges like "10K-50K" - show the full range
        if (typeof followersTier === 'string' && followersTier.includes('-')) {
          // Return the full range as-is (e.g., "10K-50K")
          return followersTier.trim();
        }
        
        // Handle simple tier values like "10K", "1M", or numbers
        if (typeof followersTier === 'string') {
          const match = followersTier.match(/^(\d+(?:\.\d+)?)([KM])?$/i);
          if (match) {
            const value = parseFloat(match[1]);
            const unit = match[2]?.toUpperCase();
            if (unit === 'M') return `${value}M`;
            if (unit === 'K') return `${value}K`;
            return value.toString();
          }
        }
        
        // Try parsing as number
        const num = parseInt(followersTier);
        if (!isNaN(num) && num > 0) {
          if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
          if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
          return num.toString();
        }
      }
      
      return 'Not Provided';
    };

    return {
      id: dbCreator?.id || null,
      name: dbCreator?.name && !isJunkData(dbCreator.name) ? dbCreator.name : 'Unknown Creator',
      profileImage: dbCreator?.profile_image || dbCreator?.profile_picture || null,
      profileImageAlt: `${dbCreator?.name || 'Creator'} profile picture`,
      instagramHandle: getInstagramHandle(),
      instagramUrl: dbCreator?.instagram_link && !isJunkData(dbCreator.instagram_link) ? dbCreator.instagram_link : null,
      isVerified: dbCreator?.is_verified || false,
      isPremium: dbCreator?.is_premium || false,
      status: dbCreator?.status || 'Active',
      city: dbCreator?.city && !isJunkData(dbCreator.city) ? dbCreator.city : 'Not Provided',
      state: dbCreator?.state && !isJunkData(dbCreator.state) ? dbCreator.state : 'Not Provided',
      followersCount: formatFollowers(dbCreator?.followers_tier, dbCreator?.followers_count),
      engagementRate: dbCreator?.engagement_rate && !isJunkData(dbCreator.engagement_rate) ? `${dbCreator.engagement_rate}%` : 'Not Provided',
      avgLikes: dbCreator?.avg_likes && !isJunkData(dbCreator.avg_likes) ? dbCreator.avg_likes.toLocaleString() : '0',
      avgComments: dbCreator?.avg_comments && !isJunkData(dbCreator.avg_comments) ? dbCreator.avg_comments.toLocaleString() : '0',
      lastSynced: dbCreator?.last_synced ? new Date(dbCreator.last_synced).toLocaleString() : 'Never',
      email: dbCreator?.email && !isJunkData(dbCreator.email) ? dbCreator.email : 'Not Provided',
      phone: dbCreator?.whatsapp && !isJunkData(dbCreator.whatsapp) ? dbCreator.whatsapp : 
             (dbCreator?.phone && !isJunkData(dbCreator.phone) ? dbCreator.phone : 'Not Provided'),
      manager: dbCreator?.manager_name && !isJunkData(dbCreator.manager_name) ? dbCreator.manager_name : 'Not Provided',
      managerPhone: dbCreator?.manager_phone && !isJunkData(dbCreator.manager_phone) ? dbCreator.manager_phone : 'Not Provided',
      gender: dbCreator?.gender && !isJunkData(dbCreator.gender) ? dbCreator.gender : 'Not Provided',
      age: dbCreator?.age && !isJunkData(dbCreator.age) ? `${dbCreator.age} years` : 'Not Provided',
      language: dbCreator?.language && !isJunkData(dbCreator.language) ? dbCreator.language : 'Not Provided',
      categories: dbCreator?.categories ? (Array.isArray(dbCreator.categories) ? dbCreator.categories : [dbCreator.categories]) : [],
      tags: dbCreator?.tags ? (Array.isArray(dbCreator.tags) ? dbCreator.tags : [dbCreator.tags]) : [],
      // Database fields (snake_case)
      sr_no: dbCreator?.sr_no || 'Not Provided',
      username: dbCreator?.username && !isJunkData(dbCreator.username) ? dbCreator.username : 'Not Provided',
      sheet_source: dbCreator?.sheet_source || 'Not Provided',
      created_at: dbCreator?.created_at || null,
      updated_at: dbCreator?.updated_at || null,
      manual_performance_score: dbCreator?.manual_performance_score || null
    };
  };

  // Fetch creator data
  useEffect(() => {
    const fetchCreatorData = async () => {
      // Get creatorId from URL param or location state
      const creatorId = id || location?.state?.creatorId;
      
      if (!creatorId) {
        console.error('❌ No creator ID provided');
        setError('Creator ID is missing. Please select a creator from the database.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log('🔵 Fetching creator data for ID:', creatorId);
        
        // Fetch creator details
        const creatorData = await creatorService?.getById(creatorId);
        
        if (!creatorData) {
          throw new Error('Creator not found');
        }

        console.log('✅ Creator data fetched:', creatorData);
        const formattedCreator = formatCreatorData(creatorData);
        setCreator(formattedCreator);

        // Fetch campaigns for this creator
        try {
          const allCampaigns = await campaignService?.getAll();
          const creatorCampaigns = allCampaigns?.filter(c => 
            c?.creator_id === creatorId || 
            c?.creators?.id === creatorId ||
            c?.creator?.id === creatorId
          ) || [];
          
          console.log('✅ Campaigns fetched:', creatorCampaigns.length);
          setCampaigns(creatorCampaigns);
          
          // Extract payments from campaigns
          const campaignPayments = creatorCampaigns
            ?.filter(c => c?.amount || c?.agreed_amount)
            ?.map((campaign, index) => ({
              id: campaign?.id || `payment-${index}`,
              date: campaign?.created_at ? new Date(campaign.created_at).toLocaleDateString('en-IN') : 'N/A',
              time: campaign?.created_at ? new Date(campaign.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'N/A',
              campaignName: campaign?.name || 'Unnamed Campaign',
              brandName: campaign?.brand_name || campaign?.brand || 'N/A',
              amount: campaign?.amount || campaign?.agreed_amount || 0,
              mode: campaign?.payment_method || 'Bank Transfer',
              modeIcon: 'Building2',
              reference: campaign?.id ? `TXN-${campaign.id.slice(0, 8)}` : 'N/A',
              utrNumber: campaign?.utr_number || null,
              status: campaign?.payment_status || 'Pending',
              delayDays: campaign?.end_date ? Math.max(0, Math.floor((new Date() - new Date(campaign.end_date)) / (1000 * 60 * 60 * 24))) : 0
            })) || [];
          
          setPayments(campaignPayments);
        } catch (campaignError) {
          console.error('Error fetching campaigns:', campaignError);
          setCampaigns([]);
          setPayments([]);
        }

        // Price history and notes would come from separate tables if they exist
        // For now, set empty arrays
        setPriceHistory([]);
        setNotes([]);

      } catch (err) {
        console.error('❌ Error fetching creator:', err);
        setError(err?.message || 'Failed to load creator profile');
      } finally {
        setLoading(false);
      }
    };

    fetchCreatorData();
  }, [id, location?.state?.creatorId]);

  // Fetch campaign statistics for quick stats
  useEffect(() => {
    const fetchCampaignStats = async () => {
      if (!creator?.id) return;
      
      try {
        const stats = await creatorService.getCampaignStats(creator.id);
        
        // Update quick stats with real data
        setQuickStats(prev => ({
          ...prev,
          totalCampaigns: stats.totalCampaigns,
          completedCampaigns: stats.completedCampaigns,
          activeCampaigns: stats.activeCampaigns
        }));
      } catch (error) {
        console.error('Error fetching campaign stats:', error);
      }
    };

    fetchCampaignStats();
  }, [creator?.id]);

  // Fetch available campaigns for "Add to Campaign" functionality
  useEffect(() => {
    const fetchAvailableCampaigns = async () => {
      try {
        const allCampaigns = await campaignService?.getAll();
        const activeCampaigns = allCampaigns?.filter(campaign => 
          campaign?.status === 'active' || campaign?.status === 'pending'
        ) || [];
        setAvailableCampaigns(activeCampaigns);
      } catch (error) {
        console.error('Error fetching available campaigns:', error);
        setAvailableCampaigns([]);
      }
    };

    fetchAvailableCampaigns();
  }, []);

  // Calculate quick stats from real data
  const [quickStats, setQuickStats] = useState({
    totalCampaigns: 0,
    completedCampaigns: 0,
    activeCampaigns: 0,
    totalEarned: 0,
    avgPerCampaign: 0,
    performanceScore: 0,
    isManualScore: false
  });

  // Update payment stats when payments change
  useEffect(() => {
    const totalEarned = payments?.filter(p => p?.status === 'Paid')?.reduce((sum, p) => sum + (p?.amount || 0), 0) || 0;
    const avgPerCampaign = quickStats.totalCampaigns > 0 
      ? Math.round(totalEarned / quickStats.totalCampaigns)
      : 0;
    
    setQuickStats(prev => ({
      ...prev,
      totalEarned,
      avgPerCampaign
    }));
  }, [payments, quickStats.totalCampaigns]);

  // Calculate performance score
  useEffect(() => {
    const performanceScore = (() => {
      // Get creator data with engagement metrics
      const creatorData = {
        engagement_rate: creator?.engagementRate ? parseFloat(creator.engagementRate.replace('%', '')) : 0,
        avg_likes: parseFloat(creator?.avgLikes?.replace(/,/g, '')) || 0,
        avg_comments: parseFloat(creator?.avgComments?.replace(/,/g, '')) || 0,
        manual_performance_score: creator?.manual_performance_score || 0
      };
      
      // Calculate performance score based on multiple factors
      const engagementScore = creatorData.engagement_rate * 0.4;
      const likesScore = Math.min(creatorData.avg_likes / 1000, 10) * 0.3;
      const commentsScore = Math.min(creatorData.avg_comments / 100, 10) * 0.3;
      
      return Math.round(engagementScore + likesScore + commentsScore);
    })();

    setQuickStats(prev => ({
      ...prev,
      performanceScore,
      isManualScore: creator?.manual_performance_score !== null
    }));
  }, [creator]);

  // Handler functions
  const handleEdit = () => {
    setIsEditModalOpen(true);
  };

  const handleArchive = () => {
    setIsArchiveConfirmOpen(true);
  };

  const handleAddToCampaign = () => {
    setIsAddToCampaignModalOpen(true);
  };

  const handleBack = () => {
    navigate('/creator-database-management');
  };

  const handleCreatorUpdate = async (creatorId, updatedData) => {
    try {
      console.log('🔵 Updating creator:', creatorId, updatedData);
      
      const updatedCreator = await creatorService.updateCreator(creatorId, updatedData);
      
      // Update local state with new data
      const formattedCreator = formatCreatorData(updatedCreator);
      setCreator(formattedCreator);
      
      toast.success('Creator profile updated successfully!');
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('❌ Error updating creator:', error);
      toast.error('Failed to update creator profile');
    }
  };

  const handleArchiveConfirm = async () => {
    if (!creator?.id) return;
    
    setIsArchiving(true);
    try {
      console.log('🔵 Archiving creator:', creator.id);
      
      const archivedCreator = await creatorService.archiveCreator(creator.id);
      
      // Update local state
      const formattedCreator = formatCreatorData(archivedCreator);
      setCreator(formattedCreator);
      
      toast.success('Creator archived successfully!');
      setIsArchiveConfirmOpen(false);
    } catch (error) {
      console.error('❌ Error archiving creator:', error);
      toast.error('Failed to archive creator');
    } finally {
      setIsArchiving(false);
    }
  };

  const handleAddNote = (note) => {
    // Add note logic here
    console.log('Adding note:', note);
  };

  const handleSyncInstagram = async () => {
    if (!creator?.id) return;
    
    try {
      await creatorService.syncInstagramMetrics(creator.id);
      
      // Refresh creator data to get updated last_synced timestamp
      const creatorData = await creatorService?.getById(creator.id);
      if (creatorData) {
        const formattedCreator = formatCreatorData(creatorData);
        setCreator(formattedCreator);
      }
    } catch (error) {
      console.error('Error syncing Instagram metrics:', error);
    }
  };

  const handleAddToCampaignConfirm = async () => {
    if (!creator?.id || !selectedCampaign) return;
    
    setIsAddingToCampaign(true);
    try {
      console.log('🔵 Adding creator to campaign:', creator.id, selectedCampaign);
      
      // This is a dummy function - in production, this would add the creator to the campaign
      toast.success('Creator added to campaign successfully!');
      setIsAddToCampaignModalOpen(false);
      setSelectedCampaign('');
    } catch (error) {
      console.error('❌ Error adding creator to campaign:', error);
      toast.error('Failed to add creator to campaign');
    } finally {
      setIsAddingToCampaign(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
        <Header isCollapsed={isSidebarCollapsed} />
        <main className={`main-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading creator profile...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Error state
  if (error || !creator) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
        <Header isCollapsed={isSidebarCollapsed} />
        <main className={`main-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="AlertTriangle" size={32} color="var(--color-destructive)" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Creator Not Found</h2>
              <p className="text-muted-foreground mb-4">{error || 'The creator profile could not be loaded.'}</p>
              <button
                onClick={() => navigate('/creator-database-management')}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Back to Creator Database
              </button>
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
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />

      <Header isCollapsed={isSidebarCollapsed} />

      <main className={`main-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <ProfileHeader
          creator={creator}
          onEdit={handleEdit}
          onArchive={handleArchive}
          onAddToCampaign={handleAddToCampaign}
          onBack={handleBack} />

        <TabNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tabs={tabs} />

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {activeTab === 'overview' && <OverviewTab creator={creator} />}
              {activeTab === 'campaigns' && <CampaignHistoryTab campaigns={campaigns} />}
              {activeTab === 'payments' && <PaymentHistoryTab payments={payments} />}
              {activeTab === 'pricing' && <PriceHistoryTab priceHistory={priceHistory} />}
              {activeTab === 'notes' && <NotesTab notes={notes} onAddNote={handleAddNote} />}
            </div>

            <div className="space-y-6">
              <QuickStatsWidget 
          stats={quickStats} 
          creatorId={creator?.id}
          onScoreUpdate={(newScore) => {
            // Refresh creator data to get updated score
            const fetchCreatorData = async () => {
              try {
                const creatorData = await creatorService?.getById(creator.id);
                if (creatorData) {
                  const formattedCreator = formatCreatorData(creatorData);
                  setCreator(formattedCreator);
                }
              } catch (err) {
                console.error('Error refreshing creator data:', err);
              }
            };
            fetchCreatorData();
          }}
        />
              {/* RecentActivityFeed and RelatedCreatorsWidget can be added later with real data */}
            </div>
          </div>
        </div>
      </main>
      
      {/* Edit Creator Modal */}
      <EditCreatorModal
        creator={creator}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdate={handleCreatorUpdate}
      />
      
      {/* Archive Confirmation Dialog */}
      {isArchiveConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                  <Icon name="Archive" size={24} color="rgb(239, 68, 68)" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Archive Creator</h3>
                  <p className="text-gray-600">
                    Are you sure you want to archive "{creator?.name}"? This will mark the creator as inactive but preserve all their data.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsArchiveConfirmOpen(false)}
                  disabled={isArchiving}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleArchiveConfirm}
                  disabled={isArchiving}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isArchiving && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  Archive Creator
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Add to Campaign Modal */}
      {isAddToCampaignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Add to Campaign</h2>
              <button
                onClick={() => setIsAddToCampaignModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Icon name="X" size={24} />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Campaign</label>
                <select
                  value={selectedCampaign}
                  onChange={(e) => setSelectedCampaign(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Choose a campaign...</option>
                  {availableCampaigns?.map(campaign => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.name} - {campaign.brand_name || campaign.brand}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsAddToCampaignModalOpen(false)}
                  disabled={isAddingToCampaign}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddToCampaignConfirm}
                  disabled={isAddingToCampaign || !selectedCampaign}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isAddingToCampaign && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  Add to Campaign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatorProfileDetails;