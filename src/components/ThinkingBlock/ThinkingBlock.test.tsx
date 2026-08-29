import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { ThinkingBlock, formatThinkingDuration } from './ThinkingBlock';

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

  describe('the thinking state', () => {
    it('labels the trigger "Thinking…" while thinking', () => {
      render(<ThinkingBlock thinking>Trace.</ThinkingBlock>);
      expect(screen.getByRole('button', { name: 'Thinking…' })).toBeInTheDocument();
    });

    it('settles to "Thought for …" once thinking flips off', () => {
      const { rerender } = render(<ThinkingBlock thinking>Trace.</ThinkingBlock>);
      expect(screen.getByRole('button', { name: 'Thinking…' })).toBeInTheDocument();
      rerender(<ThinkingBlock thinking={false}>Trace.</ThinkingBlock>);
      // Self-measured: the transition was instant, so it rounds up to the 1s floor.
      expect(screen.getByRole('button', { name: 'Thought for 1s' })).toBeInTheDocument();
    });

    it('prefers a consumer-supplied duration over its own measurement', () => {
      const { rerender } = render(
        <ThinkingBlock thinking duration={42}>
          Trace.
        </ThinkingBlock>,
      );
      rerender(
        <ThinkingBlock thinking={false} duration={42}>
          Trace.
        </ThinkingBlock>,
      );
      expect(screen.getByRole('button', { name: 'Thought for 42s' })).toBeInTheDocument();
    });

    it('reports a duration without ever having been in the thinking state', () => {
      render(<ThinkingBlock duration={8}>Trace.</ThinkingBlock>);
      expect(screen.getByRole('button', { name: 'Thought for 8s' })).toBeInTheDocument();
    });

    it('ignores a non-finite duration rather than rendering NaN', () => {
      render(<ThinkingBlock duration={Number.NaN}>Trace.</ThinkingBlock>);
      expect(screen.getByRole('button', { name: 'Show reasoning' })).toBeInTheDocument();
    });

    it('lets an explicit label override both states', () => {
      const { rerender } = render(
        <ThinkingBlock thinking label="Reasoning…">
          Trace.
        </ThinkingBlock>,
      );
      expect(screen.getByRole('button', { name: 'Reasoning…' })).toBeInTheDocument();
      rerender(
        <ThinkingBlock thinking={false} label="Reasoning…">
          Trace.
        </ThinkingBlock>,
      );
      expect(screen.getByRole('button', { name: 'Reasoning…' })).toBeInTheDocument();
    });

    it('restarts the measurement when a second thinking pass begins', () => {
      const { rerender } = render(<ThinkingBlock thinking>Trace.</ThinkingBlock>);
      rerender(<ThinkingBlock thinking={false}>Trace.</ThinkingBlock>);
      expect(screen.getByRole('button', { name: 'Thought for 1s' })).toBeInTheDocument();
      rerender(<ThinkingBlock thinking>Trace.</ThinkingBlock>);
      expect(screen.getByRole('button', { name: 'Thinking…' })).toBeInTheDocument();
    });

    it('stays open across the transition, so an expanded trace is not collapsed by it', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<ThinkingBlock thinking>Trace.</ThinkingBlock>);
      await user.click(screen.getByRole('button'));
      rerender(<ThinkingBlock thinking={false}>Trace.</ThinkingBlock>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
    });

    it('has no accessibility violations while thinking', async () => {
      const { container } = render(<ThinkingBlock thinking>Trace content.</ThinkingBlock>);
      await expectNoA11yViolations(container);
    });
  });

  describe('formatThinkingDuration', () => {
    it('rounds to whole seconds with a one-second floor', () => {
      expect(formatThinkingDuration(0)).toBe('1s');
      expect(formatThinkingDuration(0.4)).toBe('1s');
      expect(formatThinkingDuration(8.6)).toBe('9s');
    });

    it('breaks a minute or more into minutes and seconds', () => {
      expect(formatThinkingDuration(60)).toBe('1m');
      expect(formatThinkingDuration(65)).toBe('1m 5s');
      expect(formatThinkingDuration(600)).toBe('10m');
      expect(formatThinkingDuration(3661)).toBe('61m 1s');
    });
  });
});
