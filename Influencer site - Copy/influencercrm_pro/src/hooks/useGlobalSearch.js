/**
 * Global Search Hook
 * Provides Command-K (Cmd+K) functionality for global search
 * Handles keyboard shortcuts and search state management
 */

import { useState, useEffect, useCallback } from 'react';

export const useGlobalSearch = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Toggle search modal
  const toggleSearch = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  // Open search modal
  const openSearch = useCallback(() => {
    setIsOpen(true);
  }, []);

  // Close search modal
  const closeSearch = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Command/Ctrl + K to open search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleSearch();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggleSearch]);

  return {
    isOpen,
    openSearch,
    closeSearch,
    toggleSearch
  };
};

export default useGlobalSearch;
