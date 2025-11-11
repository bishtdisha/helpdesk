"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Eye, ThumbsUp, BookOpen, Loader2 } from "lucide-react"
import { KnowledgeAccessLevel } from "@prisma/client"

interface Category {
  id: string
  name: string
  description: string | null
}

interface Article {
  id: string
  title: string
  summary: string | null
  accessLevel: KnowledgeAccessLevel
  isPublished: boolean
  viewCount: number
  helpfulCount: number
  createdAt: string
  updatedAt: string
  articleCategories: Array<{
    category: Category
  }>
}

interface KBArticleListProps {
  userRole?: string
}

export function KBArticleList({ userRole }: KBArticleListProps) {
  const router = useRouter()
  const [articles, setArticles] = useState<Article[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [accessLevelFilter, setAccessLevelFilter] = useState<string>("all")

  // Check if user can create articles (Admin or Team Leader)
  const canCreateArticle = userRole === "Admin/Manager" || userRole === "Team Leader"

  useEffect(() => {
    fetchArticles()
    fetchCategories()
  }, [selectedCategory, accessLevelFilter])

  const fetchArticles = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (selectedCategory !== "all") {
        params.append("categoryId", selectedCategory)
      }
      
      if (accessLevelFilter !== "all") {
        params.append("accessLevel", accessLevelFilter)
      }

      const response = await fetch(`/api/knowledge-base/articles?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setArticles(data.articles || [])
      }
    } catch (error) {
      console.error("Error fetching articles:", error)
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

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchArticles()
      return
    }

    try {
      setLoading(true)
      const params = new URLSearchParams({ q: searchTerm })
      
      if (selectedCategory !== "all") {
        params.append("categoryId", selectedCategory)
      }
      
      if (accessLevelFilter !== "all") {
        params.append("accessLevel", accessLevelFilter)
      }

      const response = await fetch(`/api/knowledge-base/search?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setArticles(data.articles || [])
      }
    } catch (error) {
      console.error("Error searching articles:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleArticleClick = (articleId: string) => {
    router.push(`/dashboard/knowledge-base/${articleId}`)
  }

  const handleCreateArticle = () => {
    router.push("/dashboard/knowledge-base/new")
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

  const filteredArticles = articles.filter((article) => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    return (
      article.title.toLowerCase().includes(searchLower) ||
      article.summary?.toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold">Knowledge Base</h1>
          <p className="text-muted-foreground mt-1">Browse articles and documentation</p>
        </div>
        {canCreateArticle && (
          <Button onClick={handleCreateArticle} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Article
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Knowledge Base
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={accessLevelFilter} onValueChange={setAccessLevelFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Access Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="PUBLIC">Public</SelectItem>
                <SelectItem value="INTERNAL">Internal</SelectItem>
                <SelectItem value="RESTRICTED">Restricted</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch}>Search</Button>
          </div>
        </CardContent>
      </Card>

      {/* Category Navigation */}
      {categories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
            <CardDescription>Browse by topic</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory("all")}
              >
                All Articles
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Articles Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredArticles.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No articles found</h3>
              <p className="text-muted-foreground">
                {searchTerm
                  ? "Try adjusting your search terms or filters"
                  : "No articles available yet"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article) => (
            <Card
              key={article.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleArticleClick(article.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Badge className={getAccessLevelColor(article.accessLevel)}>
                    {article.accessLevel}
                  </Badge>
                  {!article.isPublished && (
                    <Badge variant="secondary">Draft</Badge>
                  )}
                </div>
                <CardTitle className="text-lg leading-tight line-clamp-2">
                  {article.title}
                </CardTitle>
                {article.summary && (
                  <CardDescription className="line-clamp-3">
                    {article.summary}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Categories */}
                  {article.articleCategories.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {article.articleCategories.map(({ category }) => (
                        <Badge key={category.id} variant="outline" className="text-xs">
                          {category.name}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {article.viewCount}
                    </div>
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="h-4 w-4" />
                      {article.helpfulCount}
                    </div>
                  </div>

                  {/* Date */}
                  <div className="text-xs text-muted-foreground">
                    Updated {new Date(article.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
