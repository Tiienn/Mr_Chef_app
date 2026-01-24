import { render, screen, fireEvent } from '@testing-library/react';
import {
  Toast,
  ToastProvider,
  ToastViewport,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
} from '@/components/ui/toast';

describe('Toast', () => {
  const renderToast = (children: React.ReactNode) => {
    return render(
      <ToastProvider>
        {children}
        <ToastViewport />
      </ToastProvider>
    );
  };

  it('renders Toast with default variant', () => {
    renderToast(
      <Toast open data-testid="toast">
        <ToastTitle>Toast Title</ToastTitle>
        <ToastDescription>Toast description</ToastDescription>
      </Toast>
    );

    const toast = screen.getByTestId('toast');
    expect(toast).toBeInTheDocument();
    expect(toast).toHaveClass('bg-background');
  });

  it('renders Toast with destructive variant', () => {
    renderToast(
      <Toast open variant="destructive" data-testid="toast">
        <ToastTitle>Error</ToastTitle>
      </Toast>
    );

    const toast = screen.getByTestId('toast');
    expect(toast).toHaveClass('destructive');
    expect(toast).toHaveClass('bg-destructive');
  });

  it('renders ToastTitle correctly', () => {
    renderToast(
      <Toast open>
        <ToastTitle>Test Title</ToastTitle>
      </Toast>
    );

    const title = screen.getByText('Test Title');
    expect(title).toBeInTheDocument();
    expect(title).toHaveClass('font-semibold');
  });

  it('renders ToastDescription correctly', () => {
    renderToast(
      <Toast open>
        <ToastTitle>Title</ToastTitle>
        <ToastDescription>Test Description</ToastDescription>
      </Toast>
    );

    const description = screen.getByText('Test Description');
    expect(description).toBeInTheDocument();
    expect(description).toHaveClass('text-sm');
  });

  it('renders ToastClose button', () => {
    renderToast(
      <Toast open>
        <ToastTitle>Title</ToastTitle>
        <ToastClose data-testid="close-button" />
      </Toast>
    );

    const closeButton = screen.getByTestId('close-button');
    expect(closeButton).toBeInTheDocument();
  });

  it('calls onOpenChange when close button is clicked', () => {
    const onOpenChange = jest.fn();
    renderToast(
      <Toast open onOpenChange={onOpenChange}>
        <ToastTitle>Title</ToastTitle>
        <ToastClose data-testid="close-button" />
      </Toast>
    );

    const closeButton = screen.getByTestId('close-button');
    fireEvent.click(closeButton);

    expect(onOpenChange).toHaveBeenCalled();
  });

  it('renders ToastAction correctly', () => {
    const handleAction = jest.fn();
    renderToast(
      <Toast open>
        <ToastTitle>Title</ToastTitle>
        <ToastAction altText="undo" onClick={handleAction}>
          Undo
        </ToastAction>
      </Toast>
    );

    const actionButton = screen.getByText('Undo');
    expect(actionButton).toBeInTheDocument();
    expect(actionButton).toHaveClass('inline-flex');
  });

  it('handles ToastAction click', () => {
    const handleAction = jest.fn();
    renderToast(
      <Toast open>
        <ToastTitle>Title</ToastTitle>
        <ToastAction altText="undo" onClick={handleAction}>
          Undo
        </ToastAction>
      </Toast>
    );

    const actionButton = screen.getByText('Undo');
    fireEvent.click(actionButton);

    expect(handleAction).toHaveBeenCalled();
  });

  it('renders ToastViewport correctly', () => {
    render(
      <ToastProvider>
        <ToastViewport data-testid="viewport" />
      </ToastProvider>
    );

    const viewport = screen.getByTestId('viewport');
    expect(viewport).toBeInTheDocument();
    expect(viewport).toHaveClass('fixed');
  });

  it('applies custom className to Toast', () => {
    renderToast(
      <Toast open className="custom-toast-class" data-testid="toast">
        <ToastTitle>Title</ToastTitle>
      </Toast>
    );

    const toast = screen.getByTestId('toast');
    expect(toast).toHaveClass('custom-toast-class');
  });

  it('applies custom className to ToastViewport', () => {
    render(
      <ToastProvider>
        <ToastViewport className="custom-viewport-class" data-testid="viewport" />
      </ToastProvider>
    );

    const viewport = screen.getByTestId('viewport');
    expect(viewport).toHaveClass('custom-viewport-class');
  });

  it('does not render when open is false', () => {
    renderToast(
      <Toast open={false} data-testid="toast">
        <ToastTitle>Hidden Title</ToastTitle>
      </Toast>
    );

    expect(screen.queryByTestId('toast')).not.toBeInTheDocument();
  });
});
