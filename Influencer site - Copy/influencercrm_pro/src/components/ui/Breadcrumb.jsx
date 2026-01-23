/**
 * Breadcrumb Navigation Component
 * Provides hierarchical navigation with automatic route detection
 * Follows the established design system with Tailwind CSS
 */

import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const Breadcrumb = ({ className = '', maxItems = 4 }) => {
  const location = useLocation();
  
  // Route mapping for user-friendly names
  const routeNames = {
    '/': 'Dashboard',
    '/executive-dashboard': 'Dashboard',
    '/creator-database-management': 'Creators',
    '/creator-profile-details': 'Creator Details',
    '/campaign-management-center': 'Campaigns',
    '/brand-contact-management': 'Brand Contacts',
    '/bulk-instagram-processor': 'Instagram Processor',
    '/payment-processing-center': 'Payments',
    '/system-settings-user-management': 'Settings',
    '/admin-state-management': 'State Management',
    '/admin-city-management': 'City Management',
    '/user-profile': 'Profile',
    '/login-and-authentication': 'Login',
    '/login': 'Login'
  };

  // Generate breadcrumb items from current path
  const generateBreadcrumbItems = () => {
    const pathSegments = location.pathname.split('/').filter(segment => segment);
    const items = [];
    
    // Always add home as first item
    items.push({
      label: 'Home',
      href: '/',
      icon: Home
    });

    // Build breadcrumb path segments
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Handle dynamic routes (like creator profile details)
      let label = routeNames[currentPath];
      if (!label) {
        // Check if this might be a dynamic route
        if (currentPath.includes('/creator-profile-details/')) {
          label = 'Creator Details';
        } else if (segment.match(/^[a-f0-9-]{36}$/i)) {
          // UUID detected, use parent route name
          const parentPath = currentPath.substring(0, currentPath.lastIndexOf('/'));
          label = routeNames[parentPath] || segment;
        } else {
          // Convert kebab-case to title case
          label = segment
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        }
      }
      
      items.push({
        label,
        href: currentPath,
        isLast: index === pathSegments.length - 1
      });
    });

    // Handle overflow by truncating middle items
    if (items.length > maxItems) {
      const firstItems = items.slice(0, 2);
      const lastItems = items.slice(-2);
      const middleItem = {
        label: '...',
        href: '#',
        isTruncated: true
      };
      
      return [...firstItems, middleItem, ...lastItems];
    }

    return items;
  };

  const breadcrumbItems = generateBreadcrumbItems();

  // Don't show breadcrumbs on login page or root
  if (location.pathname === '/' || location.pathname === '/login' || location.pathname === '/login-and-authentication') {
    return null;
  }

  return (
    <nav className={`flex items-center space-x-1 text-sm text-muted-foreground ${className}`}>
      {breadcrumbItems.map((item, index) => (
        <React.Fragment key={`${item.href}-${index}`}>
          {index > 0 && (
            <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
          )}
          
          {item.isLast || item.isTruncated ? (
            <span className={`font-medium ${
              item.isLast ? 'text-foreground' : 'text-muted-foreground'
            }`}>
              {item.icon && <item.icon className="w-4 h-4 mr-1 inline" />}
              {item.label}
            </span>
          ) : (
            <Link
              to={item.href}
              className="flex items-center hover:text-foreground transition-colors duration-200"
            >
              {item.icon && <item.icon className="w-4 h-4 mr-1" />}
              {item.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumb;
