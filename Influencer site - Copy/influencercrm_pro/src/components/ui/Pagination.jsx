import React, { useState } from 'react';
import Button from './Button';
import Input from './Input';

/**
 * Pagination component with page number buttons and direct page input
 * 
 * @param {Object} props
 * @param {number} props.currentPage - Current page number (1-indexed)
 * @param {number} props.totalPages - Total number of pages
 * @param {number} props.totalItems - Total number of items
 * @param {number} props.itemsPerPage - Number of items per page
 * @param {function} props.onPageChange - Callback function when page changes
 * @param {boolean} props.loading - Whether data is currently loading
 * @param {string} props.className - Additional CSS classes
 */
export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  loading = false,
  className = ''
}) {
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');

  // Calculate range information
  const startItem = totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      // Show all pages if total is less than or equal to max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else if (currentPage <= 3) {
      // Show first 5 pages when current page is near the start
      for (let i = 1; i <= maxVisible; i++) {
        pages.push(i);
      }
    } else if (currentPage >= totalPages - 2) {
      // Show last 5 pages when current page is near the end
      for (let i = totalPages - maxVisible + 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show pages around current page
      for (let i = currentPage - 2; i <= currentPage + 2; i++) {
        pages.push(i);
      }
    }

    return pages;
  };

  // Handle page navigation
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && !loading) {
      onPageChange(page);
      setInputValue('');
      setInputError('');
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    
    // Clear error when user starts typing
    if (inputError) {
      setInputError('');
    }
  };

  // Handle input submission (Enter key or Go button)
  const handleInputSubmit = () => {
    const pageNumber = parseInt(inputValue, 10);
    
    // Validate input
    if (!inputValue.trim()) {
      setInputError('Please enter a page number');
      return;
    }
    
    if (isNaN(pageNumber)) {
      setInputError('Please enter a valid number');
      return;
    }
    
    if (pageNumber < 1 || pageNumber > totalPages) {
      setInputError(`Page must be between 1 and ${totalPages}`);
      return;
    }
    
    // If valid, navigate to the page
    handlePageChange(pageNumber);
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleInputSubmit();
    }
  };

  // Don't render if there's only one page or no pages
  if (totalPages <= 1) {
    return null;
  }

  const pageNumbers = getPageNumbers();

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {/* Items count information */}
      <div className="text-sm text-muted-foreground">
        Showing {startItem} to {endItem} of {totalItems} items
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-2">
        {/* Previous button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1 || loading}
          iconName="ChevronLeft"
          iconSize={16}
          aria-label="Previous page"
        />

        {/* Page number buttons */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => handlePageChange(pageNum)}
              disabled={loading}
              className={`w-8 h-8 rounded-md text-sm font-medium transition-colors duration-200 ${
                currentPage === pageNum
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted text-foreground disabled:opacity-50'
              }`}
              aria-label={`Go to page ${pageNum}`}
              aria-current={currentPage === pageNum ? 'page' : undefined}
            >
              {pageNum}
            </button>
          ))}
        </div>

        {/* Direct page input */}
        <div className="flex items-center gap-1 ml-2">
          <div className="relative">
            <Input
              type="number"
              min="1"
              max={totalPages}
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Page"
              className={`w-16 h-8 text-center text-sm ${
                inputError ? 'border-destructive focus:border-destructive' : ''
              }`}
              disabled={loading}
              aria-label="Go to page"
              aria-invalid={!!inputError}
              aria-describedby={inputError ? 'page-error' : undefined}
            />
            {inputError && (
              <div
                id="page-error"
                className="absolute top-full left-0 right-0 mt-1 text-xs text-destructive whitespace-nowrap z-10"
                role="alert"
              >
                {inputError}
              </div>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleInputSubmit}
            disabled={loading || !inputValue.trim()}
            className="h-8 px-2 text-xs"
            aria-label="Go to entered page"
          >
            Go
          </Button>
        </div>

        {/* Next button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages || loading}
          iconName="ChevronRight"
          iconSize={16}
          aria-label="Next page"
        />
      </div>
    </div>
  );
}
