# Migrate from SQLite to Turso

## Tasks
- [x] Install `@libsql/client` dependency
- [x] Update `src/db/index.ts` - switch from better-sqlite3 to libsql
- [x] Update `drizzle.config.ts` - change dialect to turso
- [x] Update `src/db/seed.ts` - use async libsql calls
- [x] Update `src/app/api/menu/route.ts` - add await
- [x] Update `src/app/api/orders/route.ts` - add await
- [x] Update `src/app/api/orders/stream/route.ts` - add await (async SSE)
- [x] Update `src/app/api/dashboard/route.ts` - add await
- [x] Update `src/app/api/expenses/route.ts` - add await
- [x] Update `src/app/api/attendance/route.ts` - add await
- [x] Update `src/app/api/staff/route.ts` - add await
- [x] Update `src/app/api/balance/route.ts` - add await
- [x] Update `src/app/api/auth/login/route.ts` - add await
- [x] Move better-sqlite3 to devDependencies
- [x] Verify `npm run build` succeeds

## Review

### Changes Made
1. **`src/db/index.ts`** - Replaced `better-sqlite3` with `@libsql/client`. Uses `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` env vars. Falls back to `file:sqlite.db` for local dev. Removed test helpers (they use better-sqlite3 directly in test files).

2. **`drizzle.config.ts`** - Changed dialect from `sqlite` to `turso`. Updated credentials to use Turso env vars.

3. **`src/db/seed.ts`** - Removed `getSqlite()` usage and raw SQL schema creation. All DB calls now use `await`. Seed works via drizzle ORM only.

4. **All 9 API routes** - Added `await` to every DB query. Changed `.all()` to just awaiting the query (libsql returns arrays). Changed `.get()` to array destructuring `const [result] = await ...`. Changed `.returning().get()` to `.returning()` with destructuring.

5. **`package.json`** - Moved `better-sqlite3` from dependencies to devDependencies. Added `@libsql/client`.

### Next Steps (manual)
1. Install Turso CLI and create database
2. Set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` in Vercel env vars
3. Run `npx drizzle-kit push` to create tables in Turso
4. Run `npm run db:seed` to seed data
5. Deploy and verify
