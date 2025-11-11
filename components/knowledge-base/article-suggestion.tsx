"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Lightbulb, Eye, ThumbsUp, ExternalLink, Loader2 } from "lucide-react"

interface SuggestedArticle {
  id: string
  title: string
  summary: string | null
  content: string
  viewCount: number
  helpfulCount: number
  relevanceScore: number
  articleCategories: Array<{
    category: {
      id: string
      name: string
    }
  }>
}

interface ArticleSuggestionProps {
  ticketContent: string // Title + description of the ticket
  onArticleSelect?: (articleId: string) => void
  className?: string
}

export function ArticleSuggestion({
  ticketContent,
  onArticleSelect,
  className,
}: ArticleSuggestionProps) {
  const [suggestions, setSuggestions] = useState<SuggestedArticle[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedArticle, setSelectedArticle] = useState<SuggestedArticle | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    if (ticketContent && ticketContent.length > 10) {
      fetchSuggestions()
    } else {
      setSuggestions([])
    }
  }, [ticketContent])

  const fetchSuggestions = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/knowledge-base/suggest?content=${encodeURIComponent(ticketContent)}&limit=5`
      )
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.suggestions || [])
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleQuickView = (article: SuggestedArticle) => {
    setSelectedArticle(article)
    setShowPreview(true)
  }

  const handleViewFull = (articleId: string) => {
    if (onArticleSelect) {
      onArticleSelect(articleId)
    } else {
      window.open(`/dashboard/knowledge-base/${articleId}`, "_blank")
    }
  }

  const getRelevanceColor = (score: number) => {
    if (score >= 20) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    if (score >= 10) return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
  }

  if (!ticketContent || ticketContent.length <= 10) {
    return null
  }

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Suggested Articles
          </CardTitle>
          <CardDescription>
            These articles might help resolve this issue
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No relevant articles found</p>
              <p className="text-sm mt-1">Try adding more details to get better suggestions</p>
            </div>
          ) : (
            <div className="space-y-3">
              {suggestions.map((article) => (
                <div
                  key={article.id}
                  className="p-4 border rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-semibold line-clamp-2 flex-1">{article.title}</h4>
                    <Badge className={getRelevanceColor(article.relevanceScore)} variant="outline">
                      {article.relevanceScore >= 20
                        ? "High"
                        : article.relevanceScore >= 10
                        ? "Medium"
                        : "Low"}
                    </Badge>
                  </div>

                  {article.summary && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {article.summary}
                    </p>
                  )}

                  {/* Categories */}
                  {article.articleCategories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {article.articleCategories.map(({ category }) => (
                        <Badge key={category.id} variant="secondary" className="text-xs">
                          {category.name}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Metadata and Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {article.viewCount}
                      </div>
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3" />
                        {article.helpfulCount}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleQuickView(article)}
                      >
                        Quick View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewFull(article.id)}
                        className="gap-1"
                      >
                        View Full
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedArticle?.title}</DialogTitle>
            {selectedArticle?.summary && (
              <DialogDescription>{selectedArticle.summary}</DialogDescription>
            )}
          </DialogHeader>
          {selectedArticle && (
            <div className="space-y-4">
              {/* Categories */}
              {selectedArticle.articleCategories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedArticle.articleCategories.map(({ category }) => (
                    <Badge key={category.id} variant="outline">
                      {category.name}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Metadata */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {selectedArticle.viewCount} views
                </div>
                <div className="flex items-center gap-1">
                  <ThumbsUp className="h-4 w-4" />
                  {selectedArticle.helpfulCount} helpful
                </div>
              </div>

              {/* Content Preview */}
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div
                  dangerouslySetInnerHTML={{
                    __html: selectedArticle.content
                      .substring(0, 1000)
                      .replace(/\n/g, "<br />"),
                  }}
                />
                {selectedArticle.content.length > 1000 && (
                  <p className="text-muted-foreground italic">...</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowPreview(false)}>
                  Close
                </Button>
                <Button onClick={() => handleViewFull(selectedArticle.id)}>
                  View Full Article
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
