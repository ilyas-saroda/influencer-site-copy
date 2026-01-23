/**
 * Enterprise Page Transition Component
 * Smooth transitions between pages with loading states
 * Mobile-first responsive design
 */

import React, { useState, useEffect } from 'react';
import { LoadingSpinner } from './SkeletonLoader';

const PageTransition = ({ 
  children, 
  loading = false, 
  duration = 300,
  className = '',
  animation = 'fade' // fade, slide, scale, flip
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (!loading) {
      // Trigger entrance animation
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      setIsExiting(false);
    }
  }, [loading]);

  const handleExit = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsExiting(false);
    }, duration);
  };

  const getAnimationClasses = () => {
    const baseClasses = 'transition-all duration-300 ease-in-out';
    
    const animationClasses = {
      fade: isVisible && !isExiting 
        ? 'opacity-100' 
        : 'opacity-0',
      slide: isVisible && !isExiting 
        ? 'translate-x-0 opacity-100' 
        : '-translate-x-4 opacity-0',
      scale: isVisible && !isExiting 
        ? 'scale-100 opacity-100' 
        : 'scale-95 opacity-0',
      flip: isVisible && !isExiting 
        ? 'rotate-0 opacity-100' 
        : 'rotate-1 opacity-0'
    };

    return `${baseClasses} ${animationClasses[animation] || animationClasses.fade}`;
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center bg-gray-50 ${className}`}>
        <div className="text-center">
          <LoadingSpinner size="lg" text="Loading page..." />
        </div>
      </div>
    );
  }

  return (
    <div className={`${getAnimationClasses()} ${className}`}>
      {children}
    </div>
  );
};

export default PageTransition;
