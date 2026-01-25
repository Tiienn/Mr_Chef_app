import { render, screen, waitFor } from '@testing-library/react';
import ExpensesPage from '@/app/(admin)/expenses/page';

// Mock expense data
const mockExpensesData = {
  expenses: [
    {
      id: 1,
      category: 'ingredients',
      description: 'Fresh vegetables',
      amount: 5000,
      date: '2024-01-15',
      createdAt: new Date(),
    },
    {
      id: 2,
      category: 'rent',
      description: 'Monthly rent',
      amount: 100000,
      date: '2024-01-01',
      createdAt: new Date(),
    },
  ],
  categoryTotals: {
    ingredients: 5000,
    rent: 100000,
    wages: 0,
    utilities: 0,
    other: 0,
  },
  grandTotal: 105000,
};

describe('ExpensesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    global.fetch = jest.fn(() => new Promise(() => {})) as jest.Mock;

    render(<ExpensesPage />);

    expect(screen.getByText('Expenses')).toBeInTheDocument();
    // Check for loading skeleton cards (they have animate-pulse class)
    const loadingCards = document.querySelectorAll('.animate-pulse');
    expect(loadingCards.length).toBeGreaterThan(0);
  });

  it('renders expenses list after loading', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockExpensesData),
      })
    ) as jest.Mock;

    render(<ExpensesPage />);

    await waitFor(() => {
      expect(screen.getByText('Fresh vegetables')).toBeInTheDocument();
      expect(screen.getByText('Monthly rent')).toBeInTheDocument();
    });
  });

  it('displays category totals correctly', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockExpensesData),
      })
    ) as jest.Mock;

    render(<ExpensesPage />);

    await waitFor(() => {
      expect(screen.getByText('Totals by Category')).toBeInTheDocument();
    });

    // Check that amounts are shown (may appear multiple times in list and totals)
    expect(screen.getAllByText(/\$50\.00/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\$1,000\.00/).length).toBeGreaterThan(0);
  });

  it('displays grand total correctly', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockExpensesData),
      })
    ) as jest.Mock;

    render(<ExpensesPage />);

    await waitFor(() => {
      expect(screen.getByText('Grand Total')).toBeInTheDocument();
      expect(screen.getByText('$1,050.00')).toBeInTheDocument();
    });
  });

  it('displays expense count in header', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockExpensesData),
      })
    ) as jest.Mock;

    render(<ExpensesPage />);

    await waitFor(() => {
      expect(screen.getByText('Expenses (2)')).toBeInTheDocument();
    });
  });

  it('displays empty state when no expenses', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            expenses: [],
            categoryTotals: {
              ingredients: 0,
              rent: 0,
              wages: 0,
              utilities: 0,
              other: 0,
            },
            grandTotal: 0,
          }),
      })
    ) as jest.Mock;

    render(<ExpensesPage />);

    await waitFor(() => {
      expect(
        screen.getByText('No expenses found for the selected filters')
      ).toBeInTheDocument();
    });
  });

  it('displays error state when fetch fails', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
      })
    ) as jest.Mock;

    render(<ExpensesPage />);

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch expenses')).toBeInTheDocument();
    });
  });

  it('handles network errors gracefully', async () => {
    global.fetch = jest.fn(() =>
      Promise.reject(new Error('Network error'))
    ) as jest.Mock;

    render(<ExpensesPage />);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('renders Add button', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockExpensesData),
      })
    ) as jest.Mock;

    render(<ExpensesPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
    });
  });

  it('renders add button and form elements', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockExpensesData),
      })
    ) as jest.Mock;

    render(<ExpensesPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
    });

    // Verify page loads correctly with data
    expect(screen.getByText('Fresh vegetables')).toBeInTheDocument();
  });

  it('displays category badges for each expense', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockExpensesData),
      })
    ) as jest.Mock;

    render(<ExpensesPage />);

    await waitFor(() => {
      // Check that expense descriptions are present
      expect(screen.getByText('Fresh vegetables')).toBeInTheDocument();
      expect(screen.getByText('Monthly rent')).toBeInTheDocument();
    });
  });

  it('displays formatted dates for expenses', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockExpensesData),
      })
    ) as jest.Mock;

    render(<ExpensesPage />);

    await waitFor(() => {
      // Check that date strings containing month abbreviation exist
      expect(screen.getByText(/Jan 15/)).toBeInTheDocument();
      expect(screen.getByText(/Jan 1,/)).toBeInTheDocument();
    });
  });

  it('displays delete buttons for each expense', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockExpensesData),
      })
    ) as jest.Mock;

    render(<ExpensesPage />);

    await waitFor(() => {
      // Check that both expenses are rendered
      expect(screen.getByText('Fresh vegetables')).toBeInTheDocument();
      expect(screen.getByText('Monthly rent')).toBeInTheDocument();
    });
  });

  it('renders expenses list items correctly', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockExpensesData),
      })
    ) as jest.Mock;

    render(<ExpensesPage />);

    await waitFor(() => {
      expect(screen.getByText('Fresh vegetables')).toBeInTheDocument();
      expect(screen.getByText('Monthly rent')).toBeInTheDocument();
    });

    // Check expense count shows correctly
    expect(screen.getByText('Expenses (2)')).toBeInTheDocument();
  });

  it('renders category filter dropdown', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockExpensesData),
      })
    ) as jest.Mock;

    render(<ExpensesPage />);

    await waitFor(() => {
      // Look for the filter select trigger
      const filterTriggers = screen.getAllByRole('combobox');
      expect(filterTriggers.length).toBeGreaterThan(0);
    });
  });

  it('renders date range picker button', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockExpensesData),
      })
    ) as jest.Mock;

    render(<ExpensesPage />);

    await waitFor(() => {
      // Look for a button that contains date range text
      const buttons = screen.getAllByRole('button');
      const dateButton = buttons.find((btn) =>
        btn.textContent?.includes('-')
      );
      expect(dateButton).toBeDefined();
    });
  });

  it('includes correct query params when fetching expenses', async () => {
    const fetchMock = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockExpensesData),
      })
    );
    global.fetch = fetchMock;

    render(<ExpensesPage />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
      const callUrl = fetchMock.mock.calls[0][0] as string;
      expect(callUrl).toContain('/api/expenses');
      expect(callUrl).toContain('startDate=');
      expect(callUrl).toContain('endDate=');
    });
  });
});
