'use client';

import { Suspense } from 'react';
import { TicketDetailWithSuspense, TicketDetailSkeleton } from '@/lib/performance/lazy-components';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TicketDetailPageProps {
  params: {
    id: string;
  };
}

export default function TicketDetailPage({ params }: TicketDetailPageProps) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>
      
      <Suspense fallback={<TicketDetailSkeleton />}>
        <TicketDetailWithSuspense 
          ticketId={params.id}
          onClose={() => router.back()}
        />
      </Suspense>
    </div>
  );
}