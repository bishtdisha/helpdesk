"use client"

import { useEffect, useState } from "react"
import { Bell, Check, CheckCheck, Clock, Ticket, MessageSquare, AlertCircle, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

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

interface NotificationCenterProps {
  className?: string
}

export function NotificationCenter({ className }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  useEffect(() => {
    loadNotifications()
  }, [page, filter])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const unreadParam = filter === 'unread' ? '&unreadOnly=true' : ''
      const response = await fetch(`/api/notifications?page=${page}&limit=20${unreadParam}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications')
      }

      const data = await response.json()
      setNotifications(data.data)
      setHasMore(data.pagination.hasNext)
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
      })

      if (!response.ok) {
        throw new Error('Failed to mark notification as read')
      }

      // Update local state
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      )
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PUT',
      })

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read')
      }

      // Update local state
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true }))
      )
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'TICKET_CREATED':
        return <Ticket className="h-4 w-4" />
      case 'TICKET_ASSIGNED':
        return <Ticket className="h-4 w-4" />
      case 'TICKET_STATUS_CHANGED':
        return <TrendingUp className="h-4 w-4" />
      case 'TICKET_COMMENT':
        return <MessageSquare className="h-4 w-4" />
      case 'TICKET_RESOLVED':
        return <Check className="h-4 w-4" />
      case 'SLA_BREACH':
        return <AlertCircle className="h-4 w-4" />
      case 'ESCALATION':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'TICKET_CREATED':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      case 'TICKET_ASSIGNED':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
      case 'TICKET_STATUS_CHANGED':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'TICKET_COMMENT':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'TICKET_RESOLVED':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
      case 'SLA_BREACH':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      case 'ESCALATION':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const groupNotificationsByDate = (notifications: Notification[]) => {
    const groups: { [key: string]: Notification[] } = {}
    const now = new Date()
    
    notifications.forEach(notification => {
      const notifDate = new Date(notification.createdAt)
      const diffInHours = (now.getTime() - notifDate.getTime()) / (1000 * 60 * 60)
      
      let groupKey: string
      if (diffInHours < 24) {
        groupKey = 'Today'
      } else if (diffInHours < 48) {
        groupKey = 'Yesterday'
      } else if (diffInHours < 168) {
        groupKey = 'This Week'
      } else {
        groupKey = 'Older'
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(notification)
    })
    
    return groups
  }

  const unreadCount = notifications.filter(n => !n.isRead).length
  const groupedNotifications = groupNotificationsByDate(notifications)

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Stay updated with your ticket activities
            </CardDescription>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-sm"
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark all as read
            </Button>
          )}
        </div>
        
        <div className="flex gap-2 mt-4">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setFilter('all')
              setPage(1)
            }}
          >
            All
          </Button>
          <Button
            variant={filter === 'unread' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setFilter('unread')
              setPage(1)
            }}
          >
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-3 p-3 rounded-lg border animate-pulse">
                <div className="h-10 w-10 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-3 bg-muted rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedNotifications).map(([group, groupNotifications]) => (
              <div key={group}>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                  {group}
                </h3>
                <div className="space-y-2">
                  {groupNotifications.map(notification => (
                    <div
                      key={notification.id}
                      className={`flex gap-3 p-3 rounded-lg border transition-colors ${
                        !notification.isRead
                          ? 'bg-accent/50 border-accent'
                          : 'hover:bg-accent/30'
                      }`}
                    >
                      <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${getNotificationColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {notification.title}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                              </span>
                              {notification.ticketId && (
                                <Link
                                  href={`/dashboard/tickets/${notification.ticketId}`}
                                  className="text-xs text-primary hover:underline"
                                  onClick={() => !notification.isRead && markAsRead(notification.id)}
                                >
                                  View Ticket
                                </Link>
                              )}
                            </div>
                          </div>
                          
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="flex-shrink-0"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {hasMore && !loading && (
          <div className="mt-6 text-center">
            <Button
              variant="outline"
              onClick={() => setPage(prev => prev + 1)}
            >
              Load More
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
