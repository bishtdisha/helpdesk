"use client"

/**
 * KnowledgeBase Main Component
 * 
 * Main knowledge base interface that integrates:
 * - Article list with filtering
 * - Category navigation
 * - Search functionality
 * - Article detail view
 */

import { useState } from 'react';
import { KBArticleList } from './kb-article-list';
import { KBArticleDetail } from './kb-article-detail';
import { KBArticleSearch } from './kb-article-search';
import { KBCategoryTree } from './kb-category-tree';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, List, BookOpen } from 'lucide-react';

type ViewMode = 'list' | 'detail';

export function KnowledgeBase() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'browse' | 'search'>('browse');

  // Handle article selection
  const handleArticleClick = (articleId: string) => {
    setSelectedArticleId(articleId);
    setViewMode('detail');
  };

  // Handle back to list
  const handleBackToList = () => {
    setViewMode('list');
    setSelectedArticleId(null);
  };

  // Handle category selection
  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Knowledge Base</h1>
        <p className="text-muted-foreground">
          Find answers and solutions to common questions
        </p>
      </div>

      {viewMode === 'list' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Category Navigation */}
          <div className="lg:col-span-1">
            <KBCategoryTree
              onCategorySelect={handleCategorySelect}
              selectedCategoryId={selectedCategoryId}
              showArticleCount={true}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'browse' | 'search')}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="browse" className="flex items-center gap-2">
                  <List className="h-4 w-4" />
                  Browse Articles
                </TabsTrigger>
                <TabsTrigger value="search" className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Search
                </TabsTrigger>
              </TabsList>

              <TabsContent value="browse">
                <KBArticleList
                  onArticleClick={handleArticleClick}
                  showCategoryFilter={false}
                  defaultFilters={{
                    categoryId: selectedCategoryId || undefined,
                  }}
                />
              </TabsContent>

              <TabsContent value="search">
                <KBArticleSearch
                  onArticleClick={handleArticleClick}
                  filters={{
                    categoryId: selectedCategoryId || undefined,
                  }}
                  autoFocus={true}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          <KBArticleDetail
            articleId={selectedArticleId!}
            onBack={handleBackToList}
            trackView={true}
          />
        </div>
      )}
    </div>
  );
}
