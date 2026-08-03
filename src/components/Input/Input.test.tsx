import { describe, expect, it, vi } from 'vitest';
import { createRef, useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Input } from './Input';
import { AIProvider } from '../../providers/AIProvider';
import type { AIClient } from '../../contexts/AIContext';

describe('Input', () => {
  it('renders a native input element', () => {
    render(<Input aria-label="Name" />);
    expect(screen.getByRole('textbox')).toBeInstanceOf(HTMLInputElement);
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input aria-label="Name" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('merges a custom className with the base style', () => {
    render(<Input aria-label="Name" className="custom" />);
    expect(screen.getByRole('textbox').className).toContain('custom');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Input aria-label="Name" />);
    await expectNoA11yViolations(container);
  });

  it('defaults to size=md', () => {
    render(<Input aria-label="Name" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('data-size', 'md');
  });

  it('sets aria-invalid and data-invalid when invalid', () => {
    render(<Input aria-label="Name" invalid />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('data-invalid', 'true');
  });

  it('works uncontrolled, tracking its own value from defaultValue', async () => {
    const user = userEvent.setup();
    render(<Input aria-label="Name" defaultValue="hi" />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('hi');
    await user.type(input, '!');
    expect(input.value).toBe('hi!');
  });

  it('works controlled, deferring to the value prop', async () => {
    function Controlled() {
      const [value, setValue] = useState('start');
      return <Input aria-label="Name" value={value} onChange={(e) => setValue(e.target.value)} />;
    }
    const user = userEvent.setup();
    render(<Controlled />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('start');
    await user.type(input, '!');
    expect(input.value).toBe('start!');
  });

  it('calls onChange with the native ChangeEvent', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Input aria-label="Name" onChange={onChange} />);
    await user.type(screen.getByRole('textbox'), 'a');
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ target: expect.objectContaining({ value: 'a' }) }),
    );
  });

  describe('aiAutocomplete', () => {
    it('renders no AI trigger when aiAutocomplete is omitted', () => {
      render(<Input aria-label="Name" />);
      expect(
        screen.queryByRole('button', { name: 'Autocomplete with AI' }),
      ).not.toBeInTheDocument();
    });

    it('renders no AI trigger when aiAutocomplete is true but no AIProvider is mounted', () => {
      render(<Input aria-label="Name" aiAutocomplete />);
      expect(
        screen.queryByRole('button', { name: 'Autocomplete with AI' }),
      ).not.toBeInTheDocument();
    });

    it('renders the AI trigger when a provider is mounted', () => {
      const client: AIClient = { complete: vi.fn() };
      render(
        <AIProvider client={client}>
          <Input aria-label="Name" aiAutocomplete />
        </AIProvider>,
      );
      expect(screen.getByRole('button', { name: 'Autocomplete with AI' })).toBeInTheDocument();
    });

    it('triggers the AI client on open with the current value', async () => {
      const user = userEvent.setup();
      const complete = vi.fn().mockResolvedValue('Jonathan');
      const client: AIClient = { complete };
      render(
        <AIProvider client={client}>
          <Input aria-label="Name" defaultValue="Jon" aiAutocomplete />
        </AIProvider>,
      );
      await user.click(screen.getByRole('button', { name: 'Autocomplete with AI' }));
      expect(complete).toHaveBeenCalledWith(
        expect.objectContaining({ prompt: expect.stringContaining('Jon') }),
      );
      expect(await screen.findByText('Jonathan')).toBeInTheDocument();
    });

    it('accepting a suggestion applies it as the new value and calls onChange (controlled)', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const complete = vi.fn().mockResolvedValue('Jonathan');
      const client: AIClient = { complete };
      function Controlled() {
        const [value, setValue] = useState('Jon');
        return (
          <Input
            aria-label="Name"
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              onChange(event);
            }}
            aiAutocomplete
          />
        );
      }
      render(
        <AIProvider client={client}>
          <Controlled />
        </AIProvider>,
      );
      await user.click(screen.getByRole('button', { name: 'Autocomplete with AI' }));
      await user.click(await screen.findByRole('button', { name: 'Accept' }));
      expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('Jonathan');
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ target: expect.objectContaining({ value: 'Jonathan' }) }),
      );
    });

    it('has no accessibility violations with the AI trigger rendered', async () => {
      const client: AIClient = { complete: vi.fn() };
      const { container } = render(
        <AIProvider client={client}>
          <Input aria-label="Name" aiAutocomplete />
        </AIProvider>,
      );
      await expectNoA11yViolations(container);
    });
  });
});
