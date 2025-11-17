"use client"

/**
 * KBArticleList Component
 * 
 * Displays a list of knowledge base articles with:
 * - Role-based filtering
 * - Category navigation
 * - Article metadata display
 * - Pagination support
 */

import { useState } from 'react';
import { useKBArticles } from '@/lib/hooks/use-kb-articles';
import { useKBCategories } from '@/lib/hooks/use-kb-categories';
import { KBFilters } from '@/lib/types/knowledge-base';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  BookOpen, 
  Eye, 
  ThumbsUp, 
  AlertCircle,
  Filter,
  X
} from 'lucide-react';
import Link from 'next/link';

interface KBArticleListProps {
  onArticleClick?: (articleId: string) => void;
  showCategoryFilter?: boolean;
  showAccessLevelFilter?: boolean;
  defaultFilters?: Partial<KBFilters>;
}

export function KBArticleList({
  onArticleClick,
  showCategoryFilter = true,
  showAccessLevelFilter = false,
  defaultFilters = {},
}: KBArticleListProps) {
  const [filters, setFilters] = useState<KBFilters>({
    isPublished: true,
    ...defaultFilters,
  });

  // Fetch articles with filters
  const { articles, isLoading, isError, error } = useKBArticles(filters);

  // Fetch categories for filter
  const { categories } = useKBCategories({
    enabled: showCategoryFilter,
  });

  // Update filter
  const updateFilter = (key: keyof KBFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value,
    }));
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      isPublished: true,
      ...defaultFilters,
    });
  };

  // Check if filters are active
  const hasActiveFilters = filters.categoryId || filters.accessLevel;

  // Handle article click
  const handleArticleClick = (articleId: string) => {
    if (onArticleClick) {
      onArticleClick(articleId);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full mt-2" />
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error?.message || 'Failed to load articles. Please try again.'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {showCategoryFilter && categories.length > 0 && (
          <div className="flex-1">
            <Select
              value={filters.categoryId || 'all'}
              onValueChange={(value) => updateFilter('categoryId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                    {category._count && ` (${category._count.articleCategories})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {showAccessLevelFilter && (
          <div className="flex-1">
            <Select
              value={filters.accessLevel || 'all'}
              onValueChange={(value) => updateFilter('accessLevel', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Access Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Access Levels</SelectItem>
                <SelectItem value="PUBLIC">Public</SelectItem>
                <SelectItem value="INTERNAL">Internal</SelectItem>
                <SelectItem value="RESTRICTED">Restricted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Clear Filters
          </Button>
        )}
      </div>

      {/* Articles List */}
      {articles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              No articles found
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {hasActiveFilters 
                ? 'Try adjusting your filters'
                : 'Check back later for new articles'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {articles.map((article) => (
            <Card 
              key={article.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleArticleClick(article.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">
                      {article.title}
                    </CardTitle>
                    {article.summary && (
                      <CardDescription className="line-clamp-2">
                        {article.summary}
                      </CardDescription>
                    )}
                  </div>
                  <Badge variant="outline">
                    {article.accessLevel}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span>{article.viewCount} views</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ThumbsUp className="h-4 w-4" />
                    <span>{article.helpfulCount} helpful</span>
                  </div>
                  <div>
                    By {article.author.name}
                  </div>
                  <div>
                    {new Date(article.updatedAt).toLocaleDateString()}
                  </div>
                  {article.categories && article.categories.length > 0 && (
                    <div className="flex gap-2">
                      {article.categories.map((category) => (
                        <Badge key={category.id} variant="secondary" className="text-xs">
                          {category.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
