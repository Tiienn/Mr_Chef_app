import { NextResponse } from 'next/server';
import { createHash, randomBytes } from 'crypto';
import { getDb } from '@/db';
import { adminUsers } from '@/db/schema';
import { eq } from 'drizzle-orm';

interface LoginRequest {
  username: string;
  password: string;
}

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

function generateSessionToken(): string {
  return randomBytes(32).toString('hex');
}

export async function POST(request: Request) {
  try {
    const body: LoginRequest = await request.json();

    // Validate request
    if (!body.username || !body.password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const db = getDb();

    // Find user by username
    const user = db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.username, body.username))
      .get();

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const passwordHash = hashPassword(body.password);
    if (passwordHash !== user.passwordHash) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate session token
    const sessionToken = generateSessionToken();

    // Create response with session cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
      },
    });

    // Set HTTP-only session cookie
    response.cookies.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Login failed:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
