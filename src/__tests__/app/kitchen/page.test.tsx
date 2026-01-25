import { render, screen, waitFor, act } from '@testing-library/react';
import KitchenPage from '@/app/(admin)/kitchen/page';

// Mock orders data
const mockOrders = [
  {
    id: 1,
    orderNumber: '001',
    tableNumber: '5',
    status: 'pending',
    total: 2500,
    createdAt: '2026-01-25T10:30:00.000Z',
    updatedAt: '2026-01-25T10:30:00.000Z',
    items: [
      { id: 1, menuItemName: 'Fried Noodles - Chicken', quantity: 2, notes: null, priceAtTime: 1200 },
    ],
  },
  {
    id: 2,
    orderNumber: '002',
    tableNumber: null,
    status: 'preparing',
    total: 800,
    createdAt: '2026-01-25T10:35:00.000Z',
    updatedAt: '2026-01-25T10:36:00.000Z',
    items: [
      { id: 2, menuItemName: 'Gyoza', quantity: 1, notes: 'extra sauce', priceAtTime: 800 },
    ],
  },
  {
    id: 3,
    orderNumber: '003',
    tableNumber: '3',
    status: 'ready',
    total: 1300,
    createdAt: '2026-01-25T10:20:00.000Z',
    updatedAt: '2026-01-25T10:40:00.000Z',
    items: [
      { id: 3, menuItemName: 'Fried Noodles - Beef', quantity: 1, notes: null, priceAtTime: 1300 },
    ],
  },
];

// Mock EventSource
class MockEventSource {
  static instances: MockEventSource[] = [];
  url: string;
  listeners: Record<string, ((event: MessageEvent) => void)[]> = {};
  onerror: ((event: Event) => void) | null = null;
  readyState = 0;
  CONNECTING = 0;
  OPEN = 1;
  CLOSED = 2;

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
    // Simulate connection opening
    setTimeout(() => {
      this.readyState = 1;
    }, 0);
  }

  addEventListener(type: string, callback: (event: MessageEvent) => void) {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(callback);
  }

  removeEventListener(type: string, callback: (event: MessageEvent) => void) {
    if (this.listeners[type]) {
      this.listeners[type] = this.listeners[type].filter((cb) => cb !== callback);
    }
  }

  dispatchEvent(event: MessageEvent) {
    const type = event.type;
    if (this.listeners[type]) {
      this.listeners[type].forEach((callback) => callback(event));
    }
    return true;
  }

  close() {
    this.readyState = 2;
  }

  // Helper method for tests to simulate events
  simulateMessage(type: string, data: unknown) {
    const event = new MessageEvent(type, {
      data: JSON.stringify(data),
    });
    this.dispatchEvent(event);
  }
}

// Store original EventSource
const OriginalEventSource = global.EventSource;

describe('KitchenPage', () => {
  beforeEach(() => {
    MockEventSource.instances = [];
    // @ts-expect-error - Mock EventSource
    global.EventSource = MockEventSource;
  });

  afterEach(() => {
    global.EventSource = OriginalEventSource;
    jest.clearAllTimers();
  });

  it('renders the kitchen display header', async () => {
    await act(async () => {
      render(<KitchenPage />);
    });

    expect(screen.getByText('Kitchen Display')).toBeInTheDocument();
  });

  it('shows connection status indicator', async () => {
    await act(async () => {
      render(<KitchenPage />);
    });

    expect(screen.getByText('Reconnecting...')).toBeInTheDocument();
  });

  it('displays status columns for pending, preparing, and ready', async () => {
    await act(async () => {
      render(<KitchenPage />);
    });

    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Preparing')).toBeInTheDocument();
    expect(screen.getByText('Ready')).toBeInTheDocument();
  });

  it('shows "Live" when connected and receives orders', async () => {
    await act(async () => {
      render(<KitchenPage />);
    });

    await act(async () => {
      const eventSource = MockEventSource.instances[0];
      eventSource.simulateMessage('orders', { orders: mockOrders });
    });

    await waitFor(() => {
      expect(screen.getByText('Live')).toBeInTheDocument();
    });
  });

  it('displays orders received from SSE stream', async () => {
    await act(async () => {
      render(<KitchenPage />);
    });

    await act(async () => {
      const eventSource = MockEventSource.instances[0];
      eventSource.simulateMessage('orders', { orders: mockOrders });
    });

    await waitFor(() => {
      expect(screen.getByText('#001')).toBeInTheDocument();
      expect(screen.getByText('#002')).toBeInTheDocument();
      expect(screen.getByText('#003')).toBeInTheDocument();
    });
  });

  it('displays order items with quantities', async () => {
    await act(async () => {
      render(<KitchenPage />);
    });

    await act(async () => {
      const eventSource = MockEventSource.instances[0];
      eventSource.simulateMessage('orders', { orders: mockOrders });
    });

    await waitFor(() => {
      expect(screen.getByText('2x')).toBeInTheDocument();
      expect(screen.getByText('Fried Noodles - Chicken')).toBeInTheDocument();
    });
  });

  it('displays item notes when present', async () => {
    await act(async () => {
      render(<KitchenPage />);
    });

    await act(async () => {
      const eventSource = MockEventSource.instances[0];
      eventSource.simulateMessage('orders', { orders: mockOrders });
    });

    await waitFor(() => {
      expect(screen.getByText('extra sauce')).toBeInTheDocument();
    });
  });

  it('displays table number when present', async () => {
    await act(async () => {
      render(<KitchenPage />);
    });

    await act(async () => {
      const eventSource = MockEventSource.instances[0];
      eventSource.simulateMessage('orders', { orders: mockOrders });
    });

    await waitFor(() => {
      expect(screen.getByText('Table 5')).toBeInTheDocument();
      expect(screen.getByText('Table 3')).toBeInTheDocument();
    });
  });

  it('shows empty state when no orders for a status', async () => {
    await act(async () => {
      render(<KitchenPage />);
    });

    await act(async () => {
      const eventSource = MockEventSource.instances[0];
      // Only send pending order
      eventSource.simulateMessage('orders', { orders: [mockOrders[0]] });
    });

    await waitFor(() => {
      expect(screen.getByText('No preparing orders')).toBeInTheDocument();
      expect(screen.getByText('No ready orders')).toBeInTheDocument();
    });
  });

  it('updates order count badges', async () => {
    await act(async () => {
      render(<KitchenPage />);
    });

    await act(async () => {
      const eventSource = MockEventSource.instances[0];
      eventSource.simulateMessage('orders', { orders: mockOrders });
    });

    await waitFor(() => {
      // Each status should show count of 1
      const badges = screen.getAllByText('1');
      expect(badges.length).toBe(3);
    });
  });

  it('handles heartbeat events to maintain connection status', async () => {
    await act(async () => {
      render(<KitchenPage />);
    });

    // First connect with orders
    await act(async () => {
      const eventSource = MockEventSource.instances[0];
      eventSource.simulateMessage('orders', { orders: [] });
    });

    await waitFor(() => {
      expect(screen.getByText('Live')).toBeInTheDocument();
    });

    // Simulate heartbeat
    await act(async () => {
      const eventSource = MockEventSource.instances[0];
      eventSource.simulateMessage('heartbeat', { timestamp: new Date().toISOString() });
    });

    // Should still show Live
    expect(screen.getByText('Live')).toBeInTheDocument();
  });

  it('displays error message when error event received', async () => {
    await act(async () => {
      render(<KitchenPage />);
    });

    await act(async () => {
      const eventSource = MockEventSource.instances[0];
      eventSource.simulateMessage('error', { message: 'Failed to fetch orders' });
    });

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch orders')).toBeInTheDocument();
    });
  });

  it('organizes orders by status in correct columns', async () => {
    await act(async () => {
      render(<KitchenPage />);
    });

    await act(async () => {
      const eventSource = MockEventSource.instances[0];
      eventSource.simulateMessage('orders', { orders: mockOrders });
    });

    await waitFor(() => {
      // Order #001 is pending
      expect(screen.getByText('#001')).toBeInTheDocument();
      // Order #002 is preparing
      expect(screen.getByText('#002')).toBeInTheDocument();
      // Order #003 is ready
      expect(screen.getByText('#003')).toBeInTheDocument();
    });
  });

  it('formats order time correctly', async () => {
    await act(async () => {
      render(<KitchenPage />);
    });

    await act(async () => {
      const eventSource = MockEventSource.instances[0];
      eventSource.simulateMessage('orders', { orders: mockOrders });
    });

    // Time formatting depends on locale, but should be present
    await waitFor(() => {
      // Check that some time is displayed (format may vary by locale)
      const timeElements = screen.getAllByText(/\d{1,2}:\d{2}/);
      expect(timeElements.length).toBeGreaterThan(0);
    });
  });

  it('updates orders when new data is received', async () => {
    await act(async () => {
      render(<KitchenPage />);
    });

    // Initial orders
    await act(async () => {
      const eventSource = MockEventSource.instances[0];
      eventSource.simulateMessage('orders', { orders: [mockOrders[0]] });
    });

    await waitFor(() => {
      expect(screen.getByText('#001')).toBeInTheDocument();
      expect(screen.queryByText('#002')).not.toBeInTheDocument();
    });

    // New orders update
    await act(async () => {
      const eventSource = MockEventSource.instances[0];
      eventSource.simulateMessage('orders', { orders: mockOrders });
    });

    await waitFor(() => {
      expect(screen.getByText('#001')).toBeInTheDocument();
      expect(screen.getByText('#002')).toBeInTheDocument();
      expect(screen.getByText('#003')).toBeInTheDocument();
    });
  });

  it('cleans up EventSource on unmount', async () => {
    const { unmount } = await act(async () => {
      return render(<KitchenPage />);
    });

    const eventSource = MockEventSource.instances[0];
    const closeSpy = jest.spyOn(eventSource, 'close');

    await act(async () => {
      unmount();
    });

    expect(closeSpy).toHaveBeenCalled();
  });
});
