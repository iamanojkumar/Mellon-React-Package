import { describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Chip } from './Chip';

describe('Chip', () => {
  it('renders as a span', () => {
    render(<Chip data-testid="chip">Filter</Chip>);
    expect(screen.getByTestId('chip').tagName).toBe('SPAN');
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<Chip ref={ref}>Filter</Chip>);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it('merges a custom className with the base style', () => {
    render(
      <Chip data-testid="chip" className="custom">
        Filter
      </Chip>,
    );
    expect(screen.getByTestId('chip').className).toContain('custom');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Chip onRemove={() => {}}>Filter</Chip>);
    await expectNoA11yViolations(container);
  });

  it('does not render a remove button when onRemove is not given', () => {
    render(<Chip>Filter</Chip>);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders a remove button and calls onRemove when activated', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(<Chip onRemove={onRemove}>Filter</Chip>);
    await user.click(screen.getByRole('button', { name: 'Remove' }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('uses a custom removeLabel', () => {
    render(
      <Chip onRemove={() => {}} removeLabel="Remove Filter">
        Filter
      </Chip>,
    );
    expect(screen.getByRole('button', { name: 'Remove Filter' })).toBeInTheDocument();
  });

  it('disables the remove button when disabled', () => {
    render(
      <Chip onRemove={() => {}} disabled>
        Filter
      </Chip>,
    );
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
