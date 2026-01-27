import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { expenses } from '@/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

interface CreateExpenseRequest {
  category: 'ingredients' | 'rent' | 'wages' | 'utilities' | 'other';
  description: string;
  amount: number;
  date: string;
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

const VALID_CATEGORIES = ['ingredients', 'rent', 'wages', 'utilities', 'other'] as const;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const category = searchParams.get('category');

    const db = getDb();

    // Build conditions array
    const conditions = [];

    if (startDate) {
      if (!isValidDate(startDate)) {
        return NextResponse.json(
          { error: 'Invalid startDate format. Use YYYY-MM-DD' },
          { status: 400 }
        );
      }
      conditions.push(gte(expenses.date, startDate));
    }

    if (endDate) {
      if (!isValidDate(endDate)) {
        return NextResponse.json(
          { error: 'Invalid endDate format. Use YYYY-MM-DD' },
          { status: 400 }
        );
      }
      conditions.push(lte(expenses.date, endDate));
    }

    if (category && category !== 'all') {
      if (!VALID_CATEGORIES.includes(category as typeof VALID_CATEGORIES[number])) {
        return NextResponse.json(
          { error: 'Invalid category' },
          { status: 400 }
        );
      }
      conditions.push(eq(expenses.category, category as typeof VALID_CATEGORIES[number]));
    }

    // Query expenses with optional filters
    const expenseList = conditions.length > 0
      ? await db.select().from(expenses).where(and(...conditions)).orderBy(desc(expenses.date), desc(expenses.id))
      : await db.select().from(expenses).orderBy(desc(expenses.date), desc(expenses.id));

    // Calculate totals per category
    const categoryTotals: Record<string, number> = {
      ingredients: 0,
      rent: 0,
      wages: 0,
      utilities: 0,
      other: 0,
    };

    let grandTotal = 0;
    expenseList.forEach((expense) => {
      categoryTotals[expense.category] += expense.amount;
      grandTotal += expense.amount;
    });

    return NextResponse.json({
      expenses: expenseList,
      categoryTotals,
      grandTotal,
    });
  } catch (error) {
    console.error('Failed to fetch expenses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expenses' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body: CreateExpenseRequest = await request.json();

    // Validate required fields
    if (!body.category) {
      return NextResponse.json(
        { error: 'Category is required' },
        { status: 400 }
      );
    }

    if (!VALID_CATEGORIES.includes(body.category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    if (!body.description || typeof body.description !== 'string' || body.description.trim() === '') {
      return NextResponse.json(
        { error: 'Description is required' },
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

    const [result] = await db
      .insert(expenses)
      .values({
        category: body.category,
        description: body.description.trim(),
        amount: body.amount,
        date: date,
      })
      .returning();

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Failed to create expense:', error);
    return NextResponse.json(
      { error: 'Failed to create expense' },
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
        { error: 'Expense ID is required' },
        { status: 400 }
      );
    }

    const expenseId = parseInt(id, 10);
    if (isNaN(expenseId)) {
      return NextResponse.json(
        { error: 'Invalid expense ID' },
        { status: 400 }
      );
    }

    const db = getDb();

    // Check if expense exists
    const [existing] = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, expenseId));

    if (!existing) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      );
    }

    await db.delete(expenses).where(eq(expenses.id, expenseId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete expense:', error);
    return NextResponse.json(
      { error: 'Failed to delete expense' },
      { status: 500 }
    );
  }
}
