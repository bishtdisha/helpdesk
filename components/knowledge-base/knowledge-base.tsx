"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, BookOpen, Eye, Edit, Trash2, Star, ThumbsUp } from "lucide-react"

const mockArticles = [
  {
    id: "KB-001",
    title: "How to Reset Your Password",
    category: "Account Management",
    author: "Sarah Wilson",
    created: "2024-01-10",
    views: 1245,
    likes: 89,
    rating: 4.8,
    status: "Published",
    excerpt: "Step-by-step guide to reset your account password safely and securely.",
  },
  {
    id: "KB-002",
    title: "Understanding Billing Cycles",
    category: "Billing",
    author: "Mike Johnson",
    created: "2024-01-08",
    views: 892,
    likes: 67,
    rating: 4.6,
    status: "Published",
    excerpt: "Learn about our billing cycles, payment methods, and invoice generation.",
  },
  {
    id: "KB-003",
    title: "API Integration Guide",
    category: "Technical",
    author: "Lisa Chen",
    created: "2024-01-05",
    views: 2156,
    likes: 134,
    rating: 4.9,
    status: "Published",
    excerpt: "Complete guide to integrating with our API, including authentication and examples.",
  },
  {
    id: "KB-004",
    title: "Mobile App Setup",
    category: "Getting Started",
    author: "David Lee",
    created: "2024-01-03",
    views: 756,
    likes: 45,
    rating: 4.4,
    status: "Draft",
    excerpt: "How to download, install, and configure our mobile application.",
  },
]

const categories = [
  { name: "Getting Started", count: 12, color: "hsl(var(--chart-1))" },
  { name: "Account Management", count: 8, color: "hsl(var(--chart-2))" },
  { name: "Billing", count: 6, color: "hsl(var(--chart-3))" },
  { name: "Technical", count: 15, color: "hsl(var(--chart-4))" },
  { name: "Troubleshooting", count: 10, color: "hsl(var(--chart-5))" },
]

export function KnowledgeBase() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  const filteredArticles = mockArticles.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || article.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Article
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px]">
              <DialogHeader>
                <DialogTitle>Create New Article</DialogTitle>
                <DialogDescription>Add a new article to the knowledge base.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" placeholder="Article title" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="getting-started">Getting Started</SelectItem>
                        <SelectItem value="account">Account Management</SelectItem>
                        <SelectItem value="billing">Billing</SelectItem>
                        <SelectItem value="technical">Technical</SelectItem>
                        <SelectItem value="troubleshooting">Troubleshooting</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="review">Under Review</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="excerpt">Excerpt</Label>
                  <Textarea id="excerpt" placeholder="Brief description of the article" rows={2} />
                </div>
                <div>
                  <Label htmlFor="content">Content</Label>
                  <Textarea id="content" placeholder="Article content (Markdown supported)" rows={8} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline">Save as Draft</Button>
                <Button>Publish Article</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline">Import</Button>
          <Button variant="outline">Categories</Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Knowledge Base
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search articles, guides, and FAQs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Getting Started">Getting Started</SelectItem>
                    <SelectItem value="Account Management">Account Management</SelectItem>
                    <SelectItem value="Billing">Billing</SelectItem>
                    <SelectItem value="Technical">Technical</SelectItem>
                    <SelectItem value="Troubleshooting">Troubleshooting</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:w-80">
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
              <CardDescription>Browse by topic</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {categories.map((category, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedCategory(category.name)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                      selectedCategory === category.name ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                    }`}
                  >
                    <span className="font-medium">{category.name}</span>
                    <Badge variant="secondary">{category.count}</Badge>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredArticles.map((article) => (
          <Card key={article.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <Badge variant="outline">{article.category}</Badge>
                <Badge variant={article.status === "Published" ? "default" : "secondary"}>{article.status}</Badge>
              </div>
              <CardTitle className="text-lg leading-tight">{article.title}</CardTitle>
              <CardDescription>{article.excerpt}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {article.views}
                  </div>
                  <div className="flex items-center gap-1">
                    <ThumbsUp className="h-4 w-4" />
                    {article.likes}
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-current text-yellow-500" />
                    {article.rating}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  By {article.author} • {article.created}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Popular Articles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Most Popular Articles
          </CardTitle>
          <CardDescription>Top performing articles this month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockArticles
              .sort((a, b) => b.views - a.views)
              .slice(0, 5)
              .map((article, index) => (
                <div key={article.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{article.title}</p>
                      <p className="text-sm text-muted-foreground">{article.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{article.views} views</p>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Star className="h-3 w-3 fill-current text-yellow-500" />
                      {article.rating}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
