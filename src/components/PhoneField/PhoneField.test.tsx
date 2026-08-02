import { describe, expect, it, vi } from 'vitest';
import { createRef, useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { PhoneField } from './PhoneField';

describe('PhoneField', () => {
  it('renders a native input with type=tel', () => {
    render(<PhoneField aria-label="Phone" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'tel');
  });

  it('forwards the ref to the underlying input element', () => {
    const ref = createRef<HTMLInputElement>();
    render(<PhoneField aria-label="Phone" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<PhoneField aria-label="Phone" />);
    await expectNoA11yViolations(container);
  });

  it('does not let type be overridden', () => {
    // @ts-expect-error -- type is fixed at "tel"
    render(<PhoneField aria-label="Phone" type="text" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'tel');
  });

  describe('country code selector', () => {
    it('defaults to United States (+1)', () => {
      render(<PhoneField aria-label="Phone" />);
      expect(
        screen.getByRole('button', { name: 'Country code: United States, +1' }),
      ).toBeInTheDocument();
    });

    it('supports a defaultCountryCode', () => {
      render(<PhoneField aria-label="Phone" defaultCountryCode="GB" />);
      expect(
        screen.getByRole('button', { name: 'Country code: United Kingdom, +44' }),
      ).toBeInTheDocument();
    });

    it('opens a menu of countries and updates the selector on pick', async () => {
      const user = userEvent.setup();
      render(<PhoneField aria-label="Phone" />);
      await user.click(screen.getByRole('button', { name: /Country code/ }));
      await user.click(screen.getByRole('menuitem', { name: /France/ }));
      expect(screen.getByRole('button', { name: 'Country code: France, +33' })).toBeInTheDocument();
    });

    it('calls onCountryCodeChange with the ISO code', async () => {
      const onCountryCodeChange = vi.fn();
      const user = userEvent.setup();
      render(<PhoneField aria-label="Phone" onCountryCodeChange={onCountryCodeChange} />);
      await user.click(screen.getByRole('button', { name: /Country code/ }));
      await user.click(screen.getByRole('menuitem', { name: /France/ }));
      expect(onCountryCodeChange).toHaveBeenCalledWith('FR');
    });

    it('works controlled, deferring to the countryCode prop', async () => {
      function Controlled() {
        const [code, setCode] = useState('US');
        return <PhoneField aria-label="Phone" countryCode={code} onCountryCodeChange={setCode} />;
      }
      const user = userEvent.setup();
      render(<Controlled />);
      await user.click(screen.getByRole('button', { name: /Country code/ }));
      await user.click(screen.getByRole('menuitem', { name: /Japan/ }));
      expect(screen.getByRole('button', { name: 'Country code: Japan, +81' })).toBeInTheDocument();
    });

    it('does not fold the dial code into the input value', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<PhoneField aria-label="Phone" onChange={onChange} />);
      await user.click(screen.getByRole('button', { name: /Country code/ }));
      await user.click(screen.getByRole('menuitem', { name: /France/ }));
      await user.type(screen.getByRole('textbox'), '5551234');
      expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('5551234');
    });

    it('supports hideCountrySelect for the original plain shape', () => {
      render(<PhoneField aria-label="Phone" hideCountrySelect />);
      expect(screen.queryByRole('button', { name: /Country code/ })).not.toBeInTheDocument();
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'tel');
    });

    it('disables the selector button when disabled', () => {
      render(<PhoneField aria-label="Phone" disabled />);
      expect(screen.getByRole('button', { name: /Country code/ })).toBeDisabled();
      expect(screen.getByRole('textbox')).toBeDisabled();
    });
  });
});
