import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { attendance, staff } from '@/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

interface SetAttendanceRequest {
  staffId: number;
  date: string;
  status: 'present' | 'absent' | 'day_off';
}

function isValidDate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

const VALID_STATUSES = ['present', 'absent', 'day_off'] as const;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    if (!isValidDate(startDate) || !isValidDate(endDate)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    const db = getDb();

    // Fetch all active staff
    const staffList = await db
      .select()
      .from(staff)
      .where(eq(staff.active, true));

    // Fetch attendance records for the date range
    const attendanceRecords = await db
      .select()
      .from(attendance)
      .where(
        and(
          gte(attendance.date, startDate),
          lte(attendance.date, endDate)
        )
      );

    return NextResponse.json({
      staff: staffList,
      attendance: attendanceRecords,
    });
  } catch (error) {
    console.error('Failed to fetch attendance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body: SetAttendanceRequest = await request.json();

    // Validate required fields
    if (!body.staffId || typeof body.staffId !== 'number') {
      return NextResponse.json(
        { error: 'staffId is required and must be a number' },
        { status: 400 }
      );
    }

    if (!body.date || !isValidDate(body.date)) {
      return NextResponse.json(
        { error: 'date is required in YYYY-MM-DD format' },
        { status: 400 }
      );
    }

    if (!body.status || !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json(
        { error: 'status must be one of: present, absent, day_off' },
        { status: 400 }
      );
    }

    const db = getDb();

    // Check if staff exists and is active
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

    // Check if attendance record already exists for this staff/date
    const [existing] = await db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.staffId, body.staffId),
          eq(attendance.date, body.date)
        )
      );

    if (existing) {
      // Update existing record
      const [result] = await db
        .update(attendance)
        .set({ status: body.status })
        .where(eq(attendance.id, existing.id))
        .returning();

      return NextResponse.json(result);
    }

    // Create new record
    const [result] = await db
      .insert(attendance)
      .values({
        staffId: body.staffId,
        date: body.date,
        status: body.status,
      })
      .returning();

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Failed to set attendance:', error);
    return NextResponse.json(
      { error: 'Failed to set attendance' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get('staffId');
    const date = searchParams.get('date');

    if (!staffId || !date) {
      return NextResponse.json(
        { error: 'staffId and date are required' },
        { status: 400 }
      );
    }

    const staffIdNum = parseInt(staffId, 10);
    if (isNaN(staffIdNum)) {
      return NextResponse.json(
        { error: 'Invalid staffId' },
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

    // Check if record exists
    const [existing] = await db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.staffId, staffIdNum),
          eq(attendance.date, date)
        )
      );

    if (!existing) {
      return NextResponse.json(
        { error: 'Attendance record not found' },
        { status: 404 }
      );
    }

    await db.delete(attendance)
      .where(eq(attendance.id, existing.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete attendance:', error);
    return NextResponse.json(
      { error: 'Failed to delete attendance' },
      { status: 500 }
    );
  }
}
