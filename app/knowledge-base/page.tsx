'use client';

import { Suspense } from 'react';
import { KnowledgeBaseWithSuspense, KnowledgeBaseSkeleton } from '@/lib/performance/lazy-components';

export default function KnowledgeBasePage() {
  return (
    <div className="container mx-auto py-8">
      <Suspense fallback={<KnowledgeBaseSkeleton />}>
        <KnowledgeBaseWithSuspense />
      </Suspense>
    </div>
  );
}
