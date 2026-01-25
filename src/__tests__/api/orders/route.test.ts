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
import { POST } from '@/app/api/orders/route';

describe('POST /api/orders', () => {
  let testDb: { sqlite: Database.Database; db: DbInstance };

  beforeEach(() => {
    testDb = createTestDb();
    initTestSchema(testDb.sqlite);
    mockDb = testDb.db;
    mockThrowError = false;

    // Seed menu items
    testDb.db.insert(menuItems).values([
      { name: 'Fried Noodles', category: 'Noodles', price: 1000, sortOrder: 1 },
      { name: 'Gyoza', category: 'Dumplings', price: 800, sortOrder: 1 },
      { name: 'Fried Rice', category: 'Fried Rice', price: 1200, sortOrder: 1 },
    ]).run();
  });

  afterEach(() => {
    testDb.sqlite.close();
    jest.clearAllMocks();
  });

  function createRequest(body: object): Request {
    return new Request('http://localhost/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  it('creates an order with a single item', async () => {
    const request = createRequest({
      items: [{ menuItemId: 1, quantity: 2 }],
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('orderId');
    expect(data).toHaveProperty('orderNumber', '001');

    // Verify order was created
    const order = testDb.db.select().from(orders).all()[0];
    expect(order.status).toBe('pending');
    expect(order.total).toBe(2000); // 2 x 1000

    // Verify order items were created
    const items = testDb.db.select().from(orderItems).all();
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(2);
    expect(items[0].priceAtTime).toBe(1000);
  });

  it('creates an order with multiple items', async () => {
    const request = createRequest({
      items: [
        { menuItemId: 1, quantity: 1 },
        { menuItemId: 2, quantity: 3 },
        { menuItemId: 3, quantity: 2 },
      ],
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.orderNumber).toBe('001');

    const order = testDb.db.select().from(orders).all()[0];
    expect(order.total).toBe(1000 + 2400 + 2400); // 1000 + (800*3) + (1200*2) = 5800

    const items = testDb.db.select().from(orderItems).all();
    expect(items).toHaveLength(3);
  });

  it('creates an order with table number', async () => {
    const request = createRequest({
      items: [{ menuItemId: 1, quantity: 1 }],
      tableNumber: 'T5',
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const order = testDb.db.select().from(orders).all()[0];
    expect(order.tableNumber).toBe('T5');
  });

  it('creates an order with item notes', async () => {
    const request = createRequest({
      items: [{ menuItemId: 1, quantity: 1, notes: 'no onion, extra spicy' }],
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const items = testDb.db.select().from(orderItems).all();
    expect(items[0].notes).toBe('no onion, extra spicy');
  });

  it('generates sequential order numbers for same day', async () => {
    // Create first order
    const request1 = createRequest({
      items: [{ menuItemId: 1, quantity: 1 }],
    });
    const response1 = await POST(request1);
    const data1 = await response1.json();
    expect(data1.orderNumber).toBe('001');

    // Create second order
    const request2 = createRequest({
      items: [{ menuItemId: 2, quantity: 1 }],
    });
    const response2 = await POST(request2);
    const data2 = await response2.json();
    expect(data2.orderNumber).toBe('002');

    // Create third order
    const request3 = createRequest({
      items: [{ menuItemId: 3, quantity: 1 }],
    });
    const response3 = await POST(request3);
    const data3 = await response3.json();
    expect(data3.orderNumber).toBe('003');
  });

  it('returns 400 when items array is empty', async () => {
    const request = createRequest({ items: [] });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Order must contain at least one item');
  });

  it('returns 400 when items is not an array', async () => {
    const request = createRequest({ items: 'not an array' });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Order must contain at least one item');
  });

  it('returns 400 when items is missing', async () => {
    const request = createRequest({});

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Order must contain at least one item');
  });

  it('returns 400 when menu item does not exist', async () => {
    const request = createRequest({
      items: [{ menuItemId: 999, quantity: 1 }],
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('One or more menu items not found');
  });

  it('returns 500 on database error', async () => {
    mockThrowError = true;

    const request = createRequest({
      items: [{ menuItemId: 1, quantity: 1 }],
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to create order');
  });

  it('stores the price at time of order', async () => {
    const request = createRequest({
      items: [{ menuItemId: 1, quantity: 1 }],
    });

    await POST(request);

    const items = testDb.db.select().from(orderItems).all();
    expect(items[0].priceAtTime).toBe(1000);
  });
});
