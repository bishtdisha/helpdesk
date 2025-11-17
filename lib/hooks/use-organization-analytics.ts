'use client';

import useSWR from 'swr';
import { apiClient } from '@/lib/api-client';
import { OrganizationMetrics } from '@/lib/services/analytics-service';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface UseOrganizationAnalyticsOptions {
  dateRange: DateRange;
  refreshInterval?: number;
}

interface UseOrganizationAnalyticsReturn {
  metrics: OrganizationMetrics | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
}

/**
 * Hook for fetching organization-wide analytics
 * Only accessible by Admin_Manager role
 */
export function useOrganizationAnalytics({
  dateRange,
  refreshInterval = 60000, // Refresh every 60 seconds by default
}: UseOrganizationAnalyticsOptions): UseOrganizationAnalyticsReturn {
  const { data, error, isLoading, mutate } = useSWR<OrganizationMetrics>(
    ['/api/analytics/organization', dateRange],
    async ([url, range]) => {
      return apiClient.get<OrganizationMetrics>(url, {
        startDate: range.startDate.toISOString(),
        endDate: range.endDate.toISOString(),
      });
    },
    {
      refreshInterval,
      revalidateOnFocus: true,
      dedupingInterval: 5000, // Prevent duplicate requests within 5 seconds
    }
  );

  return {
    metrics: data || null,
    isLoading,
    error: error || null,
    refresh: mutate,
  };
}
