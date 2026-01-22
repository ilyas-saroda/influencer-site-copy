import React from 'react';
import { useAudit } from './useAudit';

// Higher-order component for wrapping components with audit functionality
export function withAuditLogging(WrappedComponent, options = {}) {
  return function WithAuditLoggingComponent(props) {
    const audit = useAudit();
    
    return React.createElement(WrappedComponent, { ...props, audit });
  };
}

// Context Provider component
export function AuditProvider({ children }) {
  const audit = useAudit();
  
  return React.createElement(
    'div',
    { className: 'audit-provider' },
    React.createElement(
      'div',
      { 'data-audit-context': 'true' },
      children
    )
  );
}

export default useAudit;
