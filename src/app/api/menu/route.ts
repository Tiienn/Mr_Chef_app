import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { menuItems } from '@/db/schema';

export async function GET() {
  try {
    const db = getDb();
    const items = db.select().from(menuItems).all();
    return NextResponse.json(items);
  } catch (error) {
    console.error('Failed to fetch menu items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch menu items' },
      { status: 500 }
    );
  }
}
