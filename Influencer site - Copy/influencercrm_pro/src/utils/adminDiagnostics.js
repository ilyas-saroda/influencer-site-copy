// src/utils/adminDiagnostics.js

// Admin Control Center Diagnostics Utility
export class AdminDiagnostics {
  static log(message, data = null) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Admin Control Center] ${message}`, data || '');
    }
  }

  static error(message, error = null) {
    console.error(`[Admin Control Center ERROR] ${message}`, error || '');
  }

  static warn(message, data = null) {
    console.warn(`[Admin Control Center WARNING] ${message}`, data || '');
  }

  static logInitialization(components) {
    this.log('🚀 Admin Control Center Initialization Started');
    
    components.forEach(component => {
      this.log(`✅ ${component} Loaded`);
    });
    
    this.log('🎯 Admin Control Center Ready');
  }

  static logPermissionCheck(isSuperAdmin, userEmail) {
    this.log(`🔐 Permission Check: ${isSuperAdmin ? 'GRANTED' : 'DENIED'} for ${userEmail}`);
  }

  static logDataFetch(type, count, duration) {
    this.log(`📊 Data Fetch: ${type} - ${count} records in ${duration}ms`);
  }

  static logOperation(operation, success, details = null) {
    const status = success ? '✅ SUCCESS' : '❌ FAILED';
    this.log(`🔧 Operation: ${operation} - ${status}`, details);
  }
}

// Performance monitor for admin operations
export class PerformanceMonitor {
  static startTimer(operation) {
    return {
      operation,
      startTime: performance.now(),
      end: function() {
        const duration = performance.now() - this.startTime;
        AdminDiagnostics.logDataFetch(this.operation, 'N/A', Math.round(duration));
        return duration;
      }
    };
  }
}

// Error boundary for admin components
export class AdminErrorBoundary {
  static handleError(error, errorInfo, component) {
    AdminDiagnostics.error(`Error in ${component}`, { error, errorInfo });
    
    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: sendErrorToService(error, errorInfo, component);
    }
  }
}

export default AdminDiagnostics;
