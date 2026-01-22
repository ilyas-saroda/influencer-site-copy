import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Icon from '../AppIcon';
import { Home, Users, FolderKanban, DollarSign, Database, Link as LinkIcon, Settings, ChevronLeft, ChevronRight, MapPin, FileSpreadsheet, Building } from 'lucide-react';
import { stateManagementService } from '../../services/stateManagementService';
import { cityManagementService } from '../../services/cityManagementService';
import SpreadsheetImportPanel from './SpreadsheetImportPanel';

const Sidebar = ({ isCollapsed = false, onToggleCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [unmappedStatesCount, setUnmappedStatesCount] = useState(0);
  const [unmappedCitiesCount, setUnmappedCitiesCount] = useState(0);
  const [showImportPanel, setShowImportPanel] = useState(false);

  // Keyboard navigation support
  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && isMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  useEffect(() => {
    if (isMobileOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isMobileOpen]);

  // Fetch unmapped states and cities count
  useEffect(() => {
    const fetchUnmappedCounts = async () => {
      try {
        const uncleanedStates = await stateManagementService.getUncleanedStates();
        const uncleanedCities = await cityManagementService.getUncleanedCities();
        setUnmappedStatesCount(uncleanedStates.length);
        setUnmappedCitiesCount(uncleanedCities.length);
      } catch (error) {
        console.error('Error fetching unmapped counts:', error);
        setUnmappedStatesCount(0);
        setUnmappedCitiesCount(0);
      }
    };

    fetchUnmappedCounts();
    
    // Refresh count every 30 seconds
    const interval = setInterval(fetchUnmappedCounts, 30000);
    
    // Listen for update events
    const handleStateMappingsUpdate = () => {
      fetchUnmappedCounts();
    };
    
    const handleCityMappingsUpdate = () => {
      fetchUnmappedCounts();
    };
    
    window.addEventListener('stateMappingsUpdated', handleStateMappingsUpdate);
    window.addEventListener('cityMappingsUpdated', handleCityMappingsUpdate);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('stateMappingsUpdated', handleStateMappingsUpdate);
      window.removeEventListener('cityMappingsUpdated', handleCityMappingsUpdate);
    };
  }, []);

  const navigation = [
    { name: 'Executive Dashboard', href: '/executive-dashboard', icon: Home },
    { name: 'Creator Database', href: '/creator-database-management', icon: Database },
    { name: 'Campaign Management', href: '/campaign-management-center', icon: FolderKanban },
    { name: 'Payment Processing', href: '/payment-processing-center', icon: DollarSign },
    { name: 'Brand & Contact', href: '/brand-contact-management', icon: Users },
    { name: 'Bulk Instagram Processor', href: '/bulk-instagram-processor', icon: LinkIcon },
    { name: 'System Settings', href: '/system-settings-user-management', icon: Settings },
    { name: 'State Management', href: '/admin-state-management', icon: MapPin },
    { name: 'City Management', href: '/admin-city-management', icon: Building },
  ];

  const handleNavigation = (path) => {
    navigate(path);
    setIsMobileOpen(false);
  };

  const handleMobileToggle = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const isActive = (path) => {
    return location?.pathname === path;
  };

  return (
    <>
      <button
        className="mobile-menu-button"
        onClick={handleMobileToggle}
        aria-label="Toggle mobile menu"
      >
        <Icon name={isMobileOpen ? 'X' : 'Menu'} size={24} />
      </button>
      {isMobileOpen && (
        <div
          className="mobile-overlay"
          onClick={handleMobileToggle}
          aria-hidden="true"
        />
      )}
      <aside
        className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Sidebar Toggle Button */}
        <button
          onClick={onToggleCollapse}
          className="sidebar-toggle-btn absolute top-2 right-2 z-50 bg-white border border-gray-200 rounded-md p-2 shadow-md hover:bg-gray-50 transition-all duration-200"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
        
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img src="/assets/images/upgoal-logo.svg" alt="Upgoal Media" className="w-8 h-6 object-contain" />
          </div>
          <span className="sidebar-logo-text">Upgoal Media</span>
        </div>

        <nav className="sidebar-nav" role="navigation" aria-label="Main navigation">
          {navigation?.map((item) => (
            <button
              key={item?.href}
              onClick={() => handleNavigation(item?.href)}
              className={`sidebar-nav-item ${isActive(item?.href) ? 'active' : ''}`}
              title={isCollapsed ? item?.name : ''}
              aria-label={item?.name}
              aria-current={isActive(item?.href) ? 'page' : undefined}
            >
              <Icon name={item?.icon} size={20} />
              <span className="sidebar-nav-item-text">{item?.name}</span>
              {item?.href === '/admin-state-management' && unmappedStatesCount > 0 && (
                <span 
                  className="sidebar-nav-item-badge"
                  style={{
                    backgroundColor: '#ef4444',
                    color: 'white',
                    minWidth: '20px',
                    height: '20px',
                    borderRadius: '9999px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: '600',
                    padding: '0 6px'
                  }}
                >
                  {unmappedStatesCount > 99 ? '99+' : unmappedStatesCount}
                </span>
              )}
              {item?.href === '/admin-city-management' && unmappedCitiesCount > 0 && (
                <span 
                  className="sidebar-nav-item-badge"
                  style={{
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    minWidth: '20px',
                    height: '20px',
                    borderRadius: '9999px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: '600',
                    padding: '0 6px'
                  }}
                >
                  {unmappedCitiesCount > 99 ? '99+' : unmappedCitiesCount}
                </span>
              )}
            </button>
          ))}
          
          {/* Spreadsheet Import Section */}
          <div className="sidebar-section-divider" />
          
          {/* Excel Import Button */}
          <button
            onClick={() => setShowImportPanel(true)}
            className="sidebar-nav-item spreadsheet-import-btn"
            title={isCollapsed ? "Import Excel/CSV" : ''}
            aria-label="Import Excel or CSV file"
          >
            <FileSpreadsheet size={20} />
            <span className="sidebar-nav-item-text">Import Excel</span>
          </button>
          
          {/* Google Sheets Import Button */}
          <button
            onClick={() => setShowImportPanel(true)}
            className="sidebar-nav-item spreadsheet-import-btn"
            title={isCollapsed ? "Import Google Sheets" : ''}
            aria-label="Import Google Sheets"
          >
            <FileSpreadsheet size={20} />
            <span className="sidebar-nav-item-text">Import Google Sheet</span>
          </button>
        </nav>

      </aside>

      {/* Spreadsheet Import Panel */}
      <SpreadsheetImportPanel
        isOpen={showImportPanel}
        onClose={() => setShowImportPanel(false)}
        onDataImported={(data) => {
          console.log('Spreadsheet data imported:', data);
          // You can add additional handling here if needed
        }}
      />
    </>
  );
};

export default Sidebar;