'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { TicketPriority } from '@prisma/client';
import { useTemplateMutations } from '@/lib/hooks/use-templates';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

const saveTemplateSchema = z.object({
  name: z
    .string()
    .min(1, 'Template name is required')
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
  includeTitle: z.boolean().default(true),
  includeDescription: z.boolean().default(true),
  includePriority: z.boolean().default(true),
  includeCategory: z.boolean().default(true),
});

type SaveTemplateFormValues = z.infer<typeof saveTemplateSchema>;

interface FormData {
  title: string;
  description: string;
  priority: TicketPriority;
  category: string;
}

interface SaveAsTemplateButtonProps {
  formData: FormData;
  disabled?: boolean;
}

export function SaveAsTemplateButton({ formData, disabled = false }: SaveAsTemplateButtonProps) {
  const { createTemplate } = useTemplateMutations();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SaveTemplateFormValues>({
    resolver: zodResolver(saveTemplateSchema),
    defaultValues: {
      name: '',
      description: '',
      category: formData.category || '',
      includeTitle: true,
      includeDescription: true,
      includePriority: true,
      includeCategory: !!formData.category,
    },
  });

  const onSubmit = async (data: SaveTemplateFormValues) => {
    setIsSubmitting(true);

    try {
      const templateData = {
        name: data.name,
        description: data.description || undefined,
        category: data.category || undefined,
        title: data.includeTitle ? formData.title : undefined,
        content: data.includeDescription ? formData.description : undefined,
        priority: data.includePriority ? formData.priority : TicketPriority.MEDIUM,
        isGlobal: false, // Personal templates are never global
      };

      const result = await createTemplate(templateData);

      if (!result?.id) {
        throw new Error('Invalid response: template ID not returned');
      }

      toast.success('Template saved successfully', {
        description: `Template "${data.name}" has been saved to your personal templates.`,
      });

      setDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error('Error saving template:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to save template. Please try again.';
      
      toast.error('Failed to save template', {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if form has enough data to save as template
  const hasData = formData.title.trim() || formData.description.trim();

  if (!hasData) {
    return null;
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
        >
          <Save className="h-4 w-4 mr-2" />
          Save as Template
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Save as Personal Template</DialogTitle>
          <DialogDescription>
            Save the current form data as a personal template for future use.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Template Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., My Support Request Template"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Template Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional description..."
                      className="min-h-[60px]"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Template Category */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Optional category..."
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Include Fields */}
            <div className="space-y-3">
              <div className="text-sm font-medium">Include in template:</div>
              
              {formData.title.trim() && (
                <FormField
                  control={form.control}
                  name="includeTitle"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm">
                          Title: &quot;{formData.title.substring(0, 50)}{formData.title.length > 50 ? '...' : ''}&quot;
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              )}

              {formData.description.trim() && (
                <FormField
                  control={form.control}
                  name="includeDescription"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm">
                          Description ({formData.description.length} characters)
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="includePriority"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm">
                        Priority: {formData.priority}
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {formData.category && (
                <FormField
                  control={form.control}
                  name="includeCategory"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm">
                          Category: {formData.category}
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Template'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}