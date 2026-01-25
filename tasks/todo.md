# Task: Calendar Day Cells with Color-Coded Attendance Status

## Objective
Implement calendar day cells that show color-coded attendance status for each staff member.

## Plan

### 1. Create Attendance API Route (`/api/attendance/route.ts`)
- **GET**: Fetch attendance records for a month with staff info
- **POST**: Set attendance status for a staff member on a date
- **PATCH**: Update attendance status

### 2. Create Attendance Calendar Page (`/app/(admin)/attendance/page.tsx`)
- Month view calendar with navigation
- Each day cell shows colored dots/indicators for each staff member
- Color coding:
  - Green = Present
  - Red = Absent
  - Gray = Day Off
- Click on a day to mark/update attendance

### 3. Update Middleware
- Add `/attendance` to protected routes (if not already)

### 4. Write Tests
- Test for attendance API (GET, POST, PATCH)

### 5. Run Tests and Lint
- Ensure all tests pass
- Ensure linting passes

### 6. Commit Changes

## Todo Items
- [ ] Create attendance API route (`/api/attendance/route.ts`)
- [ ] Create attendance calendar page with color-coded day cells
- [ ] Update middleware to protect `/attendance` route
- [ ] Write tests for attendance API
- [ ] Run tests and ensure they pass
- [ ] Run linting and ensure it passes
- [ ] Commit changes

## Review

### Summary of Changes

1. **Created Attendance API Route** (`/src/app/api/attendance/route.ts`)
   - GET: Fetches active staff and attendance records for a date range
   - POST: Creates or updates attendance status for a staff member on a date
   - DELETE: Removes an attendance record

2. **Created Attendance Calendar Page** (`/src/app/(admin)/attendance/page.tsx`)
   - Month view calendar with navigation (prev/next month, today button)
   - Each day cell displays color-coded dots for each staff member:
     - Green = Present
     - Red = Absent
     - Gray = Day Off
   - Click on a day to open dialog for marking attendance
   - Staff summary card showing monthly attendance counts per staff member
   - Legend showing color meanings

3. **Middleware Already Protected** `/attendance` route (was already in place)

4. **Created API Tests** (`/src/__tests__/api/attendance/route.test.ts`)
   - 24 tests covering GET, POST, DELETE operations
   - Tests for validation, error handling, and success cases

### Files Added/Modified
- `src/app/api/attendance/route.ts` (new)
- `src/app/(admin)/attendance/page.tsx` (new)
- `src/__tests__/api/attendance/route.test.ts` (new)
- `tasks/todo.md` (updated)
