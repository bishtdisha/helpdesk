"use client"

/**
 * KBCategoryTree Component
 * 
 * Displays knowledge base categories with:
 * - Tree navigation structure
 * - Parent-child relationships
 * - Article count per category
 * - Category filtering
 */

import { useState } from 'react';
import { useKBCategories } from '@/lib/hooks/use-kb-categories';
import { KBCategory } from '@/lib/types/knowledge-base';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ChevronRight, 
  ChevronDown, 
  Folder, 
  FolderOpen,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface KBCategoryTreeProps {
  onCategorySelect?: (categoryId: string | null) => void;
  selectedCategoryId?: string | null;
  showArticleCount?: boolean;
}

export function KBCategoryTree({
  onCategorySelect,
  selectedCategoryId = null,
  showArticleCount = true,
}: KBCategoryTreeProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const { categories, isLoading, isError, error } = useKBCategories();

  // Toggle category expansion
  const toggleExpand = (categoryId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  // Handle category selection
  const handleCategorySelect = (categoryId: string | null) => {
    if (onCategorySelect) {
      onCategorySelect(categoryId);
    }
  };

  // Get root categories (no parent)
  const rootCategories = categories.filter(cat => !cat.parentId);

  // Get children of a category
  const getChildren = (parentId: string) => {
    return categories.filter(cat => cat.parentId === parentId);
  };

  // Render category item
  const renderCategory = (category: KBCategory, level: number = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category.id);
    const isSelected = selectedCategoryId === category.id;
    const articleCount = category._count?.articleCategories || 0;

    return (
      <div key={category.id}>
        <Button
          variant="ghost"
          className={cn(
            'w-full justify-start text-left h-auto py-2 px-3',
            isSelected && 'bg-primary/10',
            level > 0 && 'ml-4'
          )}
          onClick={() => handleCategorySelect(category.id)}
        >
          <div className="flex items-center gap-2 flex-1">
            {hasChildren && (
              <button
                onClick={(e) => toggleExpand(category.id, e)}
                className="p-0 hover:bg-transparent"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            )}
            {!hasChildren && <div className="w-4" />}
            
            {isExpanded ? (
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Folder className="h-4 w-4 text-muted-foreground" />
            )}
            
            <span className="flex-1">{category.name}</span>
            
            {showArticleCount && articleCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {articleCount}
              </Badge>
            )}
          </div>
        </Button>

        {/* Render children if expanded */}
        {hasChildren && isExpanded && (
          <div className="ml-4">
            {category.children!.map(child => {
              const fullChild = categories.find(c => c.id === child.id);
              if (fullChild) {
                return renderCategory(fullChild, level + 1);
              }
              return null;
            })}
          </div>
        )}
      </div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error?.message || 'Failed to load categories. Please try again.'}
        </AlertDescription>
      </Alert>
    );
  }

  // No categories
  if (categories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No categories available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Categories</CardTitle>
          {selectedCategoryId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCategorySelect(null)}
            >
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        {/* All Articles option */}
        <Button
          variant="ghost"
          className={cn(
            'w-full justify-start text-left h-auto py-2 px-3',
            !selectedCategoryId && 'bg-primary/10'
          )}
          onClick={() => handleCategorySelect(null)}
        >
          <div className="flex items-center gap-2 flex-1">
            <Folder className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1">All Articles</span>
            {showArticleCount && (
              <Badge variant="secondary" className="text-xs">
                {categories.reduce((sum, cat) => sum + (cat._count?.articleCategories || 0), 0)}
              </Badge>
            )}
          </div>
        </Button>

        {/* Category tree */}
        {rootCategories.map(category => renderCategory(category))}
      </CardContent>
    </Card>
  );
}
