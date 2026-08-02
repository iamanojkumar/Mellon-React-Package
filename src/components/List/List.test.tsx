import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { List } from './List';

describe('List', () => {
  it('renders as a ul by default', () => {
    render(
      <List data-testid="list">
        <li>item</li>
      </List>,
    );
    expect(screen.getByTestId('list').tagName).toBe('UL');
  });

  it('renders as an ol when ordered is set', () => {
    render(
      <List ordered data-testid="list">
        <li>item</li>
      </List>,
    );
    expect(screen.getByTestId('list').tagName).toBe('OL');
  });

  it('renders as the element passed via the "as" prop, overriding ordered', () => {
    render(<List as="div" ordered data-testid="list" />);
    expect(screen.getByTestId('list').tagName).toBe('DIV');
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLUListElement>();
    render(<List ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLUListElement);
  });

  it('merges a custom className with the base style', () => {
    render(<List data-testid="list" className="custom" />);
    expect(screen.getByTestId('list').className).toContain('custom');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <List>
        <li>item</li>
      </List>,
    );
    await expectNoA11yViolations(container);
  });

  it('resolves the spacing prop to a gap', () => {
    render(<List data-testid="list" spacing="md" />);
    expect(screen.getByTestId('list')).toHaveStyle({ gap: 'var(--ds-space-md)' });
  });

  it('sets data-unstyled when unstyled is true', () => {
    render(<List data-testid="list" unstyled />);
    expect(screen.getByTestId('list')).toHaveAttribute('data-unstyled', 'true');
  });
});
