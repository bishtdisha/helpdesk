'use client';

import { useState, useEffect } from 'react';
import { usePermissions } from '@/lib/hooks/use-permissions';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/lib/hooks/use-toast';

export type EscalationConditionType = 
  | 'sla_breach'
  | 'time_in_status'
  | 'priority_level'
  | 'no_response'
  | 'customer_rating';

export type EscalationActionType = 
  | 'notify_manager'
  | 'reassign_ticket'
  | 'increase_priority'
  | 'add_follower'
  | 'send_email';

export interface EscalationRule {
  id: string;
  name: string;
  description?: string | null;
  conditionType: EscalationConditionType;
  conditionValue: any;
  actionType: EscalationActionType;
  actionConfig: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EscalationRuleManagerProps {
  onCreateClick?: () => void;
  onEditClick?: (rule: EscalationRule) => void;
}

export function EscalationRuleManager({ onCreateClick, onEditClick }: EscalationRuleManagerProps) {
  const [rules, setRules] = useState<EscalationRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { canManageSLA } = usePermissions(); // Using canManageSLA as proxy for admin check
  const { toast } = useToast();

  // Fetch escalation rules
  const fetchRules = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get<{ rules: EscalationRule[] }>('/escalation/rules');
      setRules(response.rules);
    } catch (error) {
      console.error('Error fetching escalation rules:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch escalation rules',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (canManageSLA()) {
      fetchRules();
    }
  }, [canManageSLA]);

  // Delete rule
  const handleDelete = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this escalation rule?')) {
      return;
    }

    try {
      setDeletingId(ruleId);
      await apiClient.delete(`/escalation/rules/${ruleId}`);
      
      toast({
        title: 'Success',
        description: 'Escalation rule deleted successfully',
      });
      
      // Refresh rules list
      await fetchRules();
    } catch (error) {
      console.error('Error deleting escalation rule:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete escalation rule',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  // Permission guard
  if (!canManageSLA()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>
            You do not have permission to manage escalation rules.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Format condition type for display
  const formatConditionType = (type: EscalationConditionType) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Format action type for display
  const formatActionType = (type: EscalationActionType) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Escalation Rules</CardTitle>
            <CardDescription>
              Manage automated escalation rules for ticket management
            </CardDescription>
          </div>
          <Button onClick={onCreateClick}>
            <Plus className="h-4 w-4 mr-2" />
            Create Rule
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : rules.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No escalation rules found.</p>
            <p className="text-sm mt-2">Create your first rule to get started.</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{rule.name}</div>
                        {rule.description && (
                          <div className="text-sm text-muted-foreground">
                            {rule.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {formatConditionType(rule.conditionType)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {formatActionType(rule.actionType)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditClick?.(rule)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(rule.id)}
                          disabled={deletingId === rule.id}
                        >
                          {deletingId === rule.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
