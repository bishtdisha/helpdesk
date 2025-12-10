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
import { FormFieldWithHelp } from '@/components/ui/form-field-with-help';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/lib/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { EscalationRule, EscalationConditionType, EscalationActionType } from './escalation-rule-manager';

// Form schema
const escalationRuleSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name must be less than 200 characters'),
  description: z.string().optional(),
  conditionType: z.enum(['sla_breach', 'time_in_status', 'priority_level', 'no_response', 'customer_rating']),
  conditionValue: z.string().min(1, 'Condition value is required'),
  actionType: z.enum(['notify_manager', 'reassign_ticket', 'increase_priority', 'add_follower', 'send_email']),
  actionConfig: z.string().min(1, 'Action configuration is required'),
});

type EscalationRuleFormData = z.infer<typeof escalationRuleSchema>;

interface EscalationRuleFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  rule?: EscalationRule | null;
}

export function EscalationRuleForm({ open, onClose, onSuccess, rule }: EscalationRuleFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const isEditing = !!rule;

  const form = useForm<EscalationRuleFormData>({
    resolver: zodResolver(escalationRuleSchema),
    defaultValues: {
      name: rule?.name || '',
      description: rule?.description || '',
      conditionType: rule?.conditionType || 'sla_breach',
      conditionValue: rule?.conditionValue ? JSON.stringify(rule.conditionValue) : '',
      actionType: rule?.actionType || 'notify_manager',
      actionConfig: rule?.actionConfig ? JSON.stringify(rule.actionConfig) : '',
    },
  });

  const onSubmit = async (data: EscalationRuleFormData) => {
    try {
      setIsSubmitting(true);

      // Parse JSON values
      let conditionValue;
      let actionConfig;

      try {
        conditionValue = JSON.parse(data.conditionValue);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Invalid condition value JSON format',
          variant: 'destructive',
        });
        return;
      }

      try {
        actionConfig = JSON.parse(data.actionConfig);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Invalid action configuration JSON format',
          variant: 'destructive',
        });
        return;
      }

      const payload = {
        name: data.name,
        description: data.description || undefined,
        conditionType: data.conditionType,
        conditionValue,
        actionType: data.actionType,
        actionConfig,
      };

      if (isEditing && rule) {
        // Update existing rule
        const response = await apiClient.put(`/escalation/rules/${rule.id}`, payload);
        
        // Verify API response confirms update
        if (!response.rule) {
          throw new Error('API response did not confirm rule update');
        }

        toast({
          title: 'Success',
          description: 'Escalation rule updated successfully',
        });
      } else {
        // Create new rule
        const response = await apiClient.post('/escalation/rules', payload);
        
        // Verify API response confirms storage with JSON configuration
        if (!response.rule || !response.rule.id) {
          throw new Error('API response did not confirm rule creation');
        }

        toast({
          title: 'Success',
          description: 'Escalation rule created successfully',
        });
      }

      form.reset();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving escalation rule:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save escalation rule',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  // Condition type options
  const conditionTypes: { value: EscalationConditionType; label: string; description: string }[] = [
    { value: 'sla_breach', label: 'SLA Breach', description: 'Trigger when SLA is breached or about to breach' },
    { value: 'time_in_status', label: 'Time in Status', description: 'Trigger after ticket is in a status for X hours' },
    { value: 'priority_level', label: 'Priority Level', description: 'Trigger for specific priority levels' },
    { value: 'no_response', label: 'No Response', description: 'Trigger when no activity for X hours' },
    { value: 'customer_rating', label: 'Customer Rating', description: 'Trigger based on customer feedback rating' },
  ];

  // Action type options
  const actionTypes: { value: EscalationActionType; label: string; description: string }[] = [
    { value: 'notify_manager', label: 'Notify Manager', description: 'Send notification to team leaders or admins' },
    { value: 'reassign_ticket', label: 'Reassign Ticket', description: 'Reassign ticket to a user or team' },
    { value: 'increase_priority', label: 'Increase Priority', description: 'Automatically increase ticket priority' },
    { value: 'add_follower', label: 'Add Follower', description: 'Add users as followers to the ticket' },
    { value: 'send_email', label: 'Send Email', description: 'Send email notification to specified recipients' },
  ];

  // Get example JSON for condition value
  const getConditionExample = (type: EscalationConditionType) => {
    switch (type) {
      case 'sla_breach':
        return '{"thresholdHours": 2}';
      case 'time_in_status':
        return '{"status": "OPEN", "hours": 24}';
      case 'priority_level':
        return '{"priorities": ["URGENT", "HIGH"]}';
      case 'no_response':
        return '{"hours": 48}';
      case 'customer_rating':
        return '{"rating": 3, "operator": "less_than"}';
      default:
        return '{}';
    }
  };

  // Get example JSON for action config
  const getActionExample = (type: EscalationActionType) => {
    switch (type) {
      case 'notify_manager':
        return '{"message": "Ticket requires attention"}';
      case 'reassign_ticket':
        return '{"userId": "user-id-here"}';
      case 'increase_priority':
        return '{}';
      case 'add_follower':
        return '{"userIds": ["user-id-1", "user-id-2"]}';
      case 'send_email':
        return '{"recipients": ["user-id-1"], "subject": "Escalation", "message": "Ticket escalated"}';
      default:
        return '{}';
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Escalation Rule' : 'Create Escalation Rule'}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update the escalation rule configuration' 
              : 'Create a new automated escalation rule for ticket management'}
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
                    <Input placeholder="e.g., Urgent SLA Breach Alert" {...field} />
                  </FormControl>
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
                      placeholder="Describe when this rule should trigger and what it does"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="conditionType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Condition Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select condition type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {conditionTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-xs text-muted-foreground">{type.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="conditionValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Condition Value (JSON)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={getConditionExample(form.watch('conditionType'))}
                      className="font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Example: {getConditionExample(form.watch('conditionType'))}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="actionType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Action Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select action type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {actionTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-xs text-muted-foreground">{type.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="actionConfig"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Action Configuration (JSON)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={getActionExample(form.watch('actionType'))}
                      className="font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Example: {getActionExample(form.watch('actionType'))}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Update Rule' : 'Create Rule'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
