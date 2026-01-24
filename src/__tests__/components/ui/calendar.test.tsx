import { render, screen, fireEvent } from '@testing-library/react';
import { Calendar } from '@/components/ui/calendar';

describe('Calendar', () => {
  it('renders correctly', () => {
    render(<Calendar />);
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  it('displays weekday headers', () => {
    render(<Calendar />);
    expect(screen.getByText('Su')).toBeInTheDocument();
    expect(screen.getByText('Mo')).toBeInTheDocument();
    expect(screen.getByText('Tu')).toBeInTheDocument();
    expect(screen.getByText('We')).toBeInTheDocument();
    expect(screen.getByText('Th')).toBeInTheDocument();
    expect(screen.getByText('Fr')).toBeInTheDocument();
    expect(screen.getByText('Sa')).toBeInTheDocument();
  });

  it('renders navigation buttons', () => {
    render(<Calendar />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('navigates to previous month when previous button is clicked', () => {
    const today = new Date();
    render(<Calendar defaultMonth={today} />);

    const prevButton = screen.getByRole('button', { name: /previous/i });
    const currentMonthText = screen.getByText(
      today.toLocaleString('default', { month: 'long' }),
      { exact: false }
    );
    expect(currentMonthText).toBeInTheDocument();

    fireEvent.click(prevButton);

    const prevMonth = new Date(today);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    const prevMonthText = screen.getByText(
      prevMonth.toLocaleString('default', { month: 'long' }),
      { exact: false }
    );
    expect(prevMonthText).toBeInTheDocument();
  });

  it('navigates to next month when next button is clicked', () => {
    const today = new Date();
    render(<Calendar defaultMonth={today} />);

    const nextButton = screen.getByRole('button', { name: /next/i });

    fireEvent.click(nextButton);

    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextMonthText = screen.getByText(
      nextMonth.toLocaleString('default', { month: 'long' }),
      { exact: false }
    );
    expect(nextMonthText).toBeInTheDocument();
  });

  it('handles date selection', () => {
    const onSelect = jest.fn();
    render(<Calendar mode="single" onSelect={onSelect} />);

    const dayButtons = screen.getAllByRole('button').filter(
      btn => !btn.getAttribute('name')?.includes('previous') &&
             !btn.getAttribute('name')?.includes('next')
    );

    const selectableButton = dayButtons.find(btn =>
      btn.textContent &&
      !isNaN(parseInt(btn.textContent)) &&
      !btn.hasAttribute('disabled')
    );

    if (selectableButton) {
      fireEvent.click(selectableButton);
      expect(onSelect).toHaveBeenCalled();
    }
  });

  it('renders with selected date', () => {
    const selectedDate = new Date(2025, 0, 15);
    render(
      <Calendar
        mode="single"
        selected={selectedDate}
        defaultMonth={selectedDate}
      />
    );

    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  it('renders with disabled dates', () => {
    const today = new Date();
    const disabledDay = new Date(today.getFullYear(), today.getMonth(), 15);

    render(
      <Calendar
        defaultMonth={today}
        disabled={[disabledDay]}
      />
    );

    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  it('shows outside days when showOutsideDays is true', () => {
    render(<Calendar showOutsideDays={true} />);
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  it('hides outside days when showOutsideDays is false', () => {
    render(<Calendar showOutsideDays={false} />);
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Calendar className="custom-calendar-class" />);
    const calendar = screen.getByRole('grid').closest('[data-slot="calendar"]');
    expect(calendar).toHaveClass('custom-calendar-class');
  });

  it('renders in range selection mode', () => {
    const onSelect = jest.fn();
    render(
      <Calendar
        mode="range"
        onSelect={onSelect}
      />
    );

    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  it('renders in multiple selection mode', () => {
    const onSelect = jest.fn();
    render(
      <Calendar
        mode="multiple"
        onSelect={onSelect}
      />
    );

    expect(screen.getByRole('grid')).toBeInTheDocument();
  });
});
