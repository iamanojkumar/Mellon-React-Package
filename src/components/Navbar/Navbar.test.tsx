import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Navbar } from './Navbar';

function BasicNavbar() {
  return (
    <Navbar>
      <Navbar.Brand>Acme</Navbar.Brand>
      <Navbar.Content>
        <a href="/">Home</a>
        <a href="/docs">Docs</a>
      </Navbar.Content>
      <Navbar.Actions>
        <button type="button">Sign in</button>
      </Navbar.Actions>
    </Navbar>
  );
}

describe('Navbar', () => {
  it('renders as a header landmark', () => {
    render(<BasicNavbar />);
    expect(screen.getByRole('banner').tagName).toBe('HEADER');
  });

  it('renders Navbar.Content as a nav landmark labelled "Main"', () => {
    render(<BasicNavbar />);
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
  });

  it('renders brand, content, and actions content', () => {
    render(<BasicNavbar />);
    expect(screen.getByText('Acme')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('is not sticky by default', () => {
    render(<BasicNavbar />);
    expect(screen.getByRole('banner')).not.toHaveAttribute('data-sticky');
  });

  it('applies data-sticky when sticky is set', () => {
    render(
      <Navbar sticky>
        <Navbar.Brand>Acme</Navbar.Brand>
      </Navbar>,
    );
    expect(screen.getByRole('banner')).toHaveAttribute('data-sticky');
  });

  it('merges a custom className with the base style', () => {
    render(
      <Navbar className="custom">
        <Navbar.Brand>Acme</Navbar.Brand>
      </Navbar>,
    );
    expect(screen.getByRole('banner').className).toContain('custom');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<BasicNavbar />);
    await expectNoA11yViolations(container);
  });
});
