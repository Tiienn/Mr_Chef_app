import { render, screen, fireEvent } from '@testing-library/react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';

describe('Dialog', () => {
  it('renders DialogTrigger', () => {
    render(
      <Dialog>
        <DialogTrigger>Open Dialog</DialogTrigger>
      </Dialog>
    );
    const trigger = screen.getByText('Open Dialog');
    expect(trigger).toBeInTheDocument();
  });

  it('opens dialog when trigger is clicked', () => {
    render(
      <Dialog>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>
          <DialogTitle>Dialog Title</DialogTitle>
          <DialogDescription>Dialog Description</DialogDescription>
        </DialogContent>
      </Dialog>
    );

    const trigger = screen.getByText('Open Dialog');
    fireEvent.click(trigger);

    expect(screen.getByText('Dialog Title')).toBeInTheDocument();
    expect(screen.getByText('Dialog Description')).toBeInTheDocument();
  });

  it('renders DialogHeader correctly', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogHeader data-testid="dialog-header">
            <DialogTitle>Title</DialogTitle>
            <DialogDescription>Description</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );

    const header = screen.getByTestId('dialog-header');
    expect(header).toBeInTheDocument();
  });

  it('renders DialogFooter correctly', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
          <DialogDescription>Description</DialogDescription>
          <DialogFooter data-testid="dialog-footer">
            Footer Content
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );

    const footer = screen.getByTestId('dialog-footer');
    expect(footer).toBeInTheDocument();
    expect(footer).toHaveTextContent('Footer Content');
  });

  it('renders DialogTitle correctly', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>Test Title</DialogTitle>
          <DialogDescription>Description</DialogDescription>
        </DialogContent>
      </Dialog>
    );

    const title = screen.getByText('Test Title');
    expect(title).toBeInTheDocument();
    expect(title).toHaveClass('font-semibold');
  });

  it('renders DialogDescription correctly', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
          <DialogDescription>Test Description</DialogDescription>
        </DialogContent>
      </Dialog>
    );

    const description = screen.getByText('Test Description');
    expect(description).toBeInTheDocument();
    expect(description).toHaveClass('text-muted-foreground');
  });

  it('closes dialog when close button is clicked', () => {
    const onOpenChange = jest.fn();
    render(
      <Dialog defaultOpen onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogTitle>Dialog Title</DialogTitle>
          <DialogDescription>Description</DialogDescription>
          <DialogClose data-testid="close-button">Close</DialogClose>
        </DialogContent>
      </Dialog>
    );

    const closeButton = screen.getByTestId('close-button');
    fireEvent.click(closeButton);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('applies custom className to DialogContent', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent className="custom-dialog-class">
          <DialogTitle>Title</DialogTitle>
          <DialogDescription>Description</DialogDescription>
        </DialogContent>
      </Dialog>
    );

    const content = screen.getByRole('dialog');
    expect(content).toHaveClass('custom-dialog-class');
  });

  it('renders with controlled open state', () => {
    const { rerender } = render(
      <Dialog open={false}>
        <DialogContent>
          <DialogTitle>Dialog Title</DialogTitle>
          <DialogDescription>Description</DialogDescription>
        </DialogContent>
      </Dialog>
    );

    expect(screen.queryByText('Dialog Title')).not.toBeInTheDocument();

    rerender(
      <Dialog open={true}>
        <DialogContent>
          <DialogTitle>Dialog Title</DialogTitle>
          <DialogDescription>Description</DialogDescription>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByText('Dialog Title')).toBeInTheDocument();
  });
});
