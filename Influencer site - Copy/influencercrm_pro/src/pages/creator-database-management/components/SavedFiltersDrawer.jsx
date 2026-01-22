import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import SavedFiltersPanel from './SavedFiltersPanel';

const SavedFiltersDrawer = ({ onApplyFilter, currentFilters }) => {
  const [isOpen, setIsOpen] = useState(() => {
    // Restore state from localStorage
    const saved = localStorage.getItem('saved_filters_drawer_open');
    return saved === 'true';
  });

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('saved_filters_drawer_open', isOpen.toString());
  }, [isOpen]);

  // Handle ESC key to close drawer
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const toggleDrawer = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Toggle Button in Header */}
      <button
        onClick={toggleDrawer}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors duration-200"
        aria-label="Toggle saved filters"
        aria-expanded={isOpen}
      >
        <Icon name="Filter" size={16} />
        <span>Saved Filters</span>
        <Icon 
          name={isOpen ? "ChevronRight" : "ChevronLeft"} 
          size={14} 
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Floating Handle - always visible */}
      <button
        onClick={toggleDrawer}
        className={`
          fixed top-1/2 transform -translate-y-1/2 w-10 h-20 bg-primary text-primary-foreground rounded-l-lg shadow-xl 
          flex items-center justify-center hover:bg-primary/90 hover:scale-105 transition-all duration-200 ease-in-out z-[300] group
          ${isOpen ? 'right-[360px]' : 'right-0'}
        `}
        aria-label={isOpen ? "Close saved filters" : "Open saved filters"}
        title={isOpen ? "Close Saved Filters" : "Open Saved Filters"}
        aria-expanded={isOpen}
      >
        <Icon 
          name={isOpen ? "ChevronRight" : "ChevronLeft"} 
          size={18} 
          className={`transition-transform duration-200 ${isOpen ? 'group-hover:translate-x-[2px]' : 'group-hover:translate-x-[-2px]'}`} 
        />
      </button>

      {/* Backdrop for desktop and mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-[298]"
          onClick={toggleDrawer}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className={`
          fixed top-0 right-0 h-full w-[360px] bg-card border-l border-border shadow-xl z-[299]
          transform transition-transform duration-200 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <div className="h-full flex flex-col">
          {/* Drawer Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Icon name="Star" size={18} color="var(--color-primary)" />
              <h2 className="text-lg font-semibold text-foreground">Saved Filters</h2>
            </div>
            <button
              onClick={toggleDrawer}
              className="p-2 hover:bg-muted rounded-md transition-colors duration-200 hover:scale-110 transform"
              aria-label="Close saved filters"
              title="Close Saved Filters"
            >
              <Icon name="X" size={20} />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
            <SavedFiltersPanel onApplyFilter={onApplyFilter} currentFilters={currentFilters} />
          </div>
        </div>
      </div>
    </>
  );
};

export default SavedFiltersDrawer;
