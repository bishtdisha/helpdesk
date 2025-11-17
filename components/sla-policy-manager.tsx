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
import { TicketPriority } from '@prisma/client';

interface SLAPolicy {
  id: string;
  name: string;
  description?: string | null;
  priority: TicketPriority;
  responseTimeHours: number;
  resolutionTimeHours: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SLAPolicyManagerProps {
  onCreateClick?: () => void;
  onEditClick?: (policy: SLAPolicy) => void;
}

export function SLAPolicyManager({ onCreateClick, onEditClick }: SLAPolicyManagerProps) {
  const [policies, setPolicies] = useState<SLAPolicy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { canManageSLA } = usePermissions();
  const { toast } = useToast();

  // Fetch SLA policies
  const fetchPolicies = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get<{ policies: SLAPolicy[] }>('/sla/policies');
      setPolicies(response.policies);
    } catch (error) {
      console.error('Error fetching SLA policies:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch SLA policies',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (canManageSLA()) {
      fetchPolicies();
    }
  }, [canManageSLA]);

  // Delete policy
  const handleDelete = async (policyId: string) => {
    if (!confirm('Are you sure you want to delete this SLA policy?')) {
      return;
    }

    try {
      setDeletingId(policyId);
      await apiClient.delete(`/sla/policies/${policyId}`);
      
      toast({
        title: 'Success',
        description: 'SLA policy deleted successfully',
      });
      
      // Refresh policies list
      await fetchPolicies();
    } catch (error) {
      console.error('Error deleting SLA policy:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete SLA policy',
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
            You do not have permission to manage SLA policies.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Priority badge color mapping
  const getPriorityColor = (priority: TicketPriority) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-500 text-white';
      case 'HIGH':
        return 'bg-orange-500 text-white';
      case 'MEDIUM':
        return 'bg-yellow-500 text-white';
      case 'LOW':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>SLA Policies</CardTitle>
            <CardDescription>
              Manage service level agreement policies for different ticket priorities
            </CardDescription>
          </div>
          <Button onClick={onCreateClick}>
            <Plus className="h-4 w-4 mr-2" />
            Create Policy
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : policies.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No SLA policies found.</p>
            <p className="text-sm mt-2">Create your first policy to get started.</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Response Time</TableHead>
                  <TableHead>Resolution Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {policies.map((policy) => (
                  <TableRow key={policy.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{policy.name}</div>
                        {policy.description && (
                          <div className="text-sm text-muted-foreground">
                            {policy.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(policy.priority)}>
                        {policy.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>{policy.responseTimeHours}h</TableCell>
                    <TableCell>{policy.resolutionTimeHours}h</TableCell>
                    <TableCell>
                      <Badge variant={policy.isActive ? 'default' : 'secondary'}>
                        {policy.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditClick?.(policy)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(policy.id)}
                          disabled={deletingId === policy.id}
                        >
                          {deletingId === policy.id ? (
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
