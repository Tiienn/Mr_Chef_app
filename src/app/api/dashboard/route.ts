import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { orders, orderItems, menuItems } from '@/db/schema';
import { eq, sql, and, gte, lte } from 'drizzle-orm';

function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getStartOfDay(dateString: string): Date {
  return new Date(dateString + 'T00:00:00');
}

function getEndOfDay(dateString: string): Date {
  return new Date(dateString + 'T23:59:59');
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || getTodayDateString();

    const db = getDb();
    const startOfDay = getStartOfDay(date);
    const endOfDay = getEndOfDay(date);

    // Get all orders for the specified date
    const dayOrders = await db
      .select()
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, startOfDay),
          lte(orders.createdAt, endOfDay)
        )
      );

    // Calculate stats
    const totalOrders = dayOrders.length;
    const totalRevenue = dayOrders.reduce((sum, order) => sum + order.total, 0);

    // Count orders by status
    const statusCounts = {
      pending: 0,
      preparing: 0,
      ready: 0,
      served: 0,
    };

    dayOrders.forEach((order) => {
      const status = order.status as keyof typeof statusCounts;
      if (status in statusCounts) {
        statusCounts[status]++;
      }
    });

    // Get top selling items for the day
    const topItems = await db
      .select({
        menuItemId: orderItems.menuItemId,
        menuItemName: menuItems.name,
        totalQuantity: sql<number>`SUM(${orderItems.quantity})`.as('total_quantity'),
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
      .where(
        and(
          gte(orders.createdAt, startOfDay),
          lte(orders.createdAt, endOfDay)
        )
      )
      .groupBy(orderItems.menuItemId, menuItems.name)
      .orderBy(sql`total_quantity DESC`)
      .limit(5);

    return NextResponse.json({
      date,
      totalOrders,
      totalRevenue,
      statusCounts,
      topItems,
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
