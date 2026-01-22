import React from 'react';
import Icon from '../../../components/AppIcon';

const PaymentStatusTabs = ({ activeTab, onTabChange, statusCounts, statusTotals }) => {
  const tabs = [
    {
      id: 'pending',
      label: 'Pending',
      icon: 'Clock',
      color: 'warning',
      count: statusCounts?.pending,
      total: statusTotals?.pending
    },
    {
      id: 'processing',
      label: 'Processing',
      icon: 'RefreshCw',
      color: 'primary',
      count: statusCounts?.processing,
      total: statusTotals?.processing
    },
    {
      id: 'paid',
      label: 'Paid',
      icon: 'CheckCircle',
      color: 'success',
      count: statusCounts?.paid,
      total: statusTotals?.paid
    },
    {
      id: 'overdue',
      label: 'Overdue',
      icon: 'AlertCircle',
      color: 'error',
      count: statusCounts?.overdue,
      total: statusTotals?.overdue
    }
  ];

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    })?.format(amount);
  };

  return (
    <div className="bg-card border-b border-border">
      <div className="flex items-center gap-2 px-6 overflow-x-auto custom-scrollbar">
        {tabs?.map((tab) => (
          <button
            key={tab?.id}
            onClick={() => onTabChange(tab?.id)}
            className={`flex items-center gap-3 px-6 py-4 border-b-2 transition-all duration-200 whitespace-nowrap ${
              activeTab === tab?.id
                ? `border-${tab?.color} text-${tab?.color}`
                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
            aria-label={`${tab?.label} payments`}
            aria-current={activeTab === tab?.id ? 'page' : undefined}
          >
            <Icon name={tab?.icon} size={20} />
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{tab?.label}</span>
                {tab?.count > 0 && (
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full bg-${tab?.color}/10 text-${tab?.color}`}>
                    {tab?.count}
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {formatAmount(tab?.total)}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PaymentStatusTabs;