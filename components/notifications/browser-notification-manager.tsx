"use client"

import { useEffect, useRef, useCallback } from 'react'
import { useBrowserNotifications } from '@/lib/hooks/use-browser-notifications'
import { useAuth } from '@/lib/contexts/auth-context'

interface Notification {
  id: string
  userId: string
  type: string
  title: string
  message: string
  ticketId?: string | null
  isRead: boolean
  createdAt: string
  updatedAt: string
}

interface NotificationPreferences {
  userId: string
  emailEnabled: boolean
  inAppEnabled: boolean
  notifyOnCreation: boolean
  notifyOnAssignment: boolean
  notifyOnStatusChange: boolean
  notifyOnComment: boolean
  notifyOnResolution: boolean
  notifyOnSLABreach: boolean
}

export function BrowserNotificationManager() {
  const { isAuthenticated } = useAuth()
  const { isSupported, permission, requestPermission, showNotification } = useBrowserNotifications()
  const lastNotificationIdRef = useRef<string | null>(null)
  const preferencesRef = useRef<NotificationPreferences | null>(null)
  const permissionRequestedRef = useRef(false)

  // Load user preferences
  useEffect(() => {
    if (!isAuthenticated) return

    const loadPreferences = async () => {
      try {
        const response = await fetch('/api/notifications/preferences')
        if (response.ok) {
          const data = await response.json()
          preferencesRef.current = data
        }
      } catch (error) {
        console.error('Error loading notification preferences:', error)
      }
    }

    loadPreferences()
  }, [isAuthenticated])

  // Request permission on mount if supported and not already requested
  useEffect(() => {
    if (!isAuthenticated || !isSupported || permissionRequestedRef.current) return

    // Only request permission if user hasn't made a decision yet
    if (permission === 'default') {
      // Wait a bit before requesting to avoid overwhelming the user on first load
      const timer = setTimeout(() => {
        requestPermission()
        permissionRequestedRef.current = true
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [isAuthenticated, isSupported, permission, requestPermission])

  // Check if notification type should trigger browser notification
  const shouldNotify = useCallback((type: string): boolean => {
    const prefs = preferencesRef.current
    if (!prefs || !prefs.inAppEnabled) return false

    switch (type) {
      case 'TICKET_CREATED':
        return prefs.notifyOnCreation
      case 'TICKET_ASSIGNED':
        return prefs.notifyOnAssignment
      case 'TICKET_STATUS_CHANGED':
        return prefs.notifyOnStatusChange
      case 'TICKET_COMMENT':
        return prefs.notifyOnComment
      case 'TICKET_RESOLVED':
        return prefs.notifyOnResolution
      case 'SLA_BREACH':
        return prefs.notifyOnSLABreach
      case 'ESCALATION':
        return prefs.notifyOnSLABreach // Use SLA breach setting for escalations
      default:
        return false
    }
  }, [])

  // Check if notification is high priority
  const isHighPriority = useCallback((type: string): boolean => {
    return type === 'SLA_BREACH' || type === 'ESCALATION'
  }, [])

  // Poll for new notifications
  useEffect(() => {
    if (!isAuthenticated || permission !== 'granted') return

    const checkForNewNotifications = async () => {
      try {
        const response = await fetch('/api/notifications?page=1&limit=1&unreadOnly=true')
        if (!response.ok) return

        const data = await response.json()
        const notifications: Notification[] = data.data

        if (notifications.length === 0) return

        const latestNotification = notifications[0]

        // Only show browser notification if it's a new notification
        if (lastNotificationIdRef.current !== latestNotification.id) {
          lastNotificationIdRef.current = latestNotification.id

          // Check if we should notify based on type and preferences
          if (shouldNotify(latestNotification.type)) {
            const notification = await showNotification({
              title: latestNotification.title,
              body: latestNotification.message,
              tag: latestNotification.ticketId || latestNotification.id,
              data: {
                ticketId: latestNotification.ticketId,
                notificationId: latestNotification.id,
              },
              requireInteraction: isHighPriority(latestNotification.type),
            })

            // Handle notification click
            if (notification) {
              notification.onclick = () => {
                window.focus()
                if (latestNotification.ticketId) {
                  window.location.href = `/dashboard/tickets/${latestNotification.ticketId}`
                } else {
                  window.location.href = '/dashboard/notifications'
                }
                notification.close()
              }
            }
          }
        }
      } catch (error) {
        console.error('Error checking for new notifications:', error)
      }
    }

    // Check immediately
    checkForNewNotifications()

    // Then check every 30 seconds
    const interval = setInterval(checkForNewNotifications, 30000)

    return () => clearInterval(interval)
  }, [isAuthenticated, permission, showNotification, shouldNotify, isHighPriority])

  // This component doesn't render anything
  return null
}
