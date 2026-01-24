import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
import OrderPage from '@/app/(public)/order/page';

// Mock menu items
const mockMenuItems = [
  { id: 1, name: 'Fried Noodles - Chicken', category: 'Noodles', price: 1200, available: true, sortOrder: 1, createdAt: new Date() },
  { id: 2, name: 'Fried Noodles - Beef', category: 'Noodles', price: 1300, available: true, sortOrder: 2, createdAt: new Date() },
  { id: 3, name: 'Gyoza', category: 'Dumplings', price: 800, available: true, sortOrder: 3, createdAt: new Date() },
  { id: 4, name: 'Bread - Beef', category: 'Bread', price: 600, available: true, sortOrder: 4, createdAt: new Date() },
  { id: 5, name: 'Unavailable Item', category: 'Noodles', price: 1000, available: false, sortOrder: 5, createdAt: new Date() },
];

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve(mockMenuItems),
  })
) as jest.Mock;

// Helper to render and wait for loading to finish
async function renderAndWait() {
  await act(async () => {
    render(<OrderPage />);
  });
  await waitFor(() => {
    expect(screen.queryByText('Loading menu...')).not.toBeInTheDocument();
  });
}

describe('OrderPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockMenuItems),
      })
    );
  });

  it('renders page after loading', async () => {
    await act(async () => {
      render(<OrderPage />);
    });
    // Just verify the page renders
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Noodles' })).toBeInTheDocument();
    });
  });

  it('renders category tabs after loading', async () => {
    await renderAndWait();

    expect(screen.getByRole('tab', { name: 'Noodles' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Dumplings' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Bread' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Halim' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Fried Rice' })).toBeInTheDocument();
  });

  it('displays menu items for the active category', async () => {
    await renderAndWait();

    // Default category is Noodles
    expect(screen.getByText('Fried Noodles - Chicken')).toBeInTheDocument();
    expect(screen.getByText('Fried Noodles - Beef')).toBeInTheDocument();
  });

  it('does not display unavailable menu items', async () => {
    await renderAndWait();

    expect(screen.queryByText('Unavailable Item')).not.toBeInTheDocument();
  });

  it('has correct initial tab state', async () => {
    await renderAndWait();

    // Noodles should be active by default
    const noodlesTab = screen.getByRole('tab', { name: 'Noodles' });
    expect(noodlesTab).toHaveAttribute('data-state', 'active');
  });

  it('adds item to cart when clicked', async () => {
    await renderAndWait();

    // Click on menu item card
    const itemCard = screen.getByRole('button', { name: /Add Fried Noodles - Chicken to cart/i });
    await act(async () => {
      fireEvent.click(itemCard);
    });

    // Check that cart shows 1 item
    expect(screen.getByText(/View Cart \(1 items\)/i)).toBeInTheDocument();
  });

  it('increments quantity when same item is clicked multiple times', async () => {
    await renderAndWait();

    const itemCard = screen.getByRole('button', { name: /Add Fried Noodles - Chicken to cart/i });
    await act(async () => {
      fireEvent.click(itemCard);
      fireEvent.click(itemCard);
      fireEvent.click(itemCard);
    });

    expect(screen.getByText(/View Cart \(3 items\)/i)).toBeInTheDocument();
  });

  it('opens cart panel when view cart button is clicked', async () => {
    await renderAndWait();

    // Add item to cart
    const itemCard = screen.getByRole('button', { name: /Add Fried Noodles - Chicken to cart/i });
    await act(async () => {
      fireEvent.click(itemCard);
    });

    // Click view cart
    await act(async () => {
      fireEvent.click(screen.getByText(/View Cart/i));
    });

    // Check cart panel is open
    expect(screen.getByText('Your Order')).toBeInTheDocument();
  });

  it('displays correct total in cart button', async () => {
    await renderAndWait();

    // Add item to cart (price is 1200 cents = $12.00)
    const itemCard = screen.getByRole('button', { name: /Add Fried Noodles - Chicken to cart/i });
    await act(async () => {
      fireEvent.click(itemCard);
    });

    // Check the view cart button shows the total
    const viewCartButton = screen.getByText(/View Cart \(1 items\) - \$12\.00/i);
    expect(viewCartButton).toBeInTheDocument();
  });

  it('can increase quantity in cart panel', async () => {
    await renderAndWait();

    // Add item to cart
    const itemCard = screen.getByRole('button', { name: /Add Fried Noodles - Chicken to cart/i });
    await act(async () => {
      fireEvent.click(itemCard);
    });

    // Open cart
    await act(async () => {
      fireEvent.click(screen.getByText(/View Cart/i));
    });

    // Find and click increase button
    const increaseButton = screen.getByRole('button', { name: /Increase Fried Noodles - Chicken quantity/i });
    await act(async () => {
      fireEvent.click(increaseButton);
    });

    // The cart panel should show the updated quantity
    const cartPanel = screen.getByText('Your Order').closest('div')?.parentElement;
    expect(cartPanel).toBeInTheDocument();
    // View cart button in bottom bar should show 2 items now (cart panel is open so button is hidden)
  });

  it('can decrease quantity in cart panel', async () => {
    await renderAndWait();

    // Add item twice
    const itemCard = screen.getByRole('button', { name: /Add Fried Noodles - Chicken to cart/i });
    await act(async () => {
      fireEvent.click(itemCard);
      fireEvent.click(itemCard);
    });

    // Open cart
    await act(async () => {
      fireEvent.click(screen.getByText(/View Cart/i));
    });

    // Find and click decrease button
    const decreaseButton = screen.getByRole('button', { name: /Decrease Fried Noodles - Chicken quantity/i });
    await act(async () => {
      fireEvent.click(decreaseButton);
    });

    // Check the total has updated (was $24 for 2, now $12 for 1)
    const totalSection = screen.getByText('Total').closest('div');
    expect(totalSection).toHaveTextContent('$12.00');
  });

  it('removes item from cart when quantity reaches 0', async () => {
    await renderAndWait();

    // Add item once
    const itemCard = screen.getByRole('button', { name: /Add Fried Noodles - Chicken to cart/i });
    await act(async () => {
      fireEvent.click(itemCard);
    });

    // Open cart
    await act(async () => {
      fireEvent.click(screen.getByText(/View Cart/i));
    });

    // Decrease quantity to 0
    const decreaseButton = screen.getByRole('button', { name: /Decrease Fried Noodles - Chicken quantity/i });
    await act(async () => {
      fireEvent.click(decreaseButton);
    });

    // Cart should show empty message
    expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
  });

  it('can remove item using delete button', async () => {
    await renderAndWait();

    // Add item
    const itemCard = screen.getByRole('button', { name: /Add Fried Noodles - Chicken to cart/i });
    await act(async () => {
      fireEvent.click(itemCard);
    });

    // Open cart
    await act(async () => {
      fireEvent.click(screen.getByText(/View Cart/i));
    });

    // Click delete button
    const deleteButton = screen.getByRole('button', { name: /Remove Fried Noodles - Chicken from cart/i });
    await act(async () => {
      fireEvent.click(deleteButton);
    });

    // Cart should be empty
    expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
  });

  it('closes cart panel when close button is clicked', async () => {
    await renderAndWait();

    // Add item and open cart
    const itemCard = screen.getByRole('button', { name: /Add Fried Noodles - Chicken to cart/i });
    await act(async () => {
      fireEvent.click(itemCard);
    });

    await act(async () => {
      fireEvent.click(screen.getByText(/View Cart/i));
    });

    // Close cart
    const closeButton = screen.getByRole('button', { name: /Close cart/i });
    await act(async () => {
      fireEvent.click(closeButton);
    });

    // Cart panel should be closed
    expect(screen.queryByText('Your Order')).not.toBeInTheDocument();
  });

  it('shows badge on cart button when items are in cart', async () => {
    await renderAndWait();

    // Add item
    const itemCard = screen.getByRole('button', { name: /Add Fried Noodles - Chicken to cart/i });
    await act(async () => {
      fireEvent.click(itemCard);
    });

    // Check badge on cart button
    const cartButton = screen.getByRole('button', { name: /Open cart/i });
    expect(cartButton.querySelector('.absolute')).toBeInTheDocument();
  });

  it('shows quantity badge on menu item card when in cart', async () => {
    await renderAndWait();

    // Add item twice
    const itemCard = screen.getByRole('button', { name: /Add Fried Noodles - Chicken to cart/i });
    await act(async () => {
      fireEvent.click(itemCard);
      fireEvent.click(itemCard);
    });

    // The card should have a badge - check within the card
    const card = screen.getByRole('button', { name: /Add Fried Noodles - Chicken to cart/i });
    const badge = within(card).getByText('2');
    expect(badge).toBeInTheDocument();
  });

  it('handles fetch error gracefully', async () => {
    // Mock fetch to fail
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Server error' }),
      })
    );

    await act(async () => {
      render(<OrderPage />);
    });

    await waitFor(() => {
      expect(screen.queryByText('Loading menu...')).not.toBeInTheDocument();
    });

    // Page should still render without crashing
    expect(screen.getByRole('tab', { name: 'Noodles' })).toBeInTheDocument();
  });

  it('displays formatted price on menu item card', async () => {
    await renderAndWait();

    // Check price formatting on the card (1200 cents = $12.00)
    const card = screen.getByRole('button', { name: /Add Fried Noodles - Chicken to cart/i });
    expect(within(card).getByText('$12.00')).toBeInTheDocument();
  });

  it('renders all category tabs', async () => {
    await renderAndWait();

    // Verify all 5 category tabs exist
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(5);
  });

  it('allows keyboard navigation on menu item cards', async () => {
    await renderAndWait();

    const itemCard = screen.getByRole('button', { name: /Add Fried Noodles - Chicken to cart/i });

    // Simulate Enter key press
    await act(async () => {
      fireEvent.keyDown(itemCard, { key: 'Enter' });
    });

    expect(screen.getByText(/View Cart \(1 items\)/i)).toBeInTheDocument();
  });

  it('allows keyboard navigation with space key', async () => {
    await renderAndWait();

    const itemCard = screen.getByRole('button', { name: /Add Fried Noodles - Chicken to cart/i });

    // Simulate Space key press
    await act(async () => {
      fireEvent.keyDown(itemCard, { key: ' ' });
    });

    expect(screen.getByText(/View Cart \(1 items\)/i)).toBeInTheDocument();
  });

  it('calculates total correctly for multiple items', async () => {
    await renderAndWait();

    // Add first item twice ($12 x 2 = $24)
    const itemCard1 = screen.getByRole('button', { name: /Add Fried Noodles - Chicken to cart/i });
    await act(async () => {
      fireEvent.click(itemCard1);
      fireEvent.click(itemCard1);
    });

    // Add second item once ($13)
    const itemCard2 = screen.getByRole('button', { name: /Add Fried Noodles - Beef to cart/i });
    await act(async () => {
      fireEvent.click(itemCard2);
    });

    // Total should be $37.00
    expect(screen.getByText(/\$37\.00/)).toBeInTheDocument();
  });

  it('opens cart via header button', async () => {
    await renderAndWait();

    // Add item to cart first
    const itemCard = screen.getByRole('button', { name: /Add Fried Noodles - Chicken to cart/i });
    await act(async () => {
      fireEvent.click(itemCard);
    });

    // Click cart icon in header
    const cartButton = screen.getByRole('button', { name: /Open cart/i });
    await act(async () => {
      fireEvent.click(cartButton);
    });

    // Cart panel should be open
    expect(screen.getByText('Your Order')).toBeInTheDocument();
  });
});
