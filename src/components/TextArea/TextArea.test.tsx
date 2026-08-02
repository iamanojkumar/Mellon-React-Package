import { describe, expect, it, vi } from 'vitest';
import { createRef, useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { TextArea } from './TextArea';
import { AIProvider } from '../../providers/AIProvider';
import type { AIClient } from '../../contexts/AIContext';

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

  describe('aiRewrite', () => {
    it('renders no AI trigger when aiRewrite is omitted', () => {
      render(<TextArea aria-label="Bio" />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('renders no AI trigger when aiRewrite is true but no AIProvider is mounted', () => {
      render(<TextArea aria-label="Bio" aiRewrite />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('renders the AI trigger when aiRewrite is true and an AIProvider is mounted', () => {
      const client: AIClient = { complete: vi.fn().mockResolvedValue('rewritten') };
      render(
        <AIProvider client={client}>
          <TextArea aria-label="Bio" aiRewrite defaultValue="a draft" />
        </AIProvider>,
      );
      expect(screen.getByRole('button', { name: 'Rewrite with AI' })).toBeInTheDocument();
    });

    it('triggers the AI client on open and accepting replaces the value via the same setValue path', async () => {
      const user = userEvent.setup();
      const client: AIClient = { complete: vi.fn().mockResolvedValue('a polished draft') };

      function Controlled() {
        const [value, setValue] = useState('a draft');
        return (
          <AIProvider client={client}>
            <TextArea
              aria-label="Bio"
              aiRewrite
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </AIProvider>
        );
      }
      render(<Controlled />);

      await user.click(screen.getByRole('button', { name: 'Rewrite with AI' }));
      expect(client.complete).toHaveBeenCalledWith(
        expect.objectContaining({ prompt: expect.stringContaining('a draft') }),
      );

      await screen.findByText('a polished draft');
      await user.click(screen.getByRole('button', { name: 'Accept' }));

      expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('a polished draft');
    });
  });
});
