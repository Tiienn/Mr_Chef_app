import { render, screen, waitFor } from '@testing-library/react';
import DashboardPage from '@/app/(admin)/dashboard/page';

// Mock fetch
const mockDashboardData = {
  date: '2026-01-25',
  totalOrders: 15,
  totalRevenue: 25000, // $250.00 in cents
  statusCounts: {
    pending: 3,
    preparing: 5,
    ready: 2,
    served: 5,
  },
  topItems: [
    { menuItemId: 1, menuItemName: 'Fried Noodles - Chicken', totalQuantity: 10 },
    { menuItemId: 2, menuItemName: 'Gyoza', totalQuantity: 8 },
    { menuItemId: 3, menuItemName: 'Fried Rice', totalQuantity: 5 },
  ],
};

describe('DashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    global.fetch = jest.fn(() => new Promise(() => {})) as jest.Mock;

    render(<DashboardPage />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    // Check for loading skeleton cards (they have animate-pulse class)
    const loadingCards = document.querySelectorAll('.animate-pulse');
    expect(loadingCards.length).toBeGreaterThan(0);
  });

  it('renders dashboard data after loading', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockDashboardData),
      })
    ) as jest.Mock;

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('15')).toBeInTheDocument();
    });

    // Check revenue is formatted correctly
    expect(screen.getByText('$250.00')).toBeInTheDocument();
  });

  it('displays order status counts', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockDashboardData),
      })
    ) as jest.Mock;

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Pending: 3')).toBeInTheDocument();
      expect(screen.getByText('Preparing: 5')).toBeInTheDocument();
      expect(screen.getByText('Ready: 2')).toBeInTheDocument();
      expect(screen.getByText('Served: 5')).toBeInTheDocument();
    });
  });

  it('displays top selling items', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockDashboardData),
      })
    ) as jest.Mock;

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Fried Noodles - Chicken')).toBeInTheDocument();
      expect(screen.getByText('Gyoza')).toBeInTheDocument();
      expect(screen.getByText('Fried Rice')).toBeInTheDocument();
    });

    // Check sold counts
    expect(screen.getByText('10 sold')).toBeInTheDocument();
    expect(screen.getByText('8 sold')).toBeInTheDocument();
    expect(screen.getByText('5 sold')).toBeInTheDocument();
  });

  it('displays active orders count correctly', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockDashboardData),
      })
    ) as jest.Mock;

    render(<DashboardPage />);

    await waitFor(() => {
      // Active orders = pending + preparing + ready = 3 + 5 + 2 = 10
      expect(screen.getByText('10')).toBeInTheDocument();
    });
  });

  it('displays error state when fetch fails', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
      })
    ) as jest.Mock;

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch dashboard data')).toBeInTheDocument();
    });
  });

  it('displays empty state when no top items', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            ...mockDashboardData,
            topItems: [],
          }),
      })
    ) as jest.Mock;

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('No orders yet today')).toBeInTheDocument();
    });
  });

  it('formats date correctly', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockDashboardData),
      })
    ) as jest.Mock;

    render(<DashboardPage />);

    await waitFor(() => {
      // Date format: "Saturday, January 25, 2026"
      expect(screen.getByText(/January 25, 2026/)).toBeInTheDocument();
    });
  });

  it('displays zero values when no orders', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            date: '2026-01-25',
            totalOrders: 0,
            totalRevenue: 0,
            statusCounts: {
              pending: 0,
              preparing: 0,
              ready: 0,
              served: 0,
            },
            topItems: [],
          }),
      })
    ) as jest.Mock;

    render(<DashboardPage />);

    await waitFor(() => {
      // Multiple zero values displayed
      const zeroElements = screen.getAllByText('0');
      expect(zeroElements.length).toBeGreaterThan(0);
      // Revenue should be $0.00
      expect(screen.getByText('$0.00')).toBeInTheDocument();
    });
  });

  it('handles network errors gracefully', async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error('Network error'))) as jest.Mock;

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('renders stat cards with correct icons', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockDashboardData),
      })
    ) as jest.Mock;

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Total Orders')).toBeInTheDocument();
      expect(screen.getByText('Revenue')).toBeInTheDocument();
      expect(screen.getByText('Active Orders')).toBeInTheDocument();
      expect(screen.getByText('Served')).toBeInTheDocument();
    });
  });

  it('renders section headers', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockDashboardData),
      })
    ) as jest.Mock;

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Order Status')).toBeInTheDocument();
      expect(screen.getByText('Top Selling Items')).toBeInTheDocument();
    });
  });
});
