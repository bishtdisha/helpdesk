"use client"

/**
 * KBArticleSuggestions Component
 * 
 * Displays suggested knowledge base articles with:
 * - Content-based suggestions
 * - Article summaries
 * - Quick preview functionality
 * - Links to full article details
 */

import { useState } from 'react';
import { useKBSuggestions } from '@/lib/hooks/use-kb-suggestions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Lightbulb, 
  Eye, 
  ThumbsUp, 
  ExternalLink,
  BookOpen
} from 'lucide-react';

interface KBArticleSuggestionsProps {
  content: string;
  onArticleClick?: (articleId: string) => void;
  limit?: number;
  title?: string;
  showPreview?: boolean;
}

export function KBArticleSuggestions({
  content,
  onArticleClick,
  limit = 5,
  title = 'Suggested Articles',
  showPreview = true,
}: KBArticleSuggestionsProps) {
  const [previewArticleId, setPreviewArticleId] = useState<string | null>(null);

  const { suggestions, isLoading } = useKBSuggestions(content, {
    limit,
    enabled: !!content && content.trim().length > 0,
  });

  // Handle article click
  const handleArticleClick = (articleId: string) => {
    if (onArticleClick) {
      onArticleClick(articleId);
    }
  };

  // Handle preview
  const handlePreview = (articleId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (showPreview) {
      setPreviewArticleId(articleId);
    }
  };

  // Don't render if no content
  if (!content || content.trim().length === 0) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // No suggestions
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          <CardDescription>
            These articles might help resolve your issue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className="border rounded-lg p-4 hover:bg-primary/10 transition-colors cursor-pointer"
              onClick={() => handleArticleClick(suggestion.id)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <h4 className="font-semibold text-sm leading-tight">
                    {suggestion.title}
                  </h4>
                  {suggestion.summary && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {suggestion.summary}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      <span>{suggestion.viewCount}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3" />
                      <span>{suggestion.helpfulCount}</span>
                    </div>
                  </div>
                </div>
                {showPreview && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handlePreview(suggestion.id, e)}
                    className="flex-shrink-0"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      {showPreview && previewArticleId && (
        <Dialog open={!!previewArticleId} onOpenChange={() => setPreviewArticleId(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Article Preview</DialogTitle>
              <DialogDescription>
                Click &quot;View Full Article&quot; to see the complete content
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {suggestions
                .filter(s => s.id === previewArticleId)
                .map(suggestion => (
                  <div key={suggestion.id} className="space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold mb-2">
                        {suggestion.title}
                      </h3>
                      {suggestion.summary && (
                        <p className="text-muted-foreground">
                          {suggestion.summary}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span>{suggestion.viewCount} views</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="h-4 w-4" />
                        <span>{suggestion.helpfulCount} found helpful</span>
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        setPreviewArticleId(null);
                        handleArticleClick(suggestion.id);
                      }}
                      className="w-full"
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      View Full Article
                    </Button>
                  </div>
                ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
