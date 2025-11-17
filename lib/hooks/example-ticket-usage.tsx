/**
 * Example Usage of Ticket Hooks
 * 
 * This file demonstrates how to use the ticket data fetching hooks
 * in React components.
 */

'use client';

import { useState } from 'react';
import { useTickets, useTicket, useTicketMutations } from './index';
import { TicketStatus, TicketPriority } from '@prisma/client';

/**
 * Example: Ticket List Component
 */
export function TicketListExample() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<TicketStatus[]>(['OPEN', 'IN_PROGRESS']);

  const { tickets, pagination, isLoading, error, refresh } = useTickets({
    status: statusFilter,
    page,
    limit: 20,
    enablePolling: true, // Enable 30-second polling
  });

  if (isLoading) {
    return <div>Loading tickets...</div>;
  }

  if (error) {
    return (
      <div>
        <p>Error loading tickets: {error.message}</p>
        <button onClick={refresh}>Retry</button>
      </div>
    );
  }

  return (
    <div>
      <h2>Tickets ({pagination.total})</h2>
      
      {/* Filter controls */}
      <div>
        <button onClick={() => setStatusFilter(['OPEN'])}>Open</button>
        <button onClick={() => setStatusFilter(['IN_PROGRESS'])}>In Progress</button>
        <button onClick={() => setStatusFilter(['RESOLVED'])}>Resolved</button>
      </div>

      {/* Ticket list */}
      <ul>
        {tickets.map((ticket) => (
          <li key={ticket.id}>
            <h3>{ticket.title}</h3>
            <p>Status: {ticket.status}</p>
            <p>Priority: {ticket.priority}</p>
          </li>
        ))}
      </ul>

      {/* Pagination */}
      <div>
        <button 
          onClick={() => setPage(p => p - 1)} 
          disabled={!pagination.hasPrev}
        >
          Previous
        </button>
        <span>Page {pagination.page} of {pagination.totalPages}</span>
        <button 
          onClick={() => setPage(p => p + 1)} 
          disabled={!pagination.hasNext}
        >
          Next
        </button>
      </div>

      {/* Manual refresh */}
      <button onClick={refresh}>Refresh Now</button>
    </div>
  );
}

/**
 * Example: Ticket Detail Component
 */
export function TicketDetailExample({ ticketId }: { ticketId: string }) {
  const { ticket, isLoading, error, refresh } = useTicket(ticketId, {
    enablePolling: true, // Enable 30-second polling
  });

  if (isLoading) {
    return <div>Loading ticket details...</div>;
  }

  if (error) {
    return (
      <div>
        <p>Error loading ticket: {error.message}</p>
        <button onClick={refresh}>Retry</button>
      </div>
    );
  }

  if (!ticket) {
    return <div>Ticket not found</div>;
  }

  return (
    <div>
      <h1>{ticket.title}</h1>
      <p>{ticket.description}</p>
      
      <div>
        <strong>Status:</strong> {ticket.status}
      </div>
      <div>
        <strong>Priority:</strong> {ticket.priority}
      </div>
      <div>
        <strong>Customer:</strong> {ticket.customer.name}
      </div>
      {ticket.assignedUser && (
        <div>
          <strong>Assigned to:</strong> {ticket.assignedUser.name}
        </div>
      )}

      {/* Comments */}
      {ticket.comments && ticket.comments.length > 0 && (
        <div>
          <h3>Comments ({ticket.comments.length})</h3>
          <ul>
            {ticket.comments.map((comment) => (
              <li key={comment.id}>
                <strong>{comment.author.name}:</strong> {comment.content}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Attachments */}
      {ticket.attachments && ticket.attachments.length > 0 && (
        <div>
          <h3>Attachments ({ticket.attachments.length})</h3>
          <ul>
            {ticket.attachments.map((attachment) => (
              <li key={attachment.id}>
                {attachment.fileName} ({attachment.fileSize} bytes)
              </li>
            ))}
          </ul>
        </div>
      )}

      <button onClick={refresh}>Refresh</button>
    </div>
  );
}

/**
 * Example: Create Ticket Form
 */
export function CreateTicketFormExample() {
  const { createTicket } = useTicketMutations();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    
    try {
      const newTicket = await createTicket({
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        priority: formData.get('priority') as TicketPriority,
        customerId: formData.get('customerId') as string,
        category: formData.get('category') as string || undefined,
      });

      console.log('Ticket created:', newTicket);
      alert('Ticket created successfully!');
      
      // Reset form
      e.currentTarget.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Create New Ticket</h2>

      {error && <div style={{ color: 'red' }}>{error}</div>}

      <div>
        <label>
          Title:
          <input type="text" name="title" required />
        </label>
      </div>

      <div>
        <label>
          Description:
          <textarea name="description" required />
        </label>
      </div>

      <div>
        <label>
          Priority:
          <select name="priority" required>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </label>
      </div>

      <div>
        <label>
          Category:
          <input type="text" name="category" />
        </label>
      </div>

      <div>
        <label>
          Customer ID:
          <input type="text" name="customerId" required />
        </label>
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create Ticket'}
      </button>
    </form>
  );
}

/**
 * Example: Update Ticket Component
 */
export function UpdateTicketExample({ ticketId }: { ticketId: string }) {
  const { ticket } = useTicket(ticketId);
  const { updateTicket, assignTicket, closeTicket } = useTicketMutations();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateStatus = async (status: TicketStatus) => {
    setIsUpdating(true);
    try {
      await updateTicket(ticketId, { status });
      alert('Status updated successfully!');
    } catch (error) {
      alert('Failed to update status: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAssign = async (userId: string) => {
    setIsUpdating(true);
    try {
      await assignTicket(ticketId, { assignedTo: userId });
      alert('Ticket assigned successfully!');
    } catch (error) {
      alert('Failed to assign ticket: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = async () => {
    if (!confirm('Are you sure you want to close this ticket?')) return;
    
    setIsUpdating(true);
    try {
      await closeTicket(ticketId);
      alert('Ticket closed successfully!');
    } catch (error) {
      alert('Failed to close ticket: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsUpdating(false);
    }
  };

  if (!ticket) return <div>Loading...</div>;

  return (
    <div>
      <h2>Update Ticket: {ticket.title}</h2>
      <p>Current Status: {ticket.status}</p>

      <div>
        <h3>Update Status</h3>
        <button onClick={() => handleUpdateStatus('OPEN')} disabled={isUpdating}>
          Set to Open
        </button>
        <button onClick={() => handleUpdateStatus('IN_PROGRESS')} disabled={isUpdating}>
          Set to In Progress
        </button>
        <button onClick={() => handleUpdateStatus('RESOLVED')} disabled={isUpdating}>
          Set to Resolved
        </button>
      </div>

      <div>
        <h3>Actions</h3>
        <button onClick={handleClose} disabled={isUpdating}>
          Close Ticket
        </button>
      </div>
    </div>
  );
}
