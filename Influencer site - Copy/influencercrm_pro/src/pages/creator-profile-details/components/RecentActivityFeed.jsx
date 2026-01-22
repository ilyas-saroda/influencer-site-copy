import React from 'react';
import Icon from '../../../components/AppIcon';

const RecentActivityFeed = ({ activities }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'campaign':
        return 'Megaphone';
      case 'payment':
        return 'CreditCard';
      case 'profile':
        return 'User';
      case 'note':
        return 'MessageSquare';
      default:
        return 'Activity';
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'campaign':
        return 'var(--color-primary)';
      case 'payment':
        return 'var(--color-success)';
      case 'profile':
        return 'var(--color-accent)';
      case 'note':
        return 'var(--color-secondary)';
      default:
        return 'var(--color-muted-foreground)';
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {activities?.length === 0 ? (
          <div className="text-center py-8">
            <Icon name="Activity" size={48} color="var(--color-muted-foreground)" className="mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No recent activity</p>
          </div>
        ) : (
          activities?.map((activity) => (
            <div key={activity?.id} className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <Icon 
                  name={getActivityIcon(activity?.type)} 
                  size={16} 
                  color={getActivityColor(activity?.type)} 
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{activity?.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">{activity?.timestamp}</span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">{activity?.author}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecentActivityFeed;