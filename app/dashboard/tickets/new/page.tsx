'use client';

import { useRouter } from 'next/navigation';
import { EnhancedTicketCreateForm } from '@/components/enhanced-ticket-create-form';
import { ErrorBoundary } from '@/components/error-boundary';
import { BackNavigation } from '@/components/ticket-management/back-navigation';
import { toast } from 'sonner';

/**
 * New Ticket Creation Page
 * 
 * This page provides a comprehensive interface for creating support tickets
 * with all necessary fields, file attachments, and initial comments.
 * 
 * Features:
 * - Full ticket creation form with all fields
 * - Dynamic database-driven dropdowns for teams, users, and customers
 * - File attachment support
 * - Initial comment support
 * - Status selection during creation
 * - Phone number field
 * - Error boundary for unexpected errors
 * 
 * Requirements: 1.1, 1.4, 10.3
 */
export default function NewTicketPage() {
  const router = useRouter();

  /**
   * Handle successful ticket creation
   * Redirects to the ticket detail view
   * 
   * @param ticketId - The ID of the newly created ticket
   */
  const handleSuccess = (ticketId: string) => {
    router.push(`/helpdesk/tickets/${ticketId}`);
  };

  /**
   * Handle cancel action
   * Uses browser history to go back
   */
  const handleCancel = () => {
    // Use browser history to go back to previous page
    if (window.history.length > 1) {
      router.back();
    } else {
      // Fallback to helpdesk if no history
      router.push('/helpdesk/dashboard');
      setTimeout(() => {
        const event = new CustomEvent('setActiveModule', { detail: 'tickets' });
        window.dispatchEvent(event);
      }, 100);
    }
  };

  /**
   * Handle errors caught by error boundary
   * Logs error and shows toast notification
   */
  const handleError = (error: Error) => {
    console.error('Ticket creation page error:', error);
    toast.error('An unexpected error occurred', {
      description: 'Please try again or contact support if the problem persists.',
    });
  };

  return (
    <ErrorBoundary onError={handleError}>
      <div className="p-6">
        {/* Page header with back navigation */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <BackNavigation />
            <h1 className="text-3xl font-bold tracking-tight">Create New Ticket</h1>
          </div>
          <p className="text-muted-foreground">
            Submit a new support ticket with all necessary details and attachments.
          </p>
        </div>

        {/* Enhanced ticket creation form */}
        <EnhancedTicketCreateForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </ErrorBoundary>
  );
}
