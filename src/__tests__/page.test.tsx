import { render, screen } from '@testing-library/react';
import Home from '@/app/page';

describe('Home Page', () => {
  it('renders the Next.js logo', () => {
    render(<Home />);
    const logo = screen.getByAltText('Next.js logo');
    expect(logo).toBeInTheDocument();
  });

  it('renders the getting started instruction', () => {
    render(<Home />);
    const instruction = screen.getByText(/Get started by editing/i);
    expect(instruction).toBeInTheDocument();
  });

  it('renders the deploy now link', () => {
    render(<Home />);
    const deployLink = screen.getByRole('link', { name: /Deploy now/i });
    expect(deployLink).toBeInTheDocument();
  });

  it('renders the docs link', () => {
    render(<Home />);
    const docsLink = screen.getByRole('link', { name: /Read our docs/i });
    expect(docsLink).toBeInTheDocument();
  });

  it('renders footer links', () => {
    render(<Home />);
    expect(screen.getByRole('link', { name: /Learn/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Examples/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Go to nextjs.org/i })).toBeInTheDocument();
  });
});
