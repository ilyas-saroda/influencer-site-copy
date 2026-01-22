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

  // Helper function to format creator data for UI
  const formatCreatorData = (dbCreator) => {
    if (!dbCreator) return null;

    // Extract Instagram handle from link or username
    const getInstagramHandle = () => {
      if (dbCreator?.username) {
        return `@${dbCreator.username.replace('@', '')}`;
      }
      if (dbCreator?.instagram_link) {
        const match = dbCreator.instagram_link.match(/instagram\.com\/([^\/\?]+)/);
        if (match) return `@${match[1]}`;
      }
      return 'N/A';
    };

    // Format followers count
    const formatFollowers = (followersTier, followersCount) => {
      // First try to use the actual followers count if available
      if (followersCount && followersCount !== 'N/A' && followersCount !== 0) {
        const num = parseInt(followersCount);
        if (!isNaN(num) && num > 0) {
          if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
          if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
          return num.toString();
        }
      }
      
      // If no actual count, display the full tier range
      if (followersTier && followersTier !== 'N/A') {
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
      
      return 'N/A';
    };

    return {
      id: dbCreator?.id || null,
      name: dbCreator?.name || 'Unknown Creator',
      profileImage: dbCreator?.profile_image || dbCreator?.profile_picture || null,
      profileImageAlt: `${dbCreator?.name || 'Creator'} profile picture`,
      instagramHandle: getInstagramHandle(),
      instagramUrl: dbCreator?.instagram_link || null,
      isVerified: dbCreator?.is_verified || false,
      isPremium: dbCreator?.is_premium || false,
      status: dbCreator?.status || 'Active',
      city: dbCreator?.city || 'N/A',
      state: dbCreator?.state || 'N/A',
      followersCount: formatFollowers(dbCreator?.followers_tier, dbCreator?.followers_count),
      engagementRate: dbCreator?.engagement_rate ? `${dbCreator.engagement_rate}%` : 'N/A',
      avgLikes: dbCreator?.avg_likes ? dbCreator.avg_likes.toLocaleString() : '0',
      avgComments: dbCreator?.avg_comments ? dbCreator.avg_comments.toLocaleString() : '0',
      lastSynced: dbCreator?.last_synced ? new Date(dbCreator.last_synced).toLocaleString() : 'Never',
      email: dbCreator?.email || 'N/A',
      phone: dbCreator?.whatsapp || dbCreator?.phone || 'N/A',
      manager: dbCreator?.manager_name || 'N/A',
      managerPhone: dbCreator?.manager_phone || 'N/A',
      gender: dbCreator?.gender || 'N/A',
      age: dbCreator?.age ? `${dbCreator.age} years` : 'N/A',
      language: dbCreator?.language || 'N/A',
      categories: dbCreator?.categories ? (Array.isArray(dbCreator.categories) ? dbCreator.categories : [dbCreator.categories]) : [],
      tags: dbCreator?.tags ? (Array.isArray(dbCreator.tags) ? dbCreator.tags : [dbCreator.tags]) : [],
      // Database fields (snake_case)
      sr_no: dbCreator?.sr_no || 'N/A',
      username: dbCreator?.username || 'N/A',
      sheet_source: dbCreator?.sheet_source || 'N/A',
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
  const quickStats = {
    totalCampaigns: campaigns?.length || 0,
    completedCampaigns: campaigns?.filter(c => c?.status === 'completed' || c?.payment_status === 'paid')?.length || 0,
    activeCampaigns: campaigns?.filter(c => c?.status === 'active' || c?.payment_status === 'pending')?.length || 0,
    totalEarned: payments?.filter(p => p?.status === 'Paid')?.reduce((sum, p) => sum + (p?.amount || 0), 0) || 0,
    avgPerCampaign: campaigns?.length > 0 
      ? Math.round((payments?.filter(p => p?.status === 'Paid')?.reduce((sum, p) => sum + (p?.amount || 0), 0) || 0) / campaigns.length)
      : 0,
    performanceScore: (() => {
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
    })(),
    isManualScore: creator?.manual_performance_score !== null
  };

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

  const handleCreatorUpdate = async (updatedData) => {
    try {
      // Update creator logic here
      console.log('Updating creator:', updatedData);
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error updating creator:', error);
    }
  };

  const handleAddNote = (note) => {
    // Add note logic here
    console.log('Adding note:', note);
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
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Edit Creator</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Icon name="X" size={24} />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    defaultValue={creator?.name || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Creator name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    defaultValue={creator?.email || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Email address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    defaultValue={creator?.phone || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    defaultValue={creator?.city || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                  <input
                    type="text"
                    defaultValue={creator?.state || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="State"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleCreatorUpdate({
                    name: creator?.name,
                    email: creator?.email,
                    phone: creator?.phone,
                    city: creator?.city,
                    state: creator?.state
                  })}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
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
                  <p className="text-sm text-gray-600">
                    Are you sure you want to archive this creator? This action can be undone.
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
                  onClick={confirmArchive}
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
                  onClick={confirmAddToCampaign}
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