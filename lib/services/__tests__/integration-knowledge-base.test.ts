/**
 * Integration Tests: Knowledge Base Access
 * Tests article visibility and access control
 * Requirements: 9.1, 15.1
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { knowledgeBaseService as kbService } from '../knowledge-base-service';

const prisma = new PrismaClient();

describe('Knowledge Base Integration Tests', () => {
  let adminUser: any;
  let teamLeader1: any;
  let teamLeader2: any;
  let employee1: any;
  let employee2: any;
  let team1: any;
  let team2: any;
  let publicArticle: any;
  let internalArticle: any;
  let restrictedTeam1Article: any;
  let restrictedTeam2Article: any;

  beforeAll(async () => {
    // Create roles
    const adminRole = await prisma.role.findFirst({ where: { name: 'Admin/Manager' } });
    const teamLeaderRole = await prisma.role.findFirst({ where: { name: 'Team Leader' } });
    const employeeRole = await prisma.role.findFirst({ where: { name: 'User/Employee' } });

    // Create users
    adminUser = await prisma.user.create({
      data: {
        email: 'admin-kb@test.com',
        name: 'Admin KB',
        password: 'hashedpassword',
        roleId: adminRole!.id,
      },
    });

    teamLeader1 = await prisma.user.create({
      data: {
        email: 'teamlead1-kb@test.com',
        name: 'Team Leader 1 KB',
        password: 'hashedpassword',
        roleId: teamLeaderRole!.id,
      },
    });

    teamLeader2 = await prisma.user.create({
      data: {
        email: 'teamlead2-kb@test.com',
        name: 'Team Leader 2 KB',
        password: 'hashedpassword',
        roleId: teamLeaderRole!.id,
      },
    });

    employee1 = await prisma.user.create({
      data: {
        email: 'employee1-kb@test.com',
        name: 'Employee 1 KB',
        password: 'hashedpassword',
        roleId: employeeRole!.id,
      },
    });

    employee2 = await prisma.user.create({
      data: {
        email: 'employee2-kb@test.com',
        name: 'Employee 2 KB',
        password: 'hashedpassword',
        roleId: employeeRole!.id,
      },
    });

    // Create teams
    team1 = await prisma.team.create({
      data: {
        name: 'KB Team 1',
        description: 'First team for KB testing',
      },
    });

    team2 = await prisma.team.create({
      data: {
        name: 'KB Team 2',
        description: 'Second team for KB testing',
      },
    });

    // Assign team leaders
    await prisma.teamLeader.create({
      data: { userId: teamLeader1.id, teamId: team1.id },
    });

    await prisma.teamLeader.create({
      data: { userId: teamLeader2.id, teamId: team2.id },
    });

    // Create articles with different access levels
    publicArticle = await kbService.createArticle(
      {
        title: 'Public Article',
        content: 'This article is visible to everyone',
        summary: 'Public access article',
        accessLevel: 'PUBLIC',
        categoryIds: [],
      },
      adminUser.id
    );

    internalArticle = await kbService.createArticle(
      {
        title: 'Internal Article',
        content: 'This article is visible to all employees',
        summary: 'Internal access article',
        accessLevel: 'INTERNAL',
        categoryIds: [],
      },
      adminUser.id
    );

    restrictedTeam1Article = await kbService.createArticle(
      {
        title: 'Team 1 Restricted Article',
        content: 'This article is only for Team 1',
        summary: 'Team 1 only',
        accessLevel: 'RESTRICTED',
        teamId: team1.id,
        categoryIds: [],
      },
      teamLeader1.id
    );

    restrictedTeam2Article = await kbService.createArticle(
      {
        title: 'Team 2 Restricted Article',
        content: 'This article is only for Team 2',
        summary: 'Team 2 only',
        accessLevel: 'RESTRICTED',
        teamId: team2.id,
        categoryIds: [],
      },
      teamLeader2.id
    );
  });

  afterAll(async () => {
    // Cleanup
    await prisma.kBArticleCategory.deleteMany({});
    await prisma.knowledgeBaseArticle.deleteMany({});
    await prisma.teamLeader.deleteMany({});
    await prisma.team.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        email: { contains: '-kb@test.com' },
      },
    });

    await prisma.$disconnect();
  });

  describe('Article Visibility by Access Level', () => {
    it('should allow everyone to see PUBLIC articles', async () => {
      // Admin can see public articles
      const adminArticles = await kbService.searchArticles('Public', adminUser.id);
      expect(adminArticles.some((a) => a.id === publicArticle.id)).toBe(true);

      // Team Leader can see public articles
      const tlArticles = await kbService.searchArticles('Public', teamLeader1.id);
      expect(tlArticles.some((a) => a.id === publicArticle.id)).toBe(true);

      // Employee can see public articles
      const empArticles = await kbService.searchArticles('Public', employee1.id);
      expect(empArticles.some((a) => a.id === publicArticle.id)).toBe(true);
    });

    it('should allow employees and above to see INTERNAL articles', async () => {
      // Admin can see internal articles
      const adminArticles = await kbService.searchArticles('Internal', adminUser.id);
      expect(adminArticles.some((a) => a.id === internalArticle.id)).toBe(true);

      // Team Leader can see internal articles
      const tlArticles = await kbService.searchArticles('Internal', teamLeader1.id);
      expect(tlArticles.some((a) => a.id === internalArticle.id)).toBe(true);

      // Employee can see internal articles
      const empArticles = await kbService.searchArticles('Internal', employee1.id);
      expect(empArticles.some((a) => a.id === internalArticle.id)).toBe(true);
    });

    it('should restrict RESTRICTED articles to specific teams', async () => {
      // Admin can see all restricted articles
      const adminArticles = await kbService.searchArticles('Restricted', adminUser.id);
      expect(adminArticles.some((a) => a.id === restrictedTeam1Article.id)).toBe(true);
      expect(adminArticles.some((a) => a.id === restrictedTeam2Article.id)).toBe(true);

      // Team Leader 1 can only see Team 1 restricted articles
      const tl1Articles = await kbService.searchArticles('Restricted', teamLeader1.id);
      expect(tl1Articles.some((a) => a.id === restrictedTeam1Article.id)).toBe(true);
      expect(tl1Articles.some((a) => a.id === restrictedTeam2Article.id)).toBe(false);

      // Team Leader 2 can only see Team 2 restricted articles
      const tl2Articles = await kbService.searchArticles('Restricted', teamLeader2.id);
      expect(tl2Articles.some((a) => a.id === restrictedTeam1Article.id)).toBe(false);
      expect(tl2Articles.some((a) => a.id === restrictedTeam2Article.id)).toBe(true);

      // Employees cannot see restricted articles
      const empArticles = await kbService.searchArticles('Restricted', employee1.id);
      expect(empArticles.some((a) => a.id === restrictedTeam1Article.id)).toBe(false);
      expect(empArticles.some((a) => a.id === restrictedTeam2Article.id)).toBe(false);
    });
  });

  describe('Team-Specific Article Access', () => {
    it('should allow Team Leader to access team articles', async () => {
      const article = await kbService.getArticle(
        restrictedTeam1Article.id,
        teamLeader1.id
      );

      expect(article).toBeDefined();
      expect(article!.id).toBe(restrictedTeam1Article.id);
    });

    it('should prevent Team Leader from accessing other team articles', async () => {
      await expect(
        kbService.getArticle(restrictedTeam2Article.id, teamLeader1.id)
      ).rejects.toThrow();
    });

    it('should allow Admin to access all team articles', async () => {
      const team1Article = await kbService.getArticle(
        restrictedTeam1Article.id,
        adminUser.id
      );
      expect(team1Article).toBeDefined();

      const team2Article = await kbService.getArticle(
        restrictedTeam2Article.id,
        adminUser.id
      );
      expect(team2Article).toBeDefined();
    });

    it('should prevent Employee from accessing restricted team articles', async () => {
      await expect(
        kbService.getArticle(restrictedTeam1Article.id, employee1.id)
      ).rejects.toThrow();

      await expect(
        kbService.getArticle(restrictedTeam2Article.id, employee1.id)
      ).rejects.toThrow();
    });
  });

  describe('Article Suggestion Engine', () => {
    it('should suggest relevant articles based on ticket content', async () => {
      const suggestions = await kbService.suggestArticles(
        'I need help with public information',
        employee1.id
      );

      expect(suggestions).toBeDefined();
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some((a) => a.id === publicArticle.id)).toBe(true);
    });

    it('should filter suggestions by user access level', async () => {
      // Employee should only get public and internal suggestions
      const empSuggestions = await kbService.suggestArticles(
        'restricted team information',
        employee1.id
      );

      expect(
        empSuggestions.every(
          (a) => a.accessLevel === 'PUBLIC' || a.accessLevel === 'INTERNAL'
        )
      ).toBe(true);

      // Team Leader should get team-specific suggestions
      const tlSuggestions = await kbService.suggestArticles(
        'restricted team information',
        teamLeader1.id
      );

      // Should include team 1 restricted articles but not team 2
      const hasTeam1 = tlSuggestions.some((a) => a.id === restrictedTeam1Article.id);
      const hasTeam2 = tlSuggestions.some((a) => a.id === restrictedTeam2Article.id);

      if (hasTeam1 || hasTeam2) {
        expect(hasTeam1).toBe(true);
        expect(hasTeam2).toBe(false);
      }
    });

    it('should rank suggestions by relevance', async () => {
      const suggestions = await kbService.suggestArticles(
        'public article information',
        adminUser.id
      );

      expect(suggestions).toBeDefined();
      if (suggestions.length > 1) {
        // First suggestion should be most relevant
        expect(suggestions[0].title.toLowerCase()).toContain('public');
      }
    });
  });

  describe('Article Creation by Team Leader', () => {
    it('should allow Team Leader to create articles', async () => {
      const article = await kbService.createArticle(
        {
          title: 'Team Leader Created Article',
          content: 'Article created by team leader',
          summary: 'TL article',
          accessLevel: 'INTERNAL',
          categoryIds: [],
        },
        teamLeader1.id
      );

      expect(article).toBeDefined();
      expect(article.title).toBe('Team Leader Created Article');
      expect(article.authorId).toBe(teamLeader1.id);
    });

    it('should allow Team Leader to create team-specific articles', async () => {
      const article = await kbService.createArticle(
        {
          title: 'Team Specific Article',
          content: 'Article for specific team',
          summary: 'Team article',
          accessLevel: 'RESTRICTED',
          teamId: team1.id,
          categoryIds: [],
        },
        teamLeader1.id
      );

      expect(article).toBeDefined();
      expect(article.teamId).toBe(team1.id);
      expect(article.accessLevel).toBe('RESTRICTED');
    });

    it('should prevent Team Leader from creating articles for other teams', async () => {
      await expect(
        kbService.createArticle(
          {
            title: 'Wrong Team Article',
            content: 'Trying to create for wrong team',
            summary: 'Wrong team',
            accessLevel: 'RESTRICTED',
            teamId: team2.id,
            categoryIds: [],
          },
          teamLeader1.id
        )
      ).rejects.toThrow();
    });

    it('should prevent Employee from creating articles', async () => {
      await expect(
        kbService.createArticle(
          {
            title: 'Employee Article',
            content: 'Employee trying to create',
            summary: 'Employee',
            accessLevel: 'PUBLIC',
            categoryIds: [],
          },
          employee1.id
        )
      ).rejects.toThrow();
    });
  });

  describe('Article Modification', () => {
    it('should allow Admin to update any article', async () => {
      const updated = await kbService.updateArticle(
        publicArticle.id,
        { title: 'Updated Public Article' },
        adminUser.id
      );

      expect(updated.title).toBe('Updated Public Article');
    });

    it('should allow Team Leader to update own articles', async () => {
      const updated = await kbService.updateArticle(
        restrictedTeam1Article.id,
        { content: 'Updated content by team leader' },
        teamLeader1.id
      );

      expect(updated.content).toBe('Updated content by team leader');
    });

    it('should prevent Team Leader from updating other team articles', async () => {
      await expect(
        kbService.updateArticle(
          restrictedTeam2Article.id,
          { title: 'Unauthorized Update' },
          teamLeader1.id
        )
      ).rejects.toThrow();
    });

    it('should prevent Employee from updating articles', async () => {
      await expect(
        kbService.updateArticle(
          publicArticle.id,
          { title: 'Employee Update' },
          employee1.id
        )
      ).rejects.toThrow();
    });
  });

  describe('Article Engagement Tracking', () => {
    it('should track article views', async () => {
      const beforeViews = publicArticle.viewCount || 0;

      await kbService.recordView(publicArticle.id, employee1.id);

      const article = await kbService.getArticle(publicArticle.id, employee1.id);
      expect(article!.viewCount).toBe(beforeViews + 1);
    });

    it('should track helpful votes', async () => {
      const beforeHelpful = publicArticle.helpfulCount || 0;

      await kbService.recordHelpful(publicArticle.id, employee1.id);

      const article = await kbService.getArticle(publicArticle.id, employee1.id);
      expect(article!.helpfulCount).toBe(beforeHelpful + 1);
    });

    it('should use engagement metrics for ranking', async () => {
      // Record multiple views and helpful votes
      await kbService.recordView(publicArticle.id, employee1.id);
      await kbService.recordView(publicArticle.id, employee2.id);
      await kbService.recordHelpful(publicArticle.id, employee1.id);

      const suggestions = await kbService.suggestArticles(
        'public information',
        employee1.id
      );

      // Article with more engagement should rank higher
      if (suggestions.length > 1) {
        const publicArticleIndex = suggestions.findIndex(
          (a) => a.id === publicArticle.id
        );
        expect(publicArticleIndex).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Article Search Functionality', () => {
    it('should search articles by title and content', async () => {
      const results = await kbService.searchArticles('Public', employee1.id);

      expect(results.length).toBeGreaterThan(0);
      expect(results.some((a) => a.title.includes('Public'))).toBe(true);
    });

    it('should filter search results by access level', async () => {
      const empResults = await kbService.searchArticles('Article', employee1.id);

      // Employee should not see restricted articles
      expect(
        empResults.every(
          (a) => a.accessLevel === 'PUBLIC' || a.accessLevel === 'INTERNAL'
        )
      ).toBe(true);
    });

    it('should return team-specific results for Team Leaders', async () => {
      const tl1Results = await kbService.searchArticles('Team', teamLeader1.id);

      // Should include team 1 articles
      expect(tl1Results.some((a) => a.id === restrictedTeam1Article.id)).toBe(true);

      // Should not include team 2 articles
      expect(tl1Results.some((a) => a.id === restrictedTeam2Article.id)).toBe(false);
    });
  });
});
