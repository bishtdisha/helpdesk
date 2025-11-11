"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Save, Loader2, X } from "lucide-react"
import { KnowledgeAccessLevel } from "@prisma/client"

interface Category {
  id: string
  name: string
  description: string | null
}

interface Team {
  id: string
  name: string
}

interface Article {
  id: string
  title: string
  content: string
  summary: string | null
  accessLevel: KnowledgeAccessLevel
  isPublished: boolean
  teamId: string | null
  articleCategories: Array<{
    category: Category
  }>
}

interface KBArticleEditorProps {
  articleId?: string // If provided, edit mode; otherwise, create mode
  userRole?: string
}

export function KBArticleEditor({ articleId, userRole }: KBArticleEditorProps) {
  const router = useRouter()
  const isEditMode = !!articleId
  const [loading, setLoading] = useState(isEditMode)
  const [saving, setSaving] = useState(false)

  // Form state
  const [title, setTitle] = useState("")
  const [summary, setSummary] = useState("")
  const [content, setContent] = useState("")
  const [accessLevel, setAccessLevel] = useState<KnowledgeAccessLevel>("PUBLIC")
  const [isPublished, setIsPublished] = useState(false)
  const [teamId, setTeamId] = useState<string>("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  // Reference data
  const [categories, setCategories] = useState<Category[]>([])
  const [teams, setTeams] = useState<Team[]>([])

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Check if user can publish (Admin only)
  const canPublish = userRole === "Admin/Manager"

  useEffect(() => {
    fetchCategories()
    fetchTeams()
    if (isEditMode) {
      fetchArticle()
    }
  }, [articleId])

  const fetchArticle = async () => {
    if (!articleId) return

    try {
      setLoading(true)
      const response = await fetch(`/api/knowledge-base/articles/${articleId}`)
      if (response.ok) {
        const data = await response.json()
        const article: Article = data.article
        setTitle(article.title)
        setSummary(article.summary || "")
        setContent(article.content)
        setAccessLevel(article.accessLevel)
        setIsPublished(article.isPublished)
        setTeamId(article.teamId || "")
        setSelectedCategories(article.articleCategories.map((ac) => ac.category.id))
      }
    } catch (error) {
      console.error("Error fetching article:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/knowledge-base/categories")
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const fetchTeams = async () => {
    try {
      const response = await fetch("/api/teams")
      if (response.ok) {
        const data = await response.json()
        setTeams(data.teams || [])
      }
    } catch (error) {
      console.error("Error fetching teams:", error)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!title.trim()) {
      newErrors.title = "Title is required"
    }

    if (!content.trim()) {
      newErrors.content = "Content is required"
    }

    if (accessLevel === "RESTRICTED" && !teamId) {
      newErrors.teamId = "Team is required for restricted articles"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async (publish: boolean = false) => {
    if (!validateForm()) return

    try {
      setSaving(true)

      const payload = {
        title,
        summary: summary || undefined,
        content,
        accessLevel,
        isPublished: canPublish ? publish : isPublished,
        teamId: accessLevel === "RESTRICTED" ? teamId : undefined,
        categoryIds: selectedCategories,
      }

      const url = isEditMode
        ? `/api/knowledge-base/articles/${articleId}`
        : "/api/knowledge-base/articles"

      const method = isEditMode ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/dashboard/knowledge-base/${data.article.id}`)
      } else {
        const error = await response.json()
        alert(error.error || "Failed to save article")
      }
    } catch (error) {
      console.error("Error saving article:", error)
      alert("Failed to save article")
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (isEditMode) {
      router.push(`/dashboard/knowledge-base/${articleId}`)
    } else {
      router.push("/dashboard/knowledge-base")
    }
  }

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleCancel} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {isEditMode ? "Edit Article" : "Create New Article"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isEditMode ? "Update article details" : "Add a new article to the knowledge base"}
            </p>
          </div>
        </div>
      </div>

      {/* Editor Form */}
      <Card>
        <CardHeader>
          <CardTitle>Article Details</CardTitle>
          <CardDescription>
            Fill in the information below to {isEditMode ? "update" : "create"} the article
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Enter article title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={errors.title ? "border-destructive" : ""}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title}</p>
            )}
          </div>

          {/* Summary */}
          <div className="space-y-2">
            <Label htmlFor="summary">Summary</Label>
            <Textarea
              id="summary"
              placeholder="Brief description of the article (optional)"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">
              Content <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="content"
              placeholder="Enter article content (supports basic formatting)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={15}
              className={errors.content ? "border-destructive" : ""}
            />
            {errors.content && (
              <p className="text-sm text-destructive">{errors.content}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Tip: Use line breaks to format your content
            </p>
          </div>

          {/* Access Level */}
          <div className="space-y-2">
            <Label htmlFor="accessLevel">
              Access Level <span className="text-destructive">*</span>
            </Label>
            <Select value={accessLevel} onValueChange={(value) => setAccessLevel(value as KnowledgeAccessLevel)}>
              <SelectTrigger id="accessLevel">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PUBLIC">Public - Visible to everyone</SelectItem>
                <SelectItem value="INTERNAL">Internal - Visible to all authenticated users</SelectItem>
                <SelectItem value="RESTRICTED">Restricted - Visible to specific team only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Team Selection (for RESTRICTED articles) */}
          {accessLevel === "RESTRICTED" && (
            <div className="space-y-2">
              <Label htmlFor="team">
                Team <span className="text-destructive">*</span>
              </Label>
              <Select value={teamId} onValueChange={setTeamId}>
                <SelectTrigger id="team" className={errors.teamId ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.teamId && (
                <p className="text-sm text-destructive">{errors.teamId}</p>
              )}
            </div>
          )}

          {/* Categories */}
          <div className="space-y-2">
            <Label>Categories</Label>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Badge
                  key={category.id}
                  variant={selectedCategories.includes(category.id) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleCategory(category.id)}
                >
                  {category.name}
                  {selectedCategories.includes(category.id) && (
                    <X className="h-3 w-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
            {categories.length === 0 && (
              <p className="text-sm text-muted-foreground">No categories available</p>
            )}
          </div>

          {/* Publish Toggle (Admin only) */}
          {canPublish && (
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="published">Published</Label>
                <p className="text-sm text-muted-foreground">
                  Make this article visible to users
                </p>
              </div>
              <Switch
                id="published"
                checked={isPublished}
                onCheckedChange={setIsPublished}
              />
            </div>
          )}

          {!canPublish && (
            <div className="p-4 border rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">
                Note: Only administrators can publish articles. Your article will be saved as a draft.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={handleCancel} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={() => handleSave(false)} disabled={saving} variant="outline">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save as Draft
            </>
          )}
        </Button>
        {canPublish && (
          <Button onClick={() => handleSave(true)} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isPublished ? "Save & Keep Published" : "Save & Publish"}
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
