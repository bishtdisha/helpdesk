"use client"

import { useEffect, useState, useCallback } from 'react'

export interface BrowserNotificationOptions {
  title: string
  body: string
  icon?: string
  tag?: string
  data?: any
  requireInteraction?: boolean
}

export function useBrowserNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    // Check if browser supports notifications
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setIsSupported(true)
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      console.warn('Browser notifications are not supported')
      return 'denied'
    }

    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      return result
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return 'denied'
    }
  }, [isSupported])

  const showNotification = useCallback(
    async (options: BrowserNotificationOptions): Promise<Notification | null> => {
      if (!isSupported) {
        console.warn('Browser notifications are not supported')
        return null
      }

      // Request permission if not already granted
      if (permission === 'default') {
        const result = await requestPermission()
        if (result !== 'granted') {
          return null
        }
      }

      if (permission === 'denied') {
        console.warn('Notification permission denied')
        return null
      }

      try {
        const notification = new Notification(options.title, {
          body: options.body,
          icon: options.icon || '/placeholder-logo.png',
          tag: options.tag,
          data: options.data,
          requireInteraction: options.requireInteraction || false,
          badge: '/placeholder-logo.png',
        })

        return notification
      } catch (error) {
        console.error('Error showing notification:', error)
        return null
      }
    },
    [isSupported, permission, requestPermission]
  )

  return {
    isSupported,
    permission,
    requestPermission,
    showNotification,
    isGranted: permission === 'granted',
    isDenied: permission === 'denied',
  }
}
