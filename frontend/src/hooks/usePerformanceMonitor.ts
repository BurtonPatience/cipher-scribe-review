import { useEffect, useRef, useCallback } from 'react';

interface PerformanceMetrics {
  fheEncryptionTime: number;
  contractCallTime: number;
  decryptionTime: number;
  totalOperationTime: number;
  timestamp: number;
}

interface PerformanceMonitorHook {
  startTiming: (operation: string) => void;
  endTiming: (operation: string) => PerformanceMetrics | null;
  getAverageMetrics: () => {
    avgEncryptionTime: number;
    avgContractCallTime: number;
    avgDecryptionTime: number;
    avgTotalTime: number;
    totalOperations: number;
  };
  clearMetrics: () => void;
}

export function usePerformanceMonitor(): PerformanceMonitorHook {
  const timingsRef = useRef<Map<string, number>>(new Map());
  const metricsRef = useRef<PerformanceMetrics[]>([]);

  const startTiming = useCallback((operation: string) => {
    timingsRef.current.set(operation, performance.now());
  }, []);

  const endTiming = useCallback((operation: string): PerformanceMetrics | null => {
    const startTime = timingsRef.current.get(operation);
    if (!startTime) return null;

    const endTime = performance.now();
    const duration = endTime - startTime;

    const metrics: PerformanceMetrics = {
      fheEncryptionTime: operation.includes('encrypt') ? duration : 0,
      contractCallTime: operation.includes('contract') ? duration : 0,
      decryptionTime: operation.includes('decrypt') ? duration : 0,
      totalOperationTime: duration,
      timestamp: Date.now()
    };

    metricsRef.current.push(metrics);
    timingsRef.current.delete(operation);

    // Keep only last 50 metrics
    if (metricsRef.current.length > 50) {
      metricsRef.current.shift();
    }

    return metrics;
  }, []);

  const getAverageMetrics = useCallback(() => {
    const metrics = metricsRef.current;
    if (metrics.length === 0) {
      return {
        avgEncryptionTime: 0,
        avgContractCallTime: 0,
        avgDecryptionTime: 0,
        avgTotalTime: 0,
        totalOperations: 0
      };
    }

    const totals = metrics.reduce(
      (acc, metric) => ({
        encryptionTime: acc.encryptionTime + metric.fheEncryptionTime,
        contractCallTime: acc.contractCallTime + metric.contractCallTime,
        decryptionTime: acc.decryptionTime + metric.decryptionTime,
        totalTime: acc.totalTime + metric.totalOperationTime
      }),
      { encryptionTime: 0, contractCallTime: 0, decryptionTime: 0, totalTime: 0 }
    );

    return {
      avgEncryptionTime: totals.encryptionTime / metrics.length,
      avgContractCallTime: totals.contractCallTime / metrics.length,
      avgDecryptionTime: totals.decryptionTime / metrics.length,
      avgTotalTime: totals.totalTime / metrics.length,
      totalOperations: metrics.length
    };
  }, []);

  const clearMetrics = useCallback(() => {
    metricsRef.current = [];
    timingsRef.current.clear();
  }, []);

  useEffect(() => {
    return () => {
      timingsRef.current.clear();
      metricsRef.current = [];
    };
  }, []);

  return {
    startTiming,
    endTiming,
    getAverageMetrics,
    clearMetrics
  };
}
