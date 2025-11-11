import { 
  KnowledgeBaseService, 
  ArticleNotFoundError, 
  ArticleAccessDeniedError, 
  ArticleCreationDeniedError 
} from '../knowledge-base-service';
import { KnowledgeAccessLevel } from '@prisma/client';
import { prisma } from '../../db';
import { knowledgeBaseAccessControl } from '../../rbac/knowledge-base-access-control';

// Mock dependencies
jest.mock('../../db', () => ({
  prisma: {
    knowledgeBaseArticle: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock('../../rbac/knowledge-base-access-control');

describe('KnowledgeBaseService', () => {
  let knowledgeBaseService: KnowledgeBaseService;
  const mockUserId = 'user-123';
  const mockArticleId = 'article-123';
  const mockTeamId = 'team-123';

  beforeEach(() => {
    knowledgeBaseService = new KnowledgeBaseService();
    jest.clearAllMocks();
  });

  describe('createArticle', () => {
    it('should create an article with Admin role', async () => {
      const articleData = {
        title: 'Test Article',
        content: 'Test Content',
        summary: 'Test Summary',
        accessLevel: KnowledgeAccessLevel.PUBLIC,
        categoryIds: ['cat-1', 'cat-2'],
      };

      const mockArticle = {
        id: mockArticleId,
        ...articleData,
        authorId: mockUserId,
        isPublished: false,
        viewCount: 0,
        helpfulCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        articleCategories: [
          { category: { id: 'cat-1', name: 'Category 1', description: null } },
          { category: { id: 'cat-2', name: 'Category 2', description: null } },
        ],
      };

      (knowledgeBaseAccessControl.canCreateArticle as jest.Mock).mockResolvedValue(true);
      (knowledgeBaseAccessControl.validateAccessLevelAssignment as jest.Mock).mockResolvedValue({ valid: true });
      (prisma.knowledgeBaseArticle.create as jest.Mock).mockResolvedValue(mockArticle);

      const result = await knowledgeBaseService.createArticle(articleData, mockUserId);

      expect(result).toEqual(mockArticle);
      expect(knowledgeBaseAccessControl.canCreateArticle).toHaveBeenCalledWith(mockUserId);
      expect(prisma.knowledgeBaseArticle.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: articleData.title,
          content: articleData.content,
          authorId: mockUserId,
          isPublished: false,
        }),
        include: expect.any(Object),
      });
    });

    it('should throw error when user lacks permission to create articles', async () => {
      const articleData = {
        title: 'Test Article',
        content: 'Test Content',
        accessLevel: KnowledgeAccessLevel.PUBLIC,
      };

      (knowledgeBaseAccessControl.canCreateArticle as jest.Mock).mockResolvedValue(false);

      await expect(
        knowledgeBaseService.createArticle(articleData, mockUserId)
      ).rejects.toThrow(ArticleCreationDeniedError);
    });

    it('should throw error for invalid access level assignment', async () => {
      const articleData = {
        title: 'Test Article',
        content: 'Test Content',
        accessLevel: KnowledgeAccessLevel.RESTRICTED,
        teamId: mockTeamId,
      };

      (knowledgeBaseAccessControl.canCreateArticle as jest.Mock).mockResolvedValue(true);
      (knowledgeBaseAccessControl.validateAccessLevelAssignment as jest.Mock).mockResolvedValue({
        valid: false,
        reason: 'Cannot create restricted articles for teams you do not lead',
      });

      await expect(
        knowledgeBaseService.createArticle(articleData, mockUserId)
      ).rejects.toThrow(ArticleCreationDeniedError);
    });
  });

  describe('getArticle', () => {
    it('should return article when user has access', async () => {
      const mockArticle = {
        id: mockArticleId,
        title: 'Test Article',
        content: 'Test Content',
        accessLevel: KnowledgeAccessLevel.PUBLIC,
        isPublished: true,
        articleCategories: [],
      };

      (knowledgeBaseAccessControl.canAccessArticle as jest.Mock).mockResolvedValue(true);
      (prisma.knowledgeBaseArticle.findUnique as jest.Mock).mockResolvedValue(mockArticle);

      const result = await knowledgeBaseService.getArticle(mockArticleId, mockUserId);

      expect(result).toEqual(mockArticle);
      expect(knowledgeBaseAccessControl.canAccessArticle).toHaveBeenCalledWith(mockUserId, mockArticleId);
    });

    it('should throw error when user lacks access', async () => {
      (knowledgeBaseAccessControl.canAccessArticle as jest.Mock).mockResolvedValue(false);

      await expect(
        knowledgeBaseService.getArticle(mockArticleId, mockUserId)
      ).rejects.toThrow(ArticleAccessDeniedError);
    });

    it('should throw error when article not found', async () => {
      (knowledgeBaseAccessControl.canAccessArticle as jest.Mock).mockResolvedValue(true);
      (prisma.knowledgeBaseArticle.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        knowledgeBaseService.getArticle(mockArticleId, mockUserId)
      ).rejects.toThrow(ArticleNotFoundError);
    });
  });

  describe('searchArticles', () => {
    it('should search articles with role-based filtering', async () => {
      const query = 'test search';
      const mockArticles = [
        {
          id: 'article-1',
          title: 'Test Article 1',
          content: 'Content with test search terms',
          accessLevel: KnowledgeAccessLevel.PUBLIC,
          isPublished: true,
          viewCount: 10,
          helpfulCount: 5,
          articleCategories: [],
        },
        {
          id: 'article-2',
          title: 'Another Test Article',
          content: 'More test search content',
          accessLevel: KnowledgeAccessLevel.INTERNAL,
          isPublished: true,
          viewCount: 20,
          helpfulCount: 8,
          articleCategories: [],
        },
      ];

      (knowledgeBaseAccessControl.getArticleFilters as jest.Mock).mockResolvedValue({
        OR: [
          { accessLevel: 'PUBLIC' },
          { accessLevel: 'INTERNAL' },
        ],
        isPublished: true,
      });
      (prisma.knowledgeBaseArticle.findMany as jest.Mock).mockResolvedValue(mockArticles);

      const result = await knowledgeBaseService.searchArticles(query, mockUserId);

      expect(result).toEqual(mockArticles);
      expect(knowledgeBaseAccessControl.getArticleFilters).toHaveBeenCalledWith(mockUserId);
      expect(prisma.knowledgeBaseArticle.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            expect.objectContaining({
              OR: expect.arrayContaining([
                { title: { contains: query, mode: 'insensitive' } },
                { content: { contains: query, mode: 'insensitive' } },
                { summary: { contains: query, mode: 'insensitive' } },
              ]),
            }),
          ]),
        }),
        include: expect.any(Object),
        orderBy: expect.any(Array),
      });
    });
  });

  describe('suggestArticles', () => {
    it('should suggest relevant articles based on ticket content', async () => {
      const ticketContent = 'I need help with password reset and login issues';
      const mockArticles = [
        {
          id: 'article-1',
          title: 'Password Reset Guide',
          content: 'How to reset your password',
          summary: 'Guide for password reset',
          accessLevel: KnowledgeAccessLevel.PUBLIC,
          isPublished: true,
          viewCount: 100,
          helpfulCount: 50,
          articleCategories: [],
        },
        {
          id: 'article-2',
          title: 'Login Troubleshooting',
          content: 'Common login issues and solutions',
          summary: 'Help with login problems',
          accessLevel: KnowledgeAccessLevel.PUBLIC,
          isPublished: true,
          viewCount: 80,
          helpfulCount: 40,
          articleCategories: [],
        },
        {
          id: 'article-3',
          title: 'Unrelated Article',
          content: 'Something completely different',
          summary: 'Not relevant',
          accessLevel: KnowledgeAccessLevel.PUBLIC,
          isPublished: true,
          viewCount: 10,
          helpfulCount: 2,
          articleCategories: [],
        },
      ];

      (knowledgeBaseAccessControl.getArticleFilters as jest.Mock).mockResolvedValue({
        isPublished: true,
      });
      (prisma.knowledgeBaseArticle.findMany as jest.Mock).mockResolvedValue(mockArticles);

      const result = await knowledgeBaseService.suggestArticles(ticketContent, mockUserId, 5);

      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThanOrEqual(5);
      // First result should be most relevant (password reset)
      expect(result[0].id).toBe('article-1');
      // Each result should have a relevance score
      expect(result[0]).toHaveProperty('relevanceScore');
      expect(result[0].relevanceScore).toBeGreaterThan(0);
    });

    it('should return empty array when no keywords found', async () => {
      const ticketContent = 'a an the';

      (knowledgeBaseAccessControl.getArticleFilters as jest.Mock).mockResolvedValue({});
      (prisma.knowledgeBaseArticle.findMany as jest.Mock).mockResolvedValue([]);

      const result = await knowledgeBaseService.suggestArticles(ticketContent, mockUserId);

      expect(result).toEqual([]);
    });
  });

  describe('recordView', () => {
    it('should increment view count for accessible article', async () => {
      const mockArticle = {
        id: mockArticleId,
        title: 'Test Article',
        viewCount: 10,
      };

      (knowledgeBaseAccessControl.canAccessArticle as jest.Mock).mockResolvedValue(true);
      (prisma.knowledgeBaseArticle.findUnique as jest.Mock).mockResolvedValue(mockArticle);
      (prisma.knowledgeBaseArticle.update as jest.Mock).mockResolvedValue({
        ...mockArticle,
        viewCount: 11,
      });

      await knowledgeBaseService.recordView(mockArticleId, mockUserId);

      expect(prisma.knowledgeBaseArticle.update).toHaveBeenCalledWith({
        where: { id: mockArticleId },
        data: {
          viewCount: {
            increment: 1,
          },
        },
      });
    });

    it('should throw error when user lacks access', async () => {
      (knowledgeBaseAccessControl.canAccessArticle as jest.Mock).mockResolvedValue(false);

      await expect(
        knowledgeBaseService.recordView(mockArticleId, mockUserId)
      ).rejects.toThrow(ArticleAccessDeniedError);
    });
  });

  describe('recordHelpful', () => {
    it('should increment helpful count for accessible article', async () => {
      const mockArticle = {
        id: mockArticleId,
        title: 'Test Article',
        helpfulCount: 5,
      };

      (knowledgeBaseAccessControl.canAccessArticle as jest.Mock).mockResolvedValue(true);
      (prisma.knowledgeBaseArticle.findUnique as jest.Mock).mockResolvedValue(mockArticle);
      (prisma.knowledgeBaseArticle.update as jest.Mock).mockResolvedValue({
        ...mockArticle,
        helpfulCount: 6,
      });

      await knowledgeBaseService.recordHelpful(mockArticleId, mockUserId);

      expect(prisma.knowledgeBaseArticle.update).toHaveBeenCalledWith({
        where: { id: mockArticleId },
        data: {
          helpfulCount: {
            increment: 1,
          },
        },
      });
    });
  });

  describe('updateArticle', () => {
    it('should update article when user has permission', async () => {
      const existingArticle = {
        id: mockArticleId,
        title: 'Old Title',
        content: 'Old Content',
        accessLevel: KnowledgeAccessLevel.PUBLIC,
        isPublished: false,
        authorId: mockUserId,
      };

      const updateData = {
        title: 'New Title',
        content: 'New Content',
      };

      const updatedArticle = {
        ...existingArticle,
        ...updateData,
        articleCategories: [],
      };

      (prisma.knowledgeBaseArticle.findUnique as jest.Mock).mockResolvedValue(existingArticle);
      (knowledgeBaseAccessControl.canModifyArticle as jest.Mock).mockResolvedValue(true);
      (prisma.knowledgeBaseArticle.update as jest.Mock).mockResolvedValue(updatedArticle);

      const result = await knowledgeBaseService.updateArticle(mockArticleId, updateData, mockUserId);

      expect(result).toEqual(updatedArticle);
      expect(knowledgeBaseAccessControl.canModifyArticle).toHaveBeenCalledWith(mockUserId, mockArticleId);
    });

    it('should throw error when user lacks permission', async () => {
      const existingArticle = {
        id: mockArticleId,
        authorId: 'other-user',
      };

      (prisma.knowledgeBaseArticle.findUnique as jest.Mock).mockResolvedValue(existingArticle);
      (knowledgeBaseAccessControl.canModifyArticle as jest.Mock).mockResolvedValue(false);

      await expect(
        knowledgeBaseService.updateArticle(mockArticleId, { title: 'New Title' }, mockUserId)
      ).rejects.toThrow(ArticleAccessDeniedError);
    });
  });

  describe('deleteArticle', () => {
    it('should delete article when user is Admin', async () => {
      const mockArticle = {
        id: mockArticleId,
        title: 'Test Article',
      };

      (prisma.knowledgeBaseArticle.findUnique as jest.Mock).mockResolvedValue(mockArticle);
      (knowledgeBaseAccessControl.canDeleteArticle as jest.Mock).mockResolvedValue(true);
      (prisma.knowledgeBaseArticle.delete as jest.Mock).mockResolvedValue(mockArticle);

      await knowledgeBaseService.deleteArticle(mockArticleId, mockUserId);

      expect(prisma.knowledgeBaseArticle.delete).toHaveBeenCalledWith({
        where: { id: mockArticleId },
      });
    });

    it('should throw error when user is not Admin', async () => {
      const mockArticle = {
        id: mockArticleId,
        title: 'Test Article',
      };

      (prisma.knowledgeBaseArticle.findUnique as jest.Mock).mockResolvedValue(mockArticle);
      (knowledgeBaseAccessControl.canDeleteArticle as jest.Mock).mockResolvedValue(false);

      await expect(
        knowledgeBaseService.deleteArticle(mockArticleId, mockUserId)
      ).rejects.toThrow();
    });
  });
});
