import { auditLogger } from './audit-logger';

/**
 * User Activity Tracker - Tracks user activities for security monitoring
 * 
 * This service provides methods for tracking user activities and behaviors
 * that are important for security monitoring and compliance.
 */
export class ActivityTracker {
  /**
   * Track user login activity
   * 
   * @param userId - ID of the user logging in
   * @param success - Whether the login was successful
   * @param ipAddress - IP address of the login attempt
   * @param userAgent - User agent string
   * @param details - Additional login details
   */
  async trackLogin(
    userId: string | null,
    success: boolean,
    ipAddress?: string,
    userAgent?: string,
    details?: Record<string, any>
  ): Promise<void> {
    await auditLogger.logAuthEvent(
      userId,
      success ? 'login_success' : 'login_failed',
      success,
      {
        ...details,
        loginAttempt: true,
      },
      ipAddress,
      userAgent
    );
  }

  /**
   * Track user logout activity
   * 
   * @param userId - ID of the user logging out
   * @param ipAddress - IP address of the logout
   * @param userAgent - User agent string
   * @param details - Additional logout details
   */
  async trackLogout(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
    details?: Record<string, any>
  ): Promise<void> {
    await auditLogger.logAuthEvent(
      userId,
      'logout',
      true,
      {
        ...details,
        logoutEvent: true,
      },
      ipAddress,
      userAgent
    );
  }

  /**
   * Track password change attempts
   * 
   * @param userId - ID of the user changing password
   * @param success - Whether the password change was successful
   * @param ipAddress - IP address of the attempt
   * @param userAgent - User agent string
   * @param details - Additional details about the password change
   */
  async trackPasswordChange(
    userId: string,
    success: boolean,
    ipAddress?: string,
    userAgent?: string,
    details?: Record<string, any>
  ): Promise<void> {
    await auditLogger.logAuthEvent(
      userId,
      success ? 'password_change_success' : 'password_change_failed',
      success,
      {
        ...details,
        passwordChange: true,
      },
      ipAddress,
      userAgent
    );
  }

  /**
   * Track suspicious user activity
   * 
   * @param userId - ID of the user with suspicious activity
   * @param activityType - Type of suspicious activity
   * @param description - Description of the suspicious activity
   * @param ipAddress - IP address of the activity
   * @param userAgent - User agent string
   * @param details - Additional details about the activity
   */
  async trackSuspiciousActivity(
    userId: string,
    activityType: string,
    description: string,
    ipAddress?: string,
    userAgent?: string,
    details?: Record<string, any>
  ): Promise<void> {
    await auditLogger.logAction(
      userId,
      `suspicious_activity_${activityType}`,
      'security',
      userId,
      false,
      {
        ...details,
        description,
        activityType,
        suspicious: true,
        severity: this.getSuspiciousSeverity(activityType),
      },
      ipAddress,
      userAgent
    );
  }

  /**
   * Track data export activities
   * 
   * @param userId - ID of the user exporting data
   * @param resourceType - Type of resource being exported
   * @param recordCount - Number of records exported
   * @param ipAddress - IP address of the export
   * @param userAgent - User agent string
   * @param details - Additional export details
   */
  async trackDataExport(
    userId: string,
    resourceType: string,
    recordCount: number,
    ipAddress?: string,
    userAgent?: string,
    details?: Record<string, any>
  ): Promise<void> {
    await auditLogger.logDataAccess(
      userId,
      'export',
      resourceType,
      undefined,
      {
        ...details,
        recordCount,
        exportEvent: true,
      },
      ipAddress,
      userAgent
    );
  }

  /**
   * Track bulk operations
   * 
   * @param userId - ID of the user performing bulk operation
   * @param operation - Type of bulk operation
   * @param resourceType - Type of resource being operated on
   * @param affectedCount - Number of records affected
   * @param ipAddress - IP address of the operation
   * @param userAgent - User agent string
   * @param details - Additional operation details
   */
  async trackBulkOperation(
    userId: string,
    operation: string,
    resourceType: string,
    affectedCount: number,
    ipAddress?: string,
    userAgent?: string,
    details?: Record<string, any>
  ): Promise<void> {
    await auditLogger.logAction(
      userId,
      `bulk_${operation}`,
      resourceType,
      undefined,
      true,
      {
        ...details,
        affectedCount,
        bulkOperation: true,
        operation,
      },
      ipAddress,
      userAgent
    );
  }

  /**
   * Track session activities
   * 
   * @param userId - ID of the user
   * @param sessionEvent - Type of session event
   * @param sessionId - Session identifier
   * @param ipAddress - IP address of the session
   * @param userAgent - User agent string
   * @param details - Additional session details
   */
  async trackSessionActivity(
    userId: string,
    sessionEvent: 'created' | 'expired' | 'terminated' | 'extended',
    sessionId: string,
    ipAddress?: string,
    userAgent?: string,
    details?: Record<string, any>
  ): Promise<void> {
    await auditLogger.logAction(
      userId,
      `session_${sessionEvent}`,
      'session',
      sessionId,
      true,
      {
        ...details,
        sessionEvent,
        sessionId,
      },
      ipAddress,
      userAgent
    );
  }

  /**
   * Track API access patterns
   * 
   * @param userId - ID of the user accessing the API
   * @param endpoint - API endpoint accessed
   * @param method - HTTP method used
   * @param statusCode - Response status code
   * @param responseTime - Response time in milliseconds
   * @param ipAddress - IP address of the request
   * @param userAgent - User agent string
   * @param details - Additional API access details
   */
  async trackAPIAccess(
    userId: string | null,
    endpoint: string,
    method: string,
    statusCode: number,
    responseTime: number,
    ipAddress?: string,
    userAgent?: string,
    details?: Record<string, any>
  ): Promise<void> {
    // Only log API access for sensitive endpoints or failed requests
    const isSensitiveEndpoint = this.isSensitiveEndpoint(endpoint);
    const isFailedRequest = statusCode >= 400;
    
    if (isSensitiveEndpoint || isFailedRequest) {
      await auditLogger.logAction(
        userId,
        `api_access_${method.toLowerCase()}`,
        'api',
        endpoint,
        statusCode < 400,
        {
          ...details,
          endpoint,
          method,
          statusCode,
          responseTime,
          apiAccess: true,
          sensitive: isSensitiveEndpoint,
        },
        ipAddress,
        userAgent
      );
    }
  }

  /**
   * Track failed authorization attempts
   * 
   * @param userId - ID of the user with failed authorization
   * @param resource - Resource that was accessed
   * @param action - Action that was attempted
   * @param reason - Reason for authorization failure
   * @param ipAddress - IP address of the attempt
   * @param userAgent - User agent string
   * @param details - Additional authorization details
   */
  async trackAuthorizationFailure(
    userId: string,
    resource: string,
    action: string,
    reason: string,
    ipAddress?: string,
    userAgent?: string,
    details?: Record<string, any>
  ): Promise<void> {
    await auditLogger.logPermissionViolation(
      userId,
      action,
      resource,
      undefined,
      reason,
      ipAddress,
      userAgent
    );
  }

  /**
   * Get suspicious activity severity level
   */
  private getSuspiciousSeverity(activityType: string): 'low' | 'medium' | 'high' | 'critical' {
    const highSeverityActivities = [
      'privilege_escalation',
      'data_exfiltration',
      'unauthorized_admin_access',
      'multiple_failed_logins',
    ];

    const mediumSeverityActivities = [
      'unusual_access_pattern',
      'off_hours_access',
      'multiple_ip_addresses',
      'rapid_requests',
    ];

    const criticalSeverityActivities = [
      'account_takeover',
      'malicious_payload',
      'system_compromise',
    ];

    if (criticalSeverityActivities.includes(activityType)) return 'critical';
    if (highSeverityActivities.includes(activityType)) return 'high';
    if (mediumSeverityActivities.includes(activityType)) return 'medium';
    return 'low';
  }

  /**
   * Check if an endpoint is considered sensitive
   */
  private isSensitiveEndpoint(endpoint: string): boolean {
    const sensitivePatterns = [
      '/api/users',
      '/api/roles',
      '/api/teams',
      '/api/audit-logs',
      '/api/auth',
      '/admin',
    ];

    return sensitivePatterns.some(pattern => endpoint.includes(pattern));
  }
}

// Export singleton instance
export const activityTracker = new ActivityTracker();