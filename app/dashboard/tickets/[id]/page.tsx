import { redirect } from 'next/navigation';

interface TicketDetailPageProps {
  params: {
    id: string;
  };
}

export default function TicketDetailPage({ params }: TicketDetailPageProps) {
  redirect(`/helpdesk/tickets/${params.id}`);
}
