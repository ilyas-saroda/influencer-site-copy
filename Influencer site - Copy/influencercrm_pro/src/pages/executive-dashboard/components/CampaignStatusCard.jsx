import React from 'react';
import Icon from '../../../components/AppIcon';

const CampaignStatusCard = ({ campaign }) => {
  const getStatusColor = () => {
    switch (campaign?.status) {
      case 'Active':
        return 'status-success';
      case 'Planning':
        return 'status-warning';
      case 'Completed':
        return 'bg-secondary/10 text-secondary border-secondary/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getProgressColor = () => {
    if (campaign?.progress >= 75) return 'bg-success';
    if (campaign?.progress >= 50) return 'bg-accent';
    if (campaign?.progress >= 25) return 'bg-warning';
    return 'bg-error';
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 hover:shadow-sm-custom transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-foreground truncate">{campaign?.name}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">{campaign?.brand}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor()}`}>
          {campaign?.status}
        </span>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium text-foreground">{campaign?.progress}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div 
            className={`h-full ${getProgressColor()} transition-all duration-300`}
            style={{ width: `${campaign?.progress}%` }}
          />
        </div>
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Icon name="Users" size={14} />
          <span>{campaign?.creators} creators</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Icon name="Calendar" size={14} />
          <span>{campaign?.deadline}</span>
        </div>
      </div>
    </div>
  );
};

export default CampaignStatusCard;