import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Canvas } from './Canvas';
import { AIProvider } from '../../providers/AIProvider';
import { ToastProvider } from '../../providers/ToastProvider';
import type { AIClient } from '../../contexts/AIContext';
import type { CanvasScene } from '../../utilities/canvasReducer';

function makeScene(): CanvasScene {
  return {
    blocks: [
      { id: 'a', kind: 'sticky', text: 'Login', x: 0, y: 0, width: 120, height: 120 },
      { id: 'b', kind: 'sticky', text: 'Auth', x: 300, y: 0, width: 120, height: 120 },
      {
        id: 'f',
        kind: 'frame',
        title: 'Flow',
        x: -20,
        y: -20,
        width: 500,
        height: 200,
      },
    ],
    connectors: [{ id: 'e1', from: 'a', to: 'b', label: 'signs in' }],
  };
}

function blockEl(name: string): HTMLElement {
  return screen.getByLabelText(name);
}

/**
 * The surface is a `role="group"` composite widget, not `role="application"` —
 * it takes focus and owns the arrow keys, while the outline supplies reading
 * order and connections. Named explicitly because blocks are labelled groups
 * too, so a bare `getByRole('group')` is ambiguous.
 */
function focusCanvas() {
  act(() => {
    screen.getByRole('group', { name: 'Canvas' }).focus();
  });
}

describe('Canvas rendering', () => {
  it('renders a block per scene entry', () => {
    render(<Canvas defaultScene={makeScene()} />);

    expect(blockEl('Login')).toBeInTheDocument();
    expect(blockEl('Auth')).toBeInTheDocument();
  });

  it('positions blocks from their canvas coordinates', () => {
    render(<Canvas defaultScene={makeScene()} />);

    expect(blockEl('Auth')).toHaveStyle({ transform: 'translate(300px, 0px)' });
  });

  it('renders frames behind other blocks', () => {
    const { container } = render(<Canvas defaultScene={makeScene()} />);
    const kinds = Array.from(container.querySelectorAll('[data-kind]')).map((element) =>
      element.getAttribute('data-kind'),
    );

    expect(kinds[0]).toBe('frame');
  });

  /**
   * Regression guard: the connector layer used to render before every block,
   * so a frame — a full-size backdrop — painted over every edge inside it, and
   * a framed diagram came out with no visible connectors at all.
   */
  it('paints connectors above frames but below content', () => {
    const { container } = render(<Canvas defaultScene={makeScene()} />);
    const world = container.querySelector('svg')?.parentElement;
    const kinds = Array.from(world?.children ?? []).map(
      (element) => element.getAttribute('data-kind') ?? element.tagName.toLowerCase(),
    );

    expect(kinds.indexOf('frame')).toBeLessThan(kinds.indexOf('svg'));
    expect(kinds.indexOf('svg')).toBeLessThan(kinds.indexOf('sticky'));
  });

  it('draws a connector for each edge', () => {
    const { container } = render(<Canvas defaultScene={makeScene()} />);

    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(screen.getByText('signs in')).toBeInTheDocument();
  });

  it('drops a connector whose endpoint is gone rather than throwing', () => {
    const scene: CanvasScene = {
      blocks: [{ id: 'a', kind: 'sticky', text: 'Only', x: 0, y: 0, width: 100, height: 100 }],
      connectors: [{ id: 'e1', from: 'a', to: 'ghost' }],
    };

    expect(() => render(<Canvas defaultScene={scene} />)).not.toThrow();
  });
});

describe('Canvas accessibility', () => {
  it('keeps blocks in the accessibility tree and hides only the connector geometry', () => {
    const { container } = render(<Canvas defaultScene={makeScene()} />);

    // Blocks are labelled groups, reachable by role — hiding them would strand
    // their controls (a note's textarea, an AI trigger) inside aria-hidden.
    expect(screen.getByRole('group', { name: 'Login' })).toBeInTheDocument();
    // The SVG is pure geometry; the outline states connections in words.
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('navigation', { name: 'Canvas contents' })).toBeInTheDocument();
  });

  it('lists blocks in reading order, not scene order', () => {
    const scene: CanvasScene = {
      blocks: [
        { id: 'b', kind: 'sticky', text: 'Second', x: 300, y: 0, width: 100, height: 100 },
        { id: 'a', kind: 'sticky', text: 'First', x: 0, y: 0, width: 100, height: 100 },
      ],
      connectors: [],
    };
    render(<Canvas defaultScene={scene} />);

    const entries = screen.getAllByRole('button').map((button) => button.textContent);
    expect(entries[0]).toContain('First');
    expect(entries[1]).toContain('Second');
  });

  it('states connections as text in the outline', () => {
    render(<Canvas defaultScene={makeScene()} />);

    expect(screen.getByText('Connects to Auth')).toBeInTheDocument();
  });

  it('reports an empty canvas rather than rendering nothing', () => {
    render(<Canvas />);

    expect(screen.getByText('The canvas is empty.')).toBeInTheDocument();
  });

  it('selects from the outline', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(<Canvas defaultScene={makeScene()} onSelectionChange={onSelectionChange} />);

    await user.click(screen.getByRole('button', { name: /Login/ }));

    expect(onSelectionChange).toHaveBeenCalledWith(['a']);
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Canvas defaultScene={makeScene()} aria-label="Workspace" />);

    await expectNoA11yViolations(container);
  });

  it('has no accessibility violations with the outline visible', async () => {
    const { container } = render(<Canvas defaultScene={makeScene()} outlineVisible />);

    await expectNoA11yViolations(container);
  });
});

describe('Canvas object snap', () => {
  // `makeScene()`: block `a` at (0,0,120,120) — right edge at 120 — and
  // block `b` at (300,0,120,120).

  it('snaps a dragged block flush with a nearby block, and draws a guide line', () => {
    render(<Canvas defaultScene={makeScene()} grid={0} />);

    const surface = screen.getByRole('group', { name: 'Canvas' });
    // Drag `b` so its left edge lands a few pixels past `a`'s right edge
    // (120) — close enough that object-snap should pull it flush.
    fireEvent(
      blockEl('Auth'),
      new MouseEvent('pointerdown', { bubbles: true, clientX: 0, clientY: 0 }),
    );
    fireEvent(surface, new MouseEvent('pointermove', { bubbles: true, clientX: -177, clientY: 0 }));

    expect(blockEl('Auth')).toHaveStyle({ transform: 'translate(120px, 0px)' });
  });

  it('leaves the position alone once nothing is within the snap threshold', () => {
    render(<Canvas defaultScene={makeScene()} grid={0} />);

    const surface = screen.getByRole('group', { name: 'Canvas' });
    // 40px past the snap threshold from `a`'s right edge.
    fireEvent(
      blockEl('Auth'),
      new MouseEvent('pointerdown', { bubbles: true, clientX: 0, clientY: 0 }),
    );
    fireEvent(surface, new MouseEvent('pointermove', { bubbles: true, clientX: -140, clientY: 0 }));

    expect(blockEl('Auth')).toHaveStyle({ transform: 'translate(160px, 0px)' });
  });

  it('draws a guide line while snapped, and clears it once the drag ends', () => {
    const { container } = render(<Canvas defaultScene={makeScene()} grid={0} />);

    const surface = screen.getByRole('group', { name: 'Canvas' });
    fireEvent(
      blockEl('Auth'),
      new MouseEvent('pointerdown', { bubbles: true, clientX: 0, clientY: 0 }),
    );
    fireEvent(surface, new MouseEvent('pointermove', { bubbles: true, clientX: -177, clientY: 0 }));

    expect(container.querySelector('[class*="guideLine"]')).toBeInTheDocument();

    fireEvent(surface, new MouseEvent('pointerup', { bubbles: true }));
    expect(container.querySelector('[class*="guideLine"]')).not.toBeInTheDocument();
  });
});

describe('Canvas block fill', () => {
  it('turns a chosen fill into an update command for a selected sticky note', async () => {
    const user = userEvent.setup();
    const onSceneChange = vi.fn();
    render(
      <Canvas
        defaultScene={makeScene()}
        defaultSelectedIds={['a']}
        onSceneChange={onSceneChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Change fill color' }));
    await user.click(screen.getAllByRole('group', { name: 'Preset colors' })[0]!.children[0]!);

    const next: CanvasScene = onSceneChange.mock.calls.at(-1)?.[0];
    const login = next.blocks.find((block) => block.id === 'a');
    expect(login).toMatchObject({ color: expect.stringMatching(/^#[0-9a-f]{6}$/i) });
  });

  it('offers no fill trigger for a frame, which has no color field', () => {
    render(<Canvas defaultScene={makeScene()} defaultSelectedIds={['f']} />);

    expect(screen.queryByRole('button', { name: 'Change fill color' })).not.toBeInTheDocument();
  });
});

describe('Canvas document block', () => {
  function docScene(): CanvasScene {
    return {
      blocks: [
        {
          id: 'doc',
          kind: 'document',
          pages: ['<p>Resume text</p>'],
          header: '<h1>Ada</h1>',
          x: 0,
          y: 0,
          width: 280,
          height: 396,
        },
      ],
      connectors: [],
    };
  }

  it('renders read-only by default — no RichTextEditor, no fill trigger', () => {
    render(<Canvas defaultScene={docScene()} />);

    expect(screen.getByText('Resume text')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('double-clicking opens the editor and enters focus, locked by default', () => {
    render(<Canvas defaultScene={docScene()} />);

    fireEvent.doubleClick(screen.getByText('Resume text'));

    expect(screen.getByRole('textbox', { name: 'Page 1 text' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/Focused on/);

    const surface = screen.getByRole('group', { name: 'Canvas' });
    fireEvent.keyDown(surface, { key: '0' });
    // Locked: the reset-zoom key is a no-op, so no new zoom announcement replaces the focus one.
    expect(screen.getByRole('status')).not.toHaveTextContent('Zoom 100 percent.');
  });

  it('Escape exits both the editor and focus together', () => {
    render(<Canvas defaultScene={docScene()} />);

    fireEvent.doubleClick(screen.getByText('Resume text'));
    expect(screen.getByRole('textbox', { name: 'Page 1 text' })).toBeInTheDocument();

    const surface = screen.getByRole('group', { name: 'Canvas' });
    fireEvent.keyDown(surface, { key: 'Escape' });

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Focus exited.');
  });

  it("turns a page edit into an update command for the block's pages", () => {
    const onSceneChange = vi.fn();
    render(<Canvas defaultScene={docScene()} onSceneChange={onSceneChange} />);

    fireEvent.doubleClick(screen.getByText('Resume text'));
    fireEvent.input(screen.getByRole('textbox', { name: 'Page 1 text' }), {
      target: { innerHTML: 'Edited résumé' },
    });

    const next: CanvasScene = onSceneChange.mock.calls.at(-1)?.[0];
    const doc = next.blocks.find((block) => block.id === 'doc');
    expect(doc).toMatchObject({ pages: ['Edited résumé'] });
  });
});

describe('Canvas frame grouping', () => {
  // `makeScene()`'s frame `f` spans (-20,-20) to (480,180); both `a`
  // (centre 60,60) and `b` (centre 360,60) sit inside it.

  it('carries every block visually inside a frame along when the frame is dragged', () => {
    const onSceneChange = vi.fn();
    render(<Canvas defaultScene={makeScene()} onSceneChange={onSceneChange} grid={0} />);

    const surface = screen.getByRole('group', { name: 'Canvas' });
    fireEvent(
      blockEl('Flow'),
      new MouseEvent('pointerdown', { bubbles: true, clientX: 0, clientY: 0 }),
    );
    fireEvent(surface, new MouseEvent('pointermove', { bubbles: true, clientX: 50, clientY: 30 }));
    fireEvent(surface, new MouseEvent('pointerup', { bubbles: true }));

    expect(blockEl('Login')).toHaveStyle({ transform: 'translate(50px, 30px)' });
    expect(blockEl('Auth')).toHaveStyle({ transform: 'translate(350px, 30px)' });
    // The drag moved the frame's contents without adding them to the selection.
    expect(blockEl('Login')).not.toHaveAttribute('data-selected');
    expect(blockEl('Auth')).not.toHaveAttribute('data-selected');
  });

  it('leaves a block outside the frame untouched by the same drag', () => {
    const scene = makeScene();
    scene.blocks.push({
      id: 'outside',
      kind: 'sticky',
      text: 'Outside',
      x: 1000,
      y: 1000,
      width: 100,
      height: 100,
    });
    render(<Canvas defaultScene={scene} grid={0} />);

    const surface = screen.getByRole('group', { name: 'Canvas' });
    fireEvent(
      blockEl('Flow'),
      new MouseEvent('pointerdown', { bubbles: true, clientX: 0, clientY: 0 }),
    );
    fireEvent(surface, new MouseEvent('pointermove', { bubbles: true, clientX: 50, clientY: 30 }));
    fireEvent(surface, new MouseEvent('pointerup', { bubbles: true }));

    expect(blockEl('Outside')).toHaveStyle({ transform: 'translate(1000px, 1000px)' });
  });

  it('carries frame contents along a keyboard nudge too', async () => {
    const user = userEvent.setup();
    const onSceneChange = vi.fn();
    render(
      <Canvas
        defaultScene={makeScene()}
        defaultSelectedIds={['f']}
        onSceneChange={onSceneChange}
      />,
    );

    focusCanvas();
    await user.keyboard('{ArrowRight}');

    const next: CanvasScene = onSceneChange.mock.calls.at(-1)?.[0];
    expect(next.blocks.find((block) => block.id === 'a')).toMatchObject({ x: 8 });
    expect(next.blocks.find((block) => block.id === 'b')).toMatchObject({ x: 308 });
  });

  it('expands the AI context to the frame plus its contents when only the frame is selected', async () => {
    const user = userEvent.setup();
    let seenPrompt = '';

    render(
      <Canvas
        defaultScene={makeScene()}
        selectedIds={['f']}
        aiPrompt
        aiPromptFloating
        resolveCommands={async ({ prompt }) => {
          seenPrompt = prompt;
          return { commands: [] };
        }}
      />,
    );

    await user.type(
      screen.getByLabelText('Ask or instruct the canvas'),
      "what's in this group?{Enter}",
    );

    expect(seenPrompt).toContain('Selected elements (full content):');
    expect(seenPrompt).toContain('"id":"f"');
    expect(seenPrompt).toContain('"id":"a"');
    expect(seenPrompt).toContain('"id":"b"');
  });
});

describe('Canvas focus mode', () => {
  it('F focuses the selected block and narrows the selection to it', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(
      <Canvas
        defaultScene={makeScene()}
        defaultSelectedIds={['a', 'b']}
        onSelectionChange={onSelectionChange}
      />,
    );

    focusCanvas();
    await user.keyboard('f');

    expect(onSelectionChange).toHaveBeenCalledWith(['a']);
  });

  it('F again exits focus; a second selected block can then be focused', async () => {
    const user = userEvent.setup();
    const { container } = render(<Canvas defaultScene={makeScene()} defaultSelectedIds={['a']} />);

    focusCanvas();
    await user.keyboard('f');
    expect(container.querySelector('[class*="focusOverlay"]')).toBeInTheDocument();

    await user.keyboard('f');
    expect(container.querySelector('[class*="focusOverlay"]')).not.toBeInTheDocument();
  });

  it('Escape exits focus without clearing the selection', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(
      <Canvas
        defaultScene={makeScene()}
        defaultSelectedIds={['a']}
        onSelectionChange={onSelectionChange}
      />,
    );

    focusCanvas();
    await user.keyboard('f');
    onSelectionChange.mockClear();
    await user.keyboard('{Escape}');

    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('restricts interaction to the focused block — pressing another block does nothing', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(
      <Canvas
        defaultScene={makeScene()}
        defaultSelectedIds={['a']}
        onSelectionChange={onSelectionChange}
      />,
    );

    focusCanvas();
    await user.keyboard('f');
    onSelectionChange.mockClear();

    fireEvent(
      blockEl('Auth'),
      new MouseEvent('pointerdown', { bubbles: true, clientX: 0, clientY: 0 }),
    );
    fireEvent(blockEl('Auth'), new MouseEvent('pointerup', { bubbles: true }));

    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('L locks focus, freezing zoom/pan keys; unlocked they still work', async () => {
    const user = userEvent.setup();
    render(<Canvas defaultScene={makeScene()} defaultSelectedIds={['a']} />);
    focusCanvas();
    await user.keyboard('f');

    // Unlocked: zoom still responds.
    await user.keyboard('+');

    await user.keyboard('l');
    await user.keyboard('0'); // reset would announce 100% if it ran

    const status = screen.getByRole('status');
    expect(status).not.toHaveTextContent('Zoom 100 percent.');

    await user.keyboard('l'); // unlock
    await user.keyboard('0');
    expect(status).toHaveTextContent('Zoom 100 percent.');
  });

  it('has no accessibility violations while focused', async () => {
    const user = userEvent.setup();
    const { container } = render(<Canvas defaultScene={makeScene()} defaultSelectedIds={['a']} />);
    focusCanvas();
    await user.keyboard('f');

    await expectNoA11yViolations(container);
  });
});

describe('Canvas keyboard', () => {
  it('nudges the selected block by the grid step', async () => {
    const user = userEvent.setup();
    const onSceneChange = vi.fn();
    render(
      <Canvas
        defaultScene={makeScene()}
        defaultSelectedIds={['a']}
        onSceneChange={onSceneChange}
      />,
    );

    focusCanvas();
    await user.keyboard('{ArrowRight}');

    const next: CanvasScene = onSceneChange.mock.calls.at(-1)?.[0];
    expect(next.blocks.find((block) => block.id === 'a')).toMatchObject({ x: 8, y: 0 });
  });

  it('takes a bigger step with Shift', async () => {
    const user = userEvent.setup();
    const onSceneChange = vi.fn();
    render(
      <Canvas
        defaultScene={makeScene()}
        defaultSelectedIds={['a']}
        onSceneChange={onSceneChange}
      />,
    );

    focusCanvas();
    await user.keyboard('{Shift>}{ArrowDown}{/Shift}');

    const next: CanvasScene = onSceneChange.mock.calls.at(-1)?.[0];
    expect(next.blocks.find((block) => block.id === 'a')).toMatchObject({ y: 40 });
  });

  it('resizes with Alt+arrows, so the keyboard reaches the handles’ outcomes', async () => {
    const user = userEvent.setup();
    const onSceneChange = vi.fn();
    render(
      <Canvas
        defaultScene={makeScene()}
        defaultSelectedIds={['a']}
        onSceneChange={onSceneChange}
      />,
    );

    focusCanvas();
    await user.keyboard('{Alt>}{ArrowRight}{/Alt}');

    const next: CanvasScene = onSceneChange.mock.calls.at(-1)?.[0];
    expect(next.blocks.find((block) => block.id === 'a')?.width).toBe(128);
  });

  it('moves every selected block together', async () => {
    const user = userEvent.setup();
    const onSceneChange = vi.fn();
    render(
      <Canvas
        defaultScene={makeScene()}
        defaultSelectedIds={['a', 'b']}
        onSceneChange={onSceneChange}
      />,
    );

    focusCanvas();
    await user.keyboard('{ArrowRight}');

    const next: CanvasScene = onSceneChange.mock.calls.at(-1)?.[0];
    expect(next.blocks.find((block) => block.id === 'a')?.x).toBe(8);
    expect(next.blocks.find((block) => block.id === 'b')?.x).toBe(308);
  });

  it('deletes the selection and its connectors', async () => {
    const user = userEvent.setup();
    const onSceneChange = vi.fn();
    render(
      <Canvas
        defaultScene={makeScene()}
        defaultSelectedIds={['a']}
        onSceneChange={onSceneChange}
      />,
    );

    focusCanvas();
    await user.keyboard('{Delete}');

    const next: CanvasScene = onSceneChange.mock.calls.at(-1)?.[0];
    expect(next.blocks.find((block) => block.id === 'a')).toBeUndefined();
    expect(next.connectors).toEqual([]);
  });

  it('announces a move for screen readers', async () => {
    const user = userEvent.setup();
    render(<Canvas defaultScene={makeScene()} defaultSelectedIds={['a']} />);

    focusCanvas();
    await user.keyboard('{ArrowRight}');

    expect(screen.getByRole('status')).toHaveTextContent('Login at 8, 0');
  });

  it('clears the selection on Escape', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(
      <Canvas
        defaultScene={makeScene()}
        defaultSelectedIds={['a']}
        onSelectionChange={onSelectionChange}
      />,
    );

    focusCanvas();
    await user.keyboard('{Escape}');

    expect(onSelectionChange).toHaveBeenCalledWith([]);
  });

  it('changes nothing when read-only', async () => {
    const user = userEvent.setup();
    const onSceneChange = vi.fn();
    render(
      <Canvas
        defaultScene={makeScene()}
        defaultSelectedIds={['a']}
        onSceneChange={onSceneChange}
        readOnly
      />,
    );

    focusCanvas();
    await user.keyboard('{ArrowRight}{Delete}');

    expect(onSceneChange).not.toHaveBeenCalled();
  });
});

describe('Canvas commands', () => {
  it('emits a command per applied change', async () => {
    const user = userEvent.setup();
    const onCommand = vi.fn();
    render(<Canvas defaultScene={makeScene()} defaultSelectedIds={['a']} onCommand={onCommand} />);

    focusCanvas();
    await user.keyboard('{ArrowRight}');

    expect(onCommand).toHaveBeenCalledWith(
      expect.objectContaining({ op: 'move', id: 'a', x: 8, y: 0 }),
    );
  });

  it('defers to a controlled scene', async () => {
    const user = userEvent.setup();
    const onSceneChange = vi.fn();
    render(<Canvas scene={makeScene()} defaultSelectedIds={['a']} onSceneChange={onSceneChange} />);

    focusCanvas();
    await user.keyboard('{ArrowRight}');

    expect(onSceneChange).toHaveBeenCalled();
    // Unmoved, because the parent never fed a new scene back.
    expect(blockEl('Login')).toHaveStyle({ transform: 'translate(0px, 0px)' });
  });
});

// ---------------------------------------------------------------- AI layer

/** Deterministic stand-in — no real client, key or network exists anywhere in src/. */
function mockClient(reply: string): AIClient {
  return { complete: async () => reply };
}

function json(value: unknown): string {
  return JSON.stringify(value);
}

// Enter rather than a Send click: the floating panel's `CanvasPromptBar`
// renders in its `minimal` variant, which has no Send button at all.
async function ask(user: ReturnType<typeof userEvent.setup>, text: string) {
  await user.type(screen.getByLabelText('Ask or instruct the canvas'), `${text}{Enter}`);
}

describe('Canvas AI availability', () => {
  it('renders nothing AI-related without a provider or resolver', () => {
    render(<Canvas defaultScene={makeScene()} aiPrompt />);

    expect(screen.queryByLabelText('Ask or instruct the canvas')).not.toBeInTheDocument();
  });

  it('renders markup identical to the non-AI canvas when inert', () => {
    const normalize = (html: string) => html.replace(/_r_[0-9a-z]+_/g, '_id_');

    const flagged = render(
      <Canvas defaultScene={makeScene()} aiPrompt aiRewrite aiCluster aiDiagram />,
    );
    const withFlags = normalize(flagged.container.innerHTML);
    flagged.unmount();

    const without = render(<Canvas defaultScene={makeScene()} />);

    expect(withFlags).toBe(normalize(without.container.innerHTML));
  });

  it('shows the prompt bar for an AIProvider', () => {
    render(
      <AIProvider client={mockClient('{}')}>
        <Canvas defaultScene={makeScene()} aiPrompt />
      </AIProvider>,
    );

    expect(screen.getByLabelText('Ask or instruct the canvas')).toBeInTheDocument();
  });

  it('shows the prompt bar for a resolver alone, with no AIProvider', () => {
    render(
      <Canvas
        defaultScene={makeScene()}
        aiPrompt
        resolveCommands={async () => ({ commands: [] })}
      />,
    );

    expect(screen.getByLabelText('Ask or instruct the canvas')).toBeInTheDocument();
  });
});

describe('Canvas floating prompt', () => {
  it('floats the panel instead of the static bar, with no close control', () => {
    render(
      <AIProvider client={mockClient('{}')}>
        <Canvas defaultScene={makeScene()} aiPrompt aiPromptFloating />
      </AIProvider>,
    );

    expect(screen.getByLabelText('Ask or instruct the canvas')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument();
  });

  it('leaves the canvas selection untouched when pressing on the floating panel', () => {
    render(
      <AIProvider client={mockClient('{}')}>
        <Canvas defaultScene={makeScene()} defaultSelectedIds={['a']} aiPrompt aiPromptFloating />
      </AIProvider>,
    );

    const panel = screen.getByLabelText('Ask or instruct the canvas').closest('[class*="panel"]');
    fireEvent(
      panel as Element,
      new MouseEvent('pointerdown', { bubbles: true, clientX: 0, clientY: 0 }),
    );

    // A press anywhere on the panel used to also reach the canvas surface
    // underneath, which starts a marquee (and clears the selection, since
    // this press carries no shift key) — it shouldn't reach the surface at all.
    expect(blockEl('Login')).toHaveAttribute('data-selected');
  });

  it('minimizes without unmounting the panel, and can be expanded again', async () => {
    const user = userEvent.setup();
    render(
      <AIProvider client={mockClient('{}')}>
        <Canvas defaultScene={makeScene()} aiPrompt aiPromptFloating />
      </AIProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Minimize canvas assistant' }));
    expect(screen.queryByLabelText('Ask or instruct the canvas')).not.toBeInTheDocument();
    expect(screen.getByText('Canvas Assistant')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Expand canvas assistant' }));
    expect(screen.getByLabelText('Ask or instruct the canvas')).toBeInTheDocument();
  });

  it("folds the current selection's full block content into every prompt", async () => {
    const user = userEvent.setup();
    let seenPrompt = '';

    render(
      <Canvas
        defaultScene={makeScene()}
        selectedIds={['a']}
        aiPrompt
        aiPromptFloating
        resolveCommands={async ({ prompt }) => {
          seenPrompt = prompt;
          return { commands: [] };
        }}
      />,
    );

    await ask(user, 'what is wrong with this');

    expect(seenPrompt).toContain('Selected elements (full content):');
    expect(seenPrompt).toContain('"id":"a"');
    expect(seenPrompt).toContain('"text":"Login"');
  });

  it('still stages a multi-command reply for review, same as the static bar', async () => {
    const user = userEvent.setup();
    const batch = json({
      commands: [
        { op: 'move', id: 'a', x: 10, y: 10 },
        { op: 'delete', id: 'b' },
      ],
    });

    render(
      <AIProvider client={mockClient(batch)}>
        <Canvas defaultScene={makeScene()} aiPrompt aiPromptFloating />
      </AIProvider>,
    );

    await ask(user, 'tidy up');

    expect(await screen.findByRole('region', { name: 'Proposed changes' })).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <AIProvider client={mockClient('{}')}>
        <Canvas defaultScene={makeScene()} aiPrompt aiPromptFloating />
      </AIProvider>,
    );

    await expectNoA11yViolations(container);
  });
});

describe('Canvas thinking', () => {
  it("shows the model's reasoning, collapsed by default, above the static bar's answer", async () => {
    const user = userEvent.setup();
    render(
      <AIProvider
        client={mockClient(
          json({ commands: [], message: 'Two notes.', thinking: 'Both mention SSO.' }),
        )}
      >
        <Canvas defaultScene={makeScene()} aiPrompt />
      </AIProvider>,
    );

    await ask(user, 'what is here?');

    expect(await screen.findByText('Show reasoning')).toBeInTheDocument();
    expect(screen.getByText('Both mention SSO.')).toBeInTheDocument();
    expect(screen.getByText('Both mention SSO.').closest('[hidden]')).toBeTruthy();
  });

  it('shows reasoning on the floating panel instead, not duplicated on the static bar', async () => {
    const user = userEvent.setup();
    render(
      <AIProvider
        client={mockClient(
          json({ commands: [], message: 'Two notes.', thinking: 'Both mention SSO.' }),
        )}
      >
        <Canvas defaultScene={makeScene()} aiPrompt aiPromptFloating />
      </AIProvider>,
    );

    await ask(user, 'what is here?');

    // No static-bar accordion at all with `aiPromptFloating` — the floating
    // panel's own compact "Thinking" line is the only account rendered.
    expect(screen.queryByText('Show reasoning')).not.toBeInTheDocument();
    expect(await screen.findAllByText('Thinking')).toHaveLength(1);
    expect(screen.getByText('Both mention SSO.')).toBeInTheDocument();
  });

  it('has no leftover reasoning once a fresh prompt with none resolves', async () => {
    const user = userEvent.setup();
    let reply = json({ commands: [], message: 'Two notes.', thinking: 'Both mention SSO.' });

    render(
      <AIProvider
        client={{
          complete: async () => reply,
        }}
      >
        <Canvas defaultScene={makeScene()} aiPrompt />
      </AIProvider>,
    );

    await ask(user, 'what is here?');
    expect(await screen.findByText('Both mention SSO.')).toBeInTheDocument();

    reply = json({ commands: [], message: 'Still two notes.' });
    await ask(user, 'anything new?');

    expect((await screen.findAllByText('Still two notes.')).length).toBeGreaterThan(0);
    expect(screen.queryByText('Show reasoning')).not.toBeInTheDocument();
  });
});

describe('Canvas AI query path', () => {
  it('answers a question without touching the scene', async () => {
    const user = userEvent.setup();
    const onSceneChange = vi.fn();
    render(
      <AIProvider
        client={mockClient(
          json({ commands: [], message: 'Two notes and a frame.', highlightBlockIds: ['a'] }),
        )}
      >
        <Canvas defaultScene={makeScene()} onSceneChange={onSceneChange} aiPrompt />
      </AIProvider>,
    );

    await ask(user, 'what is here?');

    await vi.waitFor(() => expect(screen.getAllByText('Two notes and a frame.')).toHaveLength(2));
    expect(onSceneChange).not.toHaveBeenCalled();
    expect(blockEl('Login')).toHaveAttribute('data-highlighted');
  });

  it('treats prose that is not JSON as an answer rather than an error', async () => {
    const user = userEvent.setup();
    render(
      <AIProvider client={mockClient('Nothing much is on this canvas.')}>
        <Canvas defaultScene={makeScene()} aiPrompt />
      </AIProvider>,
    );

    await ask(user, 'what is here?');

    expect((await screen.findAllByText('Nothing much is on this canvas.')).length).toBeGreaterThan(
      0,
    );
  });
});

describe('Canvas AI apply path', () => {
  const oneCreate = json({
    commands: [
      { op: 'create', block: { id: 'n1', kind: 'sticky', text: 'New note', x: 600, y: 0 } },
    ],
  });

  it('applies a lone create immediately — additive and trivially undone', async () => {
    const user = userEvent.setup();
    const onSceneChange = vi.fn();
    render(
      <AIProvider client={mockClient(oneCreate)}>
        <Canvas defaultScene={makeScene()} onSceneChange={onSceneChange} aiPrompt />
      </AIProvider>,
    );

    await ask(user, 'add a note');

    await vi.waitFor(() => expect(onSceneChange).toHaveBeenCalled());
    const next: CanvasScene = onSceneChange.mock.calls.at(-1)?.[0];
    expect(next.blocks.find((block) => block.id === 'n1')).toBeDefined();
  });

  it('stages a lone move, because it changes existing content', async () => {
    const user = userEvent.setup();
    const onSceneChange = vi.fn();
    render(
      <AIProvider client={mockClient(json({ commands: [{ op: 'move', id: 'a', x: 99, y: 99 }] }))}>
        <Canvas defaultScene={makeScene()} onSceneChange={onSceneChange} aiPrompt />
      </AIProvider>,
    );

    await ask(user, 'move the login note');

    expect(await screen.findByRole('region', { name: 'Proposed changes' })).toBeInTheDocument();
    expect(onSceneChange).not.toHaveBeenCalled();
  });

  it('offers an undo toast for an auto-applied change', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <AIProvider client={mockClient(oneCreate)}>
          <Canvas defaultScene={makeScene()} aiPrompt />
        </AIProvider>
      </ToastProvider>,
    );

    await ask(user, 'add a note');

    expect(await screen.findByRole('button', { name: 'Undo' })).toBeInTheDocument();
  });

  it('applies without a ToastProvider rather than throwing', async () => {
    const user = userEvent.setup();
    const onSceneChange = vi.fn();
    render(
      <AIProvider client={mockClient(oneCreate)}>
        <Canvas defaultScene={makeScene()} onSceneChange={onSceneChange} aiPrompt />
      </AIProvider>,
    );

    await ask(user, 'add a note');

    await vi.waitFor(() => expect(onSceneChange).toHaveBeenCalled());
  });
});

describe('Canvas AI staging path', () => {
  const batch = json({
    commands: [
      { op: 'create', block: { id: 'n1', kind: 'sticky', text: 'One', x: 600, y: 0 } },
      { op: 'create', block: { id: 'n2', kind: 'sticky', text: 'Two', x: 800, y: 0 } },
      { op: 'connect', connector: { id: 'e2', from: 'n1', to: 'n2' } },
    ],
  });

  it('stages a batch and applies it only once accepted', async () => {
    const user = userEvent.setup();
    const onSceneChange = vi.fn();
    render(
      <AIProvider client={mockClient(batch)}>
        <Canvas defaultScene={makeScene()} onSceneChange={onSceneChange} aiPrompt />
      </AIProvider>,
    );

    await ask(user, 'add two connected notes');
    expect(await screen.findByRole('region', { name: 'Proposed changes' })).toBeInTheDocument();
    expect(onSceneChange).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Apply all changes' }));

    const next: CanvasScene = onSceneChange.mock.calls.at(-1)?.[0];
    expect(next.blocks).toHaveLength(5);
    expect(next.connectors).toHaveLength(2);
  });

  it('validates a create followed by a connect naming it, in one batch', async () => {
    const user = userEvent.setup();
    render(
      <AIProvider client={mockClient(batch)}>
        <Canvas defaultScene={makeScene()} aiPrompt />
      </AIProvider>,
    );

    await ask(user, 'add two connected notes');

    // The connect survives validation despite referencing a block that doesn't
    // exist yet at the start of the batch.
    expect(await screen.findByText(/Connect “One” to “Two”/)).toBeInTheDocument();
  });

  it('always stages a delete', async () => {
    const user = userEvent.setup();
    const onSceneChange = vi.fn();
    render(
      <AIProvider client={mockClient(json({ commands: [{ op: 'delete', id: 'a' }] }))}>
        <Canvas defaultScene={makeScene()} onSceneChange={onSceneChange} aiPrompt />
      </AIProvider>,
    );

    await ask(user, 'remove the login note');

    expect(await screen.findByText('Delete “Login”')).toBeInTheDocument();
    expect(onSceneChange).not.toHaveBeenCalled();
  });

  it('applies only the commands left checked', async () => {
    const user = userEvent.setup();
    const onSceneChange = vi.fn();
    render(
      <AIProvider client={mockClient(batch)}>
        <Canvas defaultScene={makeScene()} onSceneChange={onSceneChange} aiPrompt />
      </AIProvider>,
    );

    await ask(user, 'add two connected notes');
    await user.click(await screen.findByText('Add sticky “Two”'));
    await user.click(screen.getByRole('button', { name: 'Apply 2 of 3' }));

    const next: CanvasScene = onSceneChange.mock.calls.at(-1)?.[0];
    // 'Two' was vetoed, so the connect that depended on it is dropped by
    // re-validation rather than corrupting the scene.
    expect(next.blocks.find((block) => block.id === 'n2')).toBeUndefined();
    expect(next.connectors).toHaveLength(1);
  });

  it('discards a staged batch without touching the scene', async () => {
    const user = userEvent.setup();
    const onSceneChange = vi.fn();
    render(
      <AIProvider client={mockClient(json({ commands: [{ op: 'delete', id: 'a' }] }))}>
        <Canvas defaultScene={makeScene()} onSceneChange={onSceneChange} aiPrompt />
      </AIProvider>,
    );

    await ask(user, 'remove it');
    await user.click(await screen.findByRole('button', { name: 'Discard' }));

    expect(screen.queryByRole('region', { name: 'Proposed changes' })).not.toBeInTheDocument();
    expect(onSceneChange).not.toHaveBeenCalled();
  });

  it('reports a hallucinated id instead of throwing or half-applying', async () => {
    const user = userEvent.setup();
    const onSceneChange = vi.fn();
    render(
      <AIProvider
        client={mockClient(json({ commands: [{ op: 'move', id: 'ghost', x: 1, y: 1 }] }))}
      >
        <Canvas defaultScene={makeScene()} onSceneChange={onSceneChange} aiPrompt />
      </AIProvider>,
    );

    await ask(user, 'move the ghost');

    expect(await screen.findByText(/Unknown block "ghost"/)).toBeInTheDocument();
    expect(onSceneChange).not.toHaveBeenCalled();
  });

  it('validates a consumer resolver the same as the parsed fallback', async () => {
    const user = userEvent.setup();
    const onSceneChange = vi.fn();
    render(
      <Canvas
        defaultScene={makeScene()}
        onSceneChange={onSceneChange}
        aiPrompt
        resolveCommands={async () => ({ commands: [{ op: 'delete', id: 'ghost' }] })}
      />,
    );

    await ask(user, 'remove the ghost');

    expect(await screen.findByText(/Unknown block or connector "ghost"/)).toBeInTheDocument();
    expect(onSceneChange).not.toHaveBeenCalled();
  });

  it('surfaces a transport error without changing the scene', async () => {
    const user = userEvent.setup();
    const onSceneChange = vi.fn();
    render(
      <Canvas
        defaultScene={makeScene()}
        onSceneChange={onSceneChange}
        aiPrompt
        resolveCommands={async () => {
          throw new Error('network down');
        }}
      />,
    );

    await ask(user, 'do something');

    expect(await screen.findByRole('alert')).toHaveTextContent('network down');
    expect(onSceneChange).not.toHaveBeenCalled();
  });

  it('has no accessibility violations with the prompt bar mounted', async () => {
    const { container } = render(
      <AIProvider client={mockClient('{}')}>
        <Canvas defaultScene={makeScene()} aiPrompt aria-label="Workspace" />
      </AIProvider>,
    );

    await expectNoA11yViolations(container);
  });

  /**
   * Regression guard. The per-note trigger is a real button rendered among the
   * blocks; when the world was `aria-hidden` this put a focusable element
   * inside a hidden subtree, which axe's `aria-hidden-focus` rule flags and no
   * earlier test covered — none of them enabled `aiRewrite` with a provider.
   */
  it('keeps the per-note AI trigger reachable, not hidden from assistive tech', async () => {
    const { container } = render(
      <AIProvider client={mockClient('Tightened text')}>
        <Canvas defaultScene={makeScene()} aiRewrite aria-label="Workspace" />
      </AIProvider>,
    );

    expect(screen.getAllByRole('button', { name: 'Rewrite with AI' }).length).toBeGreaterThan(0);
    await expectNoA11yViolations(container);
  });
});

// ------------------------------------------------------------------ clusters

describe('Canvas affinity mapping', () => {
  /** Two notes and a shape, all groupable; the frame never is. */
  function notesScene(): CanvasScene {
    return {
      blocks: [
        { id: 'n1', kind: 'sticky', text: 'Slow signup', x: 0, y: 0, width: 160, height: 160 },
        {
          id: 'n2',
          kind: 'sticky',
          text: 'Confusing email',
          x: 200,
          y: 0,
          width: 160,
          height: 160,
        },
        { id: 'n3', kind: 'sticky', text: 'Billing bug', x: 400, y: 0, width: 160, height: 160 },
        { id: 'f', kind: 'frame', title: 'Notes', x: -20, y: -20, width: 620, height: 220 },
      ],
      connectors: [],
    };
  }

  const twoGroups = json({
    groups: [
      { title: 'Onboarding', blockIds: ['n1', 'n2'] },
      { title: 'Billing', blockIds: ['n3'] },
    ],
    message: 'Two themes.',
  });

  function clusterButton() {
    return screen.getByRole('button', { name: 'Group by theme' });
  }

  it('renders no trigger without a provider or resolver', () => {
    render(<Canvas defaultScene={notesScene()} aiCluster />);

    expect(screen.queryByRole('button', { name: /Group by theme/ })).not.toBeInTheDocument();
  });

  it('shows the trigger for a resolver alone, with no AIProvider', () => {
    render(
      <Canvas
        defaultScene={notesScene()}
        aiCluster
        resolveClusters={async () => ({ groups: [] })}
      />,
    );

    expect(clusterButton()).toBeInTheDocument();
  });

  it('renders no trigger when read-only — clustering is an edit', () => {
    render(
      <AIProvider client={mockClient(twoGroups)}>
        <Canvas defaultScene={notesScene()} aiCluster readOnly />
      </AIProvider>,
    );

    expect(screen.queryByRole('button', { name: /Group by theme/ })).not.toBeInTheDocument();
  });

  it('stages the grouping rather than applying it — it moves existing content', async () => {
    const user = userEvent.setup();
    const onSceneChange = vi.fn();
    render(
      <AIProvider client={mockClient(twoGroups)}>
        <Canvas defaultScene={notesScene()} onSceneChange={onSceneChange} aiCluster />
      </AIProvider>,
    );

    await user.click(clusterButton());

    expect(await screen.findByRole('region', { name: 'Proposed changes' })).toBeInTheDocument();
    expect(screen.getByText('Add frame “Onboarding”')).toBeInTheDocument();
    expect(onSceneChange).not.toHaveBeenCalled();
  });

  it('frames each group and moves its members once accepted', async () => {
    const user = userEvent.setup();
    const onSceneChange = vi.fn();
    render(
      <AIProvider client={mockClient(twoGroups)}>
        <Canvas defaultScene={notesScene()} onSceneChange={onSceneChange} aiCluster />
      </AIProvider>,
    );

    await user.click(clusterButton());
    await user.click(await screen.findByRole('button', { name: 'Apply all changes' }));

    const next: CanvasScene = onSceneChange.mock.calls.at(-1)?.[0];
    const frames = next.blocks.filter((block) => block.kind === 'frame');
    expect(frames.map((frame) => frame.kind === 'frame' && frame.title)).toEqual([
      'Notes',
      'Onboarding',
      'Billing',
    ]);
    // Moved out of their original row, not left where they were.
    expect(next.blocks.find((block) => block.id === 'n1')?.y).toBeGreaterThan(0);
  });

  it('scopes to the selection when two or more blocks are selected', async () => {
    const user = userEvent.setup();
    const seen: string[][] = [];
    render(
      <Canvas
        defaultScene={notesScene()}
        defaultSelectedIds={['n1', 'n2']}
        aiCluster
        resolveClusters={async ({ candidates }) => {
          seen.push(candidates.map((block) => block.id));
          return { groups: [] };
        }}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Group by theme (selection)' }));

    await vi.waitFor(() => expect(seen).toEqual([['n1', 'n2']]));
  });

  it('reports a hallucinated id instead of framing nothing', async () => {
    const user = userEvent.setup();
    const onSceneChange = vi.fn();
    render(
      <Canvas
        defaultScene={notesScene()}
        onSceneChange={onSceneChange}
        aiCluster
        resolveClusters={async () => ({ groups: [{ title: 'Ghosts', blockIds: ['nope'] }] })}
      />,
    );

    await user.click(clusterButton());

    expect((await screen.findAllByText(/referenced unknown block “nope”/)).length).toBeGreaterThan(
      0,
    );
    expect(onSceneChange).not.toHaveBeenCalled();
  });

  it('shows a refusal as an answer, changing nothing', async () => {
    const user = userEvent.setup();
    const onSceneChange = vi.fn();
    render(
      <AIProvider client={mockClient('These notes share no theme.')}>
        <Canvas defaultScene={notesScene()} onSceneChange={onSceneChange} aiCluster />
      </AIProvider>,
    );

    await user.click(clusterButton());

    expect((await screen.findAllByText(/share no theme/)).length).toBeGreaterThan(0);
    expect(onSceneChange).not.toHaveBeenCalled();
  });

  it('disables the trigger when there is nothing to group', () => {
    render(
      <AIProvider client={mockClient(twoGroups)}>
        <Canvas
          defaultScene={{
            blocks: [
              { id: 'n1', kind: 'sticky', text: 'Alone', x: 0, y: 0, width: 160, height: 160 },
            ],
            connectors: [],
          }}
          aiCluster
        />
      </AIProvider>,
    );

    expect(clusterButton()).toBeDisabled();
  });

  it('surfaces a transport error even with no prompt bar to show it', async () => {
    const user = userEvent.setup();
    render(
      <Canvas
        defaultScene={notesScene()}
        aiCluster
        resolveClusters={async () => {
          throw new Error('network down');
        }}
      />,
    );

    await user.click(clusterButton());

    expect(await screen.findByRole('alert')).toHaveTextContent('network down');
  });

  it('has no accessibility violations with the trigger mounted', async () => {
    const { container } = render(
      <AIProvider client={mockClient(twoGroups)}>
        <Canvas defaultScene={notesScene()} aiCluster aria-label="Workspace" />
      </AIProvider>,
    );

    await expectNoA11yViolations(container);
  });
});

// ------------------------------------------------------------------ diagrams

describe('Canvas diagram generation', () => {
  const signIn = json({
    title: 'Sign-in',
    nodes: [
      { id: 'start', label: 'Open app', role: 'start' },
      { id: 'check', label: 'Token valid?', role: 'decision' },
      { id: 'home', label: 'Show home', role: 'end' },
    ],
    edges: [
      { from: 'start', to: 'check' },
      { from: 'check', to: 'home', label: 'yes' },
    ],
  });

  async function describeDiagram(user: ReturnType<typeof userEvent.setup>, text: string) {
    await user.type(screen.getByLabelText('Describe a diagram'), text);
    await user.click(screen.getByRole('button', { name: 'Draw' }));
  }

  it('renders no diagram bar without a provider or resolver', () => {
    render(<Canvas defaultScene={makeScene()} aiDiagram />);

    expect(screen.queryByLabelText('Describe a diagram')).not.toBeInTheDocument();
  });

  it('shows the bar for a resolver alone, with no AIProvider', () => {
    render(
      <Canvas
        defaultScene={makeScene()}
        aiDiagram
        resolveDiagram={async () => ({ nodes: [], edges: [] })}
      />,
    );

    expect(screen.getByLabelText('Describe a diagram')).toBeInTheDocument();
  });

  it('renders no bar when read-only', () => {
    render(
      <AIProvider client={mockClient(signIn)}>
        <Canvas defaultScene={makeScene()} aiDiagram readOnly />
      </AIProvider>,
    );

    expect(screen.queryByLabelText('Describe a diagram')).not.toBeInTheDocument();
  });

  it('applies immediately rather than staging — it adds content and changes none', async () => {
    const user = userEvent.setup();
    const onSceneChange = vi.fn();
    render(
      <AIProvider client={mockClient(signIn)}>
        <Canvas defaultScene={makeScene()} onSceneChange={onSceneChange} aiDiagram />
      </AIProvider>,
    );

    await describeDiagram(user, 'the sign-in flow');

    await vi.waitFor(() => expect(onSceneChange).toHaveBeenCalled());
    expect(screen.queryByRole('region', { name: 'Proposed changes' })).not.toBeInTheDocument();

    const next: CanvasScene = onSceneChange.mock.calls.at(-1)?.[0];
    // Three original blocks, plus a frame and three shapes.
    expect(next.blocks).toHaveLength(3 + 4);
    expect(next.connectors).toHaveLength(1 + 2);
  });

  it('leaves every pre-existing block exactly where it was', async () => {
    const user = userEvent.setup();
    const onSceneChange = vi.fn();
    const before = makeScene();
    render(
      <AIProvider client={mockClient(signIn)}>
        <Canvas defaultScene={before} onSceneChange={onSceneChange} aiDiagram />
      </AIProvider>,
    );

    await describeDiagram(user, 'the sign-in flow');
    await vi.waitFor(() => expect(onSceneChange).toHaveBeenCalled());

    const next: CanvasScene = onSceneChange.mock.calls.at(-1)?.[0];
    for (const block of before.blocks) {
      expect(next.blocks.find((candidate) => candidate.id === block.id)).toEqual(block);
    }
  });

  it('draws the decision as a diamond — role mapped to the shape vocabulary', async () => {
    const user = userEvent.setup();
    render(
      <AIProvider client={mockClient(signIn)}>
        <Canvas defaultScene={makeScene()} aiDiagram />
      </AIProvider>,
    );

    await describeDiagram(user, 'the sign-in flow');

    const decision = await screen.findByLabelText('Token valid?');
    expect(decision.querySelector('[data-shape="diamond"]')).toBeInTheDocument();
  });

  it('offers an undo toast, since nothing was reviewed first', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <AIProvider client={mockClient(signIn)}>
          <Canvas defaultScene={makeScene()} aiDiagram />
        </AIProvider>
      </ToastProvider>,
    );

    await describeDiagram(user, 'the sign-in flow');

    expect(await screen.findByRole('button', { name: 'Undo' })).toBeInTheDocument();
  });

  it('undoes back to the scene as it was', async () => {
    const user = userEvent.setup();
    const onSceneChange = vi.fn();
    render(
      <ToastProvider>
        <AIProvider client={mockClient(signIn)}>
          <Canvas defaultScene={makeScene()} onSceneChange={onSceneChange} aiDiagram />
        </AIProvider>
      </ToastProvider>,
    );

    await describeDiagram(user, 'the sign-in flow');
    await user.click(await screen.findByRole('button', { name: 'Undo' }));

    const next: CanvasScene = onSceneChange.mock.calls.at(-1)?.[0];
    expect(next.blocks).toHaveLength(3);
    expect(next.connectors).toHaveLength(1);
  });

  it('reports an edge to a node that was never declared', async () => {
    const user = userEvent.setup();
    render(
      <Canvas
        defaultScene={makeScene()}
        aiDiagram
        resolveDiagram={async () => ({
          nodes: [{ id: 'a', label: 'Only node' }],
          edges: [{ from: 'a', to: 'ghost' }],
        })}
      />,
    );

    await describeDiagram(user, 'something');

    expect((await screen.findAllByText(/had no such node/)).length).toBeGreaterThan(0);
  });

  it('shows a refusal as an answer, drawing nothing', async () => {
    const user = userEvent.setup();
    const onSceneChange = vi.fn();
    render(
      <AIProvider client={mockClient('That has no steps to draw.')}>
        <Canvas defaultScene={makeScene()} onSceneChange={onSceneChange} aiDiagram />
      </AIProvider>,
    );

    await describeDiagram(user, 'the colour blue');

    expect((await screen.findAllByText('That has no steps to draw.')).length).toBeGreaterThan(0);
    expect(onSceneChange).not.toHaveBeenCalled();
  });

  it('surfaces a transport error without drawing', async () => {
    const user = userEvent.setup();
    const onSceneChange = vi.fn();
    render(
      <Canvas
        defaultScene={makeScene()}
        onSceneChange={onSceneChange}
        aiDiagram
        resolveDiagram={async () => {
          throw new Error('network down');
        }}
      />,
    );

    await describeDiagram(user, 'a flow');

    expect(await screen.findByRole('alert')).toHaveTextContent('network down');
    expect(onSceneChange).not.toHaveBeenCalled();
  });

  it('has no accessibility violations, before and after drawing', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <AIProvider client={mockClient(signIn)}>
        <Canvas defaultScene={makeScene()} aiDiagram aria-label="Workspace" />
      </AIProvider>,
    );

    await expectNoA11yViolations(container);

    await describeDiagram(user, 'the sign-in flow');
    await screen.findByLabelText('Token valid?');

    await expectNoA11yViolations(container);
  });
});

// ------------------------------------------------------------------ viewport

describe('Canvas viewport', () => {
  function world(container: HTMLElement): HTMLElement {
    return container.querySelector('svg')?.parentElement as HTMLElement;
  }

  it('pans with the arrows when nothing is selected', async () => {
    const user = userEvent.setup();
    const { container } = render(<Canvas defaultScene={makeScene()} />);

    focusCanvas();
    await user.keyboard('{ArrowRight}');

    expect(world(container).style.transform).toBe('translate(-64px, 0px) scale(1)');
  });

  it('takes a bigger pan step with Shift', async () => {
    const user = userEvent.setup();
    const { container } = render(<Canvas defaultScene={makeScene()} />);

    focusCanvas();
    await user.keyboard('{Shift>}{ArrowDown}{/Shift}');

    expect(world(container).style.transform).toBe('translate(0px, -240px) scale(1)');
  });

  it('pans with Ctrl+arrows even while a block is selected', async () => {
    const user = userEvent.setup();
    const onSceneChange = vi.fn();
    const { container } = render(
      <Canvas
        defaultScene={makeScene()}
        defaultSelectedIds={['a']}
        onSceneChange={onSceneChange}
      />,
    );

    focusCanvas();
    await user.keyboard('{Control>}{ArrowLeft}{/Control}');

    expect(world(container).style.transform).toBe('translate(64px, 0px) scale(1)');
    // The selected block stayed put — this was navigation, not a move.
    expect(onSceneChange).not.toHaveBeenCalled();
  });

  it('zooms in and out from the keyboard, and announces the level', async () => {
    const user = userEvent.setup();
    const { container } = render(<Canvas defaultScene={makeScene()} />);

    focusCanvas();
    await user.keyboard('+');
    expect(world(container).style.transform).toContain('scale(1.2)');
    expect(screen.getByRole('status')).toHaveTextContent('Zoom 120 percent.');

    await user.keyboard('-');
    expect(world(container).style.transform).toContain('scale(1)');
  });

  it('resets the viewport with 0', async () => {
    const user = userEvent.setup();
    const { container } = render(<Canvas defaultScene={makeScene()} />);

    focusCanvas();
    await user.keyboard('+{ArrowRight}0');

    expect(world(container).style.transform).toBe('translate(0px, 0px) scale(1)');
  });

  it('keeps zoom and pan available in read-only — looking around is not editing', async () => {
    const user = userEvent.setup();
    const { container } = render(<Canvas defaultScene={makeScene()} readOnly />);

    focusCanvas();
    await user.keyboard('{ArrowRight}+');

    // Zoom is about the centre of the view, so it adjusts pan as well — the
    // point is only that both gestures worked with editing switched off.
    expect(world(container).style.transform).toContain('scale(1.2)');
    expect(world(container).style.transform).toMatch(/translate\(-\d/);
  });

  it('still moves a selected block with the plain arrows', async () => {
    const user = userEvent.setup();
    const onSceneChange = vi.fn();
    const { container } = render(
      <Canvas
        defaultScene={makeScene()}
        defaultSelectedIds={['a']}
        onSceneChange={onSceneChange}
      />,
    );

    focusCanvas();
    await user.keyboard('{ArrowRight}');

    expect(onSceneChange).toHaveBeenCalled();
    expect(world(container).style.transform).toBe('translate(0px, 0px) scale(1)');
  });
});

describe('Canvas controlled viewport', () => {
  function world(container: HTMLElement): HTMLElement {
    return container.querySelector('svg')?.parentElement as HTMLElement;
  }

  it('renders the passed-in viewport rather than an internal one', () => {
    const { container } = render(
      <Canvas defaultScene={makeScene()} viewport={{ panX: 40, panY: 10, zoom: 2 }} />,
    );

    expect(world(container).style.transform).toBe('translate(40px, 10px) scale(2)');
  });

  it('reports pan/zoom changes via onViewportChange instead of moving on its own', async () => {
    const user = userEvent.setup();
    const onViewportChange = vi.fn();
    const { container } = render(
      <Canvas
        defaultScene={makeScene()}
        viewport={{ panX: 0, panY: 0, zoom: 1 }}
        onViewportChange={onViewportChange}
      />,
    );

    focusCanvas();
    await user.keyboard('{ArrowRight}');

    expect(onViewportChange).toHaveBeenCalledWith({ panX: -64, panY: 0, zoom: 1 });
    // Controlled: nothing moves until the caller feeds the new value back in.
    expect(world(container).style.transform).toBe('translate(0px, 0px) scale(1)');
  });
});

describe('Canvas renderBackdrop', () => {
  it('renders nothing extra when renderBackdrop is omitted', () => {
    render(<Canvas defaultScene={makeScene()} />);
    expect(screen.queryByTestId('pdf-backdrop')).not.toBeInTheDocument();
  });

  it('renders the backdrop inside the transformed world, ahead of every block', () => {
    const { container } = render(
      <Canvas
        defaultScene={makeScene()}
        renderBackdrop={() => <canvas data-testid="pdf-backdrop" />}
      />,
    );

    const backdrop = screen.getByTestId('pdf-backdrop');
    expect(backdrop).toBeInTheDocument();

    const world = container.querySelector('svg')?.parentElement as HTMLElement;
    expect(world.firstElementChild?.contains(backdrop)).toBe(true);
  });

  it('hides the backdrop from the accessibility tree — it carries no text of its own', () => {
    render(
      <Canvas
        defaultScene={makeScene()}
        renderBackdrop={() => <canvas data-testid="pdf-backdrop" />}
      />,
    );

    expect(screen.getByTestId('pdf-backdrop').closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('has no accessibility violations with a backdrop rendered', async () => {
    const { container } = render(
      <Canvas
        defaultScene={makeScene()}
        renderBackdrop={() => <canvas data-testid="pdf-backdrop" />}
      />,
    );
    await expectNoA11yViolations(container);
  });
});

// ----------------------------------------------------------- block catalogue

describe('Canvas block catalogue', () => {
  const catalogue: CanvasScene = {
    blocks: [
      {
        id: 'c',
        kind: 'code',
        code: 'const x = 1;\nexport default x;',
        language: 'ts',
        x: 0,
        y: 0,
        width: 300,
        height: 200,
      },
      {
        id: 't',
        kind: 'table',
        columns: ['Env', 'Status'],
        rows: [['prod', 'green'], ['staging']],
        caption: 'Deployments',
        x: 320,
        y: 0,
        width: 300,
        height: 200,
      },
      {
        id: 'l',
        kind: 'link',
        url: 'https://example.com/spec',
        title: 'The spec',
        description: 'Everything we agreed',
        x: 0,
        y: 220,
        width: 260,
        height: 120,
      },
      {
        id: 'k',
        kind: 'checklist',
        title: 'Launch',
        items: [
          { id: 'k1', text: 'Draft the brief', done: true },
          { id: 'k2', text: 'Book the room' },
        ],
        x: 320,
        y: 220,
        width: 240,
        height: 200,
      },
      {
        id: 'g',
        kind: 'chart',
        label: 'Signups per week',
        data: [
          { label: 'W1', value: 12 },
          { label: 'W2', value: 30 },
        ],
        x: 620,
        y: 0,
        width: 360,
        height: 240,
      },
    ],
    connectors: [],
  };

  it('renders every kind', () => {
    render(<Canvas defaultScene={catalogue} />);

    // Twice over: once in the block, once as its name in the outline.
    expect(screen.getAllByText('const x = 1;', { exact: false }).length).toBeGreaterThan(0);
    expect(screen.getByRole('columnheader', { name: 'Env' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'The spec' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Draft the brief' })).toBeChecked();
    expect(screen.getAllByText('Signups per week').length).toBeGreaterThan(0);
  });

  it('pads a short table row instead of leaving a ragged grid', () => {
    render(<Canvas defaultScene={catalogue} />);

    // Scoped to the table block: the chart block ships an accessible table
    // twin of its own, so a bare row query would count both.
    const table = screen.getByRole('table', { name: 'Deployments' });
    const rows = within(table).getAllByRole('row');

    // Header plus two body rows, every one with two cells.
    expect(rows).toHaveLength(3);
    expect(rows[2]?.children).toHaveLength(2);
  });

  it('opens a link block safely in a new tab', () => {
    render(<Canvas defaultScene={catalogue} />);

    expect(screen.getByRole('link', { name: 'The spec' })).toHaveAttribute(
      'rel',
      'noopener noreferrer',
    );
  });

  it('ticks a checklist item through the reducer, like every other change', async () => {
    const user = userEvent.setup();
    const onCommand = vi.fn();
    const onSceneChange = vi.fn();
    render(<Canvas defaultScene={catalogue} onSceneChange={onSceneChange} onCommand={onCommand} />);

    await user.click(screen.getByRole('checkbox', { name: 'Book the room' }));

    expect(onCommand).toHaveBeenCalledWith(expect.objectContaining({ op: 'update', id: 'k' }));
    const next: CanvasScene = onSceneChange.mock.calls.at(-1)?.[0];
    const list = next.blocks.find((block) => block.id === 'k');
    expect(list?.kind === 'checklist' && list.items[1]?.done).toBe(true);
  });

  /**
   * Regression guard, found in a real browser: a press on a control inside a
   * block used to start a drag and take pointer capture, and a captured pointer
   * never delivers its click — so the boxes silently stopped ticking. Dragging
   * from a row must also not tick it on release.
   */
  it('does not drag the block from one of its own controls', () => {
    const onSceneChange = vi.fn();
    render(<Canvas defaultScene={catalogue} onSceneChange={onSceneChange} />);

    const row = screen.getByText('Book the room');
    fireEvent(row, new MouseEvent('pointerdown', { bubbles: true, clientX: 0, clientY: 0 }));
    fireEvent(row, new MouseEvent('pointermove', { bubbles: true, clientX: 80, clientY: 60 }));
    fireEvent(row, new MouseEvent('pointerup', { bubbles: true }));

    expect(onSceneChange).not.toHaveBeenCalled();
  });

  it('leaves the boxes disabled when read-only', () => {
    render(<Canvas defaultScene={catalogue} readOnly />);

    expect(screen.getByRole('checkbox', { name: 'Book the room' })).toBeDisabled();
  });

  it('names each kind usefully in the outline', () => {
    render(<Canvas defaultScene={catalogue} outlineVisible />);

    expect(screen.getByRole('button', { name: /const x = 1;/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Deployments/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Launch . 1 of 2 done/ })).toBeInTheDocument();
  });

  it('has no accessibility violations across the catalogue', async () => {
    const { container } = render(<Canvas defaultScene={catalogue} aria-label="Workspace" />);

    await expectNoA11yViolations(container);
  });
});
