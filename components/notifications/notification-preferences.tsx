"use client"

import { useEffect, useState } from "react"
import { Bell, Mail, Smartphone, Save, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"

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

interface NotificationPreferencesProps {
  className?: string
}

export function NotificationPreferences({ className }: NotificationPreferencesProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    loadPreferences()
  }, [])

  const loadPreferences = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/notifications/preferences')
      
      if (!response.ok) {
        throw new Error('Failed to fetch preferences')
      }

      const data = await response.json()
      setPreferences(data)
    } catch (error) {
      console.error('Error loading preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  const savePreferences = async () => {
    if (!preferences) return

    try {
      setSaving(true)
      setSaveSuccess(false)
      
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      })

      if (!response.ok) {
        throw new Error('Failed to save preferences')
      }

      const data = await response.json()
      setPreferences(data)
      setSaveSuccess(true)
      
      // Hide success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      console.error('Error saving preferences:', error)
    } finally {
      setSaving(false)
    }
  }

  const updatePreference = (key: keyof NotificationPreferences, value: boolean) => {
    if (!preferences) return
    setPreferences({ ...preferences, [key]: value })
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>Loading your preferences...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border animate-pulse">
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </div>
                <div className="h-6 w-11 bg-muted rounded-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!preferences) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>Failed to load preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={loadPreferences}>Retry</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Manage how you receive notifications about ticket activities
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Notification Channels */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold mb-3">Notification Channels</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Choose how you want to receive notifications
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
              <div className="flex items-start gap-3 flex-1">
                <div className="mt-1">
                  <Smartphone className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="inAppEnabled" className="text-base font-medium cursor-pointer">
                    In-App Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications within the application
                  </p>
                </div>
              </div>
              <Switch
                id="inAppEnabled"
                checked={preferences.inAppEnabled}
                onCheckedChange={(checked) => updatePreference('inAppEnabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
              <div className="flex items-start gap-3 flex-1">
                <div className="mt-1">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="emailEnabled" className="text-base font-medium cursor-pointer">
                    Email Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
              </div>
              <Switch
                id="emailEnabled"
                checked={preferences.emailEnabled}
                onCheckedChange={(checked) => updatePreference('emailEnabled', checked)}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Event-Specific Settings */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold mb-3">Event Notifications</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Choose which events trigger notifications
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors">
              <div className="space-y-1">
                <Label htmlFor="notifyOnCreation" className="text-sm font-medium cursor-pointer">
                  Ticket Created
                </Label>
                <p className="text-xs text-muted-foreground">
                  When a new ticket is created
                </p>
              </div>
              <Switch
                id="notifyOnCreation"
                checked={preferences.notifyOnCreation}
                onCheckedChange={(checked) => updatePreference('notifyOnCreation', checked)}
                disabled={!preferences.inAppEnabled && !preferences.emailEnabled}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors">
              <div className="space-y-1">
                <Label htmlFor="notifyOnAssignment" className="text-sm font-medium cursor-pointer">
                  Ticket Assigned
                </Label>
                <p className="text-xs text-muted-foreground">
                  When a ticket is assigned to someone
                </p>
              </div>
              <Switch
                id="notifyOnAssignment"
                checked={preferences.notifyOnAssignment}
                onCheckedChange={(checked) => updatePreference('notifyOnAssignment', checked)}
                disabled={!preferences.inAppEnabled && !preferences.emailEnabled}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors">
              <div className="space-y-1">
                <Label htmlFor="notifyOnStatusChange" className="text-sm font-medium cursor-pointer">
                  Status Changed
                </Label>
                <p className="text-xs text-muted-foreground">
                  When a ticket status is updated
                </p>
              </div>
              <Switch
                id="notifyOnStatusChange"
                checked={preferences.notifyOnStatusChange}
                onCheckedChange={(checked) => updatePreference('notifyOnStatusChange', checked)}
                disabled={!preferences.inAppEnabled && !preferences.emailEnabled}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors">
              <div className="space-y-1">
                <Label htmlFor="notifyOnComment" className="text-sm font-medium cursor-pointer">
                  New Comment
                </Label>
                <p className="text-xs text-muted-foreground">
                  When someone comments on a ticket
                </p>
              </div>
              <Switch
                id="notifyOnComment"
                checked={preferences.notifyOnComment}
                onCheckedChange={(checked) => updatePreference('notifyOnComment', checked)}
                disabled={!preferences.inAppEnabled && !preferences.emailEnabled}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors">
              <div className="space-y-1">
                <Label htmlFor="notifyOnResolution" className="text-sm font-medium cursor-pointer">
                  Ticket Resolved
                </Label>
                <p className="text-xs text-muted-foreground">
                  When a ticket is marked as resolved
                </p>
              </div>
              <Switch
                id="notifyOnResolution"
                checked={preferences.notifyOnResolution}
                onCheckedChange={(checked) => updatePreference('notifyOnResolution', checked)}
                disabled={!preferences.inAppEnabled && !preferences.emailEnabled}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors">
              <div className="space-y-1">
                <Label htmlFor="notifyOnSLABreach" className="text-sm font-medium cursor-pointer">
                  SLA Breach Alert
                </Label>
                <p className="text-xs text-muted-foreground">
                  When a ticket breaches its SLA
                </p>
              </div>
              <Switch
                id="notifyOnSLABreach"
                checked={preferences.notifyOnSLABreach}
                onCheckedChange={(checked) => updatePreference('notifyOnSLABreach', checked)}
                disabled={!preferences.inAppEnabled && !preferences.emailEnabled}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Save Button */}
        <div className="flex items-center justify-between">
          {saveSuccess && (
            <p className="text-sm text-green-600 dark:text-green-400">
              Preferences saved successfully!
            </p>
          )}
          <div className="ml-auto">
            <Button onClick={savePreferences} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Preferences
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
