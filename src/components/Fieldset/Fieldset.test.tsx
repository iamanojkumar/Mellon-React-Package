import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Fieldset } from './Fieldset';

describe('Fieldset', () => {
  it('renders as a fieldset', () => {
    render(
      <Fieldset data-testid="fieldset">
        <input aria-label="name" />
      </Fieldset>,
    );
    expect(screen.getByTestId('fieldset').tagName).toBe('FIELDSET');
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLFieldSetElement>();
    render(<Fieldset ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLFieldSetElement);
  });

  it('merges a custom className with the base style', () => {
    render(<Fieldset data-testid="fieldset" className="custom" />);
    expect(screen.getByTestId('fieldset').className).toContain('custom');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <Fieldset legend="Contact details">
        <input aria-label="name" />
      </Fieldset>,
    );
    await expectNoA11yViolations(container);
  });

  it('renders a legend when given', () => {
    render(<Fieldset legend="Contact details" />);
    expect(screen.getByText('Contact details').tagName).toBe('LEGEND');
  });

  it('renders no legend when not given', () => {
    render(<Fieldset data-testid="fieldset" />);
    expect(screen.getByTestId('fieldset').querySelector('legend')).not.toBeInTheDocument();
  });

  it('disables every control inside via the native disabled attribute', () => {
    render(
      <Fieldset disabled>
        <input aria-label="name" />
      </Fieldset>,
    );
    expect(screen.getByLabelText('name')).toBeDisabled();
  });
});
