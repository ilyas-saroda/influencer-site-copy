import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/ui/Sidebar';
import Header from '../../components/ui/Header';

import Button from '../../components/ui/Button';
import PaymentStatusTabs from './components/PaymentStatusTabs';
import PaymentFilterSidebar from './components/PaymentFilterSidebar';
import BulkOperationsToolbar from './components/BulkOperationsToolbar';
import PaymentTable from './components/PaymentTable';
import ExportReportModal from './components/ExportReportModal';
import KeyboardShortcutsHelper from './components/KeyboardShortcutsHelper';

import { campaignService } from '../../services/campaignService';
import { realtimeService } from '../../services/realtimeService';
import Icon from '../../components/AppIcon';

// Mock exportUtils for demonstration
const exportUtils = {
  formatCampaignData: (data, fields) => {
    return data?.map(item => {
      const result = {};
      fields?.forEach(field => {
        result[field] = item?.[field];
      });
      return result;
    });
  },
  exportToExcel: (data, filename) => {
    console.log('Exporting to Excel:', data, filename);
  },
  exportToCSV: (data, filename) => {
    console.log('Exporting to CSV:', data, filename);
  },
  exportToPDF: (data, filename) => {
    console.log('Exporting to PDF:', data, filename);
  }
};

const PaymentProcessingCenter = () => {
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedPayments, setSelectedPayments] = useState([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'dueDate', direction: 'asc' });
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    amountRange: 'all',
    paymentMethod: 'all',
    creator: 'all',
    dateFrom: '',
    dateTo: ''
  });
  const [savedPresets, setSavedPresets] = useState([
    { name: 'High Value Pending', filters: { amountRange: '50000+', status: 'pending' } },
    { name: 'This Month Overdue', filters: { status: 'overdue', dateFrom: '2025-12-01' } }
  ]);

  const userRole = 'Super Admin';

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await campaignService?.getAll();
      
      // Transform Supabase data to match payment structure
      const transformedData = data?.map(campaign => ({
        id: campaign?.id,
        creatorName: campaign?.creators?.name || 'N/A',
        instagramHandle: campaign?.creators?.username || 'N/A',
        campaignName: campaign?.name || 'N/A',
        campaignId: campaign?.id,
        amount: campaign?.amount || campaign?.agreed_amount || 0,
        dueDate: campaign?.end_date || 'N/A',
        delayDays: campaign?.end_date ? Math.max(0, Math.floor((new Date() - new Date(campaign?.end_date)) / (1000 * 60 * 60 * 24))) : 0,
        paymentMethod: 'Bank Transfer', // Default value
        status: campaign?.payment_status || 'pending',
        referenceNumber: `REF-${campaign?.id?.slice(0, 8)}`,
        gatewaySync: Math.random() > 0.5,
        bankReconciled: campaign?.payment_status === 'paid'
      }));

      setPayments(transformedData);
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError(err?.message || 'Failed to load payments from database');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredPayments = () => {
    return payments?.filter(payment => {
      if (activeTab !== 'all' && payment?.status !== activeTab) return false;
      if (filters?.amountRange !== 'all') {
        const [min, max] = filters?.amountRange?.split('-')?.map(v => parseInt(v?.replace('+', '')));
        if (max) {
          if (payment?.amount < min || payment?.amount > max) return false;
        } else {
          if (payment?.amount < min) return false;
        }
      }
      if (filters?.paymentMethod !== 'all' && payment?.paymentMethod?.toLowerCase()?.replace(' ', '_') !== filters?.paymentMethod) return false;
      if (filters?.creator !== 'all' && payment?.instagramHandle?.replace('@', '')?.replace('_', '') !== filters?.creator?.replace('_', '')) return false;
      if (filters?.dateFrom && new Date(payment.dueDate) < new Date(filters.dateFrom)) return false;
      if (filters?.dateTo && new Date(payment.dueDate) > new Date(filters.dateTo)) return false;
      return true;
    });
  };

  const getSortedPayments = (payments) => {
    return [...payments]?.sort((a, b) => {
      let aValue = a?.[sortConfig?.key];
      let bValue = b?.[sortConfig?.key];

      if (sortConfig?.key === 'amount') {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      } else if (sortConfig?.key === 'dueDate') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (aValue < bValue) return sortConfig?.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig?.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const filteredPayments = getFilteredPayments();
  const sortedPayments = getSortedPayments(filteredPayments);

  const statusCounts = {
    pending: payments?.filter(p => p?.status === 'pending')?.length,
    processing: payments?.filter(p => p?.status === 'processing')?.length,
    paid: payments?.filter(p => p?.status === 'paid')?.length,
    overdue: payments?.filter(p => p?.status === 'overdue')?.length
  };

  const statusTotals = {
    pending: payments?.filter(p => p?.status === 'pending')?.reduce((sum, p) => sum + p?.amount, 0),
    processing: payments?.filter(p => p?.status === 'processing')?.reduce((sum, p) => sum + p?.amount, 0),
    paid: payments?.filter(p => p?.status === 'paid')?.reduce((sum, p) => sum + p?.amount, 0),
    overdue: payments?.filter(p => p?.status === 'overdue')?.reduce((sum, p) => sum + p?.amount, 0)
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      const visibleIds = sortedPayments?.slice(0, 100)?.map(p => p?.id);
      setSelectedPayments(visibleIds);
    } else {
      setSelectedPayments([]);
    }
  };

  const handleSelectPayment = (id, checked) => {
    if (checked) {
      setSelectedPayments([...selectedPayments, id]);
    } else {
      setSelectedPayments(selectedPayments?.filter(pid => pid !== id));
    }
  };

  const handleUpdatePayment = async (id, updates) => {
    try {
      await campaignService?.update(id, {
        payment_status: updates?.status,
        amount: updates?.amount
      });
      
      // Update local state
      setPayments(prev => 
        prev?.map(p => p?.id === id ? { ...p, ...updates } : p)
      );
    } catch (err) {
      console.error('Error updating payment:', err);
      alert(`Failed to update payment: ${err?.message}`);
    }
  };

  const handleBulkAction = async (action) => {
    try {
      if (action === 'mark_processing') {
        await campaignService?.bulkUpdateStatus(selectedPayments, 'processing');
      } else if (action === 'mark_paid') {
        await campaignService?.bulkUpdateStatus(selectedPayments, 'paid');
      }
      
      // Refresh payments
      await fetchPayments();
      setSelectedPayments([]);
    } catch (err) {
      console.error('Error in bulk action:', err);
      alert(`Failed to perform bulk action: ${err?.message}`);
    }
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev?.key === key && prev?.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleFilterChange = (key, value) => {
    if (key === 'preset') {
      setFilters(value?.filters);
    } else {
      setFilters(prev => ({ ...prev, [key]: value }));
    }
  };

  const handleClearFilters = () => {
    setFilters({
      amountRange: 'all',
      paymentMethod: 'all',
      creator: 'all',
      dateFrom: '',
      dateTo: ''
    });
  };

  const handleSavePreset = (name, filterConfig) => {
    setSavedPresets([...savedPresets, { name, filters: filterConfig }]);
  };

  const handleExport = (config) => {
    try {
      // Get payments to export based on current filters
      const paymentsToExport = sortedPayments?.length > 0 ? sortedPayments : payments;
      
      if (paymentsToExport?.length === 0) {
        alert('No payment data to export');
        return;
      }

      // Format data using exportUtils
      const formattedData = exportUtils?.formatCampaignData(
        paymentsToExport,
        config?.includeFields || ['creator', 'campaign', 'amount', 'dueDate', 'status', 'reference', 'method']
      );

      // Generate filename with timestamp
      const timestamp = new Date()?.toISOString()?.slice(0, 10);
      const filename = `payment-report-${timestamp}`;

      // Export based on format
      switch (config?.format) {
        case 'excel':
          exportUtils?.exportToExcel(formattedData, filename);
          break;
        case 'csv':
          exportUtils?.exportToCSV(formattedData, filename);
          break;
        case 'pdf':
          exportUtils?.exportToPDF(formattedData, filename);
          break;
        default:
          exportUtils?.exportToExcel(formattedData, filename);
      }

      alert(`Successfully exported ${paymentsToExport?.length} payment records!`);
    } catch (error) {
      console.error('Export failed:', error);
      alert(`Failed to export report: ${error?.message}`);
    }
  };

  useEffect(() => {
    fetchPayments();

    // Subscribe to real-time campaign changes
    const campaignSubscription = realtimeService?.subscribeToCampaigns(
      (newCampaign) => {
        fetchPayments(); // Refresh on new campaign
      },
      (updatedCampaign) => {
        fetchPayments(); // Refresh on update
      },
      (deletedId) => {
        fetchPayments(); // Refresh on delete
      }
    );

    return () => {
      campaignSubscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e?.target?.tagName === 'INPUT' || e?.target?.tagName === 'TEXTAREA') return;

      if (e?.key === 'p' && selectedPayments?.length > 0) {
        e?.preventDefault();
        handleBulkAction('mark_processing');
      } else if (e?.key === 'm' && selectedPayments?.length > 0) {
        e?.preventDefault();
        handleBulkAction('mark_paid');
      } else if (e?.key === 'e') {
        e?.preventDefault();
        setShowExportModal(true);
      } else if (e?.key === 'Escape' && selectedPayments?.length > 0) {
        setSelectedPayments([]);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [selectedPayments]);

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
              <p className="text-muted-foreground">Loading payment data...</p>
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
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        <Header isCollapsed={isSidebarCollapsed} />
        <main className={`main-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="AlertTriangle" size={32} color="var(--color-destructive)" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Failed to Load Payments</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={fetchPayments} variant="default">
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
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      <Header isCollapsed={isSidebarCollapsed} />
      <main className={`main-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="flex h-[calc(100vh-4rem)]">
          <PaymentFilterSidebar
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            savedPresets={savedPresets}
            onSavePreset={handleSavePreset}
          />

          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="bg-card border-b border-border px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Payment Processing Center</h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Manage influencer payments and track financial operations
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    iconName="Download"
                    iconPosition="left"
                    onClick={() => setShowExportModal(true)}
                  >
                    Export Report
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    iconName="Plus"
                    iconPosition="left"
                    onClick={() => navigate('/campaign-management-center')}
                  >
                    New Payment
                  </Button>
                </div>
              </div>
            </div>

            <PaymentStatusTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              statusCounts={statusCounts}
              statusTotals={statusTotals}
            />

            {selectedPayments?.length > 0 && (
              <BulkOperationsToolbar
                selectedCount={selectedPayments?.length}
                onBulkAction={handleBulkAction}
                userRole={userRole}
              />
            )}

            <div className="flex-1 overflow-auto">
              <PaymentTable
                payments={sortedPayments}
                selectedPayments={selectedPayments}
                onSelectAll={handleSelectAll}
                onSelectPayment={handleSelectPayment}
                onUpdatePayment={handleUpdatePayment}
                sortConfig={sortConfig}
                onSort={handleSort}
                userRole={userRole}
              />
            </div>

            <div className="bg-card border-t border-border px-6 py-3">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  Showing {sortedPayments?.length} of {payments?.length} payments
                </span>
                <span>
                  Total: {new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: 'INR',
                    maximumFractionDigits: 0
                  })?.format(sortedPayments?.reduce((sum, p) => sum + p?.amount, 0))}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
      <ExportReportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        payments={sortedPayments}
      />
      <KeyboardShortcutsHelper />
    </div>
  );
};

export default PaymentProcessingCenter;