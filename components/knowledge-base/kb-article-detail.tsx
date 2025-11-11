"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Eye,
  ThumbsUp,
  Edit,
  Trash2,
  Loader2,
  BookOpen,
  Calendar,
  User,
} from "lucide-react"
import { KnowledgeAccessLevel } from "@prisma/client"

interface Category {
  id: string
  name: string
  description: string | null
}

interface Article {
  id: string
  title: string
  content: string
  summary: string | null
  accessLevel: KnowledgeAccessLevel
  isPublished: boolean
  authorId: string | null
  viewCount: number
  helpfulCount: number
  createdAt: string
  updatedAt: string
  articleCategories: Array<{
    category: Category
  }>
}

interface RelatedArticle {
  id: string
  title: string
  summary: string | null
  viewCount: number
  helpfulCount: number
}

interface KBArticleDetailProps {
  articleId: string
  userRole?: string
  userId?: string
}

export function KBArticleDetail({ articleId, userRole, userId }: KBArticleDetailProps) {
  const router = useRouter()
  const [article, setArticle] = useState<Article | null>(null)
  const [relatedArticles, setRelatedArticles] = useState<RelatedArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [hasVoted, setHasVoted] = useState(false)

  // Check if user can edit/delete (Admin, Team Leader, or author)
  const canEdit =
    userRole === "Admin/Manager" ||
    userRole === "Team Leader" ||
    (article?.authorId === userId)
  const canDelete = userRole === "Admin/Manager"

  useEffect(() => {
    fetchArticle()
  }, [articleId])

  const fetchArticle = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/knowledge-base/articles/${articleId}`)
      if (response.ok) {
        const data = await response.json()
        setArticle(data.article)
        
        // Record view
        await recordView()
        
        // Fetch related articles
        fetchRelatedArticles(data.article)
      } else if (response.status === 403) {
        router.push("/dashboard/knowledge-base")
      }
    } catch (error) {
      console.error("Error fetching article:", error)
    } finally {
      setLoading(false)
    }
  }

  const recordView = async () => {
    try {
      await fetch(`/api/knowledge-base/articles/${articleId}/view`, {
        method: "POST",
      })
    } catch (error) {
      console.error("Error recording view:", error)
    }
  }

  const fetchRelatedArticles = async (currentArticle: Article) => {
    try {
      // Use article content to find related articles
      const response = await fetch(
        `/api/knowledge-base/suggest?content=${encodeURIComponent(
          currentArticle.title + " " + (currentArticle.summary || "")
        )}&limit=3`
      )
      if (response.ok) {
        const data = await response.json()
        // Filter out current article
        const related = data.suggestions.filter((a: RelatedArticle) => a.id !== articleId)
        setRelatedArticles(related)
      }
    } catch (error) {
      console.error("Error fetching related articles:", error)
    }
  }

  const handleHelpful = async () => {
    if (hasVoted) return

    try {
      const response = await fetch(`/api/knowledge-base/articles/${articleId}/helpful`, {
        method: "POST",
      })
      if (response.ok) {
        setHasVoted(true)
        // Update local count
        if (article) {
          setArticle({
            ...article,
            helpfulCount: article.helpfulCount + 1,
          })
        }
      }
    } catch (error) {
      console.error("Error recording helpful vote:", error)
    }
  }

  const handleEdit = () => {
    router.push(`/dashboard/knowledge-base/${articleId}/edit`)
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this article?")) return

    try {
      const response = await fetch(`/api/knowledge-base/articles/${articleId}`, {
        method: "DELETE",
      })
      if (response.ok) {
        router.push("/dashboard/knowledge-base")
      }
    } catch (error) {
      console.error("Error deleting article:", error)
    }
  }

  const handleBack = () => {
    router.push("/dashboard/knowledge-base")
  }

  const handleRelatedArticleClick = (id: string) => {
    router.push(`/dashboard/knowledge-base/${id}`)
  }

  const getAccessLevelColor = (level: KnowledgeAccessLevel) => {
    switch (level) {
      case "PUBLIC":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "INTERNAL":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "RESTRICTED":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!article) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Article not found</h3>
            <p className="text-muted-foreground mb-4">
              The article you're looking for doesn't exist or you don't have access to it.
            </p>
            <Button onClick={handleBack}>Back to Knowledge Base</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={handleBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex gap-2">
          {canEdit && (
            <Button variant="outline" onClick={handleEdit} className="gap-2">
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          )}
          {canDelete && (
            <Button variant="outline" onClick={handleDelete} className="gap-2 text-destructive">
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Article Content */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge className={getAccessLevelColor(article.accessLevel)}>
              {article.accessLevel}
            </Badge>
            {!article.isPublished && <Badge variant="secondary">Draft</Badge>}
            {article.articleCategories.map(({ category }) => (
              <Badge key={category.id} variant="outline">
                {category.name}
              </Badge>
            ))}
          </div>
          <CardTitle className="text-3xl">{article.title}</CardTitle>
          {article.summary && (
            <CardDescription className="text-base mt-2">{article.summary}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground mb-6">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span>{article.viewCount} views</span>
            </div>
            <div className="flex items-center gap-2">
              <ThumbsUp className="h-4 w-4" />
              <span>{article.helpfulCount} helpful</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Updated {new Date(article.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Article Content */}
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <div
              dangerouslySetInnerHTML={{
                __html: article.content.replace(/\n/g, "<br />"),
              }}
            />
          </div>

          <Separator className="my-6" />

          {/* Helpful Feedback */}
          <div className="flex items-center justify-center py-6">
            <div className="text-center space-y-4">
              <p className="text-lg font-medium">Was this article helpful?</p>
              <Button
                onClick={handleHelpful}
                disabled={hasVoted}
                className="gap-2"
                variant={hasVoted ? "secondary" : "default"}
              >
                <ThumbsUp className="h-4 w-4" />
                {hasVoted ? "Thanks for your feedback!" : "Yes, this was helpful"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Related Articles</CardTitle>
            <CardDescription>You might also find these helpful</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {relatedArticles.map((related) => (
                <div
                  key={related.id}
                  className="p-4 border rounded-lg hover:bg-muted cursor-pointer transition-colors"
                  onClick={() => handleRelatedArticleClick(related.id)}
                >
                  <h4 className="font-semibold mb-2">{related.title}</h4>
                  {related.summary && (
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {related.summary}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {related.viewCount}
                    </div>
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3" />
                      {related.helpfulCount}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
