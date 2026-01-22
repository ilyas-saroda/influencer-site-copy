import React, { useState, useRef, useEffect } from 'react';

import UserProfileDropdown from './UserProfileDropdown';
import NotificationCenter from './NotificationCenter';
import QuickActionToolbar from './QuickActionToolbar';
import SearchGlobal from './SearchGlobal';

const Header = ({ isCollapsed = false, title, subtitle }) => {
  return (
    <header className={`app-header with-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="header-content">
        {/* Branding Section */}
        <div className="header-branding">
          <div className="brand-logo">
            <img src="/assets/images/upgoal-logo.svg" alt="Upgoal Media" className="w-8 h-6 object-contain" />
          </div>
          <div className="brand-text">
            <h1 className="brand-title">Upgoal Media</h1>
            {subtitle && <p className="brand-subtitle">{subtitle}</p>}
          </div>
        </div>

        {/* Search Bar */}
        <div className="header-search">
          <SearchGlobal />
        </div>

        {/* Actions */}
        <div className="header-actions">
          <QuickActionToolbar />
          <NotificationCenter />
          <UserProfileDropdown />
        </div>
      </div>
    </header>
  );
};

export default Header;