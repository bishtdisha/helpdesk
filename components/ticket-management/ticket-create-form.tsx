'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { TicketPriority } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { useTicketMutations } from '@/lib/hooks/use-ticket-mutations';
import { toast } from 'sonner';
import { useAuth } from '@/lib/hooks/use-auth';

import {
  Form,
  FormControl,
  FormDescription,
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
import { CustomerSelector } from '@/components/user-management/customer-selector';
import { TemplateSelector } from '@/components/templates/template-selector';
import { SaveAsTemplateButton } from '@/components/ticket-management/save-as-template-button';
import { FormFieldWithHelp } from '@/components/ui/form-field-with-help';
import { TicketTemplate } from '@/lib/hooks/use-templates';

// Zod validation schema
const ticketFormSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title cannot exceed 200 characters')
    .trim(),
  description: z
    .string()
    .min(1, 'Description is required')
    .trim(),
  priority: z.nativeEnum(TicketPriority, {
    required_error: 'Priority is required',
    invalid_type_error: 'Invalid priority value',
  }),
  category: z
    .string()
    .max(100, 'Category cannot exceed 100 characters')
    .optional()
    .or(z.literal('')),
  customerId: z
    .string()
    .uuid('Invalid customer ID')
    .optional()
    .or(z.literal('')),
});

type TicketFormValues = z.infer<typeof ticketFormSchema>;

interface TicketCreateFormProps {
  onSuccess?: (ticketId: string) => void;
  onCancel?: () => void;
}

export function TicketCreateForm({ onSuccess, onCancel }: TicketCreateFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { createTicket } = useTicketMutations();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TicketTemplate | undefined>();

  // Determine if user is Team Leader
  const isTeamLeader = user?.role?.name === 'Team Leader';
  
  // Auto-populate customer field with logged-in user for Team Leaders
  const defaultCustomerId = isTeamLeader && user?.id ? user.id : '';

  // Initialize form with React Hook Form and Zod validation
  const form = useForm<TicketFormValues>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: TicketPriority.MEDIUM,
      category: '',
      customerId: defaultCustomerId,
    },
  });

  // Handle template selection and form pre-filling
  const handleTemplateChange = (templateId: string | undefined, template?: TicketTemplate) => {
    setSelectedTemplate(template);
    
    if (template) {
      // Pre-fill form fields from template
      const updates: Partial<TicketFormValues> = {};
      
      if (template.title) {
        updates.title = template.title;
      }
      
      if (template.content) {
        updates.description = template.content;
      }
      
      if (template.priority) {
        updates.priority = template.priority;
      }
      
      if (template.category) {
        updates.category = template.category;
      }
      
      // Apply updates to form
      Object.entries(updates).forEach(([field, value]) => {
        form.setValue(field as keyof TicketFormValues, value as any);
      });
    }
  };

  // Track if user has made changes after template selection
  const [hasUserChanges, setHasUserChanges] = useState(false);
  
  // Watch form changes to detect user modifications
  React.useEffect(() => {
    const subscription = form.watch(() => {
      if (selectedTemplate) {
        setHasUserChanges(true);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, selectedTemplate]);

  // Handle form submission
  const onSubmit = async (data: TicketFormValues) => {
    setIsSubmitting(true);

    try {
      // Create ticket via API
      const ticket = await createTicket({
        title: data.title,
        description: data.description,
        priority: data.priority,
        category: data.category || undefined,
        customerId: data.customerId || undefined,
      });

      // Verify API response contains valid ticket ID
      if (!ticket?.id) {
        throw new Error('Invalid response: ticket ID not returned');
      }

      // Show success message
      toast.success('Ticket created successfully', {
        description: `Ticket #${ticket.id.slice(0, 8)} has been created.`,
      });

      // Call success callback or redirect
      if (onSuccess) {
        onSuccess(ticket.id);
      } else {
        router.push(`/dashboard/tickets/${ticket.id}`);
      }

      // Reset form
      form.reset();
    } catch (error) {
      console.error('Error creating ticket:', error);
      
      // Display error message
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to create ticket. Please try again.';
      
      toast.error('Failed to create ticket', {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Ticket</CardTitle>
        <CardDescription>
          Submit a new support ticket. All fields marked with * are required.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Template Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Template</label>
              <TemplateSelector
                value={selectedTemplate?.id}
                onValueChange={handleTemplateChange}
                disabled={isSubmitting}
                placeholder="Choose a template to pre-fill the form (optional)"
              />
              {selectedTemplate && (
                <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="text-sm text-blue-700">
                    Using template: <strong>{selectedTemplate.name}</strong>
                    {hasUserChanges && (
                      <span className="ml-2 text-blue-600">(modified)</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTemplateChange(undefined)}
                    className="ml-auto text-blue-600 hover:text-blue-800 text-sm underline"
                    disabled={isSubmitting}
                  >
                    Clear template
                  </button>
                </div>
              )}
            </div>

            {/* Title Field */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormFieldWithHelp
                  label="Title"
                  required
                  helpText="Provide a clear, concise title that summarizes the issue (max 200 characters)"
                  helpTooltip="A good title helps agents quickly understand and prioritize your ticket. Be specific but brief."
                  example="Email not working on mobile app"
                  error={form.formState.errors.title?.message}
                >
                  <Input
                    placeholder="Brief description of the issue"
                    {...field}
                    disabled={isSubmitting}
                  />
                </FormFieldWithHelp>
              )}
            />

            {/* Description Field */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormFieldWithHelp
                  label="Description"
                  required
                  helpText="Provide detailed information about the issue. Include steps to reproduce, error messages, and any relevant context."
                  helpTooltip="The more details you provide, the faster our support team can help you. Include what you were doing when the issue occurred, any error messages, and steps you've already tried."
                  example="When I try to send an email from the mobile app, I get an error message 'Connection failed'. This started happening yesterday after the app update. I've tried restarting the app and my phone."
                  error={form.formState.errors.description?.message}
                >
                  <Textarea
                    placeholder="Detailed description of the issue..."
                    className="min-h-[120px]"
                    {...field}
                    disabled={isSubmitting}
                  />
                </FormFieldWithHelp>
              )}
            />

            {/* Priority Field */}
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormFieldWithHelp
                  label="Priority"
                  required
                  helpText="Select the urgency level: Low (general questions), Medium (standard issues), High (business impact), Urgent (critical/blocking)"
                  helpTooltip="Priority affects response time. Use Urgent only for critical issues that completely block your work or affect many users."
                  error={form.formState.errors.priority?.message}
                >
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={TicketPriority.LOW}>Low - General questions</SelectItem>
                      <SelectItem value={TicketPriority.MEDIUM}>Medium - Standard issues</SelectItem>
                      <SelectItem value={TicketPriority.HIGH}>High - Business impact</SelectItem>
                      <SelectItem value={TicketPriority.URGENT}>Urgent - Critical/blocking</SelectItem>
                    </SelectContent>
                  </Select>
                </FormFieldWithHelp>
              )}
            />

            {/* Category Field */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormFieldWithHelp
                  label="Category"
                  helpText="Optional: Categorize the ticket to help route it to the right team (max 100 characters)"
                  helpTooltip="Categories help our support team route your ticket to the most appropriate specialist for faster resolution."
                  example="Technical Support, Billing, Account Access, Feature Request"
                  error={form.formState.errors.category?.message}
                >
                  <Input
                    placeholder="e.g., Technical Support, Billing, General Inquiry"
                    {...field}
                    disabled={isSubmitting}
                  />
                </FormFieldWithHelp>
              )}
            />

            {/* Customer Selection */}
            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormFieldWithHelp
                  label="Customer"
                  helpText={isTeamLeader 
                    ? "Tickets created by Team Leaders are automatically assigned to your account."
                    : "Search and select the customer this ticket is for. Type their name or email to find them."
                  }
                  helpTooltip={isTeamLeader 
                    ? "As a Team Leader, all tickets you create are automatically assigned to your account."
                    : "Start typing the customer's name or email address. If they're not found, they may need to be added to the system first."
                  }
                  error={form.formState.errors.customerId?.message}
                >
                  {isTeamLeader ? (
                    <Input
                      value={user?.name || ''}
                      disabled={true}
                      className="bg-muted cursor-not-allowed"
                      aria-readonly="true"
                    />
                  ) : (
                    <CustomerSelector
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  )}
                </FormFieldWithHelp>
              )}
            />

            {/* Form Actions */}
            <div className="flex justify-between items-center">
              <div>
                <SaveAsTemplateButton
                  formData={{
                    title: form.watch('title'),
                    description: form.watch('description'),
                    priority: form.watch('priority'),
                    category: form.watch('category'),
                  }}
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex gap-4">
                {onCancel && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                )}
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Ticket'}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
