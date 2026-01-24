import { render, screen } from '@testing-library/react';
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';

describe('Card', () => {
  it('renders Card correctly', () => {
    render(<Card data-testid="card">Card Content</Card>);
    const card = screen.getByTestId('card');
    expect(card).toBeInTheDocument();
    expect(card).toHaveTextContent('Card Content');
    expect(card).toHaveClass('rounded-xl');
    expect(card).toHaveClass('border');
  });

  it('renders CardHeader correctly', () => {
    render(<CardHeader data-testid="card-header">Header Content</CardHeader>);
    const header = screen.getByTestId('card-header');
    expect(header).toBeInTheDocument();
    expect(header).toHaveTextContent('Header Content');
    expect(header).toHaveClass('p-6');
  });

  it('renders CardTitle correctly', () => {
    render(<CardTitle>Card Title</CardTitle>);
    const title = screen.getByText('Card Title');
    expect(title).toBeInTheDocument();
    expect(title).toHaveClass('font-semibold');
  });

  it('renders CardDescription correctly', () => {
    render(<CardDescription>Card Description</CardDescription>);
    const description = screen.getByText('Card Description');
    expect(description).toBeInTheDocument();
    expect(description).toHaveClass('text-muted-foreground');
  });

  it('renders CardContent correctly', () => {
    render(<CardContent data-testid="card-content">Content</CardContent>);
    const content = screen.getByTestId('card-content');
    expect(content).toBeInTheDocument();
    expect(content).toHaveTextContent('Content');
    expect(content).toHaveClass('p-6');
  });

  it('renders CardFooter correctly', () => {
    render(<CardFooter data-testid="card-footer">Footer Content</CardFooter>);
    const footer = screen.getByTestId('card-footer');
    expect(footer).toBeInTheDocument();
    expect(footer).toHaveTextContent('Footer Content');
    expect(footer).toHaveClass('flex');
    expect(footer).toHaveClass('items-center');
  });

  it('renders a complete card with all components', () => {
    render(
      <Card data-testid="full-card">
        <CardHeader>
          <CardTitle>Test Title</CardTitle>
          <CardDescription>Test Description</CardDescription>
        </CardHeader>
        <CardContent>Main Content</CardContent>
        <CardFooter>Footer Content</CardFooter>
      </Card>
    );

    expect(screen.getByTestId('full-card')).toBeInTheDocument();
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('Main Content')).toBeInTheDocument();
    expect(screen.getByText('Footer Content')).toBeInTheDocument();
  });

  it('applies custom className to Card', () => {
    render(
      <Card className="custom-card-class" data-testid="custom-card">
        Content
      </Card>
    );
    const card = screen.getByTestId('custom-card');
    expect(card).toHaveClass('custom-card-class');
  });

  it('applies custom className to CardHeader', () => {
    render(
      <CardHeader className="custom-header-class" data-testid="custom-header">
        Header
      </CardHeader>
    );
    const header = screen.getByTestId('custom-header');
    expect(header).toHaveClass('custom-header-class');
  });

  it('applies custom className to CardContent', () => {
    render(
      <CardContent className="custom-content-class" data-testid="custom-content">
        Content
      </CardContent>
    );
    const content = screen.getByTestId('custom-content');
    expect(content).toHaveClass('custom-content-class');
  });
});
