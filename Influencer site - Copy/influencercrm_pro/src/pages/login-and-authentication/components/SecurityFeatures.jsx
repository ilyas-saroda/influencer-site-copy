import React from 'react';
import Icon from '../../../components/AppIcon';

const SecurityFeatures = () => {
  const features = [
    {
      icon: 'Shield',
      title: 'Enterprise Security',
      description: 'Bank-level encryption for all data'
    },
    {
      icon: 'Lock',
      title: 'Secure Access',
      description: 'Team-only authentication system'
    },
    {
      icon: 'Clock',
      title: 'Session Management',
      description: 'Auto-logout after 8 hours inactivity'
    },
    {
      icon: 'Smartphone',
      title: 'Device Registration',
      description: 'Trusted device verification'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {features?.map((feature, index) => (
        <div
          key={index}
          className="flex items-start gap-3 p-4 bg-card border border-border rounded-md hover:border-primary/30 transition-colors duration-200"
        >
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon name={feature?.icon} size={18} color="var(--color-primary)" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground mb-1">
              {feature?.title}
            </h3>
            <p className="text-xs text-muted-foreground">
              {feature?.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SecurityFeatures;