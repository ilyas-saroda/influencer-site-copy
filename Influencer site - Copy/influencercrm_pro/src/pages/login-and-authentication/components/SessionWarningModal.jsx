import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const SessionWarningModal = ({ isOpen, onExtend, onLogout, remainingTime }) => {
  const [timeLeft, setTimeLeft] = useState(remainingTime);

  useEffect(() => {
    if (!isOpen) return;

    setTimeLeft(remainingTime);
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, remainingTime, onLogout]);

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-card border border-border rounded-lg shadow-lg-custom max-w-md w-full p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
            <Icon name="Clock" size={24} color="var(--color-warning)" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Session Expiring Soon
            </h2>
            <p className="text-sm text-muted-foreground">
              Your session will expire in {minutes}:{seconds?.toString()?.padStart(2, '0')} due to inactivity. Would you like to continue working?
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={onLogout}
            iconName="LogOut"
            iconPosition="left"
            className="flex-1"
          >
            Logout Now
          </Button>
          <Button
            variant="default"
            onClick={onExtend}
            iconName="RefreshCw"
            iconPosition="left"
            className="flex-1"
          >
            Stay Logged In
          </Button>
        </div>

        <div className="mt-4 p-3 bg-muted rounded-md">
          <p className="text-xs text-muted-foreground">
            <Icon name="Info" size={14} className="inline mr-1" />
            Sessions automatically expire after 8 hours of inactivity for security purposes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SessionWarningModal;