'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { TicketPriority } from '@prisma/client';
import { useTemplateMutations, TicketTemplate } from '@/lib/hooks/use-templates';
import { usePermissions } from '@/lib/hooks/use-permissions';
import { toast } from 'sonner';

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
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';

// Zod validation schema
const templateFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name cannot exceed 100 characters')
    .trim(),
  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters')
    .optional()
    .or(z.literal('')),
  category: z
    .string()
    .max(100, 'Category cannot exceed 100 characters')
    .optional()
    .or(z.literal('')),
  title: z
    .string()
    .max(200, 'Title cannot exceed 200 characters')
    .optional()
    .or(z.literal('')),
  content: z
    .string()
    .optional()
    .or(z.literal('')),
  priority: z.nativeEnum(TicketPriority, {
    required_error: 'Priority is required',
    invalid_type_error: 'Invalid priority value',
  }),
  isGlobal: z.boolean().default(false),
});

type TemplateFormValues = z.infer<typeof templateFormSchema>;

interface TemplateFormProps {
  template?: TicketTemplate;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function TemplateForm({ template, onSuccess, onCancel }: TemplateFormProps) {
  const { createTemplate, updateTemplate } = useTemplateMutations();
  const { canManageSLA } = usePermissions(); // Using SLA permission as proxy for Admin_Manager
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!template;

  // Initialize form with React Hook Form and Zod validation
  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: template?.name || '',
      description: template?.description || '',
      category: template?.category || '',
      title: template?.title || '',
      content: template?.content || '',
      priority: template?.priority || TicketPriority.MEDIUM,
      isGlobal: template?.isGlobal || false,
    },
  });

  // Handle form submission
  const onSubmit = async (data: TemplateFormValues) => {
    setIsSubmitting(true);

    try {
      // Clean up empty strings
      const cleanData = {
        ...data,
        description: data.description || undefined,
        category: data.category || undefined,
        title: data.title || undefined,
        content: data.content || undefined,
      };

      let result;
      if (isEditing && template) {
        // Update existing template
        result = await updateTemplate(template.id, cleanData);
      } else {
        // Create new template
        result = await createTemplate(cleanData);
      }

      // Verify API response contains valid template ID
      if (!result?.id) {
        throw new Error('Invalid response: template ID not returned');
      }

      // Call success callback
      if (onSuccess) {
        onSuccess();
      }

      // Reset form if creating new template
      if (!isEditing) {
        form.reset();
      }
    } catch (error) {
      console.error('Error saving template:', error);
      
      // Display error message
      const errorMessage = error instanceof Error 
        ? error.message 
        : `Failed to ${isEditing ? 'update' : 'create'} template. Please try again.`;
      
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} template`, {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          {isEditing ? 'Edit Template' : 'Create New Template'}
        </CardTitle>
        <CardDescription>
          {isEditing 
            ? 'Update the template details below.'
            : 'Create a reusable template for faster ticket creation.'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Name Field */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Password Reset Request"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    A clear, descriptive name for this template (max 100 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description Field */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of when to use this template..."
                      className="min-h-[80px]"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional description to help users understand when to use this template (max 500 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category Field */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Technical Support, Billing, General"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional category to group similar templates (max 100 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Default Title Field */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Default ticket title when using this template"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional default title that will pre-fill the ticket title field (max 200 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Default Content Field */}
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Default ticket description content..."
                      className="min-h-[120px]"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional default content that will pre-fill the ticket description field
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Priority Field */}
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Priority *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select default priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={TicketPriority.LOW}>Low</SelectItem>
                      <SelectItem value={TicketPriority.MEDIUM}>Medium</SelectItem>
                      <SelectItem value={TicketPriority.HIGH}>High</SelectItem>
                      <SelectItem value={TicketPriority.URGENT}>Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Default priority level for tickets created with this template
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Global Template Checkbox (Admin_Manager only) */}
            {canManageSLA && (
              <FormField
                control={form.control}
                name="isGlobal"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Global Template
                      </FormLabel>
                      <FormDescription>
                        Make this template available to all users. If unchecked, only you can use this template.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            )}

            {/* Form Actions */}
            <div className="flex justify-end gap-4">
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
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isEditing ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  isEditing ? 'Update Template' : 'Create Template'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}