import React from 'react';
import Icon from '../../../components/AppIcon';


const CampaignCard = ({ campaign, isSelected, onClick }) => {
  const getStatusColor = (status) => {
    const colors = {
      planning: 'bg-secondary/10 text-secondary border-secondary/20',
      active: 'bg-success/10 text-success border-success/20',
      completed: 'bg-primary/10 text-primary border-primary/20',
      paused: 'bg-warning/10 text-warning border-warning/20'
    };
    return colors?.[status] || colors?.planning;
  };

  const getStatusIcon = (status) => {
    const icons = {
      planning: 'Clock',
      active: 'Play',
      completed: 'CheckCircle',
      paused: 'Pause'
    };
    return icons?.[status] || 'Clock';
  };

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

  const calculateProgress = () => {
    return Math.round((campaign?.budgetUsed / campaign?.totalBudget) * 100);
  };

  const getDaysRemaining = () => {
    const today = new Date();
    const endDate = new Date(campaign.endDate);
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const progress = calculateProgress();
  const daysRemaining = getDaysRemaining();

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer hover:shadow-md ${
        isSelected
          ? 'border-primary bg-primary/5' :'border-border bg-card hover:border-primary/50'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-foreground truncate mb-1">
            {campaign?.name}
          </h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Icon name="Building2" size={14} />
            <span className="truncate">{campaign?.brandName}</span>
          </div>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full border flex items-center gap-1 ${getStatusColor(campaign?.status)}`}>
          <Icon name={getStatusIcon(campaign?.status)} size={12} />
          {campaign?.status?.charAt(0)?.toUpperCase() + campaign?.status?.slice(1)}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon name="Users" size={16} color="var(--color-primary)" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Creators</div>
            <div className="text-sm font-semibold text-foreground">{campaign?.creatorCount}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
            <Icon name="Package" size={16} color="var(--color-success)" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Deliverables</div>
            <div className="text-sm font-semibold text-foreground">{campaign?.deliverableCount}</div>
          </div>
        </div>
      </div>
      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Budget Utilization</span>
          <span className="font-medium text-foreground">{progress}%</span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              progress >= 90 ? 'bg-error' : progress >= 70 ? 'bg-warning' : 'bg-success'
            }`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatCurrency(campaign?.budgetUsed)}</span>
          <span>{formatCurrency(campaign?.totalBudget)}</span>
        </div>
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Icon name="Calendar" size={12} />
          <span>{formatDate(campaign?.startDate)} - {formatDate(campaign?.endDate)}</span>
        </div>
        {campaign?.status === 'active' && daysRemaining > 0 && (
          <div className={`flex items-center gap-1 text-xs font-medium ${
            daysRemaining <= 7 ? 'text-error' : 'text-success'
          }`}>
            <Icon name="Clock" size={12} />
            <span>{daysRemaining}d left</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignCard;