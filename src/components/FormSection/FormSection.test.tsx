import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { FormSection } from './FormSection';

describe('FormSection', () => {
  it('renders as a section', () => {
    render(<FormSection data-testid="section" title="Profile" />);
    expect(screen.getByTestId('section').tagName).toBe('SECTION');
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLElement>();
    render(<FormSection ref={ref} title="Profile" />);
    expect(ref.current).toBeInstanceOf(HTMLElement);
  });

  it('merges a custom className with the base style', () => {
    render(<FormSection data-testid="section" className="custom" title="Profile" />);
    expect(screen.getByTestId('section').className).toContain('custom');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <FormSection title="Profile" description="Your public information">
        <input aria-label="Name" />
      </FormSection>,
    );
    await expectNoA11yViolations(container);
  });

  it('renders the title', () => {
    render(<FormSection title="Profile" />);
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('does not render a description when not given', () => {
    render(<FormSection title="Profile" data-testid="section" />);
    expect(screen.getByTestId('section').querySelector('p')).not.toBeInTheDocument();
  });

  it('renders the description and children when given', () => {
    render(
      <FormSection title="Profile" description="Your public information">
        <input aria-label="Name" />
      </FormSection>,
    );
    expect(screen.getByText('Your public information')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
  });
});
