/**
 * Performance Monitoring and Optimization Utilities
 * 
 * This module provides real-time performance monitoring and optimization
 * recommendations for the user management system.
 */

import { useEffect, useRef, useState } from 'react';

// Performance metrics interface
export interface PerformanceEntry {
  name: string;
  startTime: number;
  duration: number;
  timestamp: Date;
  type: 'component' | 'api' | 'render' | 'calculation';
  metadata?: Record<string, any>;
}

export interface PerformanceAlert {
  type: 'warning' | 'error';
  message: string;
  threshold: number;
  actual: number;
  recommendation: string;
}

// Performance thresholds
export const PERFORMANCE_THRESHOLDS = {
  COMPONENT_RENDER: 100, // milliseconds
  API_CALL: 2000, // milliseconds
  DATA_TRANSFORM: 500, // milliseconds
  GRAPH_GENERATION: 1000, // milliseconds
  MEMORY_USAGE: 100 * 1024 * 1024, // 100MB
  BUNDLE_SIZE: 5 * 1024 * 1024, // 5MB
};

// Global performance store
class PerformanceMonitor {
  private entries: PerformanceEntry[] = [];
  private alerts: PerformanceAlert[] = [];
  private isEnabled = process.env.NODE_ENV === 'development';
  private maxEntries = 1000;

  // Enable/disable monitoring
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  // Record a performance entry
  recordEntry(entry: Omit<PerformanceEntry, 'timestamp'>) {
    if (!this.isEnabled) return;

    const fullEntry: PerformanceEntry = {
      ...entry,
      timestamp: new Date(),
    };

    this.entries.push(fullEntry);

    // Keep only the latest entries
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries);
    }

    // Check for performance alerts
    this.checkThresholds(fullEntry);
  }

  // Start timing
  startTiming(name: string, type: PerformanceEntry['type'], metadata?: Record<string, any>) {
    if (!this.isEnabled) return () => {};

    const startTime = performance.now();

    return () => {
      const duration = performance.now() - startTime;
      this.recordEntry({
        name,
        startTime,
        duration,
        type,
        metadata,
      });
    };
  }

  // Check performance thresholds
  private checkThresholds(entry: PerformanceEntry) {
    let threshold: number;
    let recommendation: string;

    switch (entry.type) {
      case 'component':
        threshold = PERFORMANCE_THRESHOLDS.COMPONENT_RENDER;
        recommendation = 'Consider using React.memo or optimizing component logic';
        break;
      case 'api':
        threshold = PERFORMANCE_THRESHOLDS.API_CALL;
        recommendation = 'Consider implementing request caching or pagination';
        break;
      case 'render':
        threshold = PERFORMANCE_THRESHOLDS.COMPONENT_RENDER;
        recommendation = 'Optimize render logic or use virtualization for large lists';
        break;
      case 'calculation':
        threshold = PERFORMANCE_THRESHOLDS.DATA_TRANSFORM;
        recommendation = 'Use memoization or move calculation to web worker';
        break;
      default:
        return;
    }

    if (entry.duration > threshold) {
      this.alerts.push({
        type: entry.duration > threshold * 2 ? 'error' : 'warning',
        message: `Slow ${entry.type}: ${entry.name} took ${entry.duration.toFixed(2)}ms`,
        threshold,
        actual: entry.duration,
        recommendation,
      });

      // Keep only the latest alerts
      if (this.alerts.length > 50) {
        this.alerts = this.alerts.slice(-50);
      }
    }
  }

  // Get performance statistics
  getStats(timeRange?: number) {
    const now = Date.now();
    const cutoff = timeRange ? now - timeRange : 0;
    
    const recentEntries = this.entries.filter(entry => 
      entry.timestamp.getTime() > cutoff
    );

    const byType = recentEntries.reduce((acc, entry) => {
      if (!acc[entry.type]) {
        acc[entry.type] = { count: 0, totalDuration: 0, avgDuration: 0 };
      }
      acc[entry.type].count++;
      acc[entry.type].totalDuration += entry.duration;
      acc[entry.type].avgDuration = acc[entry.type].totalDuration / acc[entry.type].count;
      return acc;
    }, {} as Record<string, { count: number; totalDuration: number; avgDuration: number }>);

    const slowestEntries = recentEntries
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    return {
      totalEntries: recentEntries.length,
      byType,
      slowestEntries,
      recentAlerts: this.alerts.slice(-10),
      memoryUsage: (performance as any).memory ? {
        used: (performance as any).memory.usedJSHeapSize,
        total: (performance as any).memory.totalJSHeapSize,
        limit: (performance as any).memory.jsHeapSizeLimit,
      } : null,
    };
  }

  // Clear all data
  clear() {
    this.entries = [];
    this.alerts = [];
  }

  // Export data for analysis
  exportData() {
    return {
      entries: this.entries,
      alerts: this.alerts,
      timestamp: new Date(),
    };
  }
}

// Global monitor instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for component performance monitoring
export const usePerformanceMonitor = (
  componentName: string,
  metadata?: Record<string, any>
) => {
  const renderStartTime = useRef(performance.now());
  const [renderCount, setRenderCount] = useState(0);

  useEffect(() => {
    const renderDuration = performance.now() - renderStartTime.current;
    
    performanceMonitor.recordEntry({
      name: componentName,
      startTime: renderStartTime.current,
      duration: renderDuration,
      type: 'component',
      metadata: { ...metadata, renderCount },
    });

    setRenderCount(prev => prev + 1);
  });

  useEffect(() => {
    renderStartTime.current = performance.now();
  });

  return {
    recordOperation: (operationName: string, type: PerformanceEntry['type'] = 'calculation') =>
      performanceMonitor.startTiming(`${componentName}.${operationName}`, type, metadata),
    renderCount,
  };
};

// React hook for API call monitoring
export const useApiPerformanceMonitor = () => {
  const recordApiCall = (endpoint: string, method: string = 'GET') => {
    return performanceMonitor.startTiming(
      `API: ${method} ${endpoint}`,
      'api',
      { endpoint, method }
    );
  };

  return { recordApiCall };
};

// Performance optimization decorator for functions
export const withPerformanceMonitoring = <T extends (...args: any[]) => any>(
  fn: T,
  name: string,
  type: PerformanceEntry['type'] = 'calculation'
): T => {
  return ((...args: Parameters<T>) => {
    const endTiming = performanceMonitor.startTiming(name, type);
    try {
      const result = fn(...args);
      
      // Handle promises
      if (result instanceof Promise) {
        return result.finally(() => endTiming());
      }
      
      endTiming();
      return result;
    } catch (error) {
      endTiming();
      throw error;
    }
  }) as T;
};

// Memory usage monitoring
export const useMemoryMonitor = (interval: number = 5000) => {
  const [memoryStats, setMemoryStats] = useState<{
    used: number;
    total: number;
    limit: number;
  } | null>(null);

  useEffect(() => {
    if (!(performance as any).memory) return;

    const updateMemoryStats = () => {
      setMemoryStats({
        used: (performance as any).memory.usedJSHeapSize,
        total: (performance as any).memory.totalJSHeapSize,
        limit: (performance as any).memory.jsHeapSizeLimit,
      });
    };

    updateMemoryStats();
    const intervalId = setInterval(updateMemoryStats, interval);

    return () => clearInterval(intervalId);
  }, [interval]);

  return memoryStats;
};

// Performance dashboard hook
export const usePerformanceDashboard = (refreshInterval: number = 2000) => {
  const [stats, setStats] = useState(performanceMonitor.getStats());

  useEffect(() => {
    const updateStats = () => {
      setStats(performanceMonitor.getStats(300000)); // Last 5 minutes
    };

    updateStats();
    const intervalId = setInterval(updateStats, refreshInterval);

    return () => clearInterval(intervalId);
  }, [refreshInterval]);

  return stats;
};

// Bundle size analyzer
export const analyzeBundleSize = () => {
  const modules = Object.keys(require.cache || {});
  const moduleStats = modules.map(modulePath => ({
    path: modulePath,
    size: new Blob([require.cache[modulePath]?.exports || '']).size,
  })).sort((a, b) => b.size - a.size);

  const totalSize = moduleStats.reduce((sum, mod) => sum + mod.size, 0);
  const largestModules = moduleStats.slice(0, 20);

  return {
    totalSize,
    moduleCount: modules.length,
    largestModules,
    recommendations: totalSize > PERFORMANCE_THRESHOLDS.BUNDLE_SIZE ? [
      'Consider code splitting with React.lazy',
      'Use dynamic imports for heavy libraries',
      'Remove unused dependencies',
      'Implement tree shaking',
    ] : [],
  };
};

// Performance optimization recommendations
export const getOptimizationRecommendations = (stats: ReturnType<typeof performanceMonitor.getStats>) => {
  const recommendations: string[] = [];

  // Component performance
  if (stats.byType.component?.avgDuration > PERFORMANCE_THRESHOLDS.COMPONENT_RENDER) {
    recommendations.push(
      'Use React.memo for pure components',
      'Implement useCallback and useMemo for expensive calculations',
      'Consider component virtualization for large lists'
    );
  }

  // API performance
  if (stats.byType.api?.avgDuration > PERFORMANCE_THRESHOLDS.API_CALL) {
    recommendations.push(
      'Implement request caching with React Query or SWR',
      'Use pagination for large datasets',
      'Consider GraphQL for efficient data fetching'
    );
  }

  // Memory usage
  if (stats.memoryUsage && stats.memoryUsage.used > PERFORMANCE_THRESHOLDS.MEMORY_USAGE) {
    recommendations.push(
      'Implement proper cleanup in useEffect',
      'Use object pooling for frequently created objects',
      'Consider lazy loading for heavy components'
    );
  }

  // General recommendations
  if (stats.recentAlerts.length > 5) {
    recommendations.push(
      'Review and optimize frequently alerting operations',
      'Consider implementing performance budgets',
      'Use profiling tools to identify bottlenecks'
    );
  }

  return recommendations;
};

// Development-only performance logger
export const logPerformanceToConsole = () => {
  if (process.env.NODE_ENV !== 'development') return;

  const stats = performanceMonitor.getStats();
  
  console.group('🔍 Performance Statistics');
  console.log('Total Entries:', stats.totalEntries);
  console.log('By Type:', stats.byType);
  console.log('Slowest Operations:', stats.slowestEntries);
  if (stats.memoryUsage) {
    console.log('Memory Usage:', {
      used: `${(stats.memoryUsage.used / 1024 / 1024).toFixed(2)} MB`,
      total: `${(stats.memoryUsage.total / 1024 / 1024).toFixed(2)} MB`,
      usage: `${((stats.memoryUsage.used / stats.memoryUsage.total) * 100).toFixed(1)}%`,
    });
  }
  if (stats.recentAlerts.length > 0) {
    console.warn('Recent Alerts:', stats.recentAlerts);
  }
  const recommendations = getOptimizationRecommendations(stats);
  if (recommendations.length > 0) {
    console.log('💡 Recommendations:', recommendations);
  }
  console.groupEnd();
};