import { describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Banner } from './Banner';

describe('Banner', () => {
  it('renders children', () => {
    render(<Banner>A new version is available.</Banner>);
    expect(screen.getByText('A new version is available.')).toBeInTheDocument();
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Banner ref={ref}>Message</Banner>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Banner variant="warning">Message</Banner>);
    await expectNoA11yViolations(container);
  });

  it('defaults to variant=info', () => {
    render(<Banner>Message</Banner>);
    expect(screen.getByRole('status')).toHaveAttribute('data-variant', 'info');
  });

  it('uses role=status for info/success and role=alert for warning/danger', () => {
    const { rerender } = render(<Banner variant="success">Message</Banner>);
    expect(screen.getByRole('status')).toBeInTheDocument();
    rerender(<Banner variant="danger">Message</Banner>);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('does not render a dismiss button by default', () => {
    render(<Banner>Message</Banner>);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders a dismiss button and calls onDismiss when clicked', async () => {
    const onDismiss = vi.fn();
    const user = userEvent.setup();
    render(<Banner onDismiss={onDismiss}>Message</Banner>);
    await user.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onDismiss).toHaveBeenCalled();
  });
});
