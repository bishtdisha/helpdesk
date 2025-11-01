import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/server-auth';
import { ProtectedDashboard } from '@/components/protected-dashboard';

export default async function DashboardPage() {
  // Check if user is authenticated
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return <ProtectedDashboard user={user} />;
}