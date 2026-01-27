import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { staff } from '@/db/schema';
import { eq } from 'drizzle-orm';

interface CreateStaffRequest {
  name: string;
}

export async function GET() {
  try {
    const db = getDb();

    const staffList = await db
      .select()
      .from(staff)
      .where(eq(staff.active, true));

    return NextResponse.json(staffList);
  } catch (error) {
    console.error('Failed to fetch staff:', error);
    return NextResponse.json(
      { error: 'Failed to fetch staff' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body: CreateStaffRequest = await request.json();

    if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const db = getDb();

    const [result] = await db
      .insert(staff)
      .values({
        name: body.name.trim(),
        active: true,
      })
      .returning();

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Failed to create staff:', error);
    return NextResponse.json(
      { error: 'Failed to create staff' },
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
        { error: 'Staff ID is required' },
        { status: 400 }
      );
    }

    const staffId = parseInt(id, 10);
    if (isNaN(staffId)) {
      return NextResponse.json(
        { error: 'Invalid staff ID' },
        { status: 400 }
      );
    }

    const db = getDb();

    // Soft delete by setting active to false
    const [existing] = await db
      .select()
      .from(staff)
      .where(eq(staff.id, staffId));

    if (!existing) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      );
    }

    await db.update(staff)
      .set({ active: false })
      .where(eq(staff.id, staffId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete staff:', error);
    return NextResponse.json(
      { error: 'Failed to delete staff' },
      { status: 500 }
    );
  }
}
