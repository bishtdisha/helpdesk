import { prisma } from '../db';
import { KnowledgeBaseArticle, KnowledgeAccessLevel, Prisma } from '@prisma/client';
import { knowledgeBaseAccessControl } from '../rbac/knowledge-base-access-control';
import { PermissionError } from '../rbac/errors';

// Types for knowledge base operations
export interface CreateArticleData {
  title: string;
  content: string;
  summary?: string;
  accessLevel: KnowledgeAccessLevel;
  teamId?: string;
  categoryIds?: string[];
}

export interface UpdateArticleData {
  title?: string;
  content?: string;
  summary?: string;
  accessLevel?: KnowledgeAccessLevel;
  teamId?: string;
  categoryIds?: string[];
  isPublished?: boolean;
}

export interface KBFilters {
  accessLevel?: KnowledgeAccessLevel;
  teamId?: string;
  categoryId?: string;
  isPublished?: boolean;
  search?: string;
}

export interface ArticleWithCategories extends KnowledgeBaseArticle {
  articleCategories: Array<{
    category: {
      id: string;
      name: string;
      description: string | null;
    };
  }>;
}

// Custom errors
export class ArticleNotFoundError extends PermissionError {
  constructor(articleId: string) {
    super(
      `Article not found: ${articleId}`,
      'ARTICLE_NOT_FOUND',
      'knowledge_base:read',
      404
    );
  }
}

export class ArticleAccessDeniedError extends PermissionError {
  constructor(articleId: string, userId: string) {
    super(
      `Access denied to article ${articleId} for user ${userId}`,
      'ARTICLE_ACCESS_DENIED',
      'knowledge_base:read',
      403
    );
  }
}

export class ArticleCreationDeniedError extends PermissionError {
  constructor(reason: string) {
    super(
      `Cannot create article: ${reason}`,
      'ARTICLE_CREATION_DENIED',
      'knowledge_base:create',
      403
    );
  }
}

/**
 * Knowledge Base Service
 * Handles all knowledge base article operations with role-based access control
 */
export class KnowledgeBaseService {
  /**
   * Create a new article (Admin/Team Leader only)
   */
  async createArticle(data: CreateArticleData, userId: string): Promise<ArticleWithCategories> {
    // Check if user can create articles
    const canCreate = await knowledgeBaseAccessControl.canCreateArticle(userId);
    if (!canCreate) {
      throw new ArticleCreationDeniedError('Insufficient permissions to create articles');
    }

    // Validate access level assignment
    const validation = await knowledgeBaseAccessControl.validateAccessLevelAssignment(
      userId,
      data.accessLevel,
      data.teamId
    );

    if (!validation.valid) {
      throw new ArticleCreationDeniedError(validation.reason || 'Invalid access level assignment');
    }

    // Create the article
    const article = await prisma.knowledgeBaseArticle.create({
      data: {
        title: data.title,
        content: data.content,
        summary: data.summary,
        accessLevel: data.accessLevel,
        teamId: data.teamId,
        authorId: userId,
        isPublished: false, // Articles start as unpublished
        articleCategories: data.categoryIds && data.categoryIds.length > 0 ? {
          create: data.categoryIds.map(categoryId => ({
            categoryId,
          })),
        } : undefined,
      },
      include: {
        articleCategories: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
    });

    return article;
  }

  /**
   * Update an article with ownership validation
   */
  async updateArticle(
    articleId: string,
    data: UpdateArticleData,
    userId: string
  ): Promise<ArticleWithCategories> {
    // Check if article exists
    const existingArticle = await prisma.knowledgeBaseArticle.findUnique({
      where: { id: articleId },
    });

    if (!existingArticle) {
      throw new ArticleNotFoundError(articleId);
    }

    // Check if user can modify this article
    const canModify = await knowledgeBaseAccessControl.canModifyArticle(userId, articleId);
    if (!canModify) {
      throw new ArticleAccessDeniedError(articleId, userId);
    }

    // If access level is being changed, validate it
    if (data.accessLevel && data.accessLevel !== existingArticle.accessLevel) {
      const validation = await knowledgeBaseAccessControl.validateAccessLevelAssignment(
        userId,
        data.accessLevel,
        data.teamId || existingArticle.teamId || undefined
      );

      if (!validation.valid) {
        throw new ArticleCreationDeniedError(validation.reason || 'Invalid access level assignment');
      }
    }

    // If publishing/unpublishing, check permission
    if (data.isPublished !== undefined && data.isPublished !== existingArticle.isPublished) {
      const canPublish = await knowledgeBaseAccessControl.canPublishArticle(userId);
      if (!canPublish) {
        throw new PermissionError(
          'Insufficient permissions to publish/unpublish articles',
          'PUBLISH_DENIED',
          'knowledge_base:publish',
          403
        );
      }
    }

    // Handle category updates
    let categoryUpdate: Prisma.KBArticleCategoryUpdateManyWithoutArticleNestedInput | undefined;
    if (data.categoryIds !== undefined) {
      categoryUpdate = {
        deleteMany: {}, // Remove all existing categories
        create: data.categoryIds.map(categoryId => ({
          categoryId,
        })),
      };
    }

    // Update the article
    const article = await prisma.knowledgeBaseArticle.update({
      where: { id: articleId },
      data: {
        title: data.title,
        content: data.content,
        summary: data.summary,
        accessLevel: data.accessLevel,
        teamId: data.teamId,
        isPublished: data.isPublished,
        articleCategories: categoryUpdate,
      },
      include: {
        articleCategories: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
    });

    return article;
  }

  /**
   * Delete an article (Admin only)
   */
  async deleteArticle(articleId: string, userId: string): Promise<void> {
    // Check if article exists
    const article = await prisma.knowledgeBaseArticle.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      throw new ArticleNotFoundError(articleId);
    }

    // Check if user can delete articles
    const canDelete = await knowledgeBaseAccessControl.canDeleteArticle(userId, articleId);
    if (!canDelete) {
      throw new PermissionError(
        'Insufficient permissions to delete articles',
        'DELETE_DENIED',
        'knowledge_base:delete',
        403
      );
    }

    // Delete the article (cascade will handle categories)
    await prisma.knowledgeBaseArticle.delete({
      where: { id: articleId },
    });
  }

  /**
   * Get a single article with access level filtering
   */
  async getArticle(articleId: string, userId: string): Promise<ArticleWithCategories | null> {
    // Check if user can access this article
    const canAccess = await knowledgeBaseAccessControl.canAccessArticle(userId, articleId);
    if (!canAccess) {
      throw new ArticleAccessDeniedError(articleId, userId);
    }

    const article = await prisma.knowledgeBaseArticle.findUnique({
      where: { id: articleId },
      include: {
        articleCategories: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
    });

    if (!article) {
      throw new ArticleNotFoundError(articleId);
    }

    return article;
  }

  /**
   * Search articles with role-based filtering and full-text search
   */
  async searchArticles(
    query: string,
    userId: string,
    filters?: KBFilters
  ): Promise<ArticleWithCategories[]> {
    // Get role-based filters
    const roleFilters = await knowledgeBaseAccessControl.getArticleFilters(userId);

    // Build search conditions
    const searchConditions: Prisma.KnowledgeBaseArticleWhereInput = {
      ...roleFilters,
      AND: [
        {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { content: { contains: query, mode: 'insensitive' } },
            { summary: { contains: query, mode: 'insensitive' } },
          ],
        },
      ],
    };

    // Apply additional filters if provided
    if (filters?.accessLevel) {
      searchConditions.accessLevel = filters.accessLevel;
    }

    if (filters?.teamId) {
      searchConditions.teamId = filters.teamId;
    }

    if (filters?.categoryId) {
      searchConditions.articleCategories = {
        some: {
          categoryId: filters.categoryId,
        },
      };
    }

    if (filters?.isPublished !== undefined) {
      searchConditions.isPublished = filters.isPublished;
    }

    // Execute search
    const articles = await prisma.knowledgeBaseArticle.findMany({
      where: searchConditions,
      include: {
        articleCategories: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
      orderBy: [
        { helpfulCount: 'desc' },
        { viewCount: 'desc' },
        { updatedAt: 'desc' },
      ],
    });

    return articles;
  }

  /**
   * Get articles by category with role-based filtering
   */
  async getArticlesByCategory(
    categoryId: string,
    userId: string
  ): Promise<ArticleWithCategories[]> {
    // Get role-based filters
    const roleFilters = await knowledgeBaseAccessControl.getArticleFilters(userId);

    // Build query with category filter
    const whereConditions: Prisma.KnowledgeBaseArticleWhereInput = {
      ...roleFilters,
      articleCategories: {
        some: {
          categoryId,
        },
      },
    };

    const articles = await prisma.knowledgeBaseArticle.findMany({
      where: whereConditions,
      include: {
        articleCategories: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
      orderBy: [
        { helpfulCount: 'desc' },
        { viewCount: 'desc' },
        { updatedAt: 'desc' },
      ],
    });

    return articles;
  }

  /**
   * List all articles with role-based filtering
   */
  async listArticles(userId: string, filters?: KBFilters): Promise<ArticleWithCategories[]> {
    // Get role-based filters
    const roleFilters = await knowledgeBaseAccessControl.getArticleFilters(userId);

    // Build query conditions
    const whereConditions: Prisma.KnowledgeBaseArticleWhereInput = {
      ...roleFilters,
    };

    // Apply additional filters if provided
    if (filters?.accessLevel) {
      whereConditions.accessLevel = filters.accessLevel;
    }

    if (filters?.teamId) {
      whereConditions.teamId = filters.teamId;
    }

    if (filters?.categoryId) {
      whereConditions.articleCategories = {
        some: {
          categoryId: filters.categoryId,
        },
      };
    }

    if (filters?.isPublished !== undefined) {
      whereConditions.isPublished = filters.isPublished;
    }

    if (filters?.search) {
      whereConditions.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { content: { contains: filters.search, mode: 'insensitive' } },
        { summary: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const articles = await prisma.knowledgeBaseArticle.findMany({
      where: whereConditions,
      include: {
        articleCategories: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
      orderBy: [
        { helpfulCount: 'desc' },
        { viewCount: 'desc' },
        { updatedAt: 'desc' },
      ],
    });

    return articles;
  }

  /**
   * Suggest articles based on ticket content
   * Uses keyword matching and ranks by relevance
   */
  async suggestArticles(
    ticketContent: string,
    userId: string,
    limit: number = 5
  ): Promise<Array<ArticleWithCategories & { relevanceScore: number }>> {
    // Get role-based filters
    const roleFilters = await knowledgeBaseAccessControl.getArticleFilters(userId);

    // Extract keywords from ticket content (simple approach)
    const keywords = this.extractKeywords(ticketContent);

    if (keywords.length === 0) {
      return [];
    }

    // Get all accessible articles
    const articles = await prisma.knowledgeBaseArticle.findMany({
      where: roleFilters,
      include: {
        articleCategories: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
    });

    // Calculate relevance score for each article
    const scoredArticles = articles.map(article => {
      const score = this.calculateRelevanceScore(article, keywords);
      return {
        ...article,
        relevanceScore: score,
      };
    });

    // Filter out articles with zero relevance and sort by score
    const relevantArticles = scoredArticles
      .filter(article => article.relevanceScore > 0)
      .sort((a, b) => {
        // Primary sort by relevance score
        if (b.relevanceScore !== a.relevanceScore) {
          return b.relevanceScore - a.relevanceScore;
        }
        // Secondary sort by engagement metrics
        const aEngagement = a.helpfulCount * 2 + a.viewCount;
        const bEngagement = b.helpfulCount * 2 + b.viewCount;
        return bEngagement - aEngagement;
      })
      .slice(0, limit);

    return relevantArticles;
  }

  /**
   * Extract keywords from text
   * Simple implementation - can be enhanced with NLP libraries
   */
  private extractKeywords(text: string): string[] {
    // Convert to lowercase and remove special characters
    const cleanText = text.toLowerCase().replace(/[^\w\s]/g, ' ');

    // Split into words
    const words = cleanText.split(/\s+/).filter(word => word.length > 0);

    // Remove common stop words
    const stopWords = new Set([
      'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
      'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
      'to', 'was', 'will', 'with', 'i', 'me', 'my', 'we', 'our', 'you',
      'your', 'this', 'can', 'could', 'would', 'should', 'have', 'had',
    ]);

    const keywords = words.filter(word => 
      word.length > 2 && !stopWords.has(word)
    );

    // Return unique keywords
    return [...new Set(keywords)];
  }

  /**
   * Calculate relevance score between article and keywords
   */
  private calculateRelevanceScore(
    article: KnowledgeBaseArticle,
    keywords: string[]
  ): number {
    let score = 0;

    const titleLower = article.title.toLowerCase();
    const contentLower = article.content.toLowerCase();
    const summaryLower = article.summary?.toLowerCase() || '';

    for (const keyword of keywords) {
      // Title matches are worth more
      if (titleLower.includes(keyword)) {
        score += 10;
      }

      // Summary matches
      if (summaryLower.includes(keyword)) {
        score += 5;
      }

      // Content matches
      if (contentLower.includes(keyword)) {
        score += 2;
      }
    }

    // Boost score based on engagement metrics
    const engagementBoost = Math.min(
      (article.helpfulCount * 0.5) + (article.viewCount * 0.01),
      20
    );

    return score + engagementBoost;
  }

  /**
   * Record a view for an article
   * Increments the view count
   */
  async recordView(articleId: string, userId: string): Promise<void> {
    // Check if user can access this article
    const canAccess = await knowledgeBaseAccessControl.canAccessArticle(userId, articleId);
    if (!canAccess) {
      throw new ArticleAccessDeniedError(articleId, userId);
    }

    // Check if article exists
    const article = await prisma.knowledgeBaseArticle.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      throw new ArticleNotFoundError(articleId);
    }

    // Increment view count
    await prisma.knowledgeBaseArticle.update({
      where: { id: articleId },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });
  }

  /**
   * Record a helpful vote for an article
   * Increments the helpful count
   */
  async recordHelpful(articleId: string, userId: string): Promise<void> {
    // Check if user can access this article
    const canAccess = await knowledgeBaseAccessControl.canAccessArticle(userId, articleId);
    if (!canAccess) {
      throw new ArticleAccessDeniedError(articleId, userId);
    }

    // Check if article exists
    const article = await prisma.knowledgeBaseArticle.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      throw new ArticleNotFoundError(articleId);
    }

    // Increment helpful count
    await prisma.knowledgeBaseArticle.update({
      where: { id: articleId },
      data: {
        helpfulCount: {
          increment: 1,
        },
      },
    });
  }

  /**
   * Get article engagement metrics
   */
  async getArticleMetrics(articleId: string, userId: string): Promise<{
    viewCount: number;
    helpfulCount: number;
    engagementRate: number;
  }> {
    // Check if user can access this article
    const canAccess = await knowledgeBaseAccessControl.canAccessArticle(userId, articleId);
    if (!canAccess) {
      throw new ArticleAccessDeniedError(articleId, userId);
    }

    const article = await prisma.knowledgeBaseArticle.findUnique({
      where: { id: articleId },
      select: {
        viewCount: true,
        helpfulCount: true,
      },
    });

    if (!article) {
      throw new ArticleNotFoundError(articleId);
    }

    // Calculate engagement rate (helpful votes per 100 views)
    const engagementRate = article.viewCount > 0
      ? (article.helpfulCount / article.viewCount) * 100
      : 0;

    return {
      viewCount: article.viewCount,
      helpfulCount: article.helpfulCount,
      engagementRate: Math.round(engagementRate * 100) / 100, // Round to 2 decimal places
    };
  }
}

// Export singleton instance
export const knowledgeBaseService = new KnowledgeBaseService();
