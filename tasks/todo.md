# Task: Create API Route for Daily Balance

## Overview
Create API route to save/update daily opening and closing balance at `src/app/api/balance/route.ts`.

## Plan

### 1. Create API Route
- [x] Create `src/app/api/balance/route.ts` with:
  - GET endpoint to fetch daily balance for a date (query param: `?date=YYYY-MM-DD`)
  - POST endpoint to save/update opening and closing balance
  - Uses existing `dailyBalance` table from schema

### 2. Write Tests
- [x] Create tests at `src/__tests__/api/balance/route.test.ts`
- [x] Test GET endpoint returns balance for date
- [x] Test POST endpoint creates new balance
- [x] Test POST endpoint updates existing balance (upsert behavior)
- [x] Test validation errors (400)
- [x] Test server errors (500)

### 3. Verify
- [x] Run tests (`npm test`) - 336 tests pass
- [x] Run linting (`npm run lint`) - No warnings or errors

### 4. Commit
- [x] Commit changes with descriptive message

## Review

### Changes Made
Created new API route at `src/app/api/balance/route.ts` with two endpoints:

**GET /api/balance?date=YYYY-MM-DD**
- Fetches daily balance for a specific date
- Returns `{ date, openingBalance, closingBalance }` if exists
- Returns `{ date, openingBalance: null, closingBalance: null }` if no record
- Validation: requires date parameter in YYYY-MM-DD format

**POST /api/balance**
- Creates or updates daily balance record (upsert behavior)
- Request body: `{ date, openingBalance?, closingBalance? }`
- For new records: openingBalance is required
- For existing records: updates only the fields provided
- Returns the created/updated balance record

### Files Created
1. `src/app/api/balance/route.ts` - API route with GET and POST handlers
2. `src/__tests__/api/balance/route.test.ts` - 18 comprehensive tests

### Testing
- All 18 new tests pass
- All 336 total tests pass
- No linting errors
