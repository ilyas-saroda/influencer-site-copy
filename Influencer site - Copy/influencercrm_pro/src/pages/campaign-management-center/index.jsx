import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/ui/Sidebar';
import Header from '../../components/ui/Header';
import Icon from '../../components/AppIcon';
import CampaignFilters from './components/CampaignFilters';
import CampaignCard from './components/CampaignCard';
import CampaignDetails from './components/CampaignDetails';
import CampaignToolbar from './components/CampaignToolbar';
import CreateCampaignModal from './components/CreateCampaignModal';
import { realtimeService } from '../../services/realtimeService';
import { campaignService } from '../../services/campaignService';
import { exportUtils } from '../../utils/exportUtils';
import { exportLogService } from '../../services/exportLogService';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';

const CampaignManagementCenter = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [selectedCampaigns, setSelectedCampaigns] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({
    status: [],
    brand: '',
    dateRange: { start: '', end: '' },
    budgetRange: { min: '', max: '' },
    creatorCount: { min: '', max: '' }
  });
  const [sortBy, setSortBy] = useState('date-newest');
  const [viewMode, setViewMode] = useState('grid');
  const [campaigns, setCampaigns] = useState([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const mockCampaigns = [
  {
    id: 1,
    name: "Summer Fashion Campaign 2025",
    brandName: "Fashion Nova",
    status: "active",
    creatorCount: 15,
    deliverableCount: 45,
    completedDeliverables: 32,
    totalBudget: 500000,
    budgetUsed: 375000,
    startDate: "2025-06-01",
    endDate: "2025-08-31",
    description: "A comprehensive summer fashion campaign targeting Gen Z audience with focus on sustainable fashion trends. The campaign includes Instagram Reels, Stories, and static posts showcasing our new summer collection across multiple creator categories including fashion, lifestyle, and beauty influencers.",
    assignedCreators: [
    {
      id: 1,
      name: "Sarah Johnson",
      instagram: "@fashionista_sarah",
      avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_103b528db-1763293982935.png",
      avatarAlt: "Professional headshot of young woman with long brown hair wearing white blouse",
      deliverables: 3,
      amount: 25000,
      status: "active",
      paymentStatus: "Paid"
    },
    {
      id: 2,
      name: "Priya Sharma",
      instagram: "@priya_style",
      avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_15dcbaefa-1763293709926.png",
      avatarAlt: "Professional photo of Indian woman with black hair in traditional attire",
      deliverables: 2,
      amount: 18000,
      status: "completed",
      paymentStatus: "Paid"
    }],

    deliverables: [
    {
      id: 1,
      type: "Instagram Reel",
      creatorName: "Sarah Johnson",
      status: "completed",
      dueDate: "2025-06-15",
      submittedDate: "2025-06-14"
    },
    {
      id: 2,
      type: "Instagram Story",
      creatorName: "Priya Sharma",
      status: "pending",
      dueDate: "2025-06-20",
      submittedDate: null
    }],

    payments: [
    {
      id: 1,
      creatorName: "Sarah Johnson",
      description: "Instagram Reel + Stories",
      amount: 25000,
      status: "paid",
      dueDate: "2025-06-10",
      paidDate: "2025-06-09"
    },
    {
      id: 2,
      creatorName: "Priya Sharma",
      description: "Instagram Posts",
      amount: 18000,
      status: "pending",
      dueDate: "2025-06-25",
      paidDate: null
    }]

  },
  {
    id: 2,
    name: "Myntra End of Season Sale",
    brandName: "Myntra",
    status: "planning",
    creatorCount: 8,
    deliverableCount: 24,
    completedDeliverables: 0,
    totalBudget: 300000,
    budgetUsed: 0,
    startDate: "2025-07-01",
    endDate: "2025-07-15",
    description: "High-impact sale promotion campaign with focus on creating urgency and driving immediate conversions through limited-time offers and exclusive discount codes for creator audiences.",
    assignedCreators: [],
    deliverables: [],
    payments: []
  },
  {
    id: 3,
    name: "Nykaa Beauty Masterclass Series",
    brandName: "Nykaa",
    status: "active",
    creatorCount: 12,
    deliverableCount: 36,
    completedDeliverables: 18,
    totalBudget: 450000,
    budgetUsed: 225000,
    startDate: "2025-05-15",
    endDate: "2025-07-30",
    description: "Educational content series featuring beauty tutorials, product reviews, and makeup masterclasses with top beauty influencers to establish Nykaa as the go-to beauty education platform.",
    assignedCreators: [
    {
      id: 3,
      name: "Anjali Mehta",
      instagram: "@beauty_by_anjali",
      avatar: "https://images.unsplash.com/photo-1619734174708-709be4bd4153",
      avatarAlt: "Close-up portrait of Indian woman with makeup and jewelry",
      deliverables: 3,
      amount: 30000,
      status: "active",
      paymentStatus: "Pending"
    }],

    deliverables: [
    {
      id: 3,
      type: "YouTube Tutorial",
      creatorName: "Anjali Mehta",
      status: "active",
      dueDate: "2025-06-30",
      submittedDate: null
    }],

    payments: [
    {
      id: 3,
      creatorName: "Anjali Mehta",
      description: "YouTube Tutorial Series",
      amount: 30000,
      status: "pending",
      dueDate: "2025-07-05",
      paidDate: null
    }]

  },
  {
    id: 4,
    name: "boAt Lifestyle Tech Launch",
    brandName: "boAt Lifestyle",
    status: "completed",
    creatorCount: 20,
    deliverableCount: 60,
    completedDeliverables: 60,
    totalBudget: 800000,
    budgetUsed: 800000,
    startDate: "2025-03-01",
    endDate: "2025-05-31",
    description: "Product launch campaign for new wireless earbuds featuring tech reviewers, lifestyle influencers, and music artists to showcase product features and build brand awareness among young professionals.",
    assignedCreators: [
    {
      id: 4,
      name: "Rahul Verma",
      instagram: "@tech_rahul",
      avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_152996029-1763292092313.png",
      avatarAlt: "Professional photo of young Indian man with glasses in casual attire",
      deliverables: 4,
      amount: 40000,
      status: "completed",
      paymentStatus: "Paid"
    }],

    deliverables: [
    {
      id: 4,
      type: "Product Review Video",
      creatorName: "Rahul Verma",
      status: "completed",
      dueDate: "2025-04-15",
      submittedDate: "2025-04-14"
    }],

    payments: [
    {
      id: 4,
      creatorName: "Rahul Verma",
      description: "Product Review + Unboxing",
      amount: 40000,
      status: "paid",
      dueDate: "2025-04-20",
      paidDate: "2025-04-18"
    }]

  },
  {
    id: 5,
    name: "Mamaearth Sustainability Drive",
    brandName: "Mamaearth",
    status: "paused",
    creatorCount: 10,
    deliverableCount: 30,
    completedDeliverables: 15,
    totalBudget: 400000,
    budgetUsed: 200000,
    startDate: "2025-04-01",
    endDate: "2025-09-30",
    description: "Long-term sustainability awareness campaign highlighting eco-friendly products and practices with focus on parent influencers and environmental advocates to build brand trust and community engagement.",
    assignedCreators: [
    {
      id: 5,
      name: "Neha Kapoor",
      instagram: "@momlife_neha",
      avatar: "https://images.unsplash.com/photo-1637942188213-ff3090dd2d91",
      avatarAlt: "Warm portrait of Indian mother with child in outdoor setting",
      deliverables: 3,
      amount: 20000,
      status: "paused",
      paymentStatus: "Pending"
    }],

    deliverables: [
    {
      id: 5,
      type: "Instagram Carousel",
      creatorName: "Neha Kapoor",
      status: "paused",
      dueDate: "2025-07-10",
      submittedDate: null
    }],

    payments: [
    {
      id: 5,
      creatorName: "Neha Kapoor",
      description: "Instagram Content Series",
      amount: 20000,
      status: "pending",
      dueDate: "2025-07-15",
      paidDate: null
    }]

  },
  {
    id: 6,
    name: "Zara India Store Launch",
    brandName: "Zara",
    status: "planning",
    creatorCount: 6,
    deliverableCount: 18,
    completedDeliverables: 0,
    totalBudget: 350000,
    budgetUsed: 0,
    startDate: "2025-08-01",
    endDate: "2025-08-31",
    description: "Store launch campaign for new flagship location featuring fashion influencers and style bloggers to create buzz and drive foot traffic through exclusive preview events and styling sessions.",
    assignedCreators: [],
    deliverables: [],
    payments: []
  },
  {
    id: 7,
    name: "Swiggy Food Festival Campaign",
    brandName: "Swiggy",
    status: "active",
    creatorCount: 18,
    deliverableCount: 54,
    completedDeliverables: 27,
    totalBudget: 600000,
    budgetUsed: 300000,
    startDate: "2025-06-10",
    endDate: "2025-07-10",
    description: "Food festival promotion campaign featuring food bloggers and lifestyle influencers to showcase restaurant partnerships and drive app downloads through exclusive discount codes and food challenges.",
    assignedCreators: [
    {
      id: 6,
      name: "Vikram Singh",
      instagram: "@foodie_vikram",
      avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_19215798d-1765022060611.png",
      avatarAlt: "Casual photo of young man with beard in restaurant setting",
      deliverables: 3,
      amount: 22000,
      status: "active",
      paymentStatus: "Paid"
    }],

    deliverables: [
    {
      id: 6,
      type: "Food Review Reel",
      creatorName: "Vikram Singh",
      status: "active",
      dueDate: "2025-06-28",
      submittedDate: null
    }],

    payments: [
    {
      id: 6,
      creatorName: "Vikram Singh",
      description: "Food Review Series",
      amount: 22000,
      status: "paid",
      dueDate: "2025-06-20",
      paidDate: "2025-06-19"
    }]

  },
  {
    id: 8,
    name: "Tanishq Wedding Collection",
    brandName: "Tanishq",
    status: "completed",
    creatorCount: 14,
    deliverableCount: 42,
    completedDeliverables: 42,
    totalBudget: 700000,
    budgetUsed: 700000,
    startDate: "2025-02-01",
    endDate: "2025-04-30",
    description: "Premium wedding jewelry collection campaign targeting engaged couples and wedding planners through lifestyle and fashion influencers showcasing traditional and contemporary designs.",
    assignedCreators: [
    {
      id: 7,
      name: "Kavya Reddy",
      instagram: "@kavya_jewels",
      avatar: "https://images.unsplash.com/photo-1521053281402-fd6bb5f18a8a",
      avatarAlt: "Elegant portrait of Indian woman wearing traditional jewelry and saree",
      deliverables: 3,
      amount: 50000,
      status: "completed",
      paymentStatus: "Paid"
    }],

    deliverables: [
    {
      id: 7,
      type: "Instagram Post",
      creatorName: "Kavya Reddy",
      status: "completed",
      dueDate: "2025-03-15",
      submittedDate: "2025-03-14"
    }],

    payments: [
    {
      id: 7,
      creatorName: "Kavya Reddy",
      description: "Jewelry Showcase Posts",
      amount: 50000,
      status: "paid",
      dueDate: "2025-03-20",
      paidDate: "2025-03-18"
    }]

  }];


  const activeCounts = {
    planning: campaigns?.filter((c) => c?.status === 'planning')?.length,
    active: campaigns?.filter((c) => c?.status === 'active')?.length,
    completed: campaigns?.filter((c) => c?.status === 'completed')?.length,
    paused: campaigns?.filter((c) => c?.status === 'paused')?.length
  };

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await campaignService?.getAll();
      
      // Transform data to match expected format
      const transformedData = data?.map(campaign => ({
        id: campaign?.id,
        name: campaign?.name || campaign?.campaign_name,
        brandName: campaign?.brand || campaign?.brand_name,
        status: campaign?.payment_status === 'paid' ? 'completed' : campaign?.payment_status === 'pending' ? 'active' : 'planning',
        creatorCount: 1, // Single creator per campaign in current schema
        deliverableCount: 0, // Calculated from deliverables
        completedDeliverables: 0,
        totalBudget: campaign?.amount || campaign?.agreed_amount || 0,
        budgetUsed: campaign?.payment_status === 'paid' ? (campaign?.amount || campaign?.agreed_amount || 0) : 0,
        startDate: campaign?.start_date,
        endDate: campaign?.end_date,
        description: campaign?.campaign_name || campaign?.name,
        assignedCreators: campaign?.creators ? [{
          id: campaign?.creators?.id,
          name: campaign?.creators?.name,
          instagram: campaign?.creators?.username,
          avatar: campaign?.creators?.instagram_link,
          deliverables: 0,
          amount: campaign?.amount || campaign?.agreed_amount || 0,
          status: campaign?.payment_status,
          paymentStatus: campaign?.payment_status === 'paid' ? 'Paid' : 'Pending'
        }] : [],
        deliverables: [],
        payments: []
      }));

      setCampaigns(transformedData);
    } catch (err) {
      console.error('Error loading campaigns:', err);
      setError(err?.message || 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();

    // Subscribe to real-time campaign changes
    const campaignSubscription = realtimeService?.subscribeToCampaigns(
      () => loadCampaigns(), // Refresh on INSERT
      () => loadCampaigns(), // Refresh on UPDATE
      () => loadCampaigns()  // Refresh on DELETE
    );

    return () => {
      campaignSubscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e?.target?.tagName === 'INPUT' || e?.target?.tagName === 'TEXTAREA') return;

      switch (e?.key?.toLowerCase()) {
        case 'j':
          e?.preventDefault();
          navigateNext();
          break;
        case 'k':
          e?.preventDefault();
          navigatePrevious();
          break;
        case 's':
          e?.preventDefault();
          if (selectedCampaign) {
            handleQuickStatusChange();
          }
          break;
        case 'a':
          e?.preventDefault();
          if (selectedCampaign) {
            handleAssignCreator();
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedCampaign, filteredCampaigns]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [filters, sortBy, campaigns]);

  const navigateNext = () => {
    if (!selectedCampaign && filteredCampaigns?.length > 0) {
      setSelectedCampaign(filteredCampaigns?.[0]);
      return;
    }
    const currentIndex = filteredCampaigns?.findIndex((c) => c?.id === selectedCampaign?.id);
    if (currentIndex < filteredCampaigns?.length - 1) {
      setSelectedCampaign(filteredCampaigns?.[currentIndex + 1]);
    }
  };

  const navigatePrevious = () => {
    if (!selectedCampaign) return;
    const currentIndex = filteredCampaigns?.findIndex((c) => c?.id === selectedCampaign?.id);
    if (currentIndex > 0) {
      setSelectedCampaign(filteredCampaigns?.[currentIndex - 1]);
    }
  };

  const handleQuickStatusChange = () => {
    if (!selectedCampaign) return;
    
    const statusOptions = ['planning', 'active', 'completed', 'paused'];
    const currentIndex = statusOptions?.indexOf(selectedCampaign?.status);
    const nextStatus = statusOptions?.[(currentIndex + 1) % statusOptions?.length];
    
    alert(`Quick Status Change: ${selectedCampaign?.name}\nCurrent: ${selectedCampaign?.status}\nNext: ${nextStatus}\n\nThis would update the campaign status.`);
  };

  const handleAssignCreator = () => {
    if (!selectedCampaign) return;
    alert(`Assign Creator (Shortcut): ${selectedCampaign?.name}\n\nThis would quickly open the creator assignment modal.`);
  };

  const applyFiltersAndSort = () => {
    let filtered = [...campaigns];

    if (filters?.status?.length > 0) {
      filtered = filtered?.filter((c) => filters?.status?.includes(c?.status));
    }

    if (filters?.brand) {
      filtered = filtered?.filter((c) => c?.brandName?.toLowerCase()?.includes(filters?.brand?.toLowerCase()));
    }

    if (filters?.dateRange?.start) {
      filtered = filtered?.filter((c) => new Date(c.startDate) >= new Date(filters.dateRange.start));
    }

    if (filters?.dateRange?.end) {
      filtered = filtered?.filter((c) => new Date(c.endDate) <= new Date(filters.dateRange.end));
    }

    if (filters?.budgetRange?.min) {
      filtered = filtered?.filter((c) => c?.totalBudget >= parseInt(filters?.budgetRange?.min));
    }

    if (filters?.budgetRange?.max) {
      filtered = filtered?.filter((c) => c?.totalBudget <= parseInt(filters?.budgetRange?.max));
    }

    if (filters?.creatorCount?.min) {
      filtered = filtered?.filter((c) => c?.creatorCount >= parseInt(filters?.creatorCount?.min));
    }

    if (filters?.creatorCount?.max) {
      filtered = filtered?.filter((c) => c?.creatorCount <= parseInt(filters?.creatorCount?.max));
    }

    switch (sortBy) {
      case 'name-asc':
        filtered?.sort((a, b) => a?.name?.localeCompare(b?.name));
        break;
      case 'name-desc':
        filtered?.sort((a, b) => b?.name?.localeCompare(a?.name));
        break;
      case 'date-newest':
        filtered?.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
        break;
      case 'date-oldest':
        filtered?.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
        break;
      case 'budget-high':
        filtered?.sort((a, b) => b?.totalBudget - a?.totalBudget);
        break;
      case 'budget-low':
        filtered?.sort((a, b) => a?.totalBudget - b?.totalBudget);
        break;
      case 'creators-high':
        filtered?.sort((a, b) => b?.creatorCount - a?.creatorCount);
        break;
      case 'creators-low':
        filtered?.sort((a, b) => a?.creatorCount - b?.creatorCount);
        break;
      default:
        break;
    }

    setFilteredCampaigns(filtered);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleCampaignSelect = (campaign) => {
    setSelectedCampaign(campaign);
  };

  const handleBulkStatusUpdate = async (status) => {
    try {
      if (selectedCampaigns?.length === 0) {
        alert('No campaigns selected for bulk update');
        return;
      }

      const statusMap = {
        'active': 'processing',
        'completed': 'paid',
        'planning': 'pending',
        'paused': 'pending'
      };

      await campaignService?.bulkUpdateStatus(selectedCampaigns, statusMap?.[status] || 'pending');
      
      alert(`Successfully updated ${selectedCampaigns?.length} campaign(s) status to ${status}`);
      setSelectedCampaigns([]);
      await loadCampaigns();
    } catch (error) {
      console.error('Bulk status update failed:', error);
      alert(`Failed to update campaign status: ${error?.message}`);
    }
  };

  const handleExport = async () => {
    try {
      const campaignsToExport = filteredCampaigns?.length > 0 ? filteredCampaigns : campaigns;
      
      if (campaignsToExport?.length === 0) {
        alert('No campaigns available to export');
        return;
      }

      const exportData = campaignsToExport?.map(campaign => ({
        'Campaign Name': campaign?.name,
        'Brand': campaign?.brandName,
        'Status': campaign?.status,
        'Creator Count': campaign?.creatorCount,
        'Total Budget': campaign?.totalBudget,
        'Budget Used': campaign?.budgetUsed,
        'Start Date': campaign?.startDate,
        'End Date': campaign?.endDate,
        'Progress': `${Math.round((campaign?.completedDeliverables / campaign?.deliverableCount) * 100) || 0}%`
      }));

      const timestamp = new Date()?.toISOString()?.slice(0, 10);
      const filename = `campaigns-export-${timestamp}`;

      exportUtils?.exportToExcel(exportData, filename);

      // Log the export activity
      const username = user?.email || 'Unknown User';
      await exportLogService?.logExport({
        username,
        exportType: 'excel',
        exportScope: filteredCampaigns?.length > 0 ? 'filtered' : 'all',
        recordCount: campaignsToExport?.length,
        fileName: `${filename}.xlsx`,
        additionalDetails: `Campaign Management Export - ${filteredCampaigns?.length > 0 ? 'Filtered Campaigns' : 'All Campaigns'}`
      });

      alert(`Successfully exported ${campaignsToExport?.length} campaign records!`);
    } catch (error) {
      console.error('Export failed:', error);
      
      // Log the export failure
      try {
        const username = user?.email || 'Unknown User';
        await exportLogService?.logExport({
          username,
          exportType: 'excel',
          exportScope: 'unknown',
          recordCount: 0,
          fileName: '',
          additionalDetails: `Campaign Export Failed - ${error?.message || 'Unknown error'}`
        });
      } catch (logError) {
        console.error('Failed to log export error:', logError);
      }
      
      alert(`Failed to export campaigns: ${error?.message}`);
    }
  };

  const handleCreateCampaign = () => {
    setShowCreateModal(true);
  };

  const handleCampaignCreated = async () => {
    await loadCampaigns();
    setShowCreateModal(false);
  };

  const handleEditCampaign = () => {
    if (!selectedCampaign) {
      alert('No campaign selected to edit');
      return;
    }
    alert(`Edit Campaign: ${selectedCampaign?.name}\n\nThis would open a modal with editable fields for campaign details.`);
  };

  const handleDuplicateCampaign = () => {
    if (!selectedCampaign) {
      alert('No campaign selected to duplicate');
      return;
    }
    alert(`Duplicate Campaign: ${selectedCampaign?.name}\n\nThis would create a copy of the campaign with "(Copy)" appended to the name.`);
  };

  const handleAssignCreatorToCampaign = () => {
    if (!selectedCampaign) {
      alert('No campaign selected for creator assignment');
      return;
    }
    alert(`Assign Creator to: ${selectedCampaign?.name}\n\nThis would open a modal to search and select creators from the database.`);
  };

  // Add loading state
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
              <p className="text-muted-foreground">Loading campaigns...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Add error state
  if (error) {
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
              <h2 className="text-xl font-semibold text-foreground mb-2">Failed to Load Campaigns</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={loadCampaigns} variant="default">
                Try Again
              </Button>
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
        <div className="h-screen flex">
          <div className="w-1/5 border-r border-border overflow-hidden">
            <CampaignFilters
              onFilterChange={handleFilterChange}
              activeCounts={activeCounts} />

          </div>

          <div className="w-1/2 flex flex-col overflow-hidden">
            <CampaignToolbar
              selectedCount={selectedCampaigns?.length}
              onBulkStatusUpdate={handleBulkStatusUpdate}
              onExport={handleExport}
              onCreateCampaign={handleCreateCampaign}
              sortBy={sortBy}
              onSortChange={setSortBy}
              viewMode={viewMode}
              onViewModeChange={setViewMode} />


            <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
              {filteredCampaigns?.length === 0 ?
              <div className="flex flex-col items-center justify-center h-full">
                  <Icon name="SearchX" size={64} color="var(--color-muted-foreground)" />
                  <h3 className="mt-4 text-lg font-semibold text-foreground">No campaigns found</h3>
                  <p className="mt-2 text-sm text-muted-foreground text-center max-w-md">
                    Try adjusting your filters or create a new campaign to get started
                  </p>
                </div> :

              <div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-4' : 'space-y-3'}>
                  {filteredCampaigns?.map((campaign) =>
                <CampaignCard
                  key={campaign?.id}
                  campaign={campaign}
                  isSelected={selectedCampaign?.id === campaign?.id}
                  onClick={() => handleCampaignSelect(campaign)} />

                )}
                </div>
              }
            </div>
          </div>

          <div className="w-3/10 border-l border-border overflow-hidden">
            {selectedCampaign ?
            <CampaignDetails
              campaign={selectedCampaign}
              onClose={() => setSelectedCampaign(null)}
              onEdit={handleEditCampaign}
              onDuplicate={handleDuplicateCampaign}
              onAssignCreator={handleAssignCreatorToCampaign} /> :


            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                <Icon name="MousePointerClick" size={64} color="var(--color-muted-foreground)" />
                <h3 className="mt-4 text-lg font-semibold text-foreground">Select a campaign</h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-xs">
                  Click on any campaign from the list to view detailed information, manage creators, and track progress
                </p>
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    <strong>Pro tip:</strong> Use J/K keys to navigate between campaigns quickly
                  </p>
                </div>
              </div>
            }
          </div>
        </div>
      </main>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <CreateCampaignModal
          onClose={() => setShowCreateModal(false)}
          onCampaignCreated={handleCampaignCreated}
        />
      )}
    </div>
  );
};

export default CampaignManagementCenter;