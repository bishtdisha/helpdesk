/**
 * @deprecated This hook is deprecated. Use the context-based useAuth from @/lib/contexts instead.
 * 
 * This file is kept for backward compatibility but will be removed in a future version.
 * Please migrate to:
 * 
 * import { useAuth } from '@/lib/contexts';
 * // or
 * import { useAuth } from '@/lib/auth';
 */

// Re-export the new context-based useAuth hook
export { useAuth } from '../contexts/auth-context';