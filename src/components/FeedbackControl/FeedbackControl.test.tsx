import { describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { FeedbackControl } from './FeedbackControl';

describe('FeedbackControl', () => {
  it('renders thumbs-up and thumbs-down buttons, unpressed by default', () => {
    render(<FeedbackControl />);
    expect(screen.getByRole('button', { name: 'Good response' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(screen.getByRole('button', { name: 'Bad response' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('renders no report button by default', () => {
    render(<FeedbackControl />);
    expect(screen.queryByRole('button', { name: 'Report' })).not.toBeInTheDocument();
  });

  it('renders a report button and calls onReport when clicked', async () => {
    const onReport = vi.fn();
    const user = userEvent.setup();
    render(<FeedbackControl onReport={onReport} />);
    await user.click(screen.getByRole('button', { name: 'Report' }));
    expect(onReport).toHaveBeenCalled();
  });

  it('pressing "up" marks it pressed and "down" unpressed', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<FeedbackControl onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Good response' }));
    expect(screen.getByRole('button', { name: 'Good response' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Bad response' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(onChange).toHaveBeenCalledWith('up');
  });

  it('clicking "down" after "up" is pressed switches to "down" (mutually exclusive)', async () => {
    const user = userEvent.setup();
    render(<FeedbackControl defaultValue="up" />);
    await user.click(screen.getByRole('button', { name: 'Bad response' }));
    expect(screen.getByRole('button', { name: 'Good response' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(screen.getByRole('button', { name: 'Bad response' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('clicking the already-pressed button toggles it back off', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<FeedbackControl defaultValue="up" onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Good response' }));
    expect(screen.getByRole('button', { name: 'Good response' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('works as a controlled component', async () => {
    const user = userEvent.setup();
    render(<FeedbackControl value="down" onChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Bad response' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await user.click(screen.getByRole('button', { name: 'Good response' }));
    // Controlled: stays on "down" since the value prop wasn't updated by the consumer.
    expect(screen.getByRole('button', { name: 'Bad response' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('supports custom labels', () => {
    render(<FeedbackControl upLabel="Helpful" downLabel="Not helpful" />);
    expect(screen.getByRole('button', { name: 'Helpful' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Not helpful' })).toBeInTheDocument();
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLDivElement>();
    render(<FeedbackControl ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('merges a custom className with the base style', () => {
    render(<FeedbackControl className="custom" data-testid="feedback" />);
    expect(screen.getByTestId('feedback').className).toContain('custom');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<FeedbackControl onReport={() => {}} />);
    await expectNoA11yViolations(container);
  });
});
