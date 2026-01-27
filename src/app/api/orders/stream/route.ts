import { getDb } from '@/db';
import { orders, orderItems, menuItems } from '@/db/schema';
import { eq, and, gte, lt } from 'drizzle-orm';

function getStartOfDay(date: Date): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

function getEndOfDay(date: Date): Date {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
}

interface OrderWithItems {
  id: number;
  orderNumber: string;
  tableNumber: string | null;
  status: string;
  total: number;
  createdAt: Date | null;
  updatedAt: Date | null;
  items: Array<{
    id: number;
    menuItemName: string;
    quantity: number;
    notes: string | null;
    priceAtTime: number;
  }>;
}

async function fetchTodaysOrders(db: ReturnType<typeof getDb>): Promise<OrderWithItems[]> {
  const now = new Date();
  const startOfDay = getStartOfDay(now);
  const endOfDay = getEndOfDay(now);

  // Get today's orders
  const todaysOrders = await db
    .select()
    .from(orders)
    .where(
      and(
        gte(orders.createdAt, startOfDay),
        lt(orders.createdAt, endOfDay)
      )
    );

  // Get order items with menu item names for each order
  const ordersWithItems: OrderWithItems[] = [];
  for (const order of todaysOrders) {
    const items = await db
      .select({
        id: orderItems.id,
        menuItemName: menuItems.name,
        quantity: orderItems.quantity,
        notes: orderItems.notes,
        priceAtTime: orderItems.priceAtTime,
      })
      .from(orderItems)
      .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
      .where(eq(orderItems.orderId, order.id));

    ordersWithItems.push({
      ...order,
      items,
    });
  }

  return ordersWithItems;
}

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let lastDataHash = '';
      let isControllerClosed = false;

      const sendEvent = (eventType: string, data: unknown) => {
        if (isControllerClosed) return;

        try {
          const eventData = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(eventData));
        } catch {
          // Controller may be closed
          isControllerClosed = true;
        }
      };

      const checkForUpdates = async () => {
        if (isControllerClosed) return;

        try {
          const db = getDb();
          const ordersData = await fetchTodaysOrders(db);
          const currentDataHash = JSON.stringify(ordersData);

          // Send data if it has changed
          if (currentDataHash !== lastDataHash) {
            lastDataHash = currentDataHash;
            sendEvent('orders', { orders: ordersData });
          }
        } catch (error) {
          console.error('SSE: Error fetching orders:', error);
          sendEvent('error', { message: 'Failed to fetch orders' });
        }
      };

      // Send initial data immediately
      checkForUpdates();

      // Poll for updates every 2 seconds
      const intervalId = setInterval(checkForUpdates, 2000);

      // Send heartbeat every 30 seconds to keep connection alive
      const heartbeatId = setInterval(() => {
        if (isControllerClosed) return;
        sendEvent('heartbeat', { timestamp: new Date().toISOString() });
      }, 30000);

      // Cleanup when stream is cancelled
      const cleanup = () => {
        isControllerClosed = true;
        clearInterval(intervalId);
        clearInterval(heartbeatId);
      };

      // Handle controller close
      return cleanup;
    },
    cancel() {
      // Stream was cancelled by client
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

// Prevent static generation for this dynamic route
export const dynamic = 'force-dynamic';
