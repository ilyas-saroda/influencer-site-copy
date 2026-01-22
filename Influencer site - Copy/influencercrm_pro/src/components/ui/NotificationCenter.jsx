import React, { useState, useRef, useEffect } from 'react';
import Icon from '../AppIcon';

const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'payment',
      title: 'Payment Overdue',
      message: 'Payment for Campaign #2847 is 3 days overdue',
      time: '5 minutes ago',
      read: false,
      icon: 'AlertCircle',
      color: 'error'
    },
    {
      id: 2,
      type: 'campaign',
      title: 'Campaign Deadline',
      message: 'Summer Fashion Campaign ends in 2 days',
      time: '1 hour ago',
      read: false,
      icon: 'Clock',
      color: 'warning'
    },
    {
      id: 3,
      type: 'creator',
      title: 'New Creator Application',
      message: 'Sarah Johnson applied to join your network',
      time: '3 hours ago',
      read: false,
      icon: 'UserPlus',
      color: 'primary'
    },
    {
      id: 4,
      type: 'payment',
      title: 'Payment Processed',
      message: 'Payment of $2,500 completed successfully',
      time: '5 hours ago',
      read: true,
      icon: 'CheckCircle',
      color: 'success'
    },
    {
      id: 5,
      type: 'system',
      title: 'System Update',
      message: 'Instagram API integration updated',
      time: '1 day ago',
      read: true,
      icon: 'Info',
      color: 'secondary'
    }
  ]);

  const dropdownRef = useRef(null);
  const unreadCount = notifications?.filter(n => !n?.read)?.length;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef?.current && !dropdownRef?.current?.contains(event?.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = (id) => {
    setNotifications(notifications?.map(n =>
      n?.id === id ? { ...n, read: true } : n
    ));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications?.map(n => ({ ...n, read: true })));
  };

  const handleClearAll = () => {
    setNotifications([]);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-md hover:bg-muted transition-colors duration-200"
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <Icon name="Bell" size={20} />
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {isOpen && (
        <div className="dropdown-menu w-96">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary">
                  {unreadCount} new
                </span>
              )}
            </div>
            {notifications?.length > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-primary hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            {notifications?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <Icon name="BellOff" size={48} color="var(--color-muted-foreground)" />
                <p className="mt-3 text-sm text-muted-foreground">No notifications</p>
              </div>
            ) : (
              <div className="py-1">
                {notifications?.map((notification) => (
                  <button
                    key={notification?.id}
                    onClick={() => handleMarkAsRead(notification?.id)}
                    className={`w-full px-4 py-3 hover:bg-muted transition-colors duration-200 border-l-2 ${
                      notification?.read
                        ? 'border-transparent'
                        : `border-${notification?.color}`
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-${notification?.color}/10 flex items-center justify-center`}>
                        <Icon
                          name={notification?.icon}
                          size={16}
                          color={`var(--color-${notification?.color})`}
                        />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-medium ${
                            notification?.read ? 'text-muted-foreground' : 'text-foreground'
                          }`}>
                            {notification?.title}
                          </p>
                          {!notification?.read && (
                            <span className="flex-shrink-0 w-2 h-2 rounded-full bg-primary" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {notification?.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {notification?.time}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {notifications?.length > 0 && (
            <>
              <div className="dropdown-divider" />
              <div className="px-4 py-2">
                <button
                  onClick={handleClearAll}
                  className="w-full text-sm text-error hover:underline"
                >
                  Clear all notifications
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;