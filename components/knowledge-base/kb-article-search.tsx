"use client"

/**
 * KBArticleSearch Component
 * 
 * Provides search functionality for knowledge base articles with:
 * - Debounced search input
 * - Search results display
 * - Highlighted search terms
 * - Empty state handling
 */

import { useState, useEffect } from 'react';
import { useKBSearch } from '@/lib/hooks/use-kb-search';
import { KBFilters } from '@/lib/types/knowledge-base';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, 
  X, 
  Eye, 
  ThumbsUp, 
  BookOpen 
} from 'lucide-react';

interface KBArticleSearchProps {
  onArticleClick?: (articleId: string) => void;
  filters?: Omit<KBFilters, 'search'>;
  placeholder?: string;
  autoFocus?: boolean;
}

export function KBArticleSearch({
  onArticleClick,
  filters = {},
  placeholder = 'Search articles...',
  autoFocus = false,
}: KBArticleSearchProps) {
  const [inputValue, setInputValue] = useState('');
  
  const { 
    results, 
    isSearching, 
    search, 
    clearSearch, 
    query 
  } = useKBSearch({
    ...filters,
    debounceMs: 300,
  });

  // Update search when input changes
  useEffect(() => {
    search(inputValue);
  }, [inputValue]);

  // Handle clear
  const handleClear = () => {
    setInputValue('');
    clearSearch();
  };

  // Handle article click
  const handleArticleClick = (articleId: string) => {
    if (onArticleClick) {
      onArticleClick(articleId);
    }
  };

  // Highlight search terms in text
  const highlightText = (text: string, searchQuery: string) => {
    if (!searchQuery.trim()) return text;

    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === searchQuery.toLowerCase() 
        ? <mark key={index} className="bg-yellow-200 dark:bg-yellow-900">{part}</mark>
        : part
    );
  };

  const showResults = query.trim().length > 0;

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          autoFocus={autoFocus}
          className="pl-10 pr-10"
        />
        {inputValue && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Search Results */}
      {showResults && (
        <div className="space-y-4">
          {/* Loading State */}
          {isSearching && (
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
          )}

          {/* No Results */}
          {!isSearching && results.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                  No results found
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Try different keywords or check your spelling
                </p>
              </CardContent>
            </Card>
          )}

          {/* Results List */}
          {!isSearching && results.length > 0 && (
            <>
              <div className="text-sm text-muted-foreground">
                Found {results.length} {results.length === 1 ? 'article' : 'articles'}
              </div>
              <div className="space-y-4">
                {results.map((article) => (
                  <Card 
                    key={article.id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleArticleClick(article.id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-2">
                            {highlightText(article.title, query)}
                          </CardTitle>
                          {article.summary && (
                            <CardDescription className="line-clamp-2">
                              {highlightText(article.summary, query)}
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
            </>
          )}
        </div>
      )}
    </div>
  );
}
