/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { middleware } from '@/middleware';

function createRequest(path: string, cookies: Record<string, string> = {}): NextRequest {
  const url = `http://localhost${path}`;
  const request = new NextRequest(url, {
    method: 'GET',
  });

  // Set cookies on the request
  Object.entries(cookies).forEach(([name, value]) => {
    request.cookies.set(name, value);
  });

  return request;
}

describe('Auth Middleware', () => {
  describe('Protected routes without session', () => {
    it('redirects /dashboard to /login when no session cookie', () => {
      const request = createRequest('/dashboard');
      const response = middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost/login');
    });

    it('redirects /dashboard/settings to /login when no session cookie', () => {
      const request = createRequest('/dashboard/settings');
      const response = middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost/login');
    });

    it('redirects /expenses to /login when no session cookie', () => {
      const request = createRequest('/expenses');
      const response = middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost/login');
    });

    it('redirects /expenses/reports to /login when no session cookie', () => {
      const request = createRequest('/expenses/reports');
      const response = middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost/login');
    });

    it('redirects /attendance to /login when no session cookie', () => {
      const request = createRequest('/attendance');
      const response = middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost/login');
    });

    it('redirects /attendance/history to /login when no session cookie', () => {
      const request = createRequest('/attendance/history');
      const response = middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost/login');
    });
  });

  describe('Protected routes with valid session', () => {
    it('allows access to /dashboard with session cookie', () => {
      const request = createRequest('/dashboard', { session: 'valid-session-token' });
      const response = middleware(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('location')).toBeNull();
    });

    it('allows access to /dashboard/settings with session cookie', () => {
      const request = createRequest('/dashboard/settings', { session: 'valid-session-token' });
      const response = middleware(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('location')).toBeNull();
    });

    it('allows access to /expenses with session cookie', () => {
      const request = createRequest('/expenses', { session: 'valid-session-token' });
      const response = middleware(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('location')).toBeNull();
    });

    it('allows access to /attendance with session cookie', () => {
      const request = createRequest('/attendance', { session: 'valid-session-token' });
      const response = middleware(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('location')).toBeNull();
    });
  });

  describe('Protected routes with empty session', () => {
    it('redirects /dashboard to /login when session cookie is empty', () => {
      const request = createRequest('/dashboard', { session: '' });
      const response = middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost/login');
    });
  });

  describe('Unprotected routes', () => {
    it('allows access to /login without session', () => {
      const request = createRequest('/login');
      const response = middleware(request);

      expect(response.status).toBe(200);
    });

    it('allows access to /order without session', () => {
      const request = createRequest('/order');
      const response = middleware(request);

      expect(response.status).toBe(200);
    });

    it('allows access to / without session', () => {
      const request = createRequest('/');
      const response = middleware(request);

      expect(response.status).toBe(200);
    });

    it('allows access to /api/auth/login without session', () => {
      const request = createRequest('/api/auth/login');
      const response = middleware(request);

      expect(response.status).toBe(200);
    });

    it('allows access to /kitchen without session', () => {
      const request = createRequest('/kitchen');
      const response = middleware(request);

      expect(response.status).toBe(200);
    });
  });
});
