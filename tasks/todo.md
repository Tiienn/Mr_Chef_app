# Task: Create Auth Middleware

## Plan

Create auth middleware at `src/middleware.ts` that protects all `/dashboard`, `/expenses`, `/attendance` routes - redirects to `/login` if not authenticated.

### Requirements Analysis
- Middleware must check for the `session` cookie
- Protected routes: `/dashboard`, `/expenses`, `/attendance` (and their sub-routes)
- If no session cookie, redirect to `/login`
- Allow access to public routes like `/login`, `/order`, `/api`, `/kitchen`

### Implementation Approach

1. Create `src/middleware.ts` with Next.js middleware
2. Use matcher config to target specific routes
3. Check for session cookie presence
4. Redirect to /login if not authenticated
5. Write comprehensive tests
6. Run tests and linting

## Tasks

- [x] Create middleware at `src/middleware.ts`
- [x] Write tests for the middleware
- [x] Run tests and ensure they pass
- [x] Run linting and ensure it passes
- [x] Commit changes

## Review

### Summary of Changes

**Files created:**
- `src/middleware.ts` - Auth middleware that protects admin routes
- `src/__tests__/middleware.test.ts` - Test suite with 16 test cases

### Implementation Details

The auth middleware:
1. Checks if the current path matches any protected route (`/dashboard`, `/expenses`, `/attendance`)
2. Looks for the `session` cookie on protected routes
3. If no session cookie (or empty value), redirects to `/login`
4. If session cookie exists, allows the request to proceed
5. Uses Next.js `matcher` config to only run on protected routes (better performance)

### Test Coverage
- Redirects all protected routes to /login when no session cookie
- Redirects protected sub-routes (e.g., /dashboard/settings) to /login
- Allows access to protected routes with valid session cookie
- Redirects when session cookie is empty string
- Does not interfere with public routes (/login, /order, /, /api, /kitchen)
