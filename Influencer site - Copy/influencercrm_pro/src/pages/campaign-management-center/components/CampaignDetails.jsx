import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';

const CampaignDetails = ({ campaign, onClose, onEdit, onDuplicate, onAssignCreator }) => {
  const [activeTab, setActiveTab] = useState('overview');

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    })?.format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date?.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getStatusColor = (status) => {
    const colors = {
      planning: 'bg-secondary/10 text-secondary border-secondary/20',
      active: 'bg-success/10 text-success border-success/20',
      completed: 'bg-primary/10 text-primary border-primary/20',
      paused: 'bg-warning/10 text-warning border-warning/20',
      pending: 'bg-warning/10 text-warning border-warning/20',
      paid: 'bg-success/10 text-success border-success/20',
      overdue: 'bg-error/10 text-error border-error/20'
    };
    return colors?.[status] || colors?.planning;
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'LayoutDashboard' },
    { id: 'creators', label: 'Creators', icon: 'Users' },
    { id: 'deliverables', label: 'Deliverables', icon: 'Package' },
    { id: 'payments', label: 'Payments', icon: 'CreditCard' }
  ];

  return (
    <div className="h-full flex flex-col bg-card">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">Campaign Details</h2>
        <button
          onClick={onClose}
          className="p-2 rounded-md hover:bg-muted transition-colors"
          aria-label="Close details"
        >
          <Icon name="X" size={20} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-4 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-foreground mb-2">{campaign?.name}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                <Icon name="Building2" size={16} />
                <span>{campaign?.brandName}</span>
              </div>
              <span className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(campaign?.status)}`}>
                <Icon name="Circle" size={8} />
                {campaign?.status?.charAt(0)?.toUpperCase() + campaign?.status?.slice(1)}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              iconName="Edit"
              iconPosition="left"
              onClick={onEdit}
            >
              Edit Campaign
            </Button>
            <Button
              variant="outline"
              size="sm"
              iconName="Copy"
              iconPosition="left"
              onClick={onDuplicate}
            >
              Duplicate
            </Button>
            <Button
              variant="default"
              size="sm"
              iconName="UserPlus"
              iconPosition="left"
              onClick={onAssignCreator}
            >
              Assign Creator
            </Button>
          </div>

          <div className="border-b border-border">
            <div className="flex gap-1">
              {tabs?.map((tab) => (
                <button
                  key={tab?.id}
                  onClick={() => setActiveTab(tab?.id)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === tab?.id
                      ? 'border-primary text-primary' :'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon name={tab?.icon} size={16} />
                  {tab?.label}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="Calendar" size={16} color="var(--color-primary)" />
                    <span className="text-xs text-muted-foreground">Start Date</span>
                  </div>
                  <div className="text-sm font-semibold text-foreground">{formatDate(campaign?.startDate)}</div>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="Calendar" size={16} color="var(--color-primary)" />
                    <span className="text-xs text-muted-foreground">End Date</span>
                  </div>
                  <div className="text-sm font-semibold text-foreground">{formatDate(campaign?.endDate)}</div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-foreground">Budget Overview</span>
                  <span className="text-xs text-muted-foreground">
                    {Math.round((campaign?.budgetUsed / campaign?.totalBudget) * 100)}% utilized
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total Budget</span>
                    <span className="font-semibold text-foreground">{formatCurrency(campaign?.totalBudget)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Used</span>
                    <span className="font-semibold text-success">{formatCurrency(campaign?.budgetUsed)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Remaining</span>
                    <span className="font-semibold text-primary">{formatCurrency(campaign?.totalBudget - campaign?.budgetUsed)}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted">
                <h4 className="text-sm font-medium text-foreground mb-3">Campaign Description</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{campaign?.description}</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-muted text-center">
                  <Icon name="Users" size={24} color="var(--color-primary)" className="mx-auto mb-2" />
                  <div className="text-2xl font-bold text-foreground">{campaign?.creatorCount}</div>
                  <div className="text-xs text-muted-foreground">Creators</div>
                </div>
                <div className="p-4 rounded-lg bg-muted text-center">
                  <Icon name="Package" size={24} color="var(--color-success)" className="mx-auto mb-2" />
                  <div className="text-2xl font-bold text-foreground">{campaign?.deliverableCount}</div>
                  <div className="text-xs text-muted-foreground">Deliverables</div>
                </div>
                <div className="p-4 rounded-lg bg-muted text-center">
                  <Icon name="CheckCircle" size={24} color="var(--color-warning)" className="mx-auto mb-2" />
                  <div className="text-2xl font-bold text-foreground">{campaign?.completedDeliverables}</div>
                  <div className="text-xs text-muted-foreground">Completed</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'creators' && (
            <div className="space-y-3">
              {campaign?.assignedCreators?.map((creator) => (
                <div key={creator?.id} className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                      <Image
                        src={creator?.avatar}
                        alt={creator?.avatarAlt}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-foreground">{creator?.name}</div>
                      <div className="text-xs text-muted-foreground">{creator?.instagram}</div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(creator?.status)}`}>
                      {creator?.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Deliverables:</span>
                      <span className="ml-1 font-medium text-foreground">{creator?.deliverables}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="ml-1 font-medium text-foreground">{formatCurrency(creator?.amount)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <span className="ml-1 font-medium text-foreground">{creator?.paymentStatus}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'deliverables' && (
            <div className="space-y-3">
              {campaign?.deliverables?.map((deliverable) => (
                <div key={deliverable?.id} className="p-4 rounded-lg border border-border">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-foreground mb-1">{deliverable?.type}</div>
                      <div className="text-xs text-muted-foreground">{deliverable?.creatorName}</div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(deliverable?.status)}`}>
                      {deliverable?.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Icon name="Calendar" size={12} />
                      <span>Due: {formatDate(deliverable?.dueDate)}</span>
                    </div>
                    {deliverable?.submittedDate && (
                      <div className="flex items-center gap-1">
                        <Icon name="CheckCircle" size={12} />
                        <span>Submitted: {formatDate(deliverable?.submittedDate)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-3">
              {campaign?.payments?.map((payment) => (
                <div key={payment?.id} className="p-4 rounded-lg border border-border">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-foreground mb-1">{payment?.creatorName}</div>
                      <div className="text-xs text-muted-foreground">{payment?.description}</div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(payment?.status)}`}>
                      {payment?.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-semibold text-foreground">{formatCurrency(payment?.amount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                    <span>Due: {formatDate(payment?.dueDate)}</span>
                    {payment?.paidDate && <span>Paid: {formatDate(payment?.paidDate)}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampaignDetails;