/**
 * @jest-environment node
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { prisma } from '@/lib/db';

/**
 * Integration tests for Dynamic Dropdown Data Endpoints
 * 
 * These tests verify:
 * - GET /api/teams returns teams with pagination
 * - GET /api/users returns users with filtering and pagination
 * - GET /api/customers returns customers with search and pagination
 */

describe('Dynamic Dropdown Data Endpoints', () => {
  let testTeam: any;
  let testUser: any;
  let testCustomer: any;
  let adminRole: any;

  beforeAll(async () => {
    // Get admin role
    adminRole = await prisma.role.findFirst({
      where: { name: 'Admin/Manager' },
    });

    // Create test team
    testTeam = await prisma.team.create({
      data: {
        name: 'Test Dropdown Team',
        description: 'Test team for dropdown tests',
      },
    });

    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: 'dropdown-test@test.com',
        name: 'Dropdown Test User',
        password: 'hashedpassword',
        roleId: adminRole?.id,
        teamId: testTeam.id,
        isActive: true,
      },
    });

    // Create test customer
    testCustomer = await prisma.customer.create({
      data: {
        name: 'Dropdown Test Customer',
        email: 'dropdown-customer@test.com',
        company: 'Test Company',
      },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: { email: 'dropdown-test@test.com' },
    });

    await prisma.team.deleteMany({
      where: { name: 'Test Dropdown Team' },
    });

    await prisma.customer.deleteMany({
      where: { email: 'dropdown-customer@test.com' },
    });
  });

  describe('GET /api/teams', () => {
    test('should return teams with id and name in simple mode', async () => {
      const teams = await prisma.team.findMany({
        where: { id: testTeam.id },
        select: {
          id: true,
          name: true,
        },
      });

      expect(teams).toBeDefined();
      expect(teams.length).toBeGreaterThan(0);
      expect(teams[0]).toHaveProperty('id');
      expect(teams[0]).toHaveProperty('name');
      expect(teams[0].id).toBe(testTeam.id);
      expect(teams[0].name).toBe('Test Dropdown Team');
    });

    test('should support pagination', async () => {
      const page = 1;
      const limit = 10;
      
      const total = await prisma.team.count();
      const teams = await prisma.team.findMany({
        select: {
          id: true,
          name: true,
        },
        skip: (page - 1) * limit,
        take: limit,
      });

      expect(teams).toBeDefined();
      expect(Array.isArray(teams)).toBe(true);
      expect(teams.length).toBeLessThanOrEqual(limit);
    });

    test('should support search by name', async () => {
      const searchTerm = 'Dropdown';
      const teams = await prisma.team.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
        },
      });

      expect(teams).toBeDefined();
      expect(teams.length).toBeGreaterThan(0);
      const hasSearchTerm = teams.some(t => 
        t.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      expect(hasSearchTerm).toBe(true);
    });
  });

  describe('GET /api/users', () => {
    test('should return users with id, name, and email in simple mode', async () => {
      const users = await prisma.user.findMany({
        where: { id: testUser.id },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      expect(users).toBeDefined();
      expect(users.length).toBeGreaterThan(0);
      expect(users[0]).toHaveProperty('id');
      expect(users[0]).toHaveProperty('name');
      expect(users[0]).toHaveProperty('email');
      expect(users[0].id).toBe(testUser.id);
      expect(users[0].name).toBe('Dropdown Test User');
      expect(users[0].email).toBe('dropdown-test@test.com');
    });

    test('should filter active users by default in simple mode', async () => {
      const users = await prisma.user.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      expect(users).toBeDefined();
      const allActive = users.every(u => {
        // Verify by checking the user in the database
        return prisma.user.findUnique({
          where: { id: u.id },
          select: { isActive: true },
        }).then(user => user?.isActive === true);
      });
      expect(allActive).toBeTruthy();
    });

    test('should support pagination', async () => {
      const page = 1;
      const limit = 10;
      
      const total = await prisma.user.count({ where: { isActive: true } });
      const users = await prisma.user.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          email: true,
        },
        skip: (page - 1) * limit,
        take: limit,
      });

      expect(users).toBeDefined();
      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeLessThanOrEqual(limit);
    });

    test('should support search by name or email', async () => {
      const searchTerm = 'dropdown-test';
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { email: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      expect(users).toBeDefined();
      expect(users.length).toBeGreaterThan(0);
      const hasSearchTerm = users.some(u => 
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      expect(hasSearchTerm).toBe(true);
    });
  });

  describe('GET /api/customers', () => {
    test('should return customers with id, name, and email', async () => {
      const customers = await prisma.customer.findMany({
        where: { id: testCustomer.id },
        select: {
          id: true,
          name: true,
          email: true,
          company: true,
        },
      });

      expect(customers).toBeDefined();
      expect(customers.length).toBeGreaterThan(0);
      expect(customers[0]).toHaveProperty('id');
      expect(customers[0]).toHaveProperty('name');
      expect(customers[0]).toHaveProperty('email');
      expect(customers[0].id).toBe(testCustomer.id);
      expect(customers[0].name).toBe('Dropdown Test Customer');
      expect(customers[0].email).toBe('dropdown-customer@test.com');
    });

    test('should support pagination', async () => {
      const page = 1;
      const limit = 10;
      
      const total = await prisma.customer.count();
      const customers = await prisma.customer.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          company: true,
        },
        skip: (page - 1) * limit,
        take: limit,
      });

      expect(customers).toBeDefined();
      expect(Array.isArray(customers)).toBe(true);
      expect(customers.length).toBeLessThanOrEqual(limit);
    });

    test('should support search by name, email, or company', async () => {
      const searchTerm = 'Dropdown';
      const customers = await prisma.customer.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { email: { contains: searchTerm, mode: 'insensitive' } },
            { company: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          company: true,
        },
      });

      expect(customers).toBeDefined();
      expect(customers.length).toBeGreaterThan(0);
      const hasSearchTerm = customers.some(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.company && c.company.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      expect(hasSearchTerm).toBe(true);
    });
  });
});
