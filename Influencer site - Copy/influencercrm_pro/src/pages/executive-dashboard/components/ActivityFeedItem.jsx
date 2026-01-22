import React from 'react';
import Icon from '../../../components/AppIcon';

const ActivityFeedItem = ({ activity }) => {
  const getActivityIcon = () => {
    switch (activity?.type) {
      case 'creator_added':
        return { name: 'UserPlus', color: 'var(--color-success)' };
      case 'campaign_created':
        return { name: 'Megaphone', color: 'var(--color-primary)' };
      case 'payment_processed':
        return { name: 'CheckCircle', color: 'var(--color-success)' };
      case 'payment_overdue':
        return { name: 'AlertCircle', color: 'var(--color-error)' };
      case 'creator_updated':
        return { name: 'Edit', color: 'var(--color-accent)' };
      default:
        return { name: 'Activity', color: 'var(--color-secondary)' };
    }
  };

  const icon = getActivityIcon();

  return (
    <div className="flex items-start gap-3 p-3 hover:bg-muted rounded-md transition-colors duration-200">
      <div 
        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
        style={{ backgroundColor: `${icon?.color}15` }}
      >
        <Icon name={icon?.name} size={16} color={icon?.color} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground font-medium">{activity?.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{activity?.description}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">{activity?.user}</span>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground">{activity?.timestamp}</span>
        </div>
      </div>
    </div>
  );
};

export default ActivityFeedItem;