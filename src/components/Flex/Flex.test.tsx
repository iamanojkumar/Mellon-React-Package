import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Flex } from './Flex';

describe('Flex', () => {
  it('renders as a div by default', () => {
    render(<Flex data-testid="flex">content</Flex>);
    expect(screen.getByTestId('flex').tagName).toBe('DIV');
  });

  it('renders as the element passed via the "as" prop', () => {
    render(<Flex as="section" data-testid="flex" />);
    expect(screen.getByTestId('flex').tagName).toBe('SECTION');
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Flex ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('merges a custom className with the base style', () => {
    render(<Flex data-testid="flex" className="custom" />);
    expect(screen.getByTestId('flex').className).toContain('custom');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Flex>content</Flex>);
    await expectNoA11yViolations(container);
  });

  it('resolves direction, align, justify, and wrap to CSS values', () => {
    render(
      <Flex data-testid="flex" direction="column" align="center" justify="between" wrap="wrap" />,
    );
    expect(screen.getByTestId('flex')).toHaveStyle({
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
    });
  });

  it('resolves the gap prop to a spacing token', () => {
    render(<Flex data-testid="flex" gap="md" />);
    expect(screen.getByTestId('flex')).toHaveStyle({ gap: 'var(--ds-space-md)' });
  });

  it('resolves spacing props via the shared Box-style resolver', () => {
    render(<Flex data-testid="flex" p="sm" />);
    expect(screen.getByTestId('flex')).toHaveStyle({ padding: 'var(--ds-space-sm)' });
  });
});
