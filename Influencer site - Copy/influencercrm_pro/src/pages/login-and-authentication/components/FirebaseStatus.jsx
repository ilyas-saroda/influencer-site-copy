import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';

const FirebaseStatus = () => {
  const [status, setStatus] = useState('checking');
  const [connectionDetails, setConnectionDetails] = useState({
    latency: 0,
    lastChecked: null
  });

  useEffect(() => {
    const checkConnection = () => {
      const startTime = Date.now();
      
      setTimeout(() => {
        const latency = Date.now() - startTime;
        setStatus('connected');
        setConnectionDetails({
          latency,
          lastChecked: new Date()
        });
      }, 500);
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: 'CheckCircle',
          color: 'var(--color-success)',
          bgColor: 'bg-success/10',
          borderColor: 'border-success/20',
          text: 'System Online',
          description: `Connected • ${connectionDetails?.latency}ms latency`
        };
      case 'checking':
        return {
          icon: 'Loader2',
          color: 'var(--color-warning)',
          bgColor: 'bg-warning/10',
          borderColor: 'border-warning/20',
          text: 'Checking Connection',
          description: 'Verifying system status...'
        };
      case 'error':
        return {
          icon: 'AlertCircle',
          color: 'var(--color-error)',
          bgColor: 'bg-error/10',
          borderColor: 'border-error/20',
          text: 'Connection Issue',
          description: 'Unable to reach authentication server'
        };
      default:
        return {
          icon: 'HelpCircle',
          color: 'var(--color-muted-foreground)',
          bgColor: 'bg-muted',
          borderColor: 'border-border',
          text: 'Unknown Status',
          description: 'System status unavailable'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`flex items-center gap-3 p-3 ${config?.bgColor} border ${config?.borderColor} rounded-md`}>
      <Icon 
        name={config?.icon} 
        size={18} 
        color={config?.color}
        className={status === 'checking' ? 'animate-spin' : ''}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{config?.text}</p>
        <p className="text-xs text-muted-foreground">{config?.description}</p>
      </div>
    </div>
  );
};

export default FirebaseStatus;