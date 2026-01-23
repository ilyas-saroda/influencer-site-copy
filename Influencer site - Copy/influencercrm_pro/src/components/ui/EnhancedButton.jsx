/**
 * Enhanced Button Component with Transitions
 * Professional button with hover effects, loading states, and animations
 * Mobile-first responsive design
 */

import React, { useState } from 'react';
import { cva } from "class-variance-authority";
import { cn } from "../../utils/cn";
import { LoadingSpinner } from './SkeletonLoader';
import Icon from '../AppIcon';

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden group",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transform hover:-translate-y-0.5",
        destructive: "bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 shadow-md hover:shadow-lg transform hover:-translate-y-0.5",
        outline: "border-2 border-gray-300 bg-white hover:bg-gray-50 text-gray-900 hover:border-gray-400 shadow-sm hover:shadow-md transform hover:-translate-y-0.5",
        secondary: "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-900 hover:from-gray-200 hover:to-gray-300 shadow-sm hover:shadow-md transform hover:-translate-y-0.5",
        ghost: "hover:bg-gray-100 text-gray-700 hover:text-gray-900 transform hover:scale-105",
        link: "text-blue-600 underline-offset-4 hover:underline hover:text-blue-700 transform hover:scale-105",
        success: "bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 shadow-md hover:shadow-lg transform hover:-translate-y-0.5",
        warning: "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white hover:from-yellow-600 hover:to-yellow-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5",
        danger: "bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 shadow-md hover:shadow-lg transform hover:-translate-y-0.5",
        premium: "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5",
      },
      size: {
        default: "h-11 px-6 py-2 text-sm",
        sm: "h-9 px-4 py-1.5 text-xs",
        lg: "h-13 px-8 py-3 text-base",
        xl: "h-15 px-10 py-4 text-lg",
        icon: "h-11 w-11 p-0",
        xs: "h-7 px-3 py-1 text-xs",
      },
      fullWidth: {
        true: "w-full",
        false: "w-auto"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      fullWidth: false,
    },
  }
);

const EnhancedButton = React.forwardRef(({
  className,
  variant,
  size,
  fullWidth = false,
  children,
  loading = false,
  disabled = false,
  iconName = null,
  iconPosition = 'left',
  iconSize = null,
  loadingText = 'Loading...',
  showRipple = true,
  onClick,
  ...props
}, ref) => {
  const [ripples, setRipples] = useState([]);

  // Icon size mapping based on button size
  const iconSizeMap = {
    xs: 12,
    sm: 14,
    default: 16,
    lg: 18,
    xl: 20,
    icon: 16,
  };

  const calculatedIconSize = iconSize || iconSizeMap?.[size] || 16;

  // Handle ripple effect
  const handleRipple = (event) => {
    if (!showRipple) return;
    
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    const newRipple = {
      id: Date.now(),
      x,
      y,
      size
    };
    
    setRipples(prev => [...prev, newRipple]);
    
    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, 600);
  };

  const handleClick = (event) => {
    if (loading || disabled) return;
    
    handleRipple(event);
    
    if (onClick) {
      onClick(event);
    }
  };

  const renderIcon = () => {
    if (!iconName) return null;
    
    try {
      return (
        <Icon
          name={iconName}
          size={calculatedIconSize}
          className={cn(
            "transition-transform duration-200 group-hover:scale-110",
            children && iconPosition === 'left' && "mr-2",
            children && iconPosition === 'right' && "ml-2"
          )}
        />
      );
    } catch {
      return null;
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <>
          <LoadingSpinner size="sm" className="mr-2" />
          {loadingText}
        </>
      );
    }

    return (
      <>
        {iconName && iconPosition === 'left' && renderIcon()}
        <span className="relative z-10">{children}</span>
        {iconName && iconPosition === 'right' && renderIcon()}
      </>
    );
  };

  return (
    <button
      className={cn(
        buttonVariants({ variant, size, fullWidth }),
        (loading || disabled) && "cursor-not-allowed transform-none",
        className
      )}
      ref={ref}
      disabled={disabled || loading}
      onClick={handleClick}
      {...props}
    >
      {/* Ripple effects */}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute bg-white opacity-30 rounded-full animate-ping"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
            animation: 'ripple 0.6s ease-out'
          }}
        />
      ))}
      
      {/* Button content */}
      <div className="relative z-10 flex items-center justify-center">
        {renderContent()}
      </div>
      
      {/* Gradient overlay for hover effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-xl" />
    </button>
  );
});

EnhancedButton.displayName = "EnhancedButton";

export default EnhancedButton;
