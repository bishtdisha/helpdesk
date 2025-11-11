/**
 * API endpoint for cache monitoring and statistics
 * GET /api/cache-stats - Get cache performance statistics
 * POST /api/cache-stats/clear - Clear all caches (admin only)
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { CacheMonitor, CacheManager } from '../lib/cache/cache-monitor';
import { AuthService } from '../lib/auth-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      // Get cache statistics
      const stats = CacheMonitor.getCacheStats();
      const health = CacheMonitor.getCacheHealth();
      const performance = CacheMonitor.getPerformanceReport();
      
      return res.status(200).json({
        success: true,
        data: {
          stats,
          health,
          performance,
          timestamp: new Date().toISOString(),
        },
      });
    }
    
    if (req.method === 'POST') {
      // Admin operations (clear cache, etc.)
      const { action } = req.body;
      
      // Validate session (admin check would go here)
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }
      
      const token = authHeader.substring(7);
      const sessionValidation = await AuthService.validateSession(token);
      
      if (!sessionValidation.valid) {
        return res.status(401).json({
          success: false,
          error: 'Invalid session',
        });
      }
      
      // TODO: Add admin role check here
      // For now, any authenticated user can perform cache operations
      
      switch (action) {
        case 'clear':
          CacheMonitor.clearAllCaches();
          return res.status(200).json({
            success: true,
            message: 'All caches cleared successfully',
          });
          
        case 'cleanup':
          CacheManager.cleanup();
          return res.status(200).json({
            success: true,
            message: 'Cache cleanup completed',
          });
          
        case 'warmup':
          await CacheMonitor.warmupCache();
          return res.status(200).json({
            success: true,
            message: 'Cache warmup completed',
          });
          
        default:
          return res.status(400).json({
            success: false,
            error: 'Invalid action. Supported actions: clear, cleanup, warmup',
          });
      }
    }
    
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
    
  } catch (error) {
    console.error('Cache stats API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}