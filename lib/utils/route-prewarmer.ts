/**
 * Route Pre-warmer
 * 
 * Pre-warms Next.js routes by making background requests to compile them
 * This reduces the first-time navigation lag in development mode
 */

// Routes to pre-warm on app startup
const ROUTES_TO_PREWARM = [
  '/helpdesk/dashboard',
  '/helpdesk/tickets',
  '/helpdesk/knowledge-base',
  '/helpdesk/analytics',
  '/helpdesk/reports',
  '/helpdesk/users',
  '/helpdesk/teams',
];

// API routes to pre-warm
const API_ROUTES_TO_PREWARM = [
  '/api/tickets/stats',
  '/api/teams?simple=true',
  '/api/dashboard/all',
];

let isPrewarmed = false;

/**
 * Pre-warm routes by making background fetch requests
 * This triggers Next.js to compile the pages ahead of time
 */
export async function prewarmRoutes() {
  if (isPrewarmed || typeof window === 'undefined') return;
  
  isPrewarmed = true;
  
  // Wait a bit for the initial page to fully load
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Pre-warm page routes (triggers compilation)
  for (const route of ROUTES_TO_PREWARM) {
    try {
      // Use prefetch link to trigger route compilation without full navigation
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = route;
      link.as = 'document';
      document.head.appendChild(link);
      
      // Small delay between prefetches to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      // Silently ignore errors
    }
  }
  
  // Pre-warm API routes
  for (const route of API_ROUTES_TO_PREWARM) {
    try {
      fetch(route, { 
        method: 'GET',
        credentials: 'include',
        // Use low priority to not block main requests
        priority: 'low' as RequestPriority,
      }).catch(() => {});
      
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      // Silently ignore errors
    }
  }
  
  console.log('[Route Prewarmer] Routes pre-warmed successfully');
}

/**
 * Hook to trigger route pre-warming on component mount
 */
export function useRoutePrewarmer() {
  if (typeof window !== 'undefined') {
    // Run after initial render
    setTimeout(() => {
      prewarmRoutes();
    }, 100);
  }
}
