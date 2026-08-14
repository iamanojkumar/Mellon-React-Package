import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { CanvasFrame } from './CanvasFrame';

describe('CanvasFrame', () => {
  it('is a labelled group named by its title', () => {
    render(<CanvasFrame title="Onboarding" />);

    expect(screen.getByRole('group', { name: 'Onboarding' })).toBeInTheDocument();
  });

  it('shows the title visibly as well', () => {
    render(<CanvasFrame title="Onboarding" />);

    expect(screen.getByText('Onboarding')).toBeInTheDocument();
  });

  it('carries tone as a data attribute', () => {
    const { container } = render(<CanvasFrame title="Risks" tone="danger" />);

    expect(container.firstElementChild).toHaveAttribute('data-tone', 'danger');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<CanvasFrame title="Onboarding" />);

    await expectNoA11yViolations(container);
  });
});
