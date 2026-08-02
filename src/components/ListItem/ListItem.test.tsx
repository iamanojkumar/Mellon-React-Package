import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { ListItem } from './ListItem';
import { List } from '../List/List';

describe('ListItem', () => {
  it('renders as an li by default', () => {
    render(
      <List>
        <ListItem data-testid="item">content</ListItem>
      </List>,
    );
    expect(screen.getByTestId('item').tagName).toBe('LI');
  });

  it('renders as the element passed via the "as" prop', () => {
    render(<ListItem as="span" data-testid="item" />);
    expect(screen.getByTestId('item').tagName).toBe('SPAN');
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLLIElement>();
    render(
      <List>
        <ListItem ref={ref} />
      </List>,
    );
    expect(ref.current).toBeInstanceOf(HTMLLIElement);
  });

  it('merges a custom className with the base style', () => {
    render(<ListItem data-testid="item" className="custom" />);
    expect(screen.getByTestId('item').className).toContain('custom');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <List>
        <ListItem>content</ListItem>
      </List>,
    );
    await expectNoA11yViolations(container);
  });

  it('defaults to size=md and color=primary', () => {
    render(<ListItem data-testid="item">content</ListItem>);
    const el = screen.getByTestId('item');
    expect(el).toHaveAttribute('data-size', 'md');
    expect(el).toHaveAttribute('data-color', 'primary');
  });
});
