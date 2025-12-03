'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomizableDashboard } from "@/components/dashboard/customizable-dashboard";
import { ComparativeAnalysisComponent } from "@/components/analytics/comparative-analysis";
import { useAuth } from "@/lib/hooks/use-auth";
import { BarChart3, LayoutDashboard } from "lucide-react";

export function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Check if user is Admin/Manager to show analytics tab
  const isAdminOrManager = user?.role?.name === 'Admin/Manager';

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md" style={{ gridTemplateColumns: isAdminOrManager ? '1fr 1fr' : '1fr' }}>
          <TabsTrigger value="overview" className="gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Overview
          </TabsTrigger>
          {isAdminOrManager && (
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <CustomizableDashboard />
        </TabsContent>

        {isAdminOrManager && (
          <TabsContent value="analytics" className="mt-6">
            <ComparativeAnalysisComponent />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
