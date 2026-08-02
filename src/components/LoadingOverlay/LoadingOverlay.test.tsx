import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { LoadingOverlay } from './LoadingOverlay';

describe('LoadingOverlay', () => {
  it('renders a status region with a visually-hidden default label', () => {
    render(<LoadingOverlay />);
    const region = screen.getByRole('status');
    expect(region).toHaveAccessibleName('Loading');
  });

  it('renders a visible label and uses it as the accessible name', () => {
    render(<LoadingOverlay label="Fetching results…" />);
    const region = screen.getByRole('status');
    expect(region).toHaveAccessibleName('Fetching results…');
    expect(screen.getByText('Fetching results…')).toBeInTheDocument();
  });

  it('renders the spinner as decorative, not a second accessible status region', () => {
    render(<LoadingOverlay label="Loading data" />);
    expect(screen.getAllByRole('status')).toHaveLength(1);
  });

  it('defaults to fullScreen (Portal-rendered into document.body)', () => {
    render(
      <div data-testid="origin">
        <LoadingOverlay />
      </div>,
    );
    const origin = screen.getByTestId('origin');
    const region = screen.getByRole('status');
    expect(origin).not.toContainElement(region);
    expect(region.parentElement).toBe(document.body);
    expect(region).toHaveAttribute('data-full-screen', 'true');
  });

  it('renders inline (not portaled) when fullScreen is false', () => {
    render(
      <div data-testid="origin">
        <LoadingOverlay fullScreen={false} />
      </div>,
    );
    const origin = screen.getByTestId('origin');
    const region = screen.getByRole('status');
    expect(origin).toContainElement(region);
    expect(region).toHaveAttribute('data-full-screen', 'false');
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLDivElement>();
    render(<LoadingOverlay fullScreen={false} ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('has no accessibility violations', async () => {
    render(<LoadingOverlay label="Loading" />);
    await expectNoA11yViolations(document.body);
  });
});
