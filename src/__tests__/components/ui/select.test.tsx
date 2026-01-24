import { render, screen, fireEvent } from '@testing-library/react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from '@/components/ui/select';

describe('Select', () => {
  it('renders SelectTrigger with placeholder', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
      </Select>
    );

    expect(screen.getByText('Select an option')).toBeInTheDocument();
  });

  it('renders SelectTrigger with correct styling', () => {
    render(
      <Select>
        <SelectTrigger data-testid="select-trigger">
          <SelectValue placeholder="Select" />
        </SelectTrigger>
      </Select>
    );

    const trigger = screen.getByTestId('select-trigger');
    expect(trigger).toHaveClass('flex');
    expect(trigger).toHaveClass('h-9');
    expect(trigger).toHaveClass('w-full');
  });

  it('opens dropdown when trigger is clicked', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
          <SelectItem value="option2">Option 2</SelectItem>
        </SelectContent>
      </Select>
    );

    const trigger = screen.getByRole('combobox');
    fireEvent.click(trigger);

    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  it('selects an item when clicked', () => {
    const onValueChange = jest.fn();
    render(
      <Select onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
          <SelectItem value="option2">Option 2</SelectItem>
        </SelectContent>
      </Select>
    );

    const trigger = screen.getByRole('combobox');
    fireEvent.click(trigger);

    const option1 = screen.getByText('Option 1');
    fireEvent.click(option1);

    expect(onValueChange).toHaveBeenCalledWith('option1');
  });

  it('displays selected value', () => {
    render(
      <Select defaultValue="option1">
        <SelectTrigger>
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
          <SelectItem value="option2">Option 2</SelectItem>
        </SelectContent>
      </Select>
    );

    expect(screen.getByText('Option 1')).toBeInTheDocument();
  });

  it('renders SelectGroup with SelectLabel', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Group Label</SelectLabel>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    );

    const trigger = screen.getByRole('combobox');
    fireEvent.click(trigger);

    expect(screen.getByText('Group Label')).toBeInTheDocument();
  });

  it('renders SelectSeparator', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
          <SelectSeparator data-testid="separator" />
          <SelectItem value="option2">Option 2</SelectItem>
        </SelectContent>
      </Select>
    );

    const trigger = screen.getByRole('combobox');
    fireEvent.click(trigger);

    const separator = screen.getByTestId('separator');
    expect(separator).toBeInTheDocument();
    expect(separator).toHaveClass('bg-muted');
  });

  it('disables select when disabled prop is true', () => {
    render(
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="Select" />
        </SelectTrigger>
      </Select>
    );

    const trigger = screen.getByRole('combobox');
    expect(trigger).toBeDisabled();
  });

  it('disables individual items', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
          <SelectItem value="option2" disabled>
            Option 2
          </SelectItem>
        </SelectContent>
      </Select>
    );

    const trigger = screen.getByRole('combobox');
    fireEvent.click(trigger);

    const disabledOption = screen.getByText('Option 2');
    expect(disabledOption.closest('[data-disabled]')).toBeInTheDocument();
  });

  it('applies custom className to SelectTrigger', () => {
    render(
      <Select>
        <SelectTrigger className="custom-trigger-class" data-testid="trigger">
          <SelectValue placeholder="Select" />
        </SelectTrigger>
      </Select>
    );

    const trigger = screen.getByTestId('trigger');
    expect(trigger).toHaveClass('custom-trigger-class');
  });

  it('handles controlled value state', () => {
    const { rerender } = render(
      <Select value="option1">
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
          <SelectItem value="option2">Option 2</SelectItem>
        </SelectContent>
      </Select>
    );

    expect(screen.getByText('Option 1')).toBeInTheDocument();

    rerender(
      <Select value="option2">
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
          <SelectItem value="option2">Option 2</SelectItem>
        </SelectContent>
      </Select>
    );

    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });
});
