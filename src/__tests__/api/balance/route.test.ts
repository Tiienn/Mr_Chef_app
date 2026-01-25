/**
 * @jest-environment node
 */
import { createTestDb, initTestSchema } from '@/db';
import { dailyBalance } from '@/db/schema';
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
import { GET, POST } from '@/app/api/balance/route';

describe('Balance API', () => {
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

  describe('GET /api/balance', () => {
    function createGetRequest(date?: string): Request {
      const url = date
        ? `http://localhost/api/balance?date=${date}`
        : 'http://localhost/api/balance';
      return new Request(url, { method: 'GET' });
    }

    it('returns balance for a date when it exists', async () => {
      // Seed a balance record
      testDb.db.insert(dailyBalance).values({
        date: '2024-01-15',
        openingBalance: 10000,
        closingBalance: 15000,
      }).run();

      const request = createGetRequest('2024-01-15');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.date).toBe('2024-01-15');
      expect(data.openingBalance).toBe(10000);
      expect(data.closingBalance).toBe(15000);
    });

    it('returns null balances when no record exists for date', async () => {
      const request = createGetRequest('2024-01-15');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.date).toBe('2024-01-15');
      expect(data.openingBalance).toBeNull();
      expect(data.closingBalance).toBeNull();
    });

    it('returns 400 when date parameter is missing', async () => {
      const request = createGetRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Date parameter is required');
    });

    it('returns 400 for invalid date format', async () => {
      const request = createGetRequest('15-01-2024');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid date format. Use YYYY-MM-DD');
    });

    it('returns 500 on database error', async () => {
      mockThrowError = true;

      const request = createGetRequest('2024-01-15');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to get daily balance');
    });
  });

  describe('POST /api/balance', () => {
    function createPostRequest(body: object): Request {
      return new Request('http://localhost/api/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    }

    it('creates a new balance record with opening balance', async () => {
      const request = createPostRequest({
        date: '2024-01-15',
        openingBalance: 10000,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.date).toBe('2024-01-15');
      expect(data.openingBalance).toBe(10000);
      expect(data.closingBalance).toBeNull();

      // Verify in database
      const record = testDb.db.select().from(dailyBalance).all()[0];
      expect(record.openingBalance).toBe(10000);
    });

    it('creates a new balance record with both balances', async () => {
      const request = createPostRequest({
        date: '2024-01-15',
        openingBalance: 10000,
        closingBalance: 15000,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.openingBalance).toBe(10000);
      expect(data.closingBalance).toBe(15000);
    });

    it('updates existing record with new opening balance', async () => {
      // Seed existing record
      testDb.db.insert(dailyBalance).values({
        date: '2024-01-15',
        openingBalance: 10000,
        closingBalance: null,
      }).run();

      const request = createPostRequest({
        date: '2024-01-15',
        openingBalance: 12000,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.openingBalance).toBe(12000);

      // Verify in database
      const records = testDb.db.select().from(dailyBalance).all();
      expect(records).toHaveLength(1);
      expect(records[0].openingBalance).toBe(12000);
    });

    it('updates existing record with closing balance only', async () => {
      // Seed existing record
      testDb.db.insert(dailyBalance).values({
        date: '2024-01-15',
        openingBalance: 10000,
        closingBalance: null,
      }).run();

      const request = createPostRequest({
        date: '2024-01-15',
        closingBalance: 18000,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.openingBalance).toBe(10000);
      expect(data.closingBalance).toBe(18000);
    });

    it('returns 400 when date is missing', async () => {
      const request = createPostRequest({
        openingBalance: 10000,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Date is required');
    });

    it('returns 400 for invalid date format', async () => {
      const request = createPostRequest({
        date: '15-01-2024',
        openingBalance: 10000,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid date format. Use YYYY-MM-DD');
    });

    it('returns 400 when neither balance is provided', async () => {
      const request = createPostRequest({
        date: '2024-01-15',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('At least one of openingBalance or closingBalance is required');
    });

    it('returns 400 when openingBalance is not a number', async () => {
      const request = createPostRequest({
        date: '2024-01-15',
        openingBalance: 'not a number',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('openingBalance must be a number');
    });

    it('returns 400 when closingBalance is not a number', async () => {
      const request = createPostRequest({
        date: '2024-01-15',
        closingBalance: 'not a number',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('closingBalance must be a number');
    });

    it('returns 400 when creating new record without openingBalance', async () => {
      const request = createPostRequest({
        date: '2024-01-15',
        closingBalance: 15000,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('openingBalance is required for new records');
    });

    it('returns 500 on database error', async () => {
      mockThrowError = true;

      const request = createPostRequest({
        date: '2024-01-15',
        openingBalance: 10000,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to save daily balance');
    });

    it('handles zero values correctly', async () => {
      const request = createPostRequest({
        date: '2024-01-15',
        openingBalance: 0,
        closingBalance: 0,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.openingBalance).toBe(0);
      expect(data.closingBalance).toBe(0);
    });

    it('handles negative values correctly', async () => {
      const request = createPostRequest({
        date: '2024-01-15',
        openingBalance: -5000,
        closingBalance: -2000,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.openingBalance).toBe(-5000);
      expect(data.closingBalance).toBe(-2000);
    });
  });
});
