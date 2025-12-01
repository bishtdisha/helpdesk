'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { TicketPriority, TicketStatus } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DynamicDropdownSelect } from '@/components/dynamic-dropdown-select';
import { SimpleSelect } from '@/components/simple-select';
import { FileAttachmentUpload } from '@/components/file-attachment-upload';
import { CommentInput } from '@/components/comment-input';
import { apiClient } from '@/lib/api-client';
import { CacheManager } from '@/lib/performance/caching';
import { mutate } from 'swr';
import { Loader2 } from 'lucide-react';
import { announceToScreenReader } from '@/components/accessibility/aria-live-announcer';

// Zod validation schema for enhanced ticket creation
const enhancedTicketFormSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title cannot exceed 200 characters')
    .trim(),
  description: z
    .string()
    .min(1, 'Description is required')
    .trim(),
  phone: z
    .string()
    .regex(/^[0-9\s\-\(\)\+]*$/, 'Phone number can only contain digits, spaces, hyphens, parentheses, and plus signs')
    .optional()
    .or(z.literal('')),
  priority: z.nativeEnum(TicketPriority, {
    required_error: 'Priority is required',
    invalid_type_error: 'Invalid priority value',
  }),
  category: z
    .string()
    .max(100, 'Category cannot exceed 100 characters')
    .optional()
    .or(z.literal('')),
  status: z.nativeEnum(TicketStatus, {
    required_error: 'Status is required',
    invalid_type_error: 'Invalid status value',
  }),
  customerId: z
    .string()
    .min(1, 'Customer is required'),
  teamId: z
    .string()
    .optional()
    .or(z.literal('')),
  assignedTo: z
    .string()
    .optional()
    .or(z.literal('')),
});

type EnhancedTicketFormValues = z.infer<typeof enhancedTicketFormSchema>;

export interface EnhancedTicketCreateFormProps {
  onSuccess?: (ticketId: string) => void;
  onCancel?: () => void;
  initialStatus?: TicketStatus;
}

export function EnhancedTicketCreateForm({ 
  onSuccess, 
  onCancel,
  initialStatus = TicketStatus.OPEN 
}: EnhancedTicketCreateFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [initialComment, setInitialComment] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [screenReaderMessage, setScreenReaderMessage] = useState<string>('');

  // Initialize form with React Hook Form and Zod validation
  const form = useForm<EnhancedTicketFormValues>({
    resolver: zodResolver(enhancedTicketFormSchema),
    defaultValues: {
      title: '',
      description: '',
      phone: '',
      priority: TicketPriority.MEDIUM,
      category: '',
      status: initialStatus,
      customerId: '',
      teamId: '',
      assignedTo: '',
    },
  });

  // Handle keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Escape key to cancel
      if (event.key === 'Escape' && onCancel && !isSubmitting) {
        event.preventDefault();
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onCancel, isSubmitting]);

  // Announce form errors to screen readers
  React.useEffect(() => {
    const errors = form.formState.errors;
    const errorFields = Object.keys(errors);
    
    if (errorFields.length > 0 && form.formState.isSubmitted) {
      const errorMessages = errorFields.map(field => {
        const error = errors[field as keyof typeof errors];
        return error?.message || `${field} has an error`;
      });
      
      const announcement = `Form has ${errorFields.length} error${errorFields.length > 1 ? 's' : ''}: ${errorMessages.join(', ')}`;
      setScreenReaderMessage(announcement);
      announceToScreenReader(announcement, 'assertive');
    }
  }, [form.formState.errors, form.formState.isSubmitted]);

  // Announce loading state changes
  React.useEffect(() => {
    if (isSubmitting) {
      setScreenReaderMessage('Creating ticket, please wait...');
      announceToScreenReader('Creating ticket, please wait...', 'polite');
    }
  }, [isSubmitting]);

  // Handle form submission
  const onSubmit = async (data: EnhancedTicketFormValues) => {
    setIsSubmitting(true);
    let uploadToastId: string | number | undefined;

    try {
      // Step 1: Create the ticket
      toast.loading('Creating ticket...', { id: 'ticket-creation' });
      
      const ticketPayload = {
        title: data.title,
        description: data.description,
        phone: data.phone || undefined,
        priority: data.priority,
        category: data.category || undefined,
        status: data.status,
        customerId: data.customerId,
        teamId: data.teamId || undefined,
        assignedTo: data.assignedTo || undefined,
      };

      const ticketResponse = await apiClient.post<{ ticket: { id: string } }>(
        '/api/tickets',
        ticketPayload
      );

      if (!ticketResponse?.ticket?.id) {
        throw new Error('Invalid response: ticket ID not returned');
      }

      const ticketId = ticketResponse.ticket.id;
      toast.dismiss('ticket-creation');

      // Step 2: Upload attachments if present
      if (attachments.length > 0) {
        const uploadMessage = `Uploading ${attachments.length} file${attachments.length > 1 ? 's' : ''}...`;
        uploadToastId = toast.loading(uploadMessage, { id: 'file-upload' });
        
        // Announce upload start to screen readers
        setScreenReaderMessage(uploadMessage);
        announceToScreenReader(uploadMessage, 'polite');
        
        const formData = new FormData();
        attachments.forEach((file) => {
          formData.append('files', file);
        });

        try {
          // Simulate progress updates for better UX
          setUploadProgress(10);
          
          await apiClient.post(
            `/api/tickets/${ticketId}/attachments`,
            formData,
            {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
              onUploadProgress: (progressEvent) => {
                if (progressEvent.total) {
                  const percentCompleted = Math.round(
                    (progressEvent.loaded * 100) / progressEvent.total
                  );
                  setUploadProgress(percentCompleted);
                }
              },
            }
          );
          
          setUploadProgress(100);
          toast.dismiss('file-upload');
          toast.success('Files uploaded successfully');
          
          // Announce upload success to screen readers
          const uploadSuccessMessage = 'Files uploaded successfully';
          setScreenReaderMessage(uploadSuccessMessage);
          announceToScreenReader(uploadSuccessMessage, 'polite');
        } catch (attachmentError) {
          console.error('Error uploading attachments:', attachmentError);
          toast.dismiss('file-upload');
          setUploadProgress(0);
          
          const attachmentErrorMsg = attachmentError instanceof Error
            ? attachmentError.message
            : 'Unknown error occurred';
          
          toast.warning('Ticket created but some attachments failed to upload', {
            description: `Error: ${attachmentErrorMsg}. You can add attachments later from the ticket detail page.`,
          });
        }
      }

      // Step 3: Create initial comment if present
      if (initialComment.trim()) {
        try {
          await apiClient.post(`/api/tickets/${ticketId}/comments`, {
            content: initialComment,
            isInternal: isInternalComment,
          });
        } catch (commentError) {
          console.error('Error creating initial comment:', commentError);
          
          const commentErrorMsg = commentError instanceof Error
            ? commentError.message
            : 'Unknown error occurred';
          
          toast.warning('Ticket created but initial comment failed to save', {
            description: `Error: ${commentErrorMsg}. You can add comments from the ticket detail page.`,
          });
        }
      }

      // Invalidate ticket list cache to show new ticket immediately
      CacheManager.invalidateTicketCaches();
      
      // Also explicitly revalidate the ticket list
      await mutate(
        (key) => {
          // Match any ticket list query (with or without filters)
          if (typeof key === 'string' && key.startsWith('/api/tickets')) {
            return true;
          }
          if (Array.isArray(key) && key[0] === '/api/tickets') {
            return true;
          }
          return false;
        },
        undefined,
        { revalidate: true }
      );

      // Show success message with ticket ID
      const successMessage = `Ticket created successfully. Ticket ID: ${ticketId.slice(0, 8)}`;
      toast.success('Ticket created successfully', {
        description: `Ticket #${ticketId.slice(0, 8)} has been created.`,
        duration: 5000,
      });
      
      // Announce success to screen readers
      setScreenReaderMessage(successMessage);
      announceToScreenReader(successMessage, 'polite');

      // Call success callback or redirect
      if (onSuccess) {
        onSuccess(ticketId);
      } else {
        router.push(`/dashboard/tickets/${ticketId}`);
      }

      // Reset form
      form.reset();
      setAttachments([]);
      setInitialComment('');
      setIsInternalComment(false);
      setUploadProgress(0);
    } catch (error) {
      console.error('Error creating ticket:', error);
      
      // Dismiss any pending toasts
      toast.dismiss('ticket-creation');
      if (uploadToastId) {
        toast.dismiss('file-upload');
      }

      // Display detailed error message
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Provide more specific error messages based on error type
        if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message.includes('validation')) {
          errorMessage = 'Validation error. Please check your input and try again.';
        } else if (error.message.includes('unauthorized') || error.message.includes('403')) {
          errorMessage = 'You do not have permission to create tickets.';
        } else if (error.message.includes('not found') || error.message.includes('404')) {
          errorMessage = 'The requested resource was not found.';
        }
      }

      toast.error('Failed to create ticket', {
        description: errorMessage,
        duration: 7000,
      });
      
      // Announce error to screen readers
      const errorAnnouncement = `Failed to create ticket. ${errorMessage}`;
      setScreenReaderMessage(errorAnnouncement);
      announceToScreenReader(errorAnnouncement, 'assertive');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  return (
    <>
      {/* Screen reader announcements */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {screenReaderMessage}
      </div>
      
      <Form {...form}>
        <div className="w-full">
          {/* Header section with status */}
          <div className="mb-6 pb-4 border-b">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Submit a new support ticket with all necessary details. Fields marked with * are required.
                </p>
              </div>
              
              {/* Status dropdown in top corner */}
              <div className="ml-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={TicketStatus.OPEN}>New</SelectItem>
                          <SelectItem value={TicketStatus.IN_PROGRESS}>In Progress</SelectItem>
                          <SelectItem value={TicketStatus.WAITING_FOR_CUSTOMER}>On Hold</SelectItem>
                          <SelectItem value={TicketStatus.RESOLVED}>Solved</SelectItem>
                          <SelectItem value={TicketStatus.CLOSED}>Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
        
          {/* Form content */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Title Field - Full width */}
            <FormField
              control={form.control}
              name="title"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Brief description of the issue"
                      {...field}
                      disabled={isSubmitting}
                      aria-required="true"
                      aria-invalid={fieldState.invalid}
                      aria-describedby={fieldState.error ? 'title-error' : undefined}
                    />
                  </FormControl>
                  <FormMessage id="title-error" />
                </FormItem>
              )}
            />

            {/* Description Field - Full width */}
            <FormField
              control={form.control}
              name="description"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detailed description of the issue..."
                      className="min-h-[200px] resize-y"
                      {...field}
                      disabled={isSubmitting}
                      aria-required="true"
                      aria-invalid={fieldState.invalid}
                      aria-describedby={fieldState.error ? 'description-error' : undefined}
                    />
                  </FormControl>
                  <FormMessage id="description-error" />
                </FormItem>
              )}
            />

            {/* Two column grid for smaller fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Phone Number Field */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., +1 (555) 123-4567"
                        {...field}
                        disabled={isSubmitting}
                        aria-invalid={fieldState.invalid}
                        aria-describedby={fieldState.error ? 'phone-error' : undefined}
                      />
                    </FormControl>
                    <FormMessage id="phone-error" />
                  </FormItem>
                )}
              />

              {/* Priority Field */}
              <FormField
                control={form.control}
                name="priority"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Priority *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger
                          aria-required="true"
                          aria-invalid={fieldState.invalid}
                          aria-describedby={fieldState.error ? 'priority-error' : undefined}
                        >
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={TicketPriority.LOW}>Low</SelectItem>
                        <SelectItem value={TicketPriority.MEDIUM}>Medium</SelectItem>
                        <SelectItem value={TicketPriority.HIGH}>High</SelectItem>
                        <SelectItem value={TicketPriority.URGENT}>Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage id="priority-error" />
                  </FormItem>
                )}
              />

              {/* Category Field */}
              <FormField
                control={form.control}
                name="category"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Technical Support, Billing"
                        {...field}
                        disabled={isSubmitting}
                        aria-invalid={fieldState.invalid}
                        aria-describedby={fieldState.error ? 'category-error' : undefined}
                      />
                    </FormControl>
                    <FormMessage id="category-error" />
                  </FormItem>
                )}
              />

              {/* Customer Selection */}
              <FormField
                control={form.control}
                name="customerId"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Customer *</FormLabel>
                    <FormControl>
                      <SimpleSelect
                        endpoint="/api/users?simple=true&limit=200"
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Search for a customer..."
                        disabled={isSubmitting}
                        responseKey="users"
                        labelKey="name"
                        valueKey="id"
                        searchPlaceholder="Search users..."
                      />
                    </FormControl>
                    <FormMessage id="customerId-error" />
                  </FormItem>
                )}
              />

              {/* Team Selection */}
              <FormField
                control={form.control}
                name="teamId"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Team</FormLabel>
                    <FormControl>
                      <SimpleSelect
                        endpoint="/api/teams?simple=true&limit=200"
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select a team (optional)..."
                        disabled={isSubmitting}
                        responseKey="teams"
                        labelKey="name"
                        valueKey="id"
                        searchPlaceholder="Search teams..."
                      />
                    </FormControl>
                    <FormMessage id="teamId-error" />
                  </FormItem>
                )}
              />

              {/* Assigned User Selection */}
              <FormField
                control={form.control}
                name="assignedTo"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Assigned To</FormLabel>
                    <FormControl>
                      <SimpleSelect
                        endpoint="/api/users?simple=true&limit=200"
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Assign to a user..."
                        disabled={isSubmitting}
                        responseKey="users"
                        labelKey="name"
                        valueKey="id"
                        searchPlaceholder="Search users..."
                      />
                    </FormControl>
                    <FormMessage id="assignedTo-error" />
                  </FormItem>
                )}
              />
            </div>

            {/* File Attachments */}
            <div className="space-y-2">
              <FormLabel htmlFor="file-attachments">Attachments</FormLabel>
              <div id="file-attachments" role="group" aria-label="File attachments">
                <FileAttachmentUpload
                  files={attachments}
                  onFilesChange={setAttachments}
                  disabled={isSubmitting}
                  maxFiles={10}
                  maxFileSize={10 * 1024 * 1024}
                  uploadProgress={uploadProgress}
                  isUploading={isSubmitting && uploadProgress > 0}
                />
              </div>
            </div>

            {/* Initial Comment */}
            <div className="space-y-2">
              <FormLabel htmlFor="initial-comment">Initial Comment</FormLabel>
              <div id="initial-comment-wrapper">
                <CommentInput
                  value={initialComment}
                  onChange={setInitialComment}
                  isInternal={isInternalComment}
                  onIsInternalChange={setIsInternalComment}
                  placeholder="Add an initial comment or note (optional)..."
                  disabled={isSubmitting}
                  showInternalOption={true}
                  id="initial-comment"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-4 pt-4">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmitting}
                  title="Cancel (Esc)"
                >
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={isSubmitting} title="Create ticket (Enter)">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Creating...' : 'Create Ticket'}
              </Button>
            </div>
          </form>
        </div>
      </Form>
    </>
  );
}
