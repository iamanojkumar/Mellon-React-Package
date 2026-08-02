import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { AITriggerButton } from './AITriggerButton';

describe('AITriggerButton', () => {
  it('renders a button with the given accessible name', () => {
    render(<AITriggerButton aria-label="Rewrite with AI" />);
    expect(screen.getByRole('button', { name: 'Rewrite with AI' })).toBeInTheDocument();
  });

  it('defaults to idle (not busy)', () => {
    render(<AITriggerButton aria-label="Rewrite with AI" />);
    expect(screen.getByRole('button')).not.toHaveAttribute('aria-busy', 'true');
  });

  it('maps loading status to a busy, disabled button', () => {
    render(<AITriggerButton aria-label="Rewrite with AI" status="loading" />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toBeDisabled();
  });

  it('maps streaming status to a busy button as well', () => {
    render(<AITriggerButton aria-label="Rewrite with AI" status="streaming" />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
  });

  it('done/error status is not busy', () => {
    render(<AITriggerButton aria-label="Rewrite with AI" status="done" />);
    expect(screen.getByRole('button')).not.toHaveAttribute('aria-busy', 'true');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<AITriggerButton aria-label="Rewrite with AI" />);
    await expectNoA11yViolations(container);
  });
});
