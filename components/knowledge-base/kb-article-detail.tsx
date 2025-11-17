"use client"

/**
 * KBArticleDetail Component
 * 
 * Displays full knowledge base article with:
 * - Formatted content
 * - Article metadata (author, views, helpful count)
 * - Automatic view tracking
 * - "Was this helpful?" feedback
 */

import { useState } from 'react';
import { useKBArticle } from '@/lib/hooks/use-kb-article';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Eye, 
  ThumbsUp, 
  User, 
  Calendar,
  AlertCircle,
  CheckCircle,
  ArrowLeft
} from 'lucide-react';
import { useToast } from '@/lib/hooks/use-toast';

interface KBArticleDetailProps {
  articleId: string;
  onBack?: () => void;
  trackView?: boolean;
}

export function KBArticleDetail({
  articleId,
  onBack,
  trackView = true,
}: KBArticleDetailProps) {
  const [hasVoted, setHasVoted] = useState(false);
  const { toast } = useToast();

  const { 
    article, 
    isLoading, 
    isError, 
    error,
    recordHelpful 
  } = useKBArticle(articleId, {
    trackView,
  });

  // Handle helpful vote
  const handleHelpfulClick = async () => {
    if (hasVoted) {
      toast({
        title: 'Already voted',
        description: 'You have already marked this article as helpful.',
      });
      return;
    }

    try {
      await recordHelpful();
      setHasVoted(true);
      toast({
        title: 'Thank you!',
        description: 'Your feedback helps us improve our knowledge base.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to record your feedback. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-4" />
            <div className="flex gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-32" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (isError || !article) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error?.message || 'Failed to load article. Please try again.'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      {onBack && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Articles
        </Button>
      )}

      {/* Article Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4 mb-4">
            <CardTitle className="text-3xl">
              {article.title}
            </CardTitle>
            <Badge variant="outline" className="text-sm">
              {article.accessLevel}
            </Badge>
          </div>

          {article.summary && (
            <CardDescription className="text-base">
              {article.summary}
            </CardDescription>
          )}

          <Separator className="my-4" />

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>By {article.author.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>
                Updated {new Date(article.updatedAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span>{article.viewCount} views</span>
            </div>
            <div className="flex items-center gap-2">
              <ThumbsUp className="h-4 w-4" />
              <span>{article.helpfulCount} found helpful</span>
            </div>
          </div>

          {/* Categories */}
          {article.categories && article.categories.length > 0 && (
            <div className="flex gap-2 mt-4">
              {article.categories.map((category) => (
                <Badge key={category.id} variant="secondary">
                  {category.name}
                </Badge>
              ))}
            </div>
          )}
        </CardHeader>

        {/* Article Content */}
        <CardContent>
          <div 
            className="prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </CardContent>
      </Card>

      {/* Feedback Section */}
      <Card>
        <CardContent className="py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <h3 className="text-lg font-semibold mb-1">
                Was this article helpful?
              </h3>
              <p className="text-sm text-muted-foreground">
                Your feedback helps us improve our knowledge base
              </p>
            </div>
            <Button
              onClick={handleHelpfulClick}
              disabled={hasVoted}
              className="flex items-center gap-2"
              variant={hasVoted ? 'outline' : 'default'}
            >
              {hasVoted ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Thank you!
                </>
              ) : (
                <>
                  <ThumbsUp className="h-4 w-4" />
                  Yes, this was helpful
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
