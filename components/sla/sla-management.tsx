'use client';

import { useState } from 'react';
import { SLAPolicyManager } from './sla-policy-manager';
import { SLAPolicyForm } from './sla-policy-form';
import { SLAViolationList } from './sla-violation-list';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePermissions } from '@/lib/hooks/use-permissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SLAPolicy {
  id: string;
  name: string;
  description?: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  responseTimeHours: number;
  resolutionTimeHours: number;
  isActive: boolean;
}

export function SLAManagement() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<SLAPolicy | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { canManageSLA } = usePermissions();

  const handleCreateClick = () => {
    setSelectedPolicy(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (policy: SLAPolicy) => {
    setSelectedPolicy(policy);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    // Trigger refresh of policy list
    setRefreshKey((prev) => prev + 1);
  };

  // Permission guard
  if (!canManageSLA()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>
            You do not have permission to manage SLA policies. Only Admin_Manager users can access this feature.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">SLA Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage service level agreement policies and monitor violations
        </p>
      </div>

      <Tabs defaultValue="policies" className="space-y-4">
        <TabsList>
          <TabsTrigger value="policies">SLA Policies</TabsTrigger>
          <TabsTrigger value="violations">Violations</TabsTrigger>
        </TabsList>

        <TabsContent value="policies" className="space-y-4">
          <SLAPolicyManager
            key={refreshKey}
            onCreateClick={handleCreateClick}
            onEditClick={handleEditClick}
          />
        </TabsContent>

        <TabsContent value="violations" className="space-y-4">
          <SLAViolationList />
        </TabsContent>
      </Tabs>

      <SLAPolicyForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        policy={selectedPolicy}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
