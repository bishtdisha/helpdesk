/**
 * Cache Performance Dashboard Component
 * Displays real-time cache statistics and performance metrics
 */

import React, { useState, useEffect } from 'react';

interface CacheStats {
    cache: {
        users: { size: number; maxSize: number; hitRate: number };
        sessions: { size: number; maxSize: number; hitRate: number };
        memory: { estimatedSizeKB: number };
    };
    performance: {
        sessionValidationFull: {
            count: number;
            avgDuration: number;
            minDuration: number;
            maxDuration: number;
            p95Duration: number;
        };
        sessionValidationLightweight: {
            count: number;
            avgDuration: number;
            minDuration: number;
            maxDuration: number;
            p95Duration: number;
        };
    };
    summary: {
        totalCacheSize: number;
        estimatedMemoryKB: number;
        overallHitRate: number;
        avgResponseTime: number;
    };
}

interface CacheHealth {
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    recommendations: string[];
}

interface CachePerformance {
    cacheEffectiveness: number;
    avgCacheHitTime: number;
    avgCacheMissTime: number;
    memoryEfficiency: number;
}

export const CacheDashboard: React.FC = () => {
    const [stats, setStats] = useState<CacheStats | null>(null);
    const [health, setHealth] = useState<CacheHealth | null>(null);
    const [performance, setPerformance] = useState<CachePerformance | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchCacheStats = async () => {
        try {
            const token = localStorage.getItem('authToken'); // Adjust based on your auth implementation
            const response = await fetch('/api/cache-stats', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch cache stats');
            }

            const data = await response.json();

            if (data.success) {
                setStats(data.data.stats);
                setHealth(data.data.health);
                setPerformance(data.data.performance);
                setLastUpdated(new Date());
                setError(null);
            } else {
                setError(data.error || 'Failed to fetch cache stats');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    const clearCache = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/cache-stats', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ action: 'clear' }),
            });

            if (response.ok) {
                // Refresh stats after clearing
                await fetchCacheStats();
            }
        } catch (err) {
            console.error('Failed to clear cache:', err);
        }
    };

    useEffect(() => {
        fetchCacheStats();

        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchCacheStats, 30000);

        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return <div className="p-4">Loading cache statistics...</div>;
    }

    if (error) {
        return <div className="p-4 text-red-600">Error: {error}</div>;
    }

    if (!stats || !health || !performance) {
        return <div className="p-4">No cache data available</div>;
    }

    const getHealthColor = (status: string) => {
        switch (status) {
            case 'healthy': return 'text-green-600';
            case 'warning': return 'text-yellow-600';
            case 'critical': return 'text-red-600';
            default: return 'text-gray-600';
        }
    };

    const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`;
    const formatDuration = (ms: number) => `${ms.toFixed(2)}ms`;
    const formatMemory = (kb: number) => {
        if (kb < 1024) return `${kb}KB`;
        return `${(kb / 1024).toFixed(1)}MB`;
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Cache Performance Dashboard</h1>
                <div className="flex gap-2">
                    <button
                        onClick={fetchCacheStats}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Refresh
                    </button>
                    <button
                        onClick={clearCache}
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                        Clear Cache
                    </button>
                </div>
            </div>

            {lastUpdated && (
                <p className="text-sm text-gray-600 mb-4">
                    Last updated: {lastUpdated.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                </p>
            )}

            {/* Health Status */}
            <div className="mb-6 p-4 border rounded-lg">
                <h2 className="text-lg font-semibold mb-2">Cache Health</h2>
                <div className={`text-lg font-bold ${getHealthColor(health.status)}`}>
                    Status: {health.status.toUpperCase()}
                </div>

                {health.issues.length > 0 && (
                    <div className="mt-2">
                        <h3 className="font-medium text-red-600">Issues:</h3>
                        <ul className="list-disc list-inside text-sm">
                            {health.issues.map((issue, index) => (
                                <li key={index}>{issue}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {health.recommendations.length > 0 && (
                    <div className="mt-2">
                        <h3 className="font-medium text-blue-600">Recommendations:</h3>
                        <ul className="list-disc list-inside text-sm">
                            {health.recommendations.map((rec, index) => (
                                <li key={index}>{rec}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold text-sm text-gray-600">Cache Effectiveness</h3>
                    <div className="text-2xl font-bold">{performance.cacheEffectiveness}%</div>
                </div>

                <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold text-sm text-gray-600">Avg Response Time</h3>
                    <div className="text-2xl font-bold">{formatDuration(stats.summary.avgResponseTime)}</div>
                </div>

                <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold text-sm text-gray-600">Memory Usage</h3>
                    <div className="text-2xl font-bold">{formatMemory(stats.cache.memory.estimatedSizeKB)}</div>
                </div>

                <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold text-sm text-gray-600">Overall Hit Rate</h3>
                    <div className="text-2xl font-bold">{formatPercentage(stats.summary.overallHitRate)}</div>
                </div>
            </div>

            {/* Cache Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-3">Session Cache</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span>Size:</span>
                            <span>{stats.cache.sessions.size}/{stats.cache.sessions.maxSize}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Hit Rate:</span>
                            <span>{formatPercentage(stats.cache.sessions.hitRate)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${(stats.cache.sessions.size / stats.cache.sessions.maxSize) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-3">User Cache</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span>Size:</span>
                            <span>{stats.cache.users.size}/{stats.cache.users.maxSize}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Hit Rate:</span>
                            <span>{formatPercentage(stats.cache.users.hitRate)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-green-600 h-2 rounded-full"
                                style={{ width: `${(stats.cache.users.size / stats.cache.users.maxSize) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Performance Breakdown */}
            <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-3">Performance Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h4 className="font-medium text-sm text-gray-600 mb-2">Full Session Validation</h4>
                        <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span>Count (10min):</span>
                                <span>{stats.performance.sessionValidationFull.count}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Average:</span>
                                <span>{formatDuration(stats.performance.sessionValidationFull.avgDuration)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>P95:</span>
                                <span>{formatDuration(stats.performance.sessionValidationFull.p95Duration)}</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-medium text-sm text-gray-600 mb-2">Lightweight Validation</h4>
                        <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span>Count (10min):</span>
                                <span>{stats.performance.sessionValidationLightweight.count}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Average:</span>
                                <span>{formatDuration(stats.performance.sessionValidationLightweight.avgDuration)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>P95:</span>
                                <span>{formatDuration(stats.performance.sessionValidationLightweight.p95Duration)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};