import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Label } from './Label';

describe('Label', () => {
  it('renders as a label by default', () => {
    render(<Label data-testid="label">Email</Label>);
    expect(screen.getByTestId('label').tagName).toBe('LABEL');
  });

  it('renders as the element passed via the "as" prop', () => {
    render(<Label as="span" data-testid="label" />);
    expect(screen.getByTestId('label').tagName).toBe('SPAN');
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLLabelElement>();
    render(<Label ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLLabelElement);
  });

  it('merges a custom className with the base style', () => {
    render(<Label data-testid="label" className="custom" />);
    expect(screen.getByTestId('label').className).toContain('custom');
  });

  it('associates with a control via htmlFor', () => {
    render(
      <>
        <Label htmlFor="email-input">Email</Label>
        <input id="email-input" />
      </>,
    );
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Label>Email</Label>);
    await expectNoA11yViolations(container);
  });

  it('does not show a required indicator by default', () => {
    render(<Label>Email</Label>);
    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  it('shows a required indicator when required is set', () => {
    render(<Label required>Email</Label>);
    expect(screen.getByText('*')).toBeInTheDocument();
  });
});
