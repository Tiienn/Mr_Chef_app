import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { orders, orderItems, menuItems } from '@/db/schema';
import { and, gte, lt, eq } from 'drizzle-orm';

interface OrderItemRequest {
  menuItemId: number;
  quantity: number;
  notes?: string;
}

interface CreateOrderRequest {
  items: OrderItemRequest[];
  tableNumber?: string;
}

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

function generateOrderNumber(count: number): string {
  return String(count + 1).padStart(3, '0');
}

export async function POST(request: Request) {
  try {
    const body: CreateOrderRequest = await request.json();

    // Validate request
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Order must contain at least one item' },
        { status: 400 }
      );
    }

    const db = getDb();

    // Validate menu items exist and get their current prices
    const menuItemIds = body.items.map((item) => item.menuItemId);
    const allMenuItems = await db.select().from(menuItems);
    const menuItemsData = allMenuItems.filter((item) => menuItemIds.includes(item.id));

    if (menuItemsData.length !== menuItemIds.length) {
      return NextResponse.json(
        { error: 'One or more menu items not found' },
        { status: 400 }
      );
    }

    // Create a map for quick price lookup
    const menuItemPriceMap = new Map(
      menuItemsData.map((item) => [item.id, item.price])
    );

    // Calculate total
    let total = 0;
    for (const item of body.items) {
      const price = menuItemPriceMap.get(item.menuItemId);
      if (price === undefined) {
        return NextResponse.json(
          { error: `Menu item ${item.menuItemId} not found` },
          { status: 400 }
        );
      }
      total += price * item.quantity;
    }

    // Get today's order count for order number generation
    const now = new Date();
    const startOfDay = getStartOfDay(now);
    const endOfDay = getEndOfDay(now);

    const todaysOrders = await db
      .select()
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, startOfDay),
          lt(orders.createdAt, endOfDay)
        )
      );

    const orderNumber = generateOrderNumber(todaysOrders.length);

    // Create the order
    const [order] = await db
      .insert(orders)
      .values({
        orderNumber,
        tableNumber: body.tableNumber || null,
        total,
        status: 'pending',
      })
      .returning();

    // Create order items
    for (const item of body.items) {
      const price = menuItemPriceMap.get(item.menuItemId)!;
      await db.insert(orderItems)
        .values({
          orderId: order.id,
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          notes: item.notes || null,
          priceAtTime: price,
        });
    }

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.orderNumber,
    });
  } catch (error) {
    console.error('Failed to create order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

interface UpdateOrderRequest {
  orderId: number;
  status: 'pending' | 'preparing' | 'ready' | 'served';
}

export async function PATCH(request: Request) {
  try {
    const body: UpdateOrderRequest = await request.json();

    if (!body.orderId || !body.status) {
      return NextResponse.json(
        { error: 'Order ID and status are required' },
        { status: 400 }
      );
    }

    const validStatuses = ['pending', 'preparing', 'ready', 'served'];
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    const db = getDb();

    // Check if order exists
    const [existingOrder] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, body.orderId));

    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Update order status
    const [updatedOrder] = await db
      .update(orders)
      .set({
        status: body.status,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, body.orderId))
      .returning();

    return NextResponse.json({
      orderId: updatedOrder.id,
      status: updatedOrder.status,
    });
  } catch (error) {
    console.error('Failed to update order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}
