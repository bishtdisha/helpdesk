/**
 * useDashboardData Hook
 * 
 * Single hook that fetches all dashboard data in one request
 * Replaces multiple individual widget hooks for better performance
 */

import useSWR from 'swr';

interface DashboardKPIs {
  totalTickets: number;
  openTickets: number;
  myTickets: number;
  slaAtRisk: number;
  slaBreached: number;
  slaCompliance: number;
  resolvedToday: number;
  createdToday: number;
  avgResolutionHours: number;
  avgResolutionFormatted: string;
}

interface StatusDistribution {
  status: string;
  count: number;
}

interface PriorityDistribution {
  priority: string;
  count: number;
}

interface DailyTrend {
  date: string;
  created: number;
  resolved: number;
}

interface RecentTicket {
  id: string;
  ticketNumber: number;
  title: string;
  status: string;
  priority: string;
  slaDueAt: string | null;
  createdAt: string;
  customer: { name: string | null } | null;
}

export interface DashboardData {
  kpis: DashboardKPIs;
  statusDistribution: StatusDistribution[];
  priorityDistribution: PriorityDistribution[];
  dailyTrend: DailyTrend[];
  recentTickets: RecentTicket[];
  generatedAt: string;
  userRole: string;
}

const fetcher = async (url: string): Promise<DashboardData> => {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    throw new Error('Failed to fetch dashboard data');
  }
  return res.json();
};

interface UseDashboardDataReturn {
  data: DashboardData | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | undefined;
  refresh: () => Promise<DashboardData | undefined>;
}

export function useDashboardData(): UseDashboardDataReturn {
  const { data, error, isLoading, mutate } = useSWR<DashboardData, Error>(
    '/api/dashboard/all',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30000, // 30 seconds
      refreshInterval: 0, // No auto-refresh
      errorRetryCount: 2,
      keepPreviousData: true,
    }
  );

  return {
    data,
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  };
}

// Export individual data selectors for components that need specific data
export function useKPIs() {
  const { data, isLoading, isError } = useDashboardData();
  return {
    kpis: data?.kpis,
    isLoading,
    isError,
  };
}

export function useStatusDistribution() {
  const { data, isLoading, isError } = useDashboardData();
  return {
    distribution: data?.statusDistribution,
    isLoading,
    isError,
  };
}

export function usePriorityDistribution() {
  const { data, isLoading, isError } = useDashboardData();
  return {
    distribution: data?.priorityDistribution,
    isLoading,
    isError,
  };
}

export function useDailyTrend() {
  const { data, isLoading, isError } = useDashboardData();
  return {
    trend: data?.dailyTrend,
    isLoading,
    isError,
  };
}

export function useRecentTickets() {
  const { data, isLoading, isError } = useDashboardData();
  return {
    tickets: data?.recentTickets,
    isLoading,
    isError,
  };
}
