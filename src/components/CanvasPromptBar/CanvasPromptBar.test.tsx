import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { CanvasPromptBar, buildCanvasPromptWithMentions } from './CanvasPromptBar';
import type { CanvasBlockData } from '../../utilities/canvasReducer';

const blocks: CanvasBlockData[] = [
  { id: 'b1', kind: 'sticky', text: 'Login flow', x: 0, y: 0, width: 100, height: 100 },
  { id: 'b2', kind: 'sticky', text: 'Auth service', x: 200, y: 0, width: 100, height: 100 },
];

describe('buildCanvasPromptWithMentions', () => {
  it('returns the prompt untouched when nothing was referenced', () => {
    expect(buildCanvasPromptWithMentions('tidy up', [])).toBe('tidy up');
  });

  it('appends the id behind every reference', () => {
    expect(
      buildCanvasPromptWithMentions('move it', [{ id: 'b2', label: 'Auth service' }]),
    ).toContain('"Auth service" = b2');
  });
});

describe('CanvasPromptBar', () => {
  it('submits the typed prompt', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<CanvasPromptBar blocks={blocks} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Ask or instruct the canvas'), 'add a note{Enter}');

    expect(onSubmit).toHaveBeenCalledWith('add a note');
  });

  it('ignores an empty prompt', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<CanvasPromptBar blocks={blocks} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Ask or instruct the canvas'), '   {Enter}');

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('opens the block picker on @ and filters as you type', async () => {
    const user = userEvent.setup();
    render(<CanvasPromptBar blocks={blocks} onSubmit={vi.fn()} />);

    await user.type(screen.getByLabelText('Ask or instruct the canvas'), 'move @auth');

    expect(await screen.findByRole('option', { name: /Auth service/ })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /Login flow/ })).not.toBeInTheDocument();
  });

  it('resolves a picked block to its id in the submitted prompt', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<CanvasPromptBar blocks={blocks} onSubmit={onSubmit} />);

    const input = screen.getByLabelText('Ask or instruct the canvas');
    await user.type(input, 'move @auth');
    await user.click(await screen.findByRole('option', { name: /Auth service/ }));
    await user.type(input, 'left{Enter}');

    expect(onSubmit).toHaveBeenCalledWith(expect.stringContaining('"Auth service" = b2'));
  });

  it('drops a reference the user deleted from the text', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<CanvasPromptBar blocks={blocks} onSubmit={onSubmit} />);

    const input = screen.getByLabelText('Ask or instruct the canvas');
    await user.type(input, '@auth');
    await user.click(await screen.findByRole('option', { name: /Auth service/ }));
    await user.clear(input);
    await user.type(input, 'never mind{Enter}');

    expect(onSubmit).toHaveBeenCalledWith('never mind');
  });

  it('shows a busy state and surfaces errors', () => {
    const { rerender } = render(
      <CanvasPromptBar blocks={blocks} onSubmit={vi.fn()} status="loading" />,
    );
    expect(screen.getByRole('button', { name: 'Send' })).toHaveAttribute('aria-busy', 'true');

    rerender(<CanvasPromptBar blocks={blocks} onSubmit={vi.fn()} error="network down" />);
    expect(screen.getByRole('alert')).toHaveTextContent('network down');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<CanvasPromptBar blocks={blocks} onSubmit={vi.fn()} />);

    await expectNoA11yViolations(container);
  });

  describe('host-supplied references', () => {
    const references = [
      { id: 'page-3', name: 'Personas', description: 'page' },
      { id: 'page-9', name: 'Journey map', description: 'page' },
    ];

    it('offers them in the same `@` menu as blocks', async () => {
      const user = userEvent.setup();
      render(<CanvasPromptBar blocks={blocks} references={references} onSubmit={vi.fn()} />);

      await user.type(screen.getByLabelText('Ask or instruct the canvas'), '@o');

      // "Login flow" and "Personas" both contain an "o"; both are offered.
      expect(await screen.findByRole('option', { name: /Personas/ })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /Login flow/ })).toBeInTheDocument();
    });

    // The reported bug behind this prop: a reference smuggled in as a fake
    // block tells the model a block with that id is on the canvas, and every
    // command it then aims there comes back rejected by `applyCanvasCommands`.
    it('lists them under their own heading, never as a referenced block', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<CanvasPromptBar blocks={blocks} references={references} onSubmit={onSubmit} />);

      const input = screen.getByLabelText('Ask or instruct the canvas');
      await user.type(input, 'draft from @Personas');
      await user.click(await screen.findByRole('option', { name: /Personas/ }));
      await user.type(input, '{Enter}');

      const prompt = onSubmit.mock.calls.at(-1)?.[0] as string;
      expect(prompt).toContain('References: "Personas" = page-3');
      expect(prompt).not.toContain('Referenced blocks');
    });

    it('lets the host name the heading in its own terms', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(
        <CanvasPromptBar
          blocks={blocks}
          references={references}
          referenceLabel="Referenced pages"
          onSubmit={onSubmit}
        />,
      );

      const input = screen.getByLabelText('Ask or instruct the canvas');
      await user.type(input, '@Personas');
      await user.click(await screen.findByRole('option', { name: /Personas/ }));
      await user.type(input, '{Enter}');

      expect(onSubmit).toHaveBeenCalledWith(
        expect.stringContaining('Referenced pages: "Personas" = page-3'),
      );
    });

    it('keeps blocks and references on separate lines when both are mentioned', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<CanvasPromptBar blocks={blocks} references={references} onSubmit={onSubmit} />);

      const input = screen.getByLabelText('Ask or instruct the canvas');
      await user.type(input, '@Personas');
      await user.click(await screen.findByRole('option', { name: /Personas/ }));
      await user.type(input, 'into @auth');
      await user.click(await screen.findByRole('option', { name: /Auth service/ }));
      await user.type(input, '{Enter}');

      const prompt = onSubmit.mock.calls.at(-1)?.[0] as string;
      expect(prompt).toContain('Referenced blocks: "Auth service" = b2');
      expect(prompt).toContain('References: "Personas" = page-3');
    });

    it('names the picker for what it now holds', async () => {
      const user = userEvent.setup();
      render(<CanvasPromptBar blocks={blocks} references={references} onSubmit={vi.fn()} />);

      await user.type(screen.getByLabelText('Ask or instruct the canvas'), '@p');

      expect(
        await screen.findByRole('listbox', { name: 'Blocks and references' }),
      ).toBeInTheDocument();
    });

    it('changes nothing without them', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<CanvasPromptBar blocks={blocks} onSubmit={onSubmit} />);

      const input = screen.getByLabelText('Ask or instruct the canvas');
      await user.type(input, '@auth');
      await user.click(await screen.findByRole('option', { name: /Auth service/ }));
      await user.type(input, '{Enter}');

      expect(onSubmit).toHaveBeenCalledWith(
        expect.stringContaining('Referenced blocks: "Auth service" = b2'),
      );
    });

    it('has no accessibility violations', async () => {
      const { container } = render(
        <CanvasPromptBar blocks={blocks} references={references} onSubmit={vi.fn()} />,
      );

      await expectNoA11yViolations(container);
    });
  });

  describe('size', () => {
    it('defaults to md and forwards the chosen size to the field', () => {
      const { rerender } = render(<CanvasPromptBar blocks={blocks} onSubmit={vi.fn()} />);
      expect(screen.getByLabelText('Ask or instruct the canvas')).toHaveAttribute(
        'data-size',
        'md',
      );

      rerender(<CanvasPromptBar blocks={blocks} onSubmit={vi.fn()} size="lg" />);
      expect(screen.getByLabelText('Ask or instruct the canvas')).toHaveAttribute(
        'data-size',
        'lg',
      );
    });

    // `minimal` used to zero the padding outright at a specificity
    // (`.input.inputMinimal[data-size]`) no consumer selector could beat
    // without `!important`, which left the variant meant for a chat composer
    // as the one variant stuck at a single line of text height.
    it('still carries a size under the minimal variant', () => {
      render(<CanvasPromptBar blocks={blocks} onSubmit={vi.fn()} variant="minimal" size="lg" />);

      expect(screen.getByLabelText('Ask or instruct the canvas')).toHaveAttribute(
        'data-size',
        'lg',
      );
    });
  });

  describe('minimal variant', () => {
    it('renders no Send button — Enter still submits', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<CanvasPromptBar blocks={blocks} onSubmit={onSubmit} variant="minimal" />);

      expect(screen.queryByRole('button', { name: 'Send' })).not.toBeInTheDocument();

      await user.type(screen.getByLabelText('Ask or instruct the canvas'), 'add a note{Enter}');
      expect(onSubmit).toHaveBeenCalledWith('add a note');
    });

    it('has no accessibility violations', async () => {
      const { container } = render(
        <CanvasPromptBar blocks={blocks} onSubmit={vi.fn()} variant="minimal" />,
      );

      await expectNoA11yViolations(container);
    });
  });
});
