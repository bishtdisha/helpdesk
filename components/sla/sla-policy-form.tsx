'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/lib/hooks/use-toast';
import { TicketPriority } from '@prisma/client';

// Form validation schema
const slaPolicySchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name cannot exceed 100 characters'),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'], {
    required_error: 'Priority is required',
  }),
  responseTimeHours: z.number()
    .min(0.1, 'Response time must be greater than 0')
    .max(1000, 'Response time cannot exceed 1000 hours'),
  resolutionTimeHours: z.number()
    .min(0.1, 'Resolution time must be greater than 0')
    .max(1000, 'Resolution time cannot exceed 1000 hours'),
  isActive: z.boolean().default(true),
});

type SLAPolicyFormData = z.infer<typeof slaPolicySchema>;

interface SLAPolicy {
  id: string;
  name: string;
  description?: string | null;
  priority: TicketPriority;
  responseTimeHours: number;
  resolutionTimeHours: number;
  isActive: boolean;
}

interface SLAPolicyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policy?: SLAPolicy | null;
  onSuccess?: () => void;
}

export function SLAPolicyForm({ open, onOpenChange, policy, onSuccess }: SLAPolicyFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const isEditing = !!policy;

  const form = useForm<SLAPolicyFormData>({
    resolver: zodResolver(slaPolicySchema),
    defaultValues: {
      name: policy?.name || '',
      description: policy?.description || '',
      priority: policy?.priority || 'MEDIUM',
      responseTimeHours: policy?.responseTimeHours || 4,
      resolutionTimeHours: policy?.resolutionTimeHours || 24,
      isActive: policy?.isActive ?? true,
    },
  });

  // Reset form when policy changes
  useState(() => {
    if (policy) {
      form.reset({
        name: policy.name,
        description: policy.description || '',
        priority: policy.priority,
        responseTimeHours: policy.responseTimeHours,
        resolutionTimeHours: policy.resolutionTimeHours,
        isActive: policy.isActive,
      });
    } else {
      form.reset({
        name: '',
        description: '',
        priority: 'MEDIUM',
        responseTimeHours: 4,
        resolutionTimeHours: 24,
        isActive: true,
      });
    }
  });

  const onSubmit = async (data: SLAPolicyFormData) => {
    try {
      setIsSubmitting(true);

      if (isEditing) {
        // Update existing policy
        const response = await apiClient.put(`/sla/policies/${policy.id}`, data);
        
        // Verify API response confirms update
        if (response && 'policy' in response) {
          toast({
            title: 'Success',
            description: 'SLA policy updated successfully',
          });
        }
      } else {
        // Create new policy
        const response = await apiClient.post('/sla/policies', data);
        
        // Verify API response confirms storage
        if (response && 'policy' in response) {
          toast({
            title: 'Success',
            description: 'SLA policy created successfully',
          });
        }
      }

      // Close dialog and refresh list
      onOpenChange(false);
      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error('Error saving SLA policy:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save SLA policy',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit SLA Policy' : 'Create SLA Policy'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the SLA policy details below.'
              : 'Define response and resolution time targets for a specific priority level.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Standard SLA for High Priority" {...field} />
                  </FormControl>
                  <FormDescription>
                    A descriptive name for this SLA policy
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional details about this policy..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isEditing}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {isEditing
                      ? 'Priority cannot be changed after creation'
                      : 'The ticket priority this policy applies to'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="responseTimeHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Response Time (hours)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.5"
                        min="0.1"
                        max="1000"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Time to first response
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="resolutionTimeHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resolution Time (hours)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.5"
                        min="0.1"
                        max="1000"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Time to resolution
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active</FormLabel>
                    <FormDescription>
                      Enable this policy to apply it to new tickets
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Update Policy' : 'Create Policy'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
