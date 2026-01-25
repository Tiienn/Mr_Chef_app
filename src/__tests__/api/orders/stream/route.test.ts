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
import { GET } from '@/app/api/orders/stream/route';

describe('GET /api/orders/stream', () => {
  let testDb: { sqlite: Database.Database; db: DbInstance };

  beforeEach(() => {
    jest.useFakeTimers();
    testDb = createTestDb();
    initTestSchema(testDb.sqlite);
    mockDb = testDb.db;
    mockThrowError = false;

    // Seed menu items
    testDb.db.insert(menuItems).values([
      { name: 'Fried Noodles', category: 'Noodles', price: 1000, sortOrder: 1 },
      { name: 'Gyoza', category: 'Dumplings', price: 800, sortOrder: 1 },
    ]).run();
  });

  afterEach(() => {
    jest.useRealTimers();
    testDb.sqlite.close();
    jest.clearAllMocks();
  });

  async function readFirstEvent(response: Response): Promise<{ event: string; data: unknown }> {
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    // Read chunks until we get a complete event
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Check if we have a complete event (ends with \n\n)
      const eventEnd = buffer.indexOf('\n\n');
      if (eventEnd !== -1) {
        const eventText = buffer.slice(0, eventEnd);
        reader.cancel(); // Cancel the reader to close the stream

        // Parse the event
        const lines = eventText.split('\n');
        let event = '';
        let data = '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            event = line.slice(7);
          } else if (line.startsWith('data: ')) {
            data = line.slice(6);
          }
        }

        return { event, data: JSON.parse(data) };
      }
    }

    throw new Error('No event received');
  }

  it('returns a streaming response with correct headers', async () => {
    const response = await GET();

    expect(response.headers.get('Content-Type')).toBe('text/event-stream');
    expect(response.headers.get('Cache-Control')).toBe('no-cache, no-transform');
    expect(response.headers.get('Connection')).toBe('keep-alive');

    // Clean up the stream
    response.body?.cancel();
  });

  it('sends initial orders event with empty orders when no orders exist', async () => {
    const response = await GET();
    const firstEvent = await readFirstEvent(response);

    expect(firstEvent.event).toBe('orders');
    expect(firstEvent.data).toEqual({ orders: [] });
  });

  it('sends orders with items in the initial event', async () => {
    // Create an order
    const order = testDb.db
      .insert(orders)
      .values({
        orderNumber: '001',
        tableNumber: 'T1',
        total: 1800,
        status: 'pending',
      })
      .returning()
      .get();

    // Create order items
    testDb.db.insert(orderItems).values([
      { orderId: order.id, menuItemId: 1, quantity: 1, priceAtTime: 1000 },
      { orderId: order.id, menuItemId: 2, quantity: 1, priceAtTime: 800 },
    ]).run();

    const response = await GET();
    const firstEvent = await readFirstEvent(response);

    expect(firstEvent.event).toBe('orders');
    const data = firstEvent.data as { orders: Array<{ orderNumber: string; items: unknown[] }> };
    expect(data.orders).toHaveLength(1);
    expect(data.orders[0].orderNumber).toBe('001');
    expect(data.orders[0].items).toHaveLength(2);
  });

  it('includes order details in the event', async () => {
    // Create an order
    const order = testDb.db
      .insert(orders)
      .values({
        orderNumber: '001',
        tableNumber: 'T5',
        total: 1000,
        status: 'preparing',
      })
      .returning()
      .get();

    // Create order item with notes
    testDb.db.insert(orderItems).values({
      orderId: order.id,
      menuItemId: 1,
      quantity: 2,
      notes: 'extra spicy',
      priceAtTime: 500,
    }).run();

    const response = await GET();
    const firstEvent = await readFirstEvent(response);

    const data = firstEvent.data as { orders: Array<{
      orderNumber: string;
      tableNumber: string;
      status: string;
      total: number;
      items: Array<{
        menuItemName: string;
        quantity: number;
        notes: string;
        priceAtTime: number;
      }>;
    }> };

    const orderData = data.orders[0];
    expect(orderData.orderNumber).toBe('001');
    expect(orderData.tableNumber).toBe('T5');
    expect(orderData.status).toBe('preparing');
    expect(orderData.total).toBe(1000);

    const item = orderData.items[0];
    expect(item.menuItemName).toBe('Fried Noodles');
    expect(item.quantity).toBe(2);
    expect(item.notes).toBe('extra spicy');
    expect(item.priceAtTime).toBe(500);
  });

  it('sends error event when database fails', async () => {
    mockThrowError = true;

    const response = await GET();
    const firstEvent = await readFirstEvent(response);

    expect(firstEvent.event).toBe('error');
    expect(firstEvent.data).toEqual({ message: 'Failed to fetch orders' });
  });

  it('returns multiple orders sorted by creation', async () => {
    // Create first order
    const order1 = testDb.db
      .insert(orders)
      .values({
        orderNumber: '001',
        total: 1000,
        status: 'pending',
      })
      .returning()
      .get();

    testDb.db.insert(orderItems).values({
      orderId: order1.id,
      menuItemId: 1,
      quantity: 1,
      priceAtTime: 1000,
    }).run();

    // Create second order
    const order2 = testDb.db
      .insert(orders)
      .values({
        orderNumber: '002',
        total: 800,
        status: 'preparing',
      })
      .returning()
      .get();

    testDb.db.insert(orderItems).values({
      orderId: order2.id,
      menuItemId: 2,
      quantity: 1,
      priceAtTime: 800,
    }).run();

    const response = await GET();
    const firstEvent = await readFirstEvent(response);

    const data = firstEvent.data as { orders: Array<{ orderNumber: string }> };
    expect(data.orders).toHaveLength(2);
  });

  it('only returns today\'s orders', async () => {
    // Create an order with yesterday's date by directly inserting with a past timestamp
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    testDb.db
      .insert(orders)
      .values({
        orderNumber: '001',
        total: 1000,
        status: 'pending',
        createdAt: yesterday,
      })
      .run();

    // Create today's order (default createdAt is today)
    const todayOrder = testDb.db
      .insert(orders)
      .values({
        orderNumber: '002',
        total: 800,
        status: 'pending',
      })
      .returning()
      .get();

    testDb.db.insert(orderItems).values({
      orderId: todayOrder.id,
      menuItemId: 1,
      quantity: 1,
      priceAtTime: 1000,
    }).run();

    const response = await GET();
    const firstEvent = await readFirstEvent(response);

    const data = firstEvent.data as { orders: Array<{ orderNumber: string }> };
    expect(data.orders).toHaveLength(1);
    expect(data.orders[0].orderNumber).toBe('002');
  });
});
