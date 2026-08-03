import { describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { MessageActionBar } from './MessageActionBar';

describe('MessageActionBar', () => {
  it('renders nothing when no action is given', () => {
    const { container } = render(<MessageActionBar />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders only the actions whose handler is given', () => {
    render(<MessageActionBar onCopy={() => {}} onRegenerate={() => {}} />);
    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Regenerate' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Continue' })).not.toBeInTheDocument();
  });

  it('calls the matching handler when an action is clicked', async () => {
    const onCopy = vi.fn();
    const user = userEvent.setup();
    render(<MessageActionBar onCopy={onCopy} />);
    await user.click(screen.getByRole('button', { name: 'Copy' }));
    expect(onCopy).toHaveBeenCalled();
  });

  it('renders extraActions after the named ones', () => {
    render(
      <MessageActionBar
        onCopy={() => {}}
        extraActions={[{ id: 'translate', label: 'Translate', onClick: () => {} }]}
      />,
    );
    const toolbar = screen.getByRole('toolbar');
    const labels = Array.from(toolbar.querySelectorAll('button')).map((b) => b.textContent);
    expect(labels).toEqual(['Copy', 'Translate']);
  });

  it('has role=toolbar with an accessible name', () => {
    render(<MessageActionBar onCopy={() => {}} />);
    expect(screen.getByRole('toolbar', { name: 'Message actions' })).toBeInTheDocument();
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLDivElement>();
    render(<MessageActionBar ref={ref} onCopy={() => {}} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('merges a custom className with the base style', () => {
    render(<MessageActionBar onCopy={() => {}} className="custom" data-testid="bar" />);
    expect(screen.getByTestId('bar').className).toContain('custom');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <MessageActionBar onCopy={() => {}} onRegenerate={() => {}} onExplain={() => {}} />,
    );
    await expectNoA11yViolations(container);
  });
});
