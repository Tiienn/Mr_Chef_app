# Task: Submit Order Functionality

## Plan

Create the submit order functionality that:
1. Saves order to database with status "pending"
2. Auto-generates order number (daily sequential: 001, 002, etc.)

## Todo Items

- [ ] Create POST `/api/orders` endpoint with order number generation logic
- [ ] Update OrderPage to call the API and handle submission
- [ ] Add success/error feedback with toast notifications
- [ ] Write tests for the API endpoint
- [ ] Run tests and linting
- [ ] Commit changes

## Implementation Details

### Order Number Generation
- Format: "001", "002", etc. (padded to 3 digits)
- Resets daily - first order of each day starts at 001
- Query today's orders by date to find the next number

### API Endpoint
- POST `/api/orders`
- Request body: `{ items: [{ menuItemId, quantity, notes? }], tableNumber? }`
- Response: `{ orderId, orderNumber }`

### Frontend Changes
- Replace "Place Order (Coming Soon)" with functional button
- Clear cart on successful submission
- Show success toast with order number
