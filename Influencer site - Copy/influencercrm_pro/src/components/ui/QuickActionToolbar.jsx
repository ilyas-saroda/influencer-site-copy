import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Icon from '../AppIcon';

const QuickActionToolbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showMobileFAB, setShowMobileFAB] = useState(false);

  const quickActions = [
    {
      label: 'Create Campaign',
      icon: 'Plus',
      action: () => navigate('/campaign-management-center'),
      visible: ['/campaign-management-center']
    },
    {
      label: 'Process Payment',
      icon: 'DollarSign',
      action: () => navigate('/payment-processing-center'),
      visible: ['/payment-processing-center']
    }
  ];

  const getVisibleActions = () => {
    return quickActions?.filter(action =>
      action?.visible?.includes(location?.pathname)
    );
  };

  const visibleActions = getVisibleActions();
  const primaryAction = visibleActions?.[0];

  const handleAction = (action) => {
    action?.action();
  };

  return (
    <>
      <div className="hidden lg:flex items-center gap-2">
        {visibleActions?.map((action, index) => (
          <button
            key={index}
            onClick={() => handleAction(action)}
            className="quick-action-btn"
            aria-label={action?.label}
          >
            <Icon name={action?.icon} size={18} />
            <span>{action?.label}</span>
          </button>
        ))}
      </div>
      {primaryAction && (
        <button
          onClick={() => handleAction(primaryAction)}
          className="fab"
          aria-label={primaryAction?.label}
        >
          <Icon name={primaryAction?.icon} size={24} />
        </button>
      )}
    </>
  );
};

export default QuickActionToolbar;