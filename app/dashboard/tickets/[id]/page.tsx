'use client';

import { Suspense } from 'react';
import { TicketDetailWithSuspense, TicketDetailSkeleton } from '@/lib/performance/lazy-components';
import { BackNavigation } from '@/components/ticket-management/back-navigation';
import { useRouter } from 'next/navigation';

interface TicketDetailPageProps {
  params: {
    id: string;
  };
}

export default function TicketDetailPage({ params }: TicketDetailPageProps) {
  return (
    <div className="p-6">
      <Suspense fallback={<TicketDetailSkeleton />}>
        <TicketDetailWithSuspense 
          ticketId={params.id}
        />
      </Suspense>
    </div>
  );
}