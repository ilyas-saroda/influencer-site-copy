import React from 'react';
import Icon from '../../../components/AppIcon';

const PaymentAlertItem = ({ payment }) => {
  const getSeverityConfig = () => {
    switch (payment?.severity) {
      case 'critical':
        return {
          bgColor: 'bg-error/10',
          borderColor: 'border-error/20',
          textColor: 'text-error',
          icon: 'AlertTriangle'
        };
      case 'high':
        return {
          bgColor: 'bg-warning/10',
          borderColor: 'border-warning/20',
          textColor: 'text-warning',
          icon: 'AlertCircle'
        };
      case 'medium':
        return {
          bgColor: 'bg-accent/10',
          borderColor: 'border-accent/20',
          textColor: 'text-accent',
          icon: 'Clock'
        };
      default:
        return {
          bgColor: 'bg-muted',
          borderColor: 'border-border',
          textColor: 'text-muted-foreground',
          icon: 'Info'
        };
    }
  };

  const config = getSeverityConfig();

  return (
    <div className={`${config?.bgColor} border ${config?.borderColor} rounded-lg p-3`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <Icon name={config?.icon} size={18} color={`var(--color-${payment?.severity === 'critical' ? 'error' : payment?.severity === 'high' ? 'warning' : 'accent'})`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="text-sm font-medium text-foreground">{payment?.creator}</p>
            <span className={`text-sm font-semibold ${config?.textColor}`}>{payment?.amount}</span>
          </div>
          <p className="text-xs text-muted-foreground mb-2">{payment?.campaign}</p>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium ${config?.textColor}`}>
              {payment?.daysOverdue} days overdue
            </span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">{payment?.dueDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentAlertItem;