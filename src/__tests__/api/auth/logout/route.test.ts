/**
 * @jest-environment node
 */
import { POST } from '@/app/api/auth/logout/route';

describe('POST /api/auth/logout', () => {
  it('returns success response', async () => {
    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('clears the session cookie', async () => {
    const response = await POST();
    const cookies = response.headers.getSetCookie();

    expect(cookies).toHaveLength(1);
    expect(cookies[0]).toContain('session=');
    expect(cookies[0]).toContain('Max-Age=0');
    expect(cookies[0]).toContain('HttpOnly');
    expect(cookies[0]).toContain('Path=/');
  });

  it('sets session cookie value to empty string', async () => {
    const response = await POST();
    const cookies = response.headers.getSetCookie();

    // Extract session value - should be empty
    const sessionCookie = cookies[0];
    const sessionValue = sessionCookie.split(';')[0].split('=')[1];

    expect(sessionValue).toBe('');
  });
});
