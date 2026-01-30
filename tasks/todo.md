# Add Wages Feature

## Tasks
- [x] Add `wages` table to schema (`src/db/schema.ts`)
- [x] Create wages API route (`src/app/api/wages/route.ts`)
- [x] Create wages page (`src/app/(admin)/wages/page.tsx`)
- [x] Add route protection in middleware
- [x] Add Wages card to home page navigation
- [x] Push schema to Turso database
- [x] Verify build passes

## Review

### Summary of Changes
Five files were modified/created to add wage payment tracking:

1. **`src/db/schema.ts`** — Added `wages` table (id, staffId FK, amount in cents, date, note, createdAt), `wagesRelations`, updated `staffRelations` to include wages, exported `Wage` and `NewWage` types.

2. **`src/app/api/wages/route.ts`** (new) — GET with date range filtering, joins staff name, returns totals per staff member + grand total. POST validates staffId/amount/date and creates entry. DELETE removes by id.

3. **`src/app/(admin)/wages/page.tsx`** (new) — Staff dropdown, amount input (Rs), date picker (defaults today), optional note field. Shows payment list with staff name, date, amount. Totals by staff + grand total card. Date range filter. Follows same patterns as expenses page.

4. **`src/middleware.ts`** — Added `/wages` to `protectedRoutes` array and `/wages/:path*` to matcher config.

5. **`src/app/page.tsx`** — Added Wages nav card with Banknote icon (green color scheme).

### Notes
- Amount stored in cents (same as expenses), displayed as `Rs X`
- Wages table is separate from the existing "wages" category in expenses — this tracks individual staff payments
- Schema pushed to Turso successfully
- Build passes with no errors
