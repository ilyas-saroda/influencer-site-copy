import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const CampaignHistoryTab = ({ campaigns }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'startDate', direction: 'desc' });

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig?.key === key && sortConfig?.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const sortedCampaigns = [...campaigns]?.sort((a, b) => {
    if (sortConfig?.direction === 'asc') {
      return a?.[sortConfig?.key] > b?.[sortConfig?.key] ? 1 : -1;
    }
    return a?.[sortConfig?.key] < b?.[sortConfig?.key] ? 1 : -1;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-success/10 text-success border-success/20';
      case 'Active':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'Pending':
        return 'bg-warning/10 text-warning border-warning/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'Paid':
        return 'bg-success/10 text-success border-success/20';
      case 'Pending':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'Overdue':
        return 'bg-error/10 text-error border-error/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Campaign History</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Total {campaigns?.length} campaigns completed
          </p>
        </div>
        <Button variant="outline" size="sm" iconName="Download" iconPosition="left">
          Export
        </Button>
      </div>
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left py-3 px-4">
                  <button
                    onClick={() => handleSort('campaignName')}
                    className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
                  >
                    Campaign Name
                    <Icon name="ArrowUpDown" size={14} />
                  </button>
                </th>
                <th className="text-left py-3 px-4">
                  <button
                    onClick={() => handleSort('brandName')}
                    className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
                  >
                    Brand
                    <Icon name="ArrowUpDown" size={14} />
                  </button>
                </th>
                <th className="text-left py-3 px-4">
                  <button
                    onClick={() => handleSort('startDate')}
                    className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
                  >
                    Duration
                    <Icon name="ArrowUpDown" size={14} />
                  </button>
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Deliverables
                </th>
                <th className="text-right py-3 px-4">
                  <button
                    onClick={() => handleSort('totalReach')}
                    className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground ml-auto"
                  >
                    Performance
                    <Icon name="ArrowUpDown" size={14} />
                  </button>
                </th>
                <th className="text-right py-3 px-4">
                  <button
                    onClick={() => handleSort('amount')}
                    className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground ml-auto"
                  >
                    Amount
                    <Icon name="ArrowUpDown" size={14} />
                  </button>
                </th>
                <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                  Status
                </th>
                <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                  Payment
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedCampaigns?.map((campaign) => (
                <tr key={campaign?.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="text-sm font-medium text-foreground">{campaign?.campaignName}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">ID: {campaign?.campaignId}</div>
                  </td>
                  <td className="py-3 px-4 text-sm text-foreground">{campaign?.brandName}</td>
                  <td className="py-3 px-4">
                    <div className="text-sm text-foreground">{campaign?.startDate}</div>
                    <div className="text-xs text-muted-foreground">to {campaign?.endDate}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {campaign?.deliverables?.map((deliverable, index) => (
                        <span
                          key={index}
                          className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-md"
                        >
                          {deliverable}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="text-sm font-medium text-foreground">{campaign?.totalReach}</div>
                    <div className="text-xs text-muted-foreground">{campaign?.engagement}</div>
                  </td>
                  <td className="py-3 px-4 text-right text-sm font-medium text-foreground">
                    ₹{campaign?.amount?.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-md border ${getStatusColor(campaign?.status)}`}>
                      {campaign?.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-md border ${getPaymentStatusColor(campaign?.paymentStatus)}`}>
                      {campaign?.paymentStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CampaignHistoryTab;