'use client';

import { Suspense } from 'react';
import { AnalyticsPageWithSuspense, AnalyticsSkeleton } from '@/lib/performance/lazy-components';

export default function AnalyticsPage() {
  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<AnalyticsSkeleton />}>
        <AnalyticsPageWithSuspense />
      </Suspense>
    </div>
  );
}
