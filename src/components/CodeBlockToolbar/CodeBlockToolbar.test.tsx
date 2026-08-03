import { describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { CodeBlockToolbar } from './CodeBlockToolbar';

describe('CodeBlockToolbar', () => {
  it('renders nothing when nothing is given', () => {
    const { container } = render(<CodeBlockToolbar />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders only the actions whose handler is given', () => {
    render(<CodeBlockToolbar onCopy={() => {}} onRun={() => {}} />);
    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Run' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Download' })).not.toBeInTheDocument();
  });

  it('calls the matching handler when an action is clicked', async () => {
    const onCopy = vi.fn();
    const user = userEvent.setup();
    render(<CodeBlockToolbar onCopy={onCopy} />);
    await user.click(screen.getByRole('button', { name: 'Copy' }));
    expect(onCopy).toHaveBeenCalled();
  });

  it('renders the label', () => {
    render(<CodeBlockToolbar label="TypeScript" onCopy={() => {}} />);
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
  });

  it('renders the label alone with no actions', () => {
    render(<CodeBlockToolbar label="TypeScript" />);
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders no expand toggle unless expanded/defaultExpanded/onExpandedChange is given', () => {
    render(<CodeBlockToolbar onCopy={() => {}} />);
    expect(screen.queryByRole('button', { name: 'Expand' })).not.toBeInTheDocument();
  });

  it('the expand toggle switches label between Expand/Collapse and calls onExpandedChange', async () => {
    const onExpandedChange = vi.fn();
    const user = userEvent.setup();
    render(<CodeBlockToolbar onExpandedChange={onExpandedChange} />);
    const toggle = screen.getByRole('button', { name: 'Expand' });
    await user.click(toggle);
    expect(screen.getByRole('button', { name: 'Collapse' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(onExpandedChange).toHaveBeenCalledWith(true);
  });

  it('starts expanded when defaultExpanded is true', () => {
    render(<CodeBlockToolbar defaultExpanded onExpandedChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Collapse' })).toBeInTheDocument();
  });

  it('works as a controlled component via the expanded prop', async () => {
    const user = userEvent.setup();
    render(<CodeBlockToolbar expanded={false} onExpandedChange={() => {}} />);
    await user.click(screen.getByRole('button', { name: 'Expand' }));
    // Controlled: stays "Expand" since the expanded prop wasn't updated by the consumer.
    expect(screen.getByRole('button', { name: 'Expand' })).toBeInTheDocument();
  });

  it('has role=toolbar with an accessible name', () => {
    render(<CodeBlockToolbar onCopy={() => {}} />);
    expect(screen.getByRole('toolbar', { name: 'Code block actions' })).toBeInTheDocument();
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLDivElement>();
    render(<CodeBlockToolbar ref={ref} onCopy={() => {}} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('merges a custom className with the base style', () => {
    render(<CodeBlockToolbar onCopy={() => {}} className="custom" data-testid="bar" />);
    expect(screen.getByTestId('bar').className).toContain('custom');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <CodeBlockToolbar
        label="TypeScript"
        onCopy={() => {}}
        onDownload={() => {}}
        onRun={() => {}}
        onExpandedChange={() => {}}
      />,
    );
    await expectNoA11yViolations(container);
  });
});
