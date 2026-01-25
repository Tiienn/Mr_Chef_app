/**
 * @jest-environment node
 */
import { createTestDb, initTestSchema } from '@/db';
import { menuItems, orders, orderItems } from '@/db/schema';
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
import { GET } from '@/app/api/dashboard/route';

describe('GET /api/dashboard', () => {
  let testDb: { sqlite: Database.Database; db: DbInstance };

  beforeEach(() => {
    testDb = createTestDb();
    initTestSchema(testDb.sqlite);
    mockDb = testDb.db;
    mockThrowError = false;

    // Seed menu items
    testDb.db.insert(menuItems).values([
      { name: 'Fried Noodles', category: 'Noodles', price: 1000, sortOrder: 1 },
      { name: 'Gyoza', category: 'Dumplings', price: 800, sortOrder: 2 },
      { name: 'Fried Rice', category: 'Fried Rice', price: 1200, sortOrder: 3 },
    ]).run();
  });

  afterEach(() => {
    testDb.sqlite.close();
    jest.clearAllMocks();
  });

  function createRequest(params: Record<string, string> = {}): Request {
    const url = new URL('http://localhost/api/dashboard');
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    return new Request(url.toString(), { method: 'GET' });
  }

  it('returns dashboard data with zero values when no orders exist', async () => {
    const request = createRequest();
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.totalOrders).toBe(0);
    expect(data.totalRevenue).toBe(0);
    expect(data.statusCounts).toEqual({
      pending: 0,
      preparing: 0,
      ready: 0,
      served: 0,
    });
    expect(data.topItems).toEqual([]);
  });

  it('returns correct order count and revenue for today', async () => {
    const today = new Date();

    // Insert orders for today
    testDb.db.insert(orders).values([
      { orderNumber: '001', total: 2000, status: 'pending', createdAt: today },
      { orderNumber: '002', total: 1500, status: 'served', createdAt: today },
    ]).run();

    const request = createRequest();
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.totalOrders).toBe(2);
    expect(data.totalRevenue).toBe(3500);
  });

  it('returns correct status counts', async () => {
    const today = new Date();

    testDb.db.insert(orders).values([
      { orderNumber: '001', total: 1000, status: 'pending', createdAt: today },
      { orderNumber: '002', total: 1000, status: 'pending', createdAt: today },
      { orderNumber: '003', total: 1000, status: 'preparing', createdAt: today },
      { orderNumber: '004', total: 1000, status: 'ready', createdAt: today },
      { orderNumber: '005', total: 1000, status: 'served', createdAt: today },
      { orderNumber: '006', total: 1000, status: 'served', createdAt: today },
    ]).run();

    const request = createRequest();
    const response = await GET(request);
    const data = await response.json();

    expect(data.statusCounts).toEqual({
      pending: 2,
      preparing: 1,
      ready: 1,
      served: 2,
    });
  });

  it('returns top selling items sorted by quantity', async () => {
    const today = new Date();

    // Insert an order
    testDb.db.insert(orders).values({
      orderNumber: '001',
      total: 5000,
      status: 'pending',
      createdAt: today,
    }).run();

    // Insert order items
    testDb.db.insert(orderItems).values([
      { orderId: 1, menuItemId: 1, quantity: 3, priceAtTime: 1000 },
      { orderId: 1, menuItemId: 2, quantity: 5, priceAtTime: 800 },
      { orderId: 1, menuItemId: 3, quantity: 2, priceAtTime: 1200 },
    ]).run();

    const request = createRequest();
    const response = await GET(request);
    const data = await response.json();

    expect(data.topItems).toHaveLength(3);
    expect(data.topItems[0].menuItemName).toBe('Gyoza');
    expect(data.topItems[0].totalQuantity).toBe(5);
    expect(data.topItems[1].menuItemName).toBe('Fried Noodles');
    expect(data.topItems[1].totalQuantity).toBe(3);
    expect(data.topItems[2].menuItemName).toBe('Fried Rice');
    expect(data.topItems[2].totalQuantity).toBe(2);
  });

  it('filters data by date parameter', async () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toISOString().split('T')[0];

    // Insert order for yesterday
    testDb.db.insert(orders).values({
      orderNumber: '001',
      total: 2000,
      status: 'served',
      createdAt: yesterday,
    }).run();

    // Insert order for today
    testDb.db.insert(orders).values({
      orderNumber: '002',
      total: 1500,
      status: 'pending',
      createdAt: today,
    }).run();

    // Request data for yesterday
    const request = createRequest({ date: yesterdayString });
    const response = await GET(request);
    const data = await response.json();

    expect(data.date).toBe(yesterdayString);
    expect(data.totalOrders).toBe(1);
    expect(data.totalRevenue).toBe(2000);
  });

  it('limits top items to 5', async () => {
    const today = new Date();

    // Insert an order
    testDb.db.insert(orders).values({
      orderNumber: '001',
      total: 10000,
      status: 'pending',
      createdAt: today,
    }).run();

    // Add more menu items
    testDb.db.insert(menuItems).values([
      { name: 'Item 4', category: 'Other', price: 500, sortOrder: 4 },
      { name: 'Item 5', category: 'Other', price: 600, sortOrder: 5 },
      { name: 'Item 6', category: 'Other', price: 700, sortOrder: 6 },
    ]).run();

    // Insert order items for all 6 menu items
    testDb.db.insert(orderItems).values([
      { orderId: 1, menuItemId: 1, quantity: 1, priceAtTime: 1000 },
      { orderId: 1, menuItemId: 2, quantity: 2, priceAtTime: 800 },
      { orderId: 1, menuItemId: 3, quantity: 3, priceAtTime: 1200 },
      { orderId: 1, menuItemId: 4, quantity: 4, priceAtTime: 500 },
      { orderId: 1, menuItemId: 5, quantity: 5, priceAtTime: 600 },
      { orderId: 1, menuItemId: 6, quantity: 6, priceAtTime: 700 },
    ]).run();

    const request = createRequest();
    const response = await GET(request);
    const data = await response.json();

    expect(data.topItems).toHaveLength(5);
  });

  it('returns 500 on database error', async () => {
    mockThrowError = true;

    const request = createRequest();
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch dashboard data');
  });
});
