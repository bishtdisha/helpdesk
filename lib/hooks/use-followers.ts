/**
 * useFollowers Hook
 * 
 * Custom hook for managing ticket followers with:
 * - SWR for caching and revalidation
 * - Add and remove follower functionality
 * - Optimistic updates for better UX
 * - Error handling with toast notifications
 */

import useSWR from 'swr';
import { apiClient } from '../api-client';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
  role?: {
    id: string;
    name: string;
  } | null;
}

export interface Follower {
  id: string;
  userId: string;
  ticketId: string;
  addedBy: string;
  addedAt: string;
  user: User;
}

interface UseFollowersReturn {
  followers: Follower[];
  isLoading: boolean;
  isError: boolean;
  error: Error | undefined;
  addFollower: (userId: string) => Promise<void>;
  removeFollower: (userId: string) => Promise<void>;
  refresh: () => Promise<void>;
  mutate: (data?: Follower[]) => Promise<Follower[] | undefined>;
}

/**
 * Hook for managing ticket followers
 */
export function useFollowers(ticketId: string | null | undefined): UseFollowersReturn {
  // Only fetch if ticketId is provided
  const shouldFetch = !!ticketId;

  // Fetcher function
  const fetcher = async (endpoint: string) => {
    const response = await apiClient.get<{ followers: Follower[]; total: number }>(endpoint);
    return response.followers;
  };

  // Use SWR for data fetching
  const { data, error, isLoading, mutate } = useSWR<Follower[], Error>(
    shouldFetch ? `/api/tickets/${ticketId}/followers` : null,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000, // Prevent duplicate requests within 5 seconds
    }
  );

  /**
   * Add a follower to the ticket
   */
  const addFollower = async (userId: string): Promise<void> => {
    if (!ticketId) {
      throw new Error('Ticket ID is required');
    }

    try {
      // Optimistically update the UI
      const optimisticFollower: Follower = {
        id: `temp-${Date.now()}`,
        userId,
        ticketId,
        addedBy: '', // Will be set by backend
        addedAt: new Date().toISOString(),
        user: {
          id: userId,
          name: 'Loading...',
          email: '',
        },
      };

      // Update cache optimistically
      await mutate(
        async (currentFollowers) => {
          // Make API call
          const response = await apiClient.post<{
            message: string;
            follower: Follower;
          }>(`/tickets/${ticketId}/followers`, { userId });

          // Verify API response confirms record creation
          if (!response.follower || !response.follower.id) {
            throw new Error('Failed to verify follower creation');
          }

          // Return updated followers list
          return [...(currentFollowers || []), response.follower];
        },
        {
          optimisticData: [...(data || []), optimisticFollower],
          rollbackOnError: true,
          populateCache: true,
          revalidate: false,
        }
      );

      // Show success notification
      toast.success('Follower added successfully');
    } catch (err) {
      console.error('Error adding follower:', err);
      
      // Show error notification
      const errorMessage = err instanceof Error ? err.message : 'Failed to add follower';
      toast.error(errorMessage);
      
      throw err;
    }
  };

  /**
   * Remove a follower from the ticket
   */
  const removeFollower = async (userId: string): Promise<void> => {
    if (!ticketId) {
      throw new Error('Ticket ID is required');
    }

    try {
      // Optimistically update the UI
      await mutate(
        async (currentFollowers) => {
          // Make API call
          await apiClient.delete(`/tickets/${ticketId}/followers/${userId}`);

          // Verify API response confirms deletion by checking if the request succeeded
          // (if it throws, the optimistic update will be rolled back)

          // Return updated followers list
          return (currentFollowers || []).filter((f) => f.userId !== userId);
        },
        {
          optimisticData: (data || []).filter((f) => f.userId !== userId),
          rollbackOnError: true,
          populateCache: true,
          revalidate: false,
        }
      );

      // Show success notification
      toast.success('Follower removed successfully');
    } catch (err) {
      console.error('Error removing follower:', err);
      
      // Show error notification
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove follower';
      toast.error(errorMessage);
      
      throw err;
    }
  };

  // Refresh function
  const refresh = async () => {
    await mutate();
  };

  return {
    followers: data || [],
    isLoading,
    isError: !!error,
    error,
    addFollower,
    removeFollower,
    refresh,
    mutate,
  };
}
