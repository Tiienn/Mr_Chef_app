# Task: Connect Kitchen Display to SSE Stream

## Plan

Create a kitchen display page that connects to the SSE stream endpoint so new orders appear automatically without page refresh.

### Requirements Analysis
- Kitchen display page at `/kitchen` route
- Connect to SSE endpoint at `/api/orders/stream`
- Display orders in a card-based queue layout organized by status
- Real-time updates when new orders arrive
- Mobile-first, touch-friendly design

### Implementation Approach

1. Create the kitchen display page at `src/app/(admin)/kitchen/page.tsx`
2. Implement SSE connection hook using useEffect
3. Display orders organized by status (pending, preparing, ready, served)
4. Write tests for the kitchen display page
5. Run tests and linting

## Todo Items

- [ ] Create kitchen display page at `src/app/(admin)/kitchen/page.tsx`
- [ ] Write tests for the kitchen display page
- [ ] Run tests and ensure they pass
- [ ] Run linting and ensure it passes
- [ ] Commit changes
