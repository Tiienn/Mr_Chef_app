# Task: Add Table Number Input Field to Order Summary Panel

## Plan
Add an optional table number input field at the top of the order summary panel's expanded content. The field should be managed via props (controlled component pattern) to keep state in the parent page component, consistent with how cart items are managed.

## Todo Items
- [x] Add tableNumber prop and onTableNumberChange callback to OrderSummaryPanel
- [x] Add table number input field at top of expanded collapsible content
- [x] Update order page to manage tableNumber state
- [x] Write tests for the table number functionality
- [x] Run tests and ensure they pass
- [x] Run linting and ensure it passes
- [x] Commit changes

## Review

### Changes Made
1. **OrderSummaryPanel.tsx**: Added `tableNumber` and `onTableNumberChange` optional props to the component interface and function signature. Added a conditional table number input field at the top of the expanded collapsible content (only renders when `onTableNumberChange` is provided).

2. **order/page.tsx**: Added `tableNumber` state using `useState('')` and passed it along with `setTableNumber` to the OrderSummaryPanel component.

3. **OrderSummaryPanel.test.tsx**: Added 5 new tests for table number functionality:
   - Shows input when `onTableNumberChange` is provided
   - Hides input when `onTableNumberChange` is not provided
   - Displays the provided table number value
   - Calls `onTableNumberChange` when input changes
   - Shows label as optional

### Testing
- All 27 OrderSummaryPanel tests pass
- All 232 tests in the full suite pass
- No ESLint warnings or errors

### Notes
- The table number field is optional (shows "(optional)" label)
- The field only appears when the panel is expanded
- State is managed in the parent component (controlled component pattern) consistent with existing cart state management
