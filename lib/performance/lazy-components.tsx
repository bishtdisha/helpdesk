'use client';

import { lazy, Suspense, ComponentType } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// Loading fallback components
export const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-[60px] mb-2" />
            <Skeleton className="h-3 w-[120px]" />
          </CardContent>
        </Card>
      ))}
    </div>
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-[150px]" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-[150px]" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    </div>
  </div>
);

export const TicketDetailSkeleton = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-4 w-[300px]" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-[80px]" />
        <Skeleton className="h-9 w-[80px]" />
      </div>
    </div>
    
    <div className="grid gap-6 md:grid-cols-3">
      <div className="md:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[120px]" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[200px] w-full" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[100px]" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[100px]" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[80px]" />
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
);

export const KnowledgeBaseSkeleton = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-[200px]" />
      <Skeleton className="h-9 w-[120px]" />
    </div>
    
    <div className="flex gap-4">
      <Skeleton className="h-9 w-[300px]" />
      <Skeleton className="h-9 w-[150px]" />
    </div>
    
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-[180px]" />
            <Skeleton className="h-4 w-[120px]" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-16 w-full mb-4" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-[80px]" />
              <Skeleton className="h-4 w-[60px]" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export const AnalyticsSkeleton = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-[150px]" />
      <Skeleton className="h-9 w-[200px]" />
    </div>
    
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-[60px] mb-2" />
            <Skeleton className="h-3 w-[120px]" />
          </CardContent>
        </Card>
      ))}
    </div>
    
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-[150px]" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[350px] w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-[150px]" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[350px] w-full" />
        </CardContent>
      </Card>
    </div>
  </div>
);

export const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-8 w-8 animate-spin" />
  </div>
);

// Higher-order component for lazy loading with custom fallback
export function withLazyLoading<T extends ComponentType<any>>(
  LazyComponent: T,
  fallback: ComponentType = LoadingSpinner
): ComponentType<React.ComponentProps<T>> {
  return function LazyWrapper(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={<fallback />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

// Lazy loaded components
export const LazyTicketDetail = lazy(() => 
  import('@/components/ticket-detail').then(module => ({ 
    default: module.TicketDetail 
  }))
);

export const LazyKnowledgeBase = lazy(() => 
  import('@/components/knowledge-base').then(module => ({ 
    default: module.KnowledgeBase 
  }))
);

export const LazyOrganizationDashboard = lazy(() => 
  import('@/components/analytics/organization-dashboard').then(module => ({ 
    default: module.OrganizationDashboard 
  }))
);

export const LazyTeamDashboard = lazy(() => 
  import('@/components/analytics/team-dashboard').then(module => ({ 
    default: module.TeamDashboard 
  }))
);

export const LazyUserDashboard = lazy(() => 
  import('@/components/user-dashboard').then(module => ({ 
    default: module.UserDashboard 
  }))
);

export const LazyAnalyticsPage = lazy(() => 
  import('@/components/analytics/analytics-page').then(module => ({ 
    default: module.AnalyticsPage 
  }))
);

export const LazyReports = lazy(() => 
  import('@/components/reports').then(module => ({ 
    default: module.default 
  }))
);

export const LazySettings = lazy(() => 
  import('@/components/settings').then(module => ({ 
    default: module.default 
  }))
);

export const LazySLAManagement = lazy(() => 
  import('@/components/sla-management').then(module => ({ 
    default: module.default 
  }))
);

export const LazyEscalationManagement = lazy(() => 
  import('@/components/escalation-management').then(module => ({ 
    default: module.default 
  }))
);

// Wrapped components with appropriate fallbacks
export const TicketDetailWithSuspense = withLazyLoading(LazyTicketDetail, TicketDetailSkeleton);
export const KnowledgeBaseWithSuspense = withLazyLoading(LazyKnowledgeBase, KnowledgeBaseSkeleton);
export const OrganizationDashboardWithSuspense = withLazyLoading(LazyOrganizationDashboard, AnalyticsSkeleton);
export const TeamDashboardWithSuspense = withLazyLoading(LazyTeamDashboard, AnalyticsSkeleton);
export const UserDashboardWithSuspense = withLazyLoading(LazyUserDashboard, DashboardSkeleton);
export const AnalyticsPageWithSuspense = withLazyLoading(LazyAnalyticsPage, AnalyticsSkeleton);
export const ReportsWithSuspense = withLazyLoading(LazyReports, LoadingSpinner);
export const SettingsWithSuspense = withLazyLoading(LazySettings, LoadingSpinner);
export const SLAManagementWithSuspense = withLazyLoading(LazySLAManagement, LoadingSpinner);
export const EscalationManagementWithSuspense = withLazyLoading(LazyEscalationManagement, LoadingSpinner);