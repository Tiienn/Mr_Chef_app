import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AttendancePage from '@/app/(admin)/attendance/page';

// Mock attendance data
const mockAttendanceData = {
  staff: [
    { id: 1, name: 'John Doe', active: true, createdAt: new Date() },
    { id: 2, name: 'Jane Smith', active: true, createdAt: new Date() },
  ],
  attendance: [
    { id: 1, staffId: 1, date: '2024-01-15', status: 'present', createdAt: new Date() },
    { id: 2, staffId: 2, date: '2024-01-15', status: 'absent', createdAt: new Date() },
    { id: 3, staffId: 1, date: '2024-01-16', status: 'day_off', createdAt: new Date() },
  ],
};

describe('AttendancePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock the current date to ensure consistent test results
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-15'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders loading state initially', () => {
    global.fetch = jest.fn(() => new Promise(() => {})) as jest.Mock;

    render(<AttendancePage />);

    expect(screen.getByText('Attendance')).toBeInTheDocument();
    // Check for loading skeleton
    const loadingCards = document.querySelectorAll('.animate-pulse');
    expect(loadingCards.length).toBeGreaterThan(0);
  });

  it('renders attendance calendar after loading', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockAttendanceData),
      })
    ) as jest.Mock;

    render(<AttendancePage />);

    await waitFor(() => {
      // Check that month/year header is displayed
      expect(screen.getByText('January 2024')).toBeInTheDocument();
    });

    // Check that weekday headers are displayed
    expect(screen.getByText('Sun')).toBeInTheDocument();
    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Sat')).toBeInTheDocument();
  });

  it('displays staff summary section', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockAttendanceData),
      })
    ) as jest.Mock;

    render(<AttendancePage />);

    await waitFor(() => {
      expect(screen.getByText('Staff Members (2)')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('displays legend for attendance status colors', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockAttendanceData),
      })
    ) as jest.Mock;

    render(<AttendancePage />);

    await waitFor(() => {
      expect(screen.getByText('Present')).toBeInTheDocument();
      expect(screen.getByText('Absent')).toBeInTheDocument();
      expect(screen.getByText('Day Off')).toBeInTheDocument();
    });
  });

  it('displays Today button in header', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockAttendanceData),
      })
    ) as jest.Mock;

    render(<AttendancePage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Today' })).toBeInTheDocument();
    });
  });

  it('opens day dialog when clicking on a day', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockAttendanceData),
      })
    ) as jest.Mock;

    render(<AttendancePage />);

    await waitFor(() => {
      expect(screen.getByText('January 2024')).toBeInTheDocument();
    });

    // Click on day 15 (the mocked current date)
    const day15Button = screen.getByRole('button', { name: /15/ });
    fireEvent.click(day15Button);

    await waitFor(() => {
      // Dialog should show the full date and staff list
      expect(screen.getByText(/Monday, January 15, 2024/)).toBeInTheDocument();
    });
  });

  it('displays staff with status toggle buttons in dialog', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockAttendanceData),
      })
    ) as jest.Mock;

    render(<AttendancePage />);

    await waitFor(() => {
      expect(screen.getByText('January 2024')).toBeInTheDocument();
    });

    // Click on a day to open dialog
    const day15Button = screen.getByRole('button', { name: /15/ });
    fireEvent.click(day15Button);

    await waitFor(() => {
      // Should show staff names in dialog
      const dialogContent = screen.getByRole('dialog');
      expect(dialogContent).toBeInTheDocument();
    });
  });

  it('displays no staff message when no active staff', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            staff: [],
            attendance: [],
          }),
      })
    ) as jest.Mock;

    render(<AttendancePage />);

    await waitFor(() => {
      expect(screen.getByText('No active staff members found.')).toBeInTheDocument();
    });
  });

  it('displays error state when fetch fails', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
      })
    ) as jest.Mock;

    render(<AttendancePage />);

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch attendance')).toBeInTheDocument();
    });
  });

  it('handles network errors gracefully', async () => {
    global.fetch = jest.fn(() =>
      Promise.reject(new Error('Network error'))
    ) as jest.Mock;

    render(<AttendancePage />);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('navigates to previous month when clicking previous button', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockAttendanceData),
      })
    ) as jest.Mock;

    render(<AttendancePage />);

    await waitFor(() => {
      expect(screen.getByText('January 2024')).toBeInTheDocument();
    });

    // Find and click the previous month button (ChevronLeft icon button)
    const buttons = screen.getAllByRole('button');
    const prevButton = buttons.find(btn => btn.querySelector('svg.lucide-chevron-left'));
    if (prevButton) {
      fireEvent.click(prevButton);
    }

    await waitFor(() => {
      expect(screen.getByText('December 2023')).toBeInTheDocument();
    });
  });

  it('navigates to next month when clicking next button', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockAttendanceData),
      })
    ) as jest.Mock;

    render(<AttendancePage />);

    await waitFor(() => {
      expect(screen.getByText('January 2024')).toBeInTheDocument();
    });

    // Find and click the next month button (ChevronRight icon button)
    const buttons = screen.getAllByRole('button');
    const nextButton = buttons.find(btn => btn.querySelector('svg.lucide-chevron-right'));
    if (nextButton) {
      fireEvent.click(nextButton);
    }

    await waitFor(() => {
      expect(screen.getByText('February 2024')).toBeInTheDocument();
    });
  });

  it('displays attendance statistics for each staff member', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockAttendanceData),
      })
    ) as jest.Mock;

    render(<AttendancePage />);

    await waitFor(() => {
      // Check for attendance stats badges (P for present, A for absent, O for day off)
      expect(screen.getByText('1P')).toBeInTheDocument();
      expect(screen.getByText('1A')).toBeInTheDocument();
      expect(screen.getByText('1O')).toBeInTheDocument();
    });
  });

  it('includes correct query params when fetching attendance', async () => {
    const fetchMock = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockAttendanceData),
      })
    );
    global.fetch = fetchMock;

    render(<AttendancePage />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
      const callUrl = fetchMock.mock.calls[0][0] as string;
      expect(callUrl).toContain('/api/attendance');
      expect(callUrl).toContain('startDate=');
      expect(callUrl).toContain('endDate=');
    });
  });

  it('shows status buttons for each staff member in dialog', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockAttendanceData),
      })
    ) as jest.Mock;

    render(<AttendancePage />);

    await waitFor(() => {
      expect(screen.getByText('January 2024')).toBeInTheDocument();
    });

    // Click on a day
    const day15Button = screen.getByRole('button', { name: /15/ });
    fireEvent.click(day15Button);

    await waitFor(() => {
      // Each staff should have 3 status buttons (Present, Absent, Day Off)
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();

      // Look for the status icon buttons in the dialog
      const allButtons = dialog.querySelectorAll('button');
      // We expect at least 6 buttons (3 status buttons per 2 staff members)
      expect(allButtons.length).toBeGreaterThanOrEqual(6);
    });
  });
});
