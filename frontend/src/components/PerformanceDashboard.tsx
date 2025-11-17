import React, { useEffect, useState } from 'react';
import { Activity, Cpu, HardDrive, Zap, TrendingUp, AlertTriangle } from 'lucide-react';
import { usePerformanceMonitor } from '../hooks/usePerformanceMonitor';
import { cn } from '../lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'stable';
  className?: string;
}

function MetricCard({ title, value, unit, icon, trend, className }: MetricCardProps) {
  return (
    <div className={cn(
      'bg-white rounded-lg border p-4 shadow-sm',
      className
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium text-gray-600">{title}</span>
        </div>
        {trend && (
          <div className={cn(
            'flex items-center gap-1 text-xs',
            trend === 'up' ? 'text-green-600' :
            trend === 'down' ? 'text-red-600' : 'text-gray-600'
          )}>
            <TrendingUp className="w-3 h-3" />
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
          </div>
        )}
      </div>
      <div className="mt-2">
        <span className="text-2xl font-bold text-gray-900">
          {typeof value === 'number' ? value.toFixed(2) : value}
        </span>
        {unit && <span className="text-sm text-gray-600 ml-1">{unit}</span>}
      </div>
    </div>
  );
}

interface PerformanceDashboardProps {
  className?: string;
  showDetailedMetrics?: boolean;
}

export function PerformanceDashboard({
  className,
  showDetailedMetrics = true
}: PerformanceDashboardProps) {
  const { getAverageMetrics } = usePerformanceMonitor();
  const [metrics, setMetrics] = useState(getAverageMetrics());

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(getAverageMetrics());
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [getAverageMetrics]);

  const formatTime = (ms: number) => `${ms.toFixed(1)}ms`;
  const formatGas = (gas: number) => `${(gas / 1000).toFixed(1)}K`;

  // Simulate some additional metrics for demo
  const simulatedMetrics = {
    memoryUsage: Math.random() * 100,
    cpuUsage: Math.random() * 100,
    networkLatency: 50 + Math.random() * 100,
    activeConnections: Math.floor(Math.random() * 50)
  };

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-center gap-2">
        <Activity className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">Performance Dashboard</h2>
      </div>

      {/* FHE Operations Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Avg Encryption"
          value={formatTime(metrics.avgEncryptionTime)}
          icon={<Zap className="w-4 h-4 text-yellow-600" />}
          trend="stable"
        />
        <MetricCard
          title="Avg Contract Call"
          value={formatTime(metrics.avgContractCallTime)}
          icon={<Cpu className="w-4 h-4 text-blue-600" />}
          trend="down"
        />
        <MetricCard
          title="Avg Decryption"
          value={formatTime(metrics.avgDecryptionTime)}
          icon={<HardDrive className="w-4 h-4 text-green-600" />}
          trend="stable"
        />
        <MetricCard
          title="Total Operations"
          value={metrics.totalOperations}
          icon={<Activity className="w-4 h-4 text-purple-600" />}
          trend="up"
        />
      </div>

      {/* System Metrics */}
      {showDetailedMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Memory Usage"
            value={simulatedMetrics.memoryUsage.toFixed(1)}
            unit="%"
            icon={<HardDrive className="w-4 h-4 text-indigo-600" />}
            trend={simulatedMetrics.memoryUsage > 80 ? 'down' : 'stable'}
          />
          <MetricCard
            title="CPU Usage"
            value={simulatedMetrics.cpuUsage.toFixed(1)}
            unit="%"
            icon={<Cpu className="w-4 h-4 text-orange-600" />}
            trend={simulatedMetrics.cpuUsage > 90 ? 'down' : 'stable'}
          />
          <MetricCard
            title="Network Latency"
            value={simulatedMetrics.networkLatency.toFixed(0)}
            unit="ms"
            icon={<Activity className="w-4 h-4 text-cyan-600" />}
            trend={simulatedMetrics.networkLatency > 200 ? 'down' : 'up'}
          />
          <MetricCard
            title="Active Connections"
            value={simulatedMetrics.activeConnections}
            icon={<TrendingUp className="w-4 h-4 text-teal-600" />}
            trend="up"
          />
        </div>
      )}

      {/* Performance Insights */}
      <div className="bg-white rounded-lg border p-4 shadow-sm">
        <h3 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          Performance Insights
        </h3>
        <div className="space-y-2 text-sm text-gray-700">
          {metrics.avgEncryptionTime > 1000 && (
            <div className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="w-3 h-3" />
              High encryption time detected. Consider optimizing FHE operations.
            </div>
          )}
          {metrics.avgContractCallTime > 500 && (
            <div className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="w-3 h-3" />
              Contract calls are slower than expected. Check network conditions.
            </div>
          )}
          {metrics.totalOperations > 100 && (
            <div className="flex items-center gap-2 text-green-700">
              <TrendingUp className="w-3 h-3" />
              High operation volume. System performing well under load.
            </div>
          )}
          {simulatedMetrics.memoryUsage > 85 && (
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-3 h-3" />
              High memory usage. Consider optimizing data structures.
            </div>
          )}
        </div>
      </div>

      {/* Performance History */}
      <div className="bg-white rounded-lg border p-4 shadow-sm">
        <h3 className="text-md font-semibold text-gray-900 mb-3">Recent Performance</h3>
        <div className="text-sm text-gray-600">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-medium">Average Operation Time:</span>
              <span className="ml-2">{formatTime(metrics.avgTotalTime)}</span>
            </div>
            <div>
              <span className="font-medium">Operations Completed:</span>
              <span className="ml-2">{metrics.totalOperations}</span>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Data updates every 5 seconds. Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
}
