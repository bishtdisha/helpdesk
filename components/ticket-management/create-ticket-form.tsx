"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert } from "@/components/ui/alert"
import { TicketPriority } from "@prisma/client"
import { CreateTicketData } from "@/lib/types/ticket"
import { Loader2, Upload, X, Lightbulb } from "lucide-react"

interface Customer {
  id: string
  name: string
  email: string
}

interface User {
  id: string
  name: string
  email: string
}

interface KBArticle {
  id: string
  title: string
  summary?: string
}

interface CreateTicketFormProps {
  onSuccess?: (ticketId: string) => void
  onCancel?: () => void
}

export function CreateTicketForm({ onSuccess, onCancel }: CreateTicketFormProps) {
  const [formData, setFormData] = useState<Partial<CreateTicketData>>({
    title: "",
    description: "",
    priority: TicketPriority.MEDIUM,
    category: "",
    customerId: "",
    assignedTo: "",
    followerIds: [],
  })
  
  const [customers, setCustomers] = useState<Customer[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [suggestedArticles, setSuggestedArticles] = useState<KBArticle[]>([])
  const [loadingCustomers, setLoadingCustomers] = useState(true)
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attachments, setAttachments] = useState<File[]>([])

  // Fetch customers and users
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch('/api/customers')
        if (response.ok) {
          const data = await response.json()
          setCustomers(data)
        }
      } catch (error) {
        console.error('Error fetching customers:', error)
      } finally {
        setLoadingCustomers(false)
      }
    }

    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users')
        if (response.ok) {
          const data = await response.json()
          setUsers(data)
        }
      } catch (error) {
        console.error('Error fetching users:', error)
      } finally {
        setLoadingUsers(false)
      }
    }

    fetchCustomers()
    fetchUsers()
  }, [])

  // Fetch KB article suggestions when title or description changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!formData.title && !formData.description) {
        setSuggestedArticles([])
        return
      }

      const content = `${formData.title || ''} ${formData.description || ''}`.trim()
      if (content.length < 10) return

      try {
        setLoadingSuggestions(true)
        const response = await fetch('/api/knowledge-base/suggest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        })

        if (response.ok) {
          const data = await response.json()
          setSuggestedArticles(data.articles || [])
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error)
      } finally {
        setLoadingSuggestions(false)
      }
    }

    const debounceTimer = setTimeout(fetchSuggestions, 500)
    return () => clearTimeout(debounceTimer)
  }, [formData.title, formData.description])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setAttachments(prev => [...prev, ...newFiles])
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!formData.title?.trim()) {
      setError('Title is required')
      return
    }

    if (!formData.description?.trim()) {
      setError('Description is required')
      return
    }



    if (!formData.priority) {
      setError('Please select a priority')
      return
    }

    if (!formData.assignedTo) {
      setError('Please select an assignee')
      return
    }

    try {
      setSubmitting(true)

      // Create ticket
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim(),
          priority: formData.priority,
          category: formData.category?.trim() || undefined,
          customerId: formData.customerId,
          assignedTo: formData.assignedTo,
          followerIds: formData.followerIds || [],
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create ticket')
      }

      const result = await response.json()
      const ticketId = result.ticket.id

      // Upload attachments if any
      if (attachments.length > 0) {
        const formData = new FormData()
        attachments.forEach(file => {
          formData.append('files', file)
        })

        await fetch(`/api/tickets/${ticketId}/attachments`, {
          method: 'POST',
          body: formData,
        })
      }

      onSuccess?.(ticketId)
    } catch (error) {
      console.error('Error creating ticket:', error)
      setError(error instanceof Error ? error.message : 'Failed to create ticket')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          {error}
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ticket Details</CardTitle>
              <CardDescription>Provide information about the support request</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Brief description of the issue"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  maxLength={200}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {formData.title?.length || 0}/200 characters
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Detailed description of the issue"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={6}
                  required
                />
              </div>

              {/* Customer */}
              <div className="space-y-2">
                <Label htmlFor="customer">Customer</Label>
                <Select
                  value={formData.customerId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, customerId: value }))}
                  disabled={loadingCustomers}
                >
                  <SelectTrigger id="customer">
                    <SelectValue placeholder={loadingCustomers ? "Loading customers..." : "Select a customer"} />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name} ({customer.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Assignee */}
              <div className="space-y-2">
                <Label htmlFor="assignee">Assignee *</Label>
                <Select
                  value={formData.assignedTo}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, assignedTo: value }))}
                  disabled={loadingUsers}
                  required
                >
                  <SelectTrigger id="assignee">
                    <SelectValue placeholder={loadingUsers ? "Loading users..." : "Select an assignee"} />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Followers */}
              <div className="space-y-2">
                <Label>Followers (Optional)</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Followers can view and comment on the ticket
                </p>
                {loadingUsers ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                    {users.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-2">No users available</p>
                    ) : (
                      users.map((user) => (
                        <label
                          key={user.id}
                          className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={formData.followerIds?.includes(user.id) || false}
                            onChange={(e) => {
                              const isChecked = e.target.checked
                              setFormData(prev => ({
                                ...prev,
                                followerIds: isChecked
                                  ? [...(prev.followerIds || []), user.id]
                                  : (prev.followerIds || []).filter(id => id !== user.id)
                              }))
                            }}
                            className="h-4 w-4"
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium">{user.name}</div>
                            <div className="text-xs text-muted-foreground">{user.email}</div>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                )}
                {formData.followerIds && formData.followerIds.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.followerIds.length} follower(s) selected
                  </p>
                )}
              </div>

              {/* Priority and Category */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority *</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as TicketPriority }))}
                  >
                    <SelectTrigger id="priority">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={TicketPriority.LOW}>Low</SelectItem>
                      <SelectItem value={TicketPriority.MEDIUM}>Medium</SelectItem>
                      <SelectItem value={TicketPriority.HIGH}>High</SelectItem>
                      <SelectItem value={TicketPriority.URGENT}>Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    placeholder="e.g., Technical, Billing"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    maxLength={100}
                  />
                </div>
              </div>

              {/* File Attachments */}
              <div className="space-y-2">
                <Label htmlFor="attachments">Attachments</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="attachments"
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('attachments')?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Files
                  </Button>
                </div>
                {attachments.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-muted rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({(file.size / 1024).toFixed(2)} KB)
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAttachment(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - KB Suggestions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Lightbulb className="h-4 w-4" />
                Suggested Articles
              </CardTitle>
              <CardDescription className="text-xs">
                These articles might help resolve the issue
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSuggestions ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : suggestedArticles.length > 0 ? (
                <div className="space-y-3">
                  {suggestedArticles.map((article) => (
                    <div
                      key={article.id}
                      className="p-3 bg-muted rounded-lg hover:bg-muted/80 cursor-pointer transition-colors"
                      onClick={() => window.open(`/knowledge-base/${article.id}`, '_blank')}
                    >
                      <div className="font-medium text-sm">{article.title}</div>
                      {article.summary && (
                        <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {article.summary}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">
                  {formData.title || formData.description
                    ? 'No relevant articles found'
                    : 'Start typing to see suggestions'}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <p>• Provide a clear and concise title</p>
              <p>• Include all relevant details in the description</p>
              <p>• Attach screenshots or files if applicable</p>
              <p>• Check suggested articles before submitting</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Ticket'
          )}
        </Button>
      </div>
    </form>
  )
}
