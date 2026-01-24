/**
 * @jest-environment node
 */
import { createTestDb, initTestSchema } from '@/db';
import { menuItems } from '@/db/schema';
import type Database from 'better-sqlite3';
import type { DbInstance } from '@/db';

// We need to set up the mock before importing the route
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
import { GET } from '@/app/api/menu/route';

describe('GET /api/menu', () => {
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

  it('returns an empty array when no menu items exist', async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([]);
  });

  it('returns all menu items', async () => {
    // Insert test menu items
    testDb.db.insert(menuItems).values([
      { name: 'Test Item 1', category: 'Noodles', price: 1000, sortOrder: 1 },
      { name: 'Test Item 2', category: 'Dumplings', price: 800, sortOrder: 2 },
    ]).run();

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(2);
    expect(data[0].name).toBe('Test Item 1');
    expect(data[1].name).toBe('Test Item 2');
  });

  it('includes all required fields in response', async () => {
    testDb.db.insert(menuItems).values({
      name: 'Test Item',
      category: 'Noodles',
      price: 1500,
      available: true,
      sortOrder: 1,
    }).run();

    const response = await GET();
    const data = await response.json();

    expect(data[0]).toHaveProperty('id');
    expect(data[0]).toHaveProperty('name', 'Test Item');
    expect(data[0]).toHaveProperty('category', 'Noodles');
    expect(data[0]).toHaveProperty('price', 1500);
    expect(data[0]).toHaveProperty('available');
    expect(data[0]).toHaveProperty('sortOrder', 1);
  });

  it('returns 500 on database error', async () => {
    mockThrowError = true;

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toHaveProperty('error', 'Failed to fetch menu items');
  });
});
