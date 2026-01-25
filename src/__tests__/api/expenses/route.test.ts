/**
 * @jest-environment node
 */
import { createTestDb, initTestSchema } from '@/db';
import { expenses } from '@/db/schema';
import type Database from 'better-sqlite3';
import type { DbInstance } from '@/db';

// Mock database
let mockDb: DbInstance | null = null;
let mockThrowError = false;

jest.mock('@/db', () => {
  const actual = jest.requireActual('@/db');
  return {
    ...actual,
    getDb: jest.fn(() => {
      if (mockThrowError) {
        throw new Error('Database connection failed');
      }
      return mockDb;
    }),
  };
});

// Import after mock is set up
import { GET, POST, DELETE } from '@/app/api/expenses/route';

describe('Expenses API', () => {
  let testDb: { sqlite: Database.Database; db: DbInstance };

  beforeEach(() => {
    testDb = createTestDb();
    initTestSchema(testDb.sqlite);
    mockDb = testDb.db;
    mockThrowError = false;
  });

  afterEach(() => {
    testDb.sqlite.close();
    jest.clearAllMocks();
  });

  describe('GET /api/expenses', () => {
    function createGetRequest(params?: Record<string, string>): Request {
      const searchParams = new URLSearchParams(params);
      const url = params
        ? `http://localhost/api/expenses?${searchParams.toString()}`
        : 'http://localhost/api/expenses';
      return new Request(url, { method: 'GET' });
    }

    it('returns all expenses when no filters are provided', async () => {
      // Seed expenses
      testDb.db.insert(expenses).values([
        { category: 'ingredients', description: 'Vegetables', amount: 5000, date: '2024-01-15' },
        { category: 'rent', description: 'Monthly rent', amount: 100000, date: '2024-01-01' },
      ]).run();

      const request = createGetRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.expenses).toHaveLength(2);
      expect(data.grandTotal).toBe(105000);
      expect(data.categoryTotals.ingredients).toBe(5000);
      expect(data.categoryTotals.rent).toBe(100000);
    });

    it('filters expenses by date range', async () => {
      // Seed expenses with different dates
      testDb.db.insert(expenses).values([
        { category: 'ingredients', description: 'Vegetables', amount: 5000, date: '2024-01-15' },
        { category: 'rent', description: 'Monthly rent', amount: 100000, date: '2024-01-01' },
        { category: 'utilities', description: 'Electric', amount: 20000, date: '2024-02-01' },
      ]).run();

      const request = createGetRequest({ startDate: '2024-01-10', endDate: '2024-01-20' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.expenses).toHaveLength(1);
      expect(data.expenses[0].description).toBe('Vegetables');
      expect(data.grandTotal).toBe(5000);
    });

    it('filters expenses by category', async () => {
      // Seed expenses
      testDb.db.insert(expenses).values([
        { category: 'ingredients', description: 'Vegetables', amount: 5000, date: '2024-01-15' },
        { category: 'rent', description: 'Monthly rent', amount: 100000, date: '2024-01-01' },
        { category: 'ingredients', description: 'Meat', amount: 8000, date: '2024-01-16' },
      ]).run();

      const request = createGetRequest({ category: 'ingredients' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.expenses).toHaveLength(2);
      expect(data.grandTotal).toBe(13000);
      expect(data.categoryTotals.ingredients).toBe(13000);
    });

    it('combines date range and category filters', async () => {
      // Seed expenses
      testDb.db.insert(expenses).values([
        { category: 'ingredients', description: 'Vegetables', amount: 5000, date: '2024-01-15' },
        { category: 'ingredients', description: 'Old vegetables', amount: 3000, date: '2024-01-01' },
        { category: 'rent', description: 'Monthly rent', amount: 100000, date: '2024-01-15' },
      ]).run();

      const request = createGetRequest({
        startDate: '2024-01-10',
        endDate: '2024-01-20',
        category: 'ingredients'
      });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.expenses).toHaveLength(1);
      expect(data.expenses[0].description).toBe('Vegetables');
    });

    it('ignores category filter when set to all', async () => {
      // Seed expenses
      testDb.db.insert(expenses).values([
        { category: 'ingredients', description: 'Vegetables', amount: 5000, date: '2024-01-15' },
        { category: 'rent', description: 'Monthly rent', amount: 100000, date: '2024-01-01' },
      ]).run();

      const request = createGetRequest({ category: 'all' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.expenses).toHaveLength(2);
    });

    it('returns 400 for invalid startDate format', async () => {
      const request = createGetRequest({ startDate: '15-01-2024' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid startDate format. Use YYYY-MM-DD');
    });

    it('returns 400 for invalid endDate format', async () => {
      const request = createGetRequest({ endDate: 'invalid' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid endDate format. Use YYYY-MM-DD');
    });

    it('returns 400 for invalid category', async () => {
      const request = createGetRequest({ category: 'invalid' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid category');
    });

    it('returns expenses sorted by date descending', async () => {
      testDb.db.insert(expenses).values([
        { category: 'ingredients', description: 'First', amount: 1000, date: '2024-01-01' },
        { category: 'ingredients', description: 'Third', amount: 3000, date: '2024-01-15' },
        { category: 'ingredients', description: 'Second', amount: 2000, date: '2024-01-10' },
      ]).run();

      const request = createGetRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.expenses[0].description).toBe('Third');
      expect(data.expenses[1].description).toBe('Second');
      expect(data.expenses[2].description).toBe('First');
    });

    it('returns 500 on database error', async () => {
      mockThrowError = true;

      const request = createGetRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch expenses');
    });
  });

  describe('POST /api/expenses', () => {
    function createPostRequest(body: object): Request {
      return new Request('http://localhost/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    }

    it('creates a new expense successfully', async () => {
      const request = createPostRequest({
        category: 'ingredients',
        description: 'Fresh vegetables',
        amount: 5000,
        date: '2024-01-15',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.category).toBe('ingredients');
      expect(data.description).toBe('Fresh vegetables');
      expect(data.amount).toBe(5000);
      expect(data.date).toBe('2024-01-15');

      // Verify in database
      const record = testDb.db.select().from(expenses).all()[0];
      expect(record.description).toBe('Fresh vegetables');
    });

    it('creates expense with default date when not provided', async () => {
      const request = createPostRequest({
        category: 'rent',
        description: 'Monthly rent',
        amount: 100000,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.date).toBeDefined();
      expect(data.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('trims description whitespace', async () => {
      const request = createPostRequest({
        category: 'wages',
        description: '  Staff payment  ',
        amount: 50000,
        date: '2024-01-15',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.description).toBe('Staff payment');
    });

    it('returns 400 when category is missing', async () => {
      const request = createPostRequest({
        description: 'Test expense',
        amount: 5000,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Category is required');
    });

    it('returns 400 for invalid category', async () => {
      const request = createPostRequest({
        category: 'invalid',
        description: 'Test expense',
        amount: 5000,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid category');
    });

    it('returns 400 when description is missing', async () => {
      const request = createPostRequest({
        category: 'ingredients',
        amount: 5000,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Description is required');
    });

    it('returns 400 when description is empty', async () => {
      const request = createPostRequest({
        category: 'ingredients',
        description: '   ',
        amount: 5000,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Description is required');
    });

    it('returns 400 when amount is missing', async () => {
      const request = createPostRequest({
        category: 'ingredients',
        description: 'Test expense',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Amount must be a positive number');
    });

    it('returns 400 when amount is zero', async () => {
      const request = createPostRequest({
        category: 'ingredients',
        description: 'Test expense',
        amount: 0,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Amount must be a positive number');
    });

    it('returns 400 when amount is negative', async () => {
      const request = createPostRequest({
        category: 'ingredients',
        description: 'Test expense',
        amount: -5000,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Amount must be a positive number');
    });

    it('returns 400 for invalid date format', async () => {
      const request = createPostRequest({
        category: 'ingredients',
        description: 'Test expense',
        amount: 5000,
        date: '15-01-2024',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid date format. Use YYYY-MM-DD');
    });

    it('returns 500 on database error', async () => {
      mockThrowError = true;

      const request = createPostRequest({
        category: 'ingredients',
        description: 'Test expense',
        amount: 5000,
        date: '2024-01-15',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create expense');
    });
  });

  describe('DELETE /api/expenses', () => {
    function createDeleteRequest(id?: string): Request {
      const url = id
        ? `http://localhost/api/expenses?id=${id}`
        : 'http://localhost/api/expenses';
      return new Request(url, { method: 'DELETE' });
    }

    it('deletes an existing expense successfully', async () => {
      // Seed expense
      testDb.db.insert(expenses).values({
        category: 'ingredients',
        description: 'To delete',
        amount: 5000,
        date: '2024-01-15',
      }).run();

      const records = testDb.db.select().from(expenses).all();
      expect(records).toHaveLength(1);

      const request = createDeleteRequest(String(records[0].id));
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify deleted from database
      const remainingRecords = testDb.db.select().from(expenses).all();
      expect(remainingRecords).toHaveLength(0);
    });

    it('returns 400 when id is missing', async () => {
      const request = createDeleteRequest();
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Expense ID is required');
    });

    it('returns 400 for invalid id format', async () => {
      const request = createDeleteRequest('not-a-number');
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid expense ID');
    });

    it('returns 404 when expense does not exist', async () => {
      const request = createDeleteRequest('999');
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Expense not found');
    });

    it('returns 500 on database error', async () => {
      mockThrowError = true;

      const request = createDeleteRequest('1');
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to delete expense');
    });
  });
});
