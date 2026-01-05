/**
 * Prefetch utilities for improving navigation performance
 * Preloads data for common routes before user navigates
 */

import { mutate } from 'swr';

// Prefetch dashboard data
export function prefetchDashboard() {
  // Prefetch the batch dashboard API
  mutate('/api/dashboard/all', undefined, { revalidate: true });
}

// Prefetch tickets data
export function prefetchTickets() {
  // Prefetch first page of tickets
  mutate('/api/tickets?page=1&limit=20', undefined, { revalidate: true });
  // Prefetch ticket stats
  mutate('/api/tickets/stats', undefined, { revalidate: true });
}

// Prefetch teams data
export function prefetchTeams() {
  mutate('/api/teams', undefined, { revalidate: true });
}

// Prefetch users data
export function prefetchUsers() {
  mutate('/api/users', undefined, { revalidate: true });
}

// Prefetch based on route
export function prefetchRoute(route: string) {
  switch (route) {
    case 'dashboard':
      prefetchDashboard();
      break;
    case 'tickets':
      prefetchTickets();
      break;
    case 'teams':
      prefetchTeams();
      break;
    case 'users':
      prefetchUsers();
      break;
  }
}

// Prefetch on hover (for navigation links)
export function createHoverPrefetch(route: string) {
  let prefetched = false;
  
  return () => {
    if (!prefetched) {
      prefetched = true;
      // Small delay to avoid prefetching on accidental hovers
      setTimeout(() => {
        prefetchRoute(route);
      }, 100);
    }
  };
}
