import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Code } from './Code';

describe('Code', () => {
  it('renders as a code element by default', () => {
    render(<Code data-testid="code">const x = 1;</Code>);
    expect(screen.getByTestId('code').tagName).toBe('CODE');
  });

  it('renders as the element passed via the "as" prop', () => {
    render(<Code as="pre" data-testid="code" />);
    expect(screen.getByTestId('code').tagName).toBe('PRE');
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLElement>();
    render(<Code ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLElement);
  });

  it('merges a custom className with the base style', () => {
    render(<Code data-testid="code" className="custom" />);
    expect(screen.getByTestId('code').className).toContain('custom');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Code>const x = 1;</Code>);
    await expectNoA11yViolations(container);
  });

  it('omits data-block by default', () => {
    render(<Code data-testid="code">content</Code>);
    expect(screen.getByTestId('code')).not.toHaveAttribute('data-block');
  });

  it('sets data-block when block is true', () => {
    render(
      <Code data-testid="code" block>
        content
      </Code>,
    );
    expect(screen.getByTestId('code')).toHaveAttribute('data-block', 'true');
  });
});
