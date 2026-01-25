/**
 * @jest-environment node
 */
import { createTestDb, initTestSchema } from '@/db';
import { adminUsers } from '@/db/schema';
import { createHash } from 'crypto';
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
import { POST } from '@/app/api/auth/login/route';

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

describe('POST /api/auth/login', () => {
  let testDb: { sqlite: Database.Database; db: DbInstance };

  beforeEach(() => {
    testDb = createTestDb();
    initTestSchema(testDb.sqlite);
    mockDb = testDb.db;
    mockThrowError = false;

    // Seed admin user
    testDb.db.insert(adminUsers).values({
      username: 'admin',
      passwordHash: hashPassword('admin123'),
    }).run();
  });

  afterEach(() => {
    testDb.sqlite.close();
    jest.clearAllMocks();
  });

  function createRequest(body: object): Request {
    return new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  it('returns success with valid credentials', async () => {
    const request = createRequest({
      username: 'admin',
      password: 'admin123',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.user).toHaveProperty('id');
    expect(data.user).toHaveProperty('username', 'admin');
  });

  it('sets HTTP-only session cookie on successful login', async () => {
    const request = createRequest({
      username: 'admin',
      password: 'admin123',
    });

    const response = await POST(request);
    const cookies = response.headers.getSetCookie();

    expect(cookies).toHaveLength(1);
    expect(cookies[0]).toContain('session=');
    expect(cookies[0]).toContain('HttpOnly');
    expect(cookies[0]).toContain('Path=/');
    expect(cookies[0].toLowerCase()).toContain('samesite=lax');
  });

  it('returns 401 with invalid username', async () => {
    const request = createRequest({
      username: 'nonexistent',
      password: 'admin123',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Invalid credentials');
  });

  it('returns 401 with invalid password', async () => {
    const request = createRequest({
      username: 'admin',
      password: 'wrongpassword',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Invalid credentials');
  });

  it('returns 400 when username is missing', async () => {
    const request = createRequest({
      password: 'admin123',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Username and password are required');
  });

  it('returns 400 when password is missing', async () => {
    const request = createRequest({
      username: 'admin',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Username and password are required');
  });

  it('returns 400 when both username and password are missing', async () => {
    const request = createRequest({});

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Username and password are required');
  });

  it('returns 500 on database error', async () => {
    mockThrowError = true;

    const request = createRequest({
      username: 'admin',
      password: 'admin123',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Login failed');
  });

  it('generates unique session token each time', async () => {
    const request1 = createRequest({
      username: 'admin',
      password: 'admin123',
    });
    const request2 = createRequest({
      username: 'admin',
      password: 'admin123',
    });

    const response1 = await POST(request1);
    const response2 = await POST(request2);

    const cookies1 = response1.headers.getSetCookie();
    const cookies2 = response2.headers.getSetCookie();

    // Extract session values
    const session1 = cookies1[0].split(';')[0].split('=')[1];
    const session2 = cookies2[0].split(';')[0].split('=')[1];

    expect(session1).not.toBe(session2);
  });

  it('does not reveal whether username exists (same error for invalid username and password)', async () => {
    const invalidUsernameRequest = createRequest({
      username: 'nonexistent',
      password: 'admin123',
    });
    const invalidPasswordRequest = createRequest({
      username: 'admin',
      password: 'wrongpassword',
    });

    const response1 = await POST(invalidUsernameRequest);
    const response2 = await POST(invalidPasswordRequest);

    const data1 = await response1.json();
    const data2 = await response2.json();

    // Both should return the same error to prevent username enumeration
    expect(response1.status).toBe(response2.status);
    expect(data1.error).toBe(data2.error);
  });
});
