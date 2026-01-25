import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OrderSummaryPanel } from '@/components/order/OrderSummaryPanel';
import type { MenuItem } from '@/db/schema';

const createMockMenuItem = (overrides: Partial<MenuItem> = {}): MenuItem => ({
  id: 1,
  name: 'Test Item',
  category: 'Noodles',
  price: 1200,
  available: true,
  sortOrder: 1,
  createdAt: new Date(),
  ...overrides,
});

describe('OrderSummaryPanel', () => {
  const mockOnUpdateQuantity = jest.fn();
  const mockOnViewFullCart = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when cart is empty', () => {
    const { container } = render(
      <OrderSummaryPanel
        cart={[]}
        onUpdateQuantity={mockOnUpdateQuantity}
        onViewFullCart={mockOnViewFullCart}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders panel when cart has items', () => {
    const cart = [
      { menuItem: createMockMenuItem(), quantity: 2 },
    ];

    render(
      <OrderSummaryPanel
        cart={cart}
        onUpdateQuantity={mockOnUpdateQuantity}
        onViewFullCart={mockOnViewFullCart}
      />
    );

    expect(screen.getByText('2 items')).toBeInTheDocument();
    expect(screen.getByText('$24.00')).toBeInTheDocument();
  });

  it('shows singular "item" when quantity is 1', () => {
    const cart = [
      { menuItem: createMockMenuItem(), quantity: 1 },
    ];

    render(
      <OrderSummaryPanel
        cart={cart}
        onUpdateQuantity={mockOnUpdateQuantity}
        onViewFullCart={mockOnViewFullCart}
      />
    );

    expect(screen.getByText('1 item')).toBeInTheDocument();
  });

  it('calculates total correctly for multiple items', () => {
    const cart = [
      { menuItem: createMockMenuItem({ id: 1, price: 1000 }), quantity: 2 },
      { menuItem: createMockMenuItem({ id: 2, price: 500 }), quantity: 3 },
    ];

    render(
      <OrderSummaryPanel
        cart={cart}
        onUpdateQuantity={mockOnUpdateQuantity}
        onViewFullCart={mockOnViewFullCart}
      />
    );

    // Total: (1000 * 2) + (500 * 3) = 3500 cents = $35.00
    expect(screen.getByText('$35.00')).toBeInTheDocument();
  });

  it('expands to show items when trigger is clicked', async () => {
    const cart = [
      { menuItem: createMockMenuItem({ name: 'Fried Noodles' }), quantity: 1 },
    ];

    render(
      <OrderSummaryPanel
        cart={cart}
        onUpdateQuantity={mockOnUpdateQuantity}
        onViewFullCart={mockOnViewFullCart}
      />
    );

    // Click to expand
    const trigger = screen.getByRole('button', { name: /expand order summary/i });
    fireEvent.click(trigger);

    // Now item name should be visible
    await waitFor(() => {
      expect(screen.getByText('Fried Noodles')).toBeVisible();
    });
  });

  it('collapses when trigger is clicked again', async () => {
    const cart = [
      { menuItem: createMockMenuItem({ name: 'Fried Noodles' }), quantity: 1 },
    ];

    render(
      <OrderSummaryPanel
        cart={cart}
        onUpdateQuantity={mockOnUpdateQuantity}
        onViewFullCart={mockOnViewFullCart}
      />
    );

    // Expand
    const trigger = screen.getByRole('button', { name: /expand order summary/i });
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Fried Noodles')).toBeVisible();
    });

    // Collapse - the button label changes when open
    const collapseTrigger = screen.getByRole('button', { name: /collapse order summary/i });
    fireEvent.click(collapseTrigger);

    // After collapse, we should see expand button again
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /expand order summary/i })).toBeInTheDocument();
    });
  });

  it('shows line total when expanded', async () => {
    const cart = [
      { menuItem: createMockMenuItem({ name: 'Test Item', price: 1200 }), quantity: 3 },
    ];

    render(
      <OrderSummaryPanel
        cart={cart}
        onUpdateQuantity={mockOnUpdateQuantity}
        onViewFullCart={mockOnViewFullCart}
      />
    );

    // Total should already be visible in collapsed state ($36.00)
    expect(screen.getByText('$36.00')).toBeInTheDocument();

    // Expand to see item details
    fireEvent.click(screen.getByRole('button', { name: /expand order summary/i }));

    // After expanding, item name should be visible
    await waitFor(() => {
      expect(screen.getByText('Test Item')).toBeVisible();
    });
  });

  it('calls onUpdateQuantity with +1 when increase button is clicked', async () => {
    const cart = [
      { menuItem: createMockMenuItem({ id: 42, name: 'Test Item' }), quantity: 1 },
    ];

    render(
      <OrderSummaryPanel
        cart={cart}
        onUpdateQuantity={mockOnUpdateQuantity}
        onViewFullCart={mockOnViewFullCart}
      />
    );

    // Expand to see controls
    fireEvent.click(screen.getByRole('button', { name: /expand order summary/i }));

    // Click increase button
    await waitFor(() => {
      const increaseButton = screen.getByRole('button', { name: /increase test item quantity/i });
      fireEvent.click(increaseButton);
    });

    expect(mockOnUpdateQuantity).toHaveBeenCalledWith(42, 1);
  });

  it('calls onUpdateQuantity with -1 when decrease button is clicked', async () => {
    const cart = [
      { menuItem: createMockMenuItem({ id: 42, name: 'Test Item' }), quantity: 2 },
    ];

    render(
      <OrderSummaryPanel
        cart={cart}
        onUpdateQuantity={mockOnUpdateQuantity}
        onViewFullCart={mockOnViewFullCart}
      />
    );

    // Expand to see controls
    fireEvent.click(screen.getByRole('button', { name: /expand order summary/i }));

    // Click decrease button
    await waitFor(() => {
      const decreaseButton = screen.getByRole('button', { name: /decrease test item quantity/i });
      fireEvent.click(decreaseButton);
    });

    expect(mockOnUpdateQuantity).toHaveBeenCalledWith(42, -1);
  });

  it('calls onViewFullCart when View Full Cart button is clicked', async () => {
    const cart = [
      { menuItem: createMockMenuItem(), quantity: 1 },
    ];

    render(
      <OrderSummaryPanel
        cart={cart}
        onUpdateQuantity={mockOnUpdateQuantity}
        onViewFullCart={mockOnViewFullCart}
      />
    );

    // Expand to see View Full Cart button
    fireEvent.click(screen.getByRole('button', { name: /expand order summary/i }));

    // Click View Full Cart
    await waitFor(() => {
      const viewCartButton = screen.getByRole('button', { name: /view full cart/i });
      fireEvent.click(viewCartButton);
    });

    expect(mockOnViewFullCart).toHaveBeenCalledTimes(1);
  });

  it('shows all cart items when expanded', async () => {
    const cart = [
      { menuItem: createMockMenuItem({ id: 1, name: 'Item One' }), quantity: 1 },
      { menuItem: createMockMenuItem({ id: 2, name: 'Item Two' }), quantity: 2 },
      { menuItem: createMockMenuItem({ id: 3, name: 'Item Three' }), quantity: 3 },
    ];

    render(
      <OrderSummaryPanel
        cart={cart}
        onUpdateQuantity={mockOnUpdateQuantity}
        onViewFullCart={mockOnViewFullCart}
      />
    );

    // Expand
    fireEvent.click(screen.getByRole('button', { name: /expand order summary/i }));

    await waitFor(() => {
      expect(screen.getByText('Item One')).toBeVisible();
      expect(screen.getByText('Item Two')).toBeVisible();
      expect(screen.getByText('Item Three')).toBeVisible();
    });
  });

  it('displays correct item count for multiple items', () => {
    const cart = [
      { menuItem: createMockMenuItem({ id: 1 }), quantity: 2 },
      { menuItem: createMockMenuItem({ id: 2 }), quantity: 3 },
    ];

    render(
      <OrderSummaryPanel
        cart={cart}
        onUpdateQuantity={mockOnUpdateQuantity}
        onViewFullCart={mockOnViewFullCart}
      />
    );

    // Total items: 2 + 3 = 5
    expect(screen.getByText('5 items')).toBeInTheDocument();
  });
});
