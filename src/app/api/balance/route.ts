import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { dailyBalance } from '@/db/schema';
import { eq } from 'drizzle-orm';

interface SaveBalanceRequest {
  date: string;
  openingBalance?: number;
  closingBalance?: number;
}

function isValidDate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      );
    }

    if (!isValidDate(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    const db = getDb();

    const [balance] = await db
      .select()
      .from(dailyBalance)
      .where(eq(dailyBalance.date, date));

    if (!balance) {
      return NextResponse.json({
        date,
        openingBalance: null,
        closingBalance: null,
      });
    }

    return NextResponse.json({
      id: balance.id,
      date: balance.date,
      openingBalance: balance.openingBalance,
      closingBalance: balance.closingBalance,
    });
  } catch (error) {
    console.error('Failed to get daily balance:', error);
    return NextResponse.json(
      { error: 'Failed to get daily balance' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body: SaveBalanceRequest = await request.json();

    if (!body.date) {
      return NextResponse.json(
        { error: 'Date is required' },
        { status: 400 }
      );
    }

    if (!isValidDate(body.date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    if (body.openingBalance === undefined && body.closingBalance === undefined) {
      return NextResponse.json(
        { error: 'At least one of openingBalance or closingBalance is required' },
        { status: 400 }
      );
    }

    if (body.openingBalance !== undefined && typeof body.openingBalance !== 'number') {
      return NextResponse.json(
        { error: 'openingBalance must be a number' },
        { status: 400 }
      );
    }

    if (body.closingBalance !== undefined && typeof body.closingBalance !== 'number') {
      return NextResponse.json(
        { error: 'closingBalance must be a number' },
        { status: 400 }
      );
    }

    const db = getDb();

    // Check if record exists for this date
    const [existing] = await db
      .select()
      .from(dailyBalance)
      .where(eq(dailyBalance.date, body.date));

    if (existing) {
      // Update existing record
      const updateData: { openingBalance?: number; closingBalance?: number } = {};
      if (body.openingBalance !== undefined) {
        updateData.openingBalance = body.openingBalance;
      }
      if (body.closingBalance !== undefined) {
        updateData.closingBalance = body.closingBalance;
      }

      await db.update(dailyBalance)
        .set(updateData)
        .where(eq(dailyBalance.date, body.date));

      const [updated] = await db
        .select()
        .from(dailyBalance)
        .where(eq(dailyBalance.date, body.date));

      return NextResponse.json({
        id: updated!.id,
        date: updated!.date,
        openingBalance: updated!.openingBalance,
        closingBalance: updated!.closingBalance,
      });
    } else {
      // Create new record - openingBalance is required for new records
      if (body.openingBalance === undefined) {
        return NextResponse.json(
          { error: 'openingBalance is required for new records' },
          { status: 400 }
        );
      }

      const [result] = await db
        .insert(dailyBalance)
        .values({
          date: body.date,
          openingBalance: body.openingBalance,
          closingBalance: body.closingBalance ?? null,
        })
        .returning();

      return NextResponse.json({
        id: result.id,
        date: result.date,
        openingBalance: result.openingBalance,
        closingBalance: result.closingBalance,
      });
    }
  } catch (error) {
    console.error('Failed to save daily balance:', error);
    return NextResponse.json(
      { error: 'Failed to save daily balance' },
      { status: 500 }
    );
  }
}
