import React from 'react';
import Icon from '../../../components/AppIcon';

const IntegrationStatusBadge = ({ name, status, lastSync }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'active':
        return {
          color: 'status-success',
          icon: 'CheckCircle',
          text: 'Active'
        };
      case 'syncing':
        return {
          color: 'bg-accent/10 text-accent border-accent/20',
          icon: 'RefreshCw',
          text: 'Syncing'
        };
      case 'error':
        return {
          color: 'status-error',
          icon: 'XCircle',
          text: 'Error'
        };
      default:
        return {
          color: 'bg-muted text-muted-foreground border-border',
          icon: 'Circle',
          text: 'Inactive'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-foreground">{name}</span>
        <span className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${config?.color}`}>
          <Icon name={config?.icon} size={12} className={status === 'syncing' ? 'animate-spin' : ''} />
          {config?.text}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        Last sync: {lastSync}
      </p>
    </div>
  );
};

export default IntegrationStatusBadge;