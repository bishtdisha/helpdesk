'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { performanceMonitor } from '@/lib/performance/monitoring';
import { CachePerformance } from '@/lib/performance/caching';
import { 
  Activity, 
  Clock, 
  Database, 
  Gauge, 
  RefreshCw, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

export function PerformanceDashboard() {
  const [metrics, setMetrics] = useState(performanceMonitor.getPerformanceSummary());
  const [cacheMetrics, setCacheMetrics] = useState(CachePerformance.getCacheMetrics());
  const [slowApis, setSlowApis] = useState(performanceMonitor.getSlowApis());
  const [slowComponents, setSlowComponents] = useState(performanceMonitor.getSlowComponents());

  // Refresh metrics every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(performanceMonitor.getPerformanceSummary());
      setCacheMetrics(CachePerformance.getCacheMetrics());
      setSlowApis(performanceMonitor.getSlowApis());
      setSlowComponents(performanceMonitor.getSlowComponents());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setMetrics(performanceMonitor.getPerformanceSummary());
    setCacheMetrics(CachePerformance.getCacheMetrics());
    setSlowApis(performanceMonitor.getSlowApis());
    setSlowComponents(performanceMonitor.getSlowComponents());
  };

  const handleExportMetrics = () => {
    const data = performanceMonitor.exportMetrics();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-metrics-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getWebVitalStatus = (metric: string, value?: number) => {
    if (!value) return 'unknown';
    
    switch (metric) {
      case 'lcp':
        return value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor';
      case 'fid':
        return value <= 100 ? 'good' : value <= 300 ? 'needs-improvement' : 'poor';
      case 'cls':
        return value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor';
      case 'fcp':
        return value <= 1800 ? 'good' : value <= 3000 ? 'needs-improvement' : 'poor';
      case 'ttfb':
        return value <= 800 ? 'good' : value <= 1800 ? 'needs-improvement' : 'poor';
      default:
        return 'unknown';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'needs-improvement':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'poor':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'bg-green-500';
      case 'needs-improvement':
        return 'bg-yellow-500';
      case 'poor':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Performance Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor application performance and identify bottlenecks
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleExportMetrics} variant="outline" size="sm">
            Export Metrics
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="web-vitals">Web Vitals</TabsTrigger>
          <TabsTrigger value="api-performance">API Performance</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="cache">Cache</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Page Load Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.pageLoadTime ? `${metrics.pageLoadTime.toFixed(0)}ms` : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Time to fully load the page
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg API Response</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.averageApiResponseTime.toFixed(0)}ms
                </div>
                <p className="text-xs text-muted-foreground">
                  Average API response time
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.memoryUsage ? `${(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB` : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  JavaScript heap size
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Component Renders</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.averageComponentRenderTime.toFixed(1)}ms
                </div>
                <p className="text-xs text-muted-foreground">
                  Average render time
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="web-vitals" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              { key: 'lcp', name: 'Largest Contentful Paint', value: metrics.webVitals.lcp, unit: 'ms' },
              { key: 'fid', name: 'First Input Delay', value: metrics.webVitals.fid, unit: 'ms' },
              { key: 'cls', name: 'Cumulative Layout Shift', value: metrics.webVitals.cls, unit: '' },
              { key: 'fcp', name: 'First Contentful Paint', value: metrics.webVitals.fcp, unit: 'ms' },
              { key: 'ttfb', name: 'Time to First Byte', value: metrics.webVitals.ttfb, unit: 'ms' },
            ].map((vital) => {
              const status = getWebVitalStatus(vital.key, vital.value);
              return (
                <Card key={vital.key}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{vital.name}</CardTitle>
                    {getStatusIcon(status)}
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {vital.value ? `${vital.value.toFixed(vital.key === 'cls' ? 3 : 0)}${vital.unit}` : 'N/A'}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <div className={`h-2 w-2 rounded-full ${getStatusColor(status)}`} />
                      <span className="text-xs text-muted-foreground capitalize">
                        {status === 'WAITING_FOR_CUSTOMER' || status === 'waiting-for-customer' ? 'On Hold' : 
                         status === 'CLOSED' || status === 'closed' ? 'Cancelled' : 
                         status.replace(/-|_/g, ' ')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="api-performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Slow API Endpoints</CardTitle>
              <CardDescription>
                API endpoints with response times above 1000ms
              </CardDescription>
            </CardHeader>
            <CardContent>
              {slowApis.length === 0 ? (
                <p className="text-muted-foreground">No slow APIs detected</p>
              ) : (
                <div className="space-y-2">
                  {slowApis.map((api, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <span className="font-mono text-sm">{api.url}</span>
                      <Badge variant={api.averageTime > 2000 ? 'destructive' : 'secondary'}>
                        {api.averageTime.toFixed(0)}ms
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="components" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Slow Components</CardTitle>
              <CardDescription>
                Components with render times above 100ms
              </CardDescription>
            </CardHeader>
            <CardContent>
              {slowComponents.length === 0 ? (
                <p className="text-muted-foreground">No slow components detected</p>
              ) : (
                <div className="space-y-2">
                  {slowComponents.map((component, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <span className="font-mono text-sm">{component.name}</span>
                      <Badge variant={component.averageTime > 200 ? 'destructive' : 'secondary'}>
                        {component.averageTime.toFixed(1)}ms
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cache" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cache Performance</CardTitle>
              <CardDescription>
                Cache hit rates and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cacheMetrics.length === 0 ? (
                <p className="text-muted-foreground">No cache metrics available</p>
              ) : (
                <div className="space-y-4">
                  {cacheMetrics.map((metric, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm">{metric.key}</span>
                        <Badge variant={metric.hitRate > 0.8 ? 'default' : 'secondary'}>
                          {(metric.hitRate * 100).toFixed(1)}% hit rate
                        </Badge>
                      </div>
                      <Progress value={metric.hitRate * 100} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {metric.totalRequests} total requests
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}