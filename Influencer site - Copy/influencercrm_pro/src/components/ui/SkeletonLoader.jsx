/**
 * Enterprise Skeleton Loader Components
 * Professional loading states for various UI patterns
 * Mobile-first responsive design
 */

import React from 'react';

// Base skeleton component
const Skeleton = ({ 
  className = '', 
  variant = 'default',
  animation = 'pulse',
  ...props 
}) => {
  const baseClasses = 'bg-gray-200 rounded';
  
  const variantClasses = {
    default: 'h-4 w-full',
    text: 'h-4 w-full',
    heading: 'h-8 w-3/4',
    subheading: 'h-6 w-1/2',
    avatar: 'h-10 w-10 rounded-full',
    button: 'h-10 w-20',
    card: 'h-32 w-full',
    image: 'h-48 w-full',
    circle: 'rounded-full',
    rectangle: 'rounded-none'
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    shimmer: 'animate-shimmer',
    none: ''
  };

  const classes = `
    ${baseClasses}
    ${variantClasses[variant] || variantClasses.default}
    ${animationClasses[animation] || animationClasses.pulse}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div 
      className={classes}
      {...props}
    />
  );
};

// Table skeleton loader
export const TableSkeleton = ({ rows = 5, columns = 4, className = '' }) => (
  <div className={`space-y-3 ${className}`}>
    {/* Header */}
    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {Array.from({ length: columns }).map((_, index) => (
        <Skeleton key={`header-${index}`} variant="text" className="h-6" />
      ))}
    </div>
    
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={`row-${rowIndex}`} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton key={`cell-${rowIndex}-${colIndex}`} variant="text" />
        ))}
      </div>
    ))}
  </div>
);

// Card skeleton loader
export const CardSkeleton = ({ count = 1, className = '' }) => (
  <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <div className="flex items-center space-x-4">
          <Skeleton variant="avatar" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="heading" className="h-5" />
            <Skeleton variant="text" className="h-4 w-2/3" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton variant="text" />
          <Skeleton variant="text" className="w-4/5" />
          <Skeleton variant="text" className="w-3/5" />
        </div>
        <div className="flex justify-between items-center pt-4">
          <Skeleton variant="button" />
          <Skeleton variant="button" className="w-16" />
        </div>
      </div>
    ))}
  </div>
);

// List skeleton loader
export const ListSkeleton = ({ items = 5, className = '' }) => (
  <div className={`space-y-4 ${className}`}>
    {Array.from({ length: items }).map((_, index) => (
      <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <Skeleton variant="avatar" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="subheading" />
            <Skeleton variant="text" />
            <Skeleton variant="text" className="w-3/4" />
          </div>
          <Skeleton variant="button" />
        </div>
      </div>
    ))}
  </div>
);

// Form skeleton loader
export const FormSkeleton = ({ fields = 5, className = '' }) => (
  <div className={`space-y-6 ${className}`}>
    <div className="space-y-2">
      <Skeleton variant="subheading" className="h-6 w-1/3" />
      <Skeleton variant="text" className="h-4 w-2/3" />
    </div>
    
    {Array.from({ length: fields }).map((_, index) => (
      <div key={index} className="space-y-2">
        <Skeleton variant="text" className="h-4 w-1/4" />
        <Skeleton variant="text" className="h-10" />
      </div>
    ))}
    
    <div className="flex space-x-3 pt-4">
      <Skeleton variant="button" className="w-24" />
      <Skeleton variant="button" className="w-16" />
    </div>
  </div>
);

// Dashboard stats skeleton
export const DashboardStatsSkeleton = ({ count = 4, className = '' }) => (
  <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <Skeleton variant="circle" className="h-8 w-8" />
          <Skeleton variant="text" className="h-4 w-16" />
        </div>
        <Skeleton variant="heading" className="h-8 w-20 mb-2" />
        <Skeleton variant="text" className="h-4 w-24" />
      </div>
    ))}
  </div>
);

// Chart skeleton loader
export const ChartSkeleton = ({ className = '' }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
    <div className="flex items-center justify-between mb-6">
      <Skeleton variant="subheading" className="h-6 w-32" />
      <Skeleton variant="button" className="w-24" />
    </div>
    <div className="space-y-4">
      {/* Chart area */}
      <div className="h-64 space-y-2">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="flex items-end space-x-2 h-8">
            <Skeleton variant="text" className="h-full w-8" />
            <Skeleton variant="text" className="h-full w-12" />
            <Skeleton variant="text" className="h-full w-6" />
            <Skeleton variant="text" className="h-full w-16" />
            <Skeleton variant="text" className="h-full w-10" />
            <Skeleton variant="text" className="h-full w-14" />
          </div>
        ))}
      </div>
      {/* Legend */}
      <div className="flex justify-center space-x-6">
        <Skeleton variant="text" className="h-4 w-20" />
        <Skeleton variant="text" className="h-4 w-24" />
        <Skeleton variant="text" className="h-4 w-16" />
      </div>
    </div>
  </div>
);

// Page layout skeleton
export const PageSkeleton = ({ 
  showHeader = true,
  showSidebar = false,
  children,
  className = '' 
}) => (
  <div className={`min-h-screen bg-gray-50 ${className}`}>
    {/* Header */}
    {showHeader && (
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Skeleton variant="rectangle" className="h-8 w-32" />
              <Skeleton variant="text" className="h-8 w-48" />
            </div>
            <div className="flex items-center space-x-4">
              <Skeleton variant="avatar" />
              <Skeleton variant="button" className="w-20" />
            </div>
          </div>
        </div>
      </div>
    )}

    <div className="flex">
      {/* Sidebar */}
      {showSidebar && (
        <div className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
          <div className="p-4 space-y-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} variant="text" className="h-8" />
            ))}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 p-6">
        {children || (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Skeleton variant="heading" className="h-8 w-48" />
              <Skeleton variant="button" className="w-32" />
            </div>
            <DashboardStatsSkeleton />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartSkeleton />
              <CardSkeleton count={2} />
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);

// Loading spinner for inline use
export const LoadingSpinner = ({ 
  size = 'md', 
  className = '',
  text = 'Loading...' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]}`} />
      {text && <span className="text-sm text-gray-600">{text}</span>}
    </div>
  );
};

// Full page loading overlay
export const FullPageLoader = ({ text = 'Loading...', className = '' }) => (
  <div className={`fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50 ${className}`}>
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
      <p className="text-lg font-medium text-gray-900">{text}</p>
    </div>
  </div>
);

export default Skeleton;
