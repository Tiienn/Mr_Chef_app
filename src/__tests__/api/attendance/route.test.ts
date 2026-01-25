/**
 * @jest-environment node
 */
import { createTestDb, initTestSchema } from '@/db';
import { attendance, staff } from '@/db/schema';
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
import { GET, POST, DELETE } from '@/app/api/attendance/route';

describe('Attendance API', () => {
  let testDb: { sqlite: Database.Database; db: DbInstance };

  beforeEach(() => {
    testDb = createTestDb();
    initTestSchema(testDb.sqlite);
    mockDb = testDb.db;
    mockThrowError = false;

    // Seed staff members
    testDb.db.insert(staff).values([
      { name: 'John Doe', active: true },
      { name: 'Jane Smith', active: true },
      { name: 'Inactive Staff', active: false },
    ]).run();
  });

  afterEach(() => {
    testDb.sqlite.close();
    jest.clearAllMocks();
  });

  describe('GET /api/attendance', () => {
    function createGetRequest(params?: Record<string, string>): Request {
      const searchParams = new URLSearchParams(params);
      const url = params
        ? `http://localhost/api/attendance?${searchParams.toString()}`
        : 'http://localhost/api/attendance';
      return new Request(url, { method: 'GET' });
    }

    it('returns staff and attendance for date range', async () => {
      // Seed attendance
      const staffList = testDb.db.select().from(staff).all();
      testDb.db.insert(attendance).values([
        { staffId: staffList[0].id, date: '2024-01-15', status: 'present' },
        { staffId: staffList[1].id, date: '2024-01-15', status: 'absent' },
      ]).run();

      const request = createGetRequest({ startDate: '2024-01-01', endDate: '2024-01-31' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.staff).toHaveLength(2); // Only active staff
      expect(data.attendance).toHaveLength(2);
    });

    it('returns only active staff members', async () => {
      const request = createGetRequest({ startDate: '2024-01-01', endDate: '2024-01-31' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.staff).toHaveLength(2);
      expect(data.staff.every((s: { active: boolean }) => s.active)).toBe(true);
    });

    it('returns 400 when startDate is missing', async () => {
      const request = createGetRequest({ endDate: '2024-01-31' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('startDate and endDate are required');
    });

    it('returns 400 when endDate is missing', async () => {
      const request = createGetRequest({ startDate: '2024-01-01' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('startDate and endDate are required');
    });

    it('returns 400 for invalid startDate format', async () => {
      const request = createGetRequest({ startDate: '15-01-2024', endDate: '2024-01-31' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid date format. Use YYYY-MM-DD');
    });

    it('returns 400 for invalid endDate format', async () => {
      const request = createGetRequest({ startDate: '2024-01-01', endDate: 'invalid' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid date format. Use YYYY-MM-DD');
    });

    it('returns 500 on database error', async () => {
      mockThrowError = true;

      const request = createGetRequest({ startDate: '2024-01-01', endDate: '2024-01-31' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch attendance');
    });
  });

  describe('POST /api/attendance', () => {
    function createPostRequest(body: object): Request {
      return new Request('http://localhost/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    }

    it('creates a new attendance record', async () => {
      const staffList = testDb.db.select().from(staff).all();
      const request = createPostRequest({
        staffId: staffList[0].id,
        date: '2024-01-15',
        status: 'present',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.staffId).toBe(staffList[0].id);
      expect(data.date).toBe('2024-01-15');
      expect(data.status).toBe('present');

      // Verify in database
      const record = testDb.db.select().from(attendance).all()[0];
      expect(record.status).toBe('present');
    });

    it('updates existing attendance record', async () => {
      const staffList = testDb.db.select().from(staff).all();

      // Create initial record
      testDb.db.insert(attendance).values({
        staffId: staffList[0].id,
        date: '2024-01-15',
        status: 'present',
      }).run();

      // Update to absent
      const request = createPostRequest({
        staffId: staffList[0].id,
        date: '2024-01-15',
        status: 'absent',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('absent');

      // Verify only one record exists
      const records = testDb.db.select().from(attendance).all();
      expect(records).toHaveLength(1);
      expect(records[0].status).toBe('absent');
    });

    it('creates attendance with day_off status', async () => {
      const staffList = testDb.db.select().from(staff).all();
      const request = createPostRequest({
        staffId: staffList[0].id,
        date: '2024-01-15',
        status: 'day_off',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.status).toBe('day_off');
    });

    it('returns 400 when staffId is missing', async () => {
      const request = createPostRequest({
        date: '2024-01-15',
        status: 'present',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('staffId is required and must be a number');
    });

    it('returns 400 when date is missing', async () => {
      const staffList = testDb.db.select().from(staff).all();
      const request = createPostRequest({
        staffId: staffList[0].id,
        status: 'present',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('date is required in YYYY-MM-DD format');
    });

    it('returns 400 for invalid date format', async () => {
      const staffList = testDb.db.select().from(staff).all();
      const request = createPostRequest({
        staffId: staffList[0].id,
        date: '15-01-2024',
        status: 'present',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('date is required in YYYY-MM-DD format');
    });

    it('returns 400 when status is missing', async () => {
      const staffList = testDb.db.select().from(staff).all();
      const request = createPostRequest({
        staffId: staffList[0].id,
        date: '2024-01-15',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('status must be one of: present, absent, day_off');
    });

    it('returns 400 for invalid status', async () => {
      const staffList = testDb.db.select().from(staff).all();
      const request = createPostRequest({
        staffId: staffList[0].id,
        date: '2024-01-15',
        status: 'invalid',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('status must be one of: present, absent, day_off');
    });

    it('returns 404 when staff member does not exist', async () => {
      const request = createPostRequest({
        staffId: 999,
        date: '2024-01-15',
        status: 'present',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Staff member not found');
    });

    it('returns 500 on database error', async () => {
      mockThrowError = true;

      const request = createPostRequest({
        staffId: 1,
        date: '2024-01-15',
        status: 'present',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to set attendance');
    });
  });

  describe('DELETE /api/attendance', () => {
    function createDeleteRequest(params?: Record<string, string>): Request {
      const searchParams = new URLSearchParams(params);
      const url = params
        ? `http://localhost/api/attendance?${searchParams.toString()}`
        : 'http://localhost/api/attendance';
      return new Request(url, { method: 'DELETE' });
    }

    it('deletes an existing attendance record', async () => {
      const staffList = testDb.db.select().from(staff).all();

      // Create record
      testDb.db.insert(attendance).values({
        staffId: staffList[0].id,
        date: '2024-01-15',
        status: 'present',
      }).run();

      const records = testDb.db.select().from(attendance).all();
      expect(records).toHaveLength(1);

      const request = createDeleteRequest({
        staffId: String(staffList[0].id),
        date: '2024-01-15',
      });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify deleted
      const remainingRecords = testDb.db.select().from(attendance).all();
      expect(remainingRecords).toHaveLength(0);
    });

    it('returns 400 when staffId is missing', async () => {
      const request = createDeleteRequest({ date: '2024-01-15' });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('staffId and date are required');
    });

    it('returns 400 when date is missing', async () => {
      const request = createDeleteRequest({ staffId: '1' });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('staffId and date are required');
    });

    it('returns 400 for invalid staffId', async () => {
      const request = createDeleteRequest({ staffId: 'invalid', date: '2024-01-15' });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid staffId');
    });

    it('returns 400 for invalid date format', async () => {
      const request = createDeleteRequest({ staffId: '1', date: 'invalid' });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid date format. Use YYYY-MM-DD');
    });

    it('returns 404 when attendance record does not exist', async () => {
      const request = createDeleteRequest({ staffId: '1', date: '2024-01-15' });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Attendance record not found');
    });

    it('returns 500 on database error', async () => {
      mockThrowError = true;

      const request = createDeleteRequest({ staffId: '1', date: '2024-01-15' });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to delete attendance');
    });
  });
});
