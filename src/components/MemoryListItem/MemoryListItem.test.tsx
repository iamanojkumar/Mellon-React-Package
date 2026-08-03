import { describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { MemoryListItem } from './MemoryListItem';

describe('MemoryListItem', () => {
  it('renders as a li', () => {
    render(
      <ul>
        <MemoryListItem>Prefers dark mode</MemoryListItem>
      </ul>,
    );
    expect(screen.getByText('Prefers dark mode').closest('li')).toBeInTheDocument();
  });

  it('renders no forget button by default', () => {
    render(
      <ul>
        <MemoryListItem>Prefers dark mode</MemoryListItem>
      </ul>,
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders a forget button and calls onForget when clicked', async () => {
    const onForget = vi.fn();
    const user = userEvent.setup();
    render(
      <ul>
        <MemoryListItem onForget={onForget}>Prefers dark mode</MemoryListItem>
      </ul>,
    );
    await user.click(screen.getByRole('button', { name: 'Forget' }));
    expect(onForget).toHaveBeenCalled();
  });

  it('supports a custom forgetLabel', () => {
    render(
      <ul>
        <MemoryListItem onForget={() => {}} forgetLabel="Remove this memory">
          Prefers dark mode
        </MemoryListItem>
      </ul>,
    );
    expect(screen.getByRole('button', { name: 'Remove this memory' })).toBeInTheDocument();
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLLIElement>();
    render(
      <ul>
        <MemoryListItem ref={ref}>Prefers dark mode</MemoryListItem>
      </ul>,
    );
    expect(ref.current).toBeInstanceOf(HTMLLIElement);
  });

  it('merges a custom className with the base style', () => {
    render(
      <ul>
        <MemoryListItem className="custom" data-testid="item">
          Prefers dark mode
        </MemoryListItem>
      </ul>,
    );
    expect(screen.getByTestId('item').className).toContain('custom');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <ul>
        <MemoryListItem onForget={() => {}}>Prefers dark mode</MemoryListItem>
      </ul>,
    );
    await expectNoA11yViolations(container);
  });
});
