import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { ThinkingBlock } from './ThinkingBlock';

describe('ThinkingBlock', () => {
  it('renders the trigger label, defaulting to "Show reasoning"', () => {
    render(<ThinkingBlock>Some reasoning trace.</ThinkingBlock>);
    expect(screen.getByRole('button', { name: 'Show reasoning' })).toBeInTheDocument();
  });

  it('supports a custom label', () => {
    render(<ThinkingBlock label="Thinking…">Trace.</ThinkingBlock>);
    expect(screen.getByRole('button', { name: 'Thinking…' })).toBeInTheDocument();
  });

  it('is collapsed by default, and the content is hidden', () => {
    render(<ThinkingBlock>Some reasoning trace.</ThinkingBlock>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('Some reasoning trace.')).not.toBeVisible();
  });

  it('expands on click and calls onOpenChange', async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(<ThinkingBlock onOpenChange={onOpenChange}>Some reasoning trace.</ThinkingBlock>);
    await user.click(screen.getByRole('button'));
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Some reasoning trace.')).toBeVisible();
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it('starts expanded when defaultOpen is true', () => {
    render(<ThinkingBlock defaultOpen>Some reasoning trace.</ThinkingBlock>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
  });

  it('works as a controlled component via the open prop', async () => {
    const user = userEvent.setup();
    render(
      <ThinkingBlock open={false} onOpenChange={() => {}}>
        Some reasoning trace.
      </ThinkingBlock>,
    );
    await user.click(screen.getByRole('button'));
    // Controlled: stays closed since the open prop wasn't updated by the consumer.
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
  });

  it('has no accessibility violations, collapsed or expanded', async () => {
    const collapsed = render(<ThinkingBlock>Trace content.</ThinkingBlock>);
    await expectNoA11yViolations(collapsed.container);
    collapsed.unmount();
    const expanded = render(<ThinkingBlock defaultOpen>Trace content.</ThinkingBlock>);
    await expectNoA11yViolations(expanded.container);
  });
});
