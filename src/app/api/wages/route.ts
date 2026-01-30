import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { wages, staff } from '@/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

interface CreateWageRequest {
  staffId: number;
  amount: number;
  date: string;
  note?: string;
}

function isValidDate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

function getTodayDateString(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const db = getDb();

    const conditions = [];

    if (startDate) {
      if (!isValidDate(startDate)) {
        return NextResponse.json(
          { error: 'Invalid startDate format. Use YYYY-MM-DD' },
          { status: 400 }
        );
      }
      conditions.push(gte(wages.date, startDate));
    }

    if (endDate) {
      if (!isValidDate(endDate)) {
        return NextResponse.json(
          { error: 'Invalid endDate format. Use YYYY-MM-DD' },
          { status: 400 }
        );
      }
      conditions.push(lte(wages.date, endDate));
    }

    // Query wages joined with staff name
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const wageList = await db
      .select({
        id: wages.id,
        staffId: wages.staffId,
        staffName: staff.name,
        amount: wages.amount,
        date: wages.date,
        note: wages.note,
        createdAt: wages.createdAt,
      })
      .from(wages)
      .innerJoin(staff, eq(wages.staffId, staff.id))
      .where(whereClause)
      .orderBy(desc(wages.date), desc(wages.id));

    // Calculate totals per staff member
    const staffTotals: Record<string, { name: string; total: number }> = {};
    let grandTotal = 0;

    wageList.forEach((wage) => {
      const key = String(wage.staffId);
      if (!staffTotals[key]) {
        staffTotals[key] = { name: wage.staffName, total: 0 };
      }
      staffTotals[key].total += wage.amount;
      grandTotal += wage.amount;
    });

    return NextResponse.json({
      wages: wageList,
      staffTotals,
      grandTotal,
    });
  } catch (error) {
    console.error('Failed to fetch wages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wages' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body: CreateWageRequest = await request.json();

    if (!body.staffId || typeof body.staffId !== 'number') {
      return NextResponse.json(
        { error: 'Staff member is required' },
        { status: 400 }
      );
    }

    if (body.amount === undefined || typeof body.amount !== 'number' || body.amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }

    const date = body.date || getTodayDateString();
    if (!isValidDate(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    const db = getDb();

    // Verify staff member exists
    const [staffMember] = await db
      .select()
      .from(staff)
      .where(eq(staff.id, body.staffId));

    if (!staffMember) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      );
    }

    const [result] = await db
      .insert(wages)
      .values({
        staffId: body.staffId,
        amount: body.amount,
        date: date,
        note: body.note?.trim() || null,
      })
      .returning();

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Failed to create wage entry:', error);
    return NextResponse.json(
      { error: 'Failed to create wage entry' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Wage ID is required' },
        { status: 400 }
      );
    }

    const wageId = parseInt(id, 10);
    if (isNaN(wageId)) {
      return NextResponse.json(
        { error: 'Invalid wage ID' },
        { status: 400 }
      );
    }

    const db = getDb();

    const [existing] = await db
      .select()
      .from(wages)
      .where(eq(wages.id, wageId));

    if (!existing) {
      return NextResponse.json(
        { error: 'Wage entry not found' },
        { status: 404 }
      );
    }

    await db.delete(wages).where(eq(wages.id, wageId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete wage entry:', error);
    return NextResponse.json(
      { error: 'Failed to delete wage entry' },
      { status: 500 }
    );
  }
}
