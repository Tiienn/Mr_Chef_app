import { render, screen, fireEvent } from '@testing-library/react';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';

describe('Collapsible', () => {
  it('renders CollapsibleTrigger', () => {
    render(
      <Collapsible>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
      </Collapsible>
    );
    expect(screen.getByText('Toggle')).toBeInTheDocument();
  });

  it('content is hidden by default', () => {
    render(
      <Collapsible>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Hidden Content</CollapsibleContent>
      </Collapsible>
    );
    expect(screen.queryByText('Hidden Content')).not.toBeInTheDocument();
  });

  it('shows content when trigger is clicked', () => {
    render(
      <Collapsible>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Visible Content</CollapsibleContent>
      </Collapsible>
    );

    const trigger = screen.getByText('Toggle');
    fireEvent.click(trigger);

    expect(screen.getByText('Visible Content')).toBeInTheDocument();
  });

  it('hides content when trigger is clicked again', () => {
    render(
      <Collapsible>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Content</CollapsibleContent>
      </Collapsible>
    );

    const trigger = screen.getByText('Toggle');

    // Open
    fireEvent.click(trigger);
    expect(screen.getByText('Content')).toBeInTheDocument();

    // Close
    fireEvent.click(trigger);
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('respects defaultOpen prop', () => {
    render(
      <Collapsible defaultOpen>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Default Open Content</CollapsibleContent>
      </Collapsible>
    );

    expect(screen.getByText('Default Open Content')).toBeInTheDocument();
  });

  it('works with controlled open state', () => {
    const { rerender } = render(
      <Collapsible open={false}>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Controlled Content</CollapsibleContent>
      </Collapsible>
    );

    expect(screen.queryByText('Controlled Content')).not.toBeInTheDocument();

    rerender(
      <Collapsible open={true}>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Controlled Content</CollapsibleContent>
      </Collapsible>
    );

    expect(screen.getByText('Controlled Content')).toBeInTheDocument();
  });

  it('calls onOpenChange when state changes', () => {
    const onOpenChange = jest.fn();

    render(
      <Collapsible onOpenChange={onOpenChange}>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Content</CollapsibleContent>
      </Collapsible>
    );

    const trigger = screen.getByText('Toggle');
    fireEvent.click(trigger);

    expect(onOpenChange).toHaveBeenCalledWith(true);
  });
});
