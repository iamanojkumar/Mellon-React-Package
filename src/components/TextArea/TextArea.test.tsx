import { describe, expect, it, vi } from 'vitest';
import { createRef, useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { TextArea } from './TextArea';

describe('TextArea', () => {
  it('renders a native textarea element', () => {
    render(<TextArea aria-label="Bio" />);
    expect(screen.getByRole('textbox')).toBeInstanceOf(HTMLTextAreaElement);
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<TextArea aria-label="Bio" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });

  it('merges a custom className with the base style', () => {
    render(<TextArea aria-label="Bio" className="custom" />);
    expect(screen.getByRole('textbox').className).toContain('custom');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<TextArea aria-label="Bio" />);
    await expectNoA11yViolations(container);
  });

  it('defaults to size=md', () => {
    render(<TextArea aria-label="Bio" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('data-size', 'md');
  });

  it('sets aria-invalid and data-invalid when invalid', () => {
    render(<TextArea aria-label="Bio" invalid />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('aria-invalid', 'true');
    expect(textarea).toHaveAttribute('data-invalid', 'true');
  });

  it('works uncontrolled, tracking its own value from defaultValue', async () => {
    const user = userEvent.setup();
    render(<TextArea aria-label="Bio" defaultValue="hi" />);
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.value).toBe('hi');
    await user.type(textarea, '!');
    expect(textarea.value).toBe('hi!');
  });

  it('works controlled, deferring to the value prop', async () => {
    function Controlled() {
      const [value, setValue] = useState('start');
      return <TextArea aria-label="Bio" value={value} onChange={(e) => setValue(e.target.value)} />;
    }
    const user = userEvent.setup();
    render(<Controlled />);
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.value).toBe('start');
    await user.type(textarea, '!');
    expect(textarea.value).toBe('start!');
  });

  it('calls onChange with the native ChangeEvent', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<TextArea aria-label="Bio" onChange={onChange} />);
    await user.type(screen.getByRole('textbox'), 'a');
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ target: expect.objectContaining({ value: 'a' }) }),
    );
  });
});
