import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';
import { useAuth } from '../../contexts/AuthContext';


const UserProfileDropdown = () => {
  const { signOut, userProfile, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const userRole = userProfile?.role || userProfile?.displayName || 'Super Admin';
  const userName = userProfile?.full_name || user?.email?.split('@')[0] || 'User';
  const userEmail = user?.email || '';

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

  const handleLogout = async () => {
    const { error } = await signOut();
    if (!error) {
      navigate('/login-and-authentication');
      setIsOpen(false);
    }
  };

  const handleProfile = () => {
    navigate('/user-profile');
    setIsOpen(false);
  };

  const handleSettings = () => {
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="flex items-center gap-2 p-2 rounded-md hover:bg-muted transition-colors duration-200"
        aria-label="User profile menu"
        aria-expanded={isOpen}
      >
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon name="User" size={18} color="var(--color-primary)" />
        </div>
        <div className="hidden md:block text-left">
          <div className="text-sm font-medium text-foreground">{userName}</div>
          <div className="text-xs text-muted-foreground">{userRole}</div>
        </div>
        <Icon
          name="ChevronDown"
          size={16}
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="dropdown-menu">
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon name="User" size={20} color="var(--color-primary)" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate">
                  {userName}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {userEmail}
                </div>
                <span className="role-badge admin mt-1">
                  {userRole}
                </span>
              </div>
            </div>
          </div>

          <div className="py-1">
            <button
              onClick={handleProfile}
              className="dropdown-item"
            >
              <Icon name="User" size={18} />
              <span>My Profile</span>
            </button>
            {userRole === 'Super Admin' && (
              <button
                onClick={() => { navigate('/system-settings-user-management'); setIsOpen(false); }}
                className="dropdown-item"
              >
                <Icon name="Shield" size={18} />
                <span>Admin Console</span>
              </button>
            )}
            {(userRole === 'Super Admin' || userRole === 'Manager') && (
              <button
                onClick={() => { navigate('/campaign-management-center'); setIsOpen(false); }}
                className="dropdown-item"
              >
                <Icon name="FolderKanban" size={18} />
                <span>Manage Campaigns</span>
              </button>
            )}
            <button
              onClick={handleSettings}
              className="dropdown-item"
            >
              <Icon name="Settings" size={18} />
              <span>Settings</span>
            </button>
          </div>

          <div className="dropdown-divider" />

          <div className="py-1">
            <button
              onClick={handleLogout}
              className="dropdown-item text-error"
            >
              <Icon name="LogOut" size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfileDropdown;