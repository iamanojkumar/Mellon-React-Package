import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Figure } from './Figure';

describe('Figure', () => {
  it('renders as a figure', () => {
    render(<Figure data-testid="figure">content</Figure>);
    expect(screen.getByTestId('figure').tagName).toBe('FIGURE');
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLElement>();
    render(<Figure ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLElement);
  });

  it('merges a custom className with the base style', () => {
    render(<Figure data-testid="figure" className="custom" />);
    expect(screen.getByTestId('figure').className).toContain('custom');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <Figure caption="A caption">
        <img src="https://example.com/a.png" alt="" />
      </Figure>,
    );
    await expectNoA11yViolations(container);
  });

  it('does not render a figcaption when caption is not given', () => {
    render(<Figure data-testid="figure">content</Figure>);
    expect(screen.getByTestId('figure').querySelector('figcaption')).not.toBeInTheDocument();
  });

  it('renders the caption in a figcaption when given', () => {
    render(<Figure caption="A photo caption">content</Figure>);
    expect(screen.getByText('A photo caption').tagName).toBe('FIGCAPTION');
  });
});
