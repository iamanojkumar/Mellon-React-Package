import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { CanvasBlock } from './CanvasBlock';
import { DEFAULT_CANVAS_FILL_PRESETS } from '../CanvasFillPicker/CanvasFillPicker';
import { AIProvider } from '../../providers/AIProvider';
import type { AIClient } from '../../contexts/AIContext';
import type { CanvasBlockData } from '../../utilities/canvasReducer';

function at(block: Partial<CanvasBlockData> & Pick<CanvasBlockData, 'kind'>): CanvasBlockData {
  return { id: 'x', x: 10, y: 20, width: 100, height: 50, ...block } as CanvasBlockData;
}

describe('CanvasBlock positioning', () => {
  it('positions from canvas coordinates alone — the viewport transform is an ancestor’s job', () => {
    const { container } = render(<CanvasBlock block={at({ kind: 'sticky', text: 'Note' })} />);

    expect(container.firstElementChild).toHaveStyle({
      transform: 'translate(10px, 20px)',
      width: '100px',
      height: '50px',
    });
  });

  it('names itself from its content for the a11y tree', () => {
    render(<CanvasBlock block={at({ kind: 'sticky', text: 'Ship it' })} />);

    expect(screen.getByLabelText('Ship it')).toBeInTheDocument();
  });

  it('reflects selection, highlight and editing as data attributes', () => {
    const { container } = render(
      <CanvasBlock block={at({ kind: 'sticky', text: 'Note' })} selected highlighted editing />,
    );

    expect(container.firstElementChild).toHaveAttribute('data-selected');
    expect(container.firstElementChild).toHaveAttribute('data-highlighted');
    expect(container.firstElementChild).toHaveAttribute('data-editing');
  });
});

describe('CanvasBlock faces', () => {
  it('renders a sticky note', () => {
    render(<CanvasBlock block={at({ kind: 'sticky', text: 'Note' })} />);
    expect(screen.getByText('Note')).toBeInTheDocument();
  });

  it('renders a shape with its label', () => {
    render(<CanvasBlock block={at({ kind: 'shape', shape: 'diamond', text: 'Decide' })} />);
    expect(screen.getByText('Decide')).toBeInTheDocument();
  });

  it('renders an image with its alt text', () => {
    render(<CanvasBlock block={at({ kind: 'image', src: '/a.png', alt: 'A diagram' })} />);
    expect(screen.getByAltText('A diagram')).toBeInTheDocument();
  });

  // An `<img>` is natively draggable, and the browser's own drag-and-drop
  // pre-empts the pointer sequence the canvas move gesture needs — the block
  // simply never travels. jsdom has no native drag to reproduce that with, so
  // this asserts the attribute that prevents it rather than the symptom.
  it('marks an image block undraggable, so the canvas gesture wins the press', () => {
    render(<CanvasBlock block={at({ kind: 'image', src: '/a.png', alt: 'A diagram' })} />);
    expect(screen.getByAltText('A diagram')).toHaveAttribute('draggable', 'false');
  });

  it('renders a titled embed', () => {
    render(
      <CanvasBlock block={at({ kind: 'embed', title: 'Docs', url: 'https://example.com' })} />,
    );
    expect(screen.getByTitle('Docs')).toBeInTheDocument();
  });

  it('renders a frame as a labelled group', () => {
    render(<CanvasBlock block={at({ kind: 'frame', title: 'Risks' })} />);
    expect(screen.getByRole('group', { name: 'Risks' })).toBeInTheDocument();
  });

  it('renders a node as a single labelled group, not doubly-labelled by the wrapper', () => {
    render(<CanvasBlock block={at({ kind: 'node', name: 'Auth service' })} />);
    expect(screen.getAllByRole('group', { name: 'Auth service' })).toHaveLength(1);
  });

  it('renders a divider', () => {
    const { container } = render(<CanvasBlock block={at({ kind: 'divider' })} />);
    expect(container.querySelector('[role="separator"], hr')).toBeInTheDocument();
  });

  it('lets renderBlock replace the face entirely', () => {
    render(
      <CanvasBlock
        block={at({ kind: 'sticky', text: 'Note' })}
        renderBlock={(block) => <span>custom {block.id}</span>}
      />,
    );

    expect(screen.getByText('custom x')).toBeInTheDocument();
    expect(screen.queryByText('Note')).not.toBeInTheDocument();
  });
});

describe('CanvasBlock handles', () => {
  it('shows resize handles only when selected and resizable', () => {
    const block = at({ kind: 'text', html: '<p>Note</p>' });

    const plain = render(<CanvasBlock block={block} resizable />);
    expect(plain.container.querySelector('[data-canvas-resize-handles]')).toBeNull();
    plain.unmount();

    const selected = render(<CanvasBlock block={block} resizable selected />);
    expect(selected.container.querySelector('[data-canvas-resize-handles]')).toBeInTheDocument();
  });

  it('hides the handles from assistive tech — Alt+arrows is the keyboard path', () => {
    const { container } = render(
      <CanvasBlock block={at({ kind: 'text', html: '<p>Note</p>' })} resizable selected />,
    );

    expect(container.querySelector('[data-canvas-resize-handles]')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });

  // A `node` is sized by its label, so a resize frame would be a control that
  // does nothing. It's the only kind that refuses resizing outright.
  it('never draws resize zones on a node block, even when asked', () => {
    const { container } = render(
      <CanvasBlock block={at({ kind: 'node', name: 'Step' })} resizable selected />,
    );

    expect(container.querySelector('[data-canvas-resize-handles]')).toBeNull();
    expect(container.firstElementChild).toHaveAttribute('data-node-like');
  });

  // `sticky` and `shape` are node-like — they connect and highlight like a
  // node — but a note is a container for arbitrary prose, so its author has to
  // be able to widen it. Grouping the two questions together made these
  // unresizable, which shipped as a regression in 0.11.0.
  it.each(['sticky', 'shape'] as const)(
    'gives a %s block resize zones while still being node-like',
    (kind) => {
      const block = at(
        kind === 'sticky'
          ? { kind: 'sticky', text: 'Note' }
          : { kind: 'shape', shape: 'rectangle', text: 'Box' },
      );
      const { container } = render(<CanvasBlock block={block} resizable selected />);

      expect(container.querySelector('[data-canvas-resize-handles]')).toBeInTheDocument();
      expect(container.firstElementChild).toHaveAttribute('data-node-like');
    },
  );

  it('starts a resize from a node-like block’s edge zone', () => {
    const onResizeStart = vi.fn();
    const { container } = render(
      <CanvasBlock
        block={at({ kind: 'sticky', text: 'Note' })}
        resizable
        selected
        onResizeStart={onResizeStart}
      />,
    );

    const east = container.querySelector('[data-handle="e"]');
    expect(east).toBeInTheDocument();
    fireEvent.pointerDown(east!);
    expect(onResizeStart).toHaveBeenCalledWith(expect.anything(), 'e');
  });

  it('marks the sized kinds as not node-like, so they keep their frame', () => {
    const { container } = render(
      <CanvasBlock block={at({ kind: 'text', html: '<p>Note</p>' })} selected resizable />,
    );

    expect(container.firstElementChild).not.toHaveAttribute('data-node-like');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <CanvasBlock block={at({ kind: 'text', html: '<p>Note</p>' })} selected resizable />,
    );

    await expectNoA11yViolations(container);
  });
});

describe('CanvasBlock ports', () => {
  it('draws a sticky note the same input/output ports a node has', () => {
    render(
      <CanvasBlock
        block={at({ kind: 'sticky', text: 'Login' })}
        onInputPortClick={vi.fn()}
        onOutputPortClick={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: "Connect to Login's input" })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: "Connect Login's output to another block" }),
    ).toBeInTheDocument();
  });

  it('draws them on a shape too, outside the clipped face', () => {
    render(
      <CanvasBlock
        block={at({ kind: 'shape', shape: 'diamond', text: 'Approved?' })}
        onInputPortClick={vi.fn()}
        onOutputPortClick={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('button', { name: "Connect to Approved?'s input" }),
    ).toBeInTheDocument();
  });

  it('reports port clicks with the block id', async () => {
    const user = userEvent.setup();
    const onOutputPortClick = vi.fn();
    const onInputPortClick = vi.fn();
    render(
      <CanvasBlock
        block={at({ kind: 'sticky', text: 'Login' })}
        onInputPortClick={onInputPortClick}
        onOutputPortClick={onOutputPortClick}
      />,
    );

    await user.click(
      screen.getByRole('button', { name: "Connect Login's output to another block" }),
    );
    await user.click(screen.getByRole('button', { name: "Connect to Login's input" }));

    expect(onOutputPortClick).toHaveBeenCalledWith('x');
    expect(onInputPortClick).toHaveBeenCalledWith('x');
  });

  // No handler means no connection is possible, and a dot that does nothing is
  // worse than no dot — a read-only board stays free of them.
  it('draws no ports without the handlers', () => {
    const { container } = render(<CanvasBlock block={at({ kind: 'sticky', text: 'Login' })} />);

    expect(container.querySelectorAll('[data-port]')).toHaveLength(0);
  });

  it('draws none on a kind that is not node-like', () => {
    const { container } = render(
      <CanvasBlock
        block={at({ kind: 'text', html: '<p>Note</p>' })}
        onInputPortClick={vi.fn()}
        onOutputPortClick={vi.fn()}
      />,
    );

    expect(container.querySelectorAll('[data-port]')).toHaveLength(0);
  });

  it('has no accessibility violations with ports on', async () => {
    const { container } = render(
      <CanvasBlock
        block={at({ kind: 'sticky', text: 'Login' })}
        selected
        onInputPortClick={vi.fn()}
        onOutputPortClick={vi.fn()}
      />,
    );

    await expectNoA11yViolations(container);
  });
});

describe('CanvasBlock fill picker', () => {
  it('offers it only for sticky/shape/node, only while selected, and only when a handler is given', () => {
    const sticky = at({ kind: 'sticky', text: 'Note' });
    const shape = at({ kind: 'shape', shape: 'rectangle' });
    const node = at({ kind: 'node', name: 'Auth' });
    const frame = at({ kind: 'frame', title: 'Group' });

    expect(
      render(
        <CanvasBlock block={sticky} selected onColorChange={() => {}} />,
      ).container.querySelector('button[aria-label="Change fill color"]'),
    ).toBeInTheDocument();

    expect(
      render(
        <CanvasBlock block={shape} selected onColorChange={() => {}} />,
      ).container.querySelector('button[aria-label="Change fill color"]'),
    ).toBeInTheDocument();

    expect(
      render(
        <CanvasBlock block={node} selected onColorChange={() => {}} />,
      ).container.querySelector('button[aria-label="Change fill color"]'),
    ).toBeInTheDocument();

    // Not selected.
    expect(
      render(<CanvasBlock block={sticky} onColorChange={() => {}} />).container.querySelector(
        'button[aria-label="Change fill color"]',
      ),
    ).toBeNull();

    // No handler.
    expect(
      render(<CanvasBlock block={sticky} selected />).container.querySelector(
        'button[aria-label="Change fill color"]',
      ),
    ).toBeNull();

    // Wrong kind — a frame has no `color` field.
    expect(
      render(
        <CanvasBlock block={frame} selected onColorChange={() => {}} />,
      ).container.querySelector('button[aria-label="Change fill color"]'),
    ).toBeNull();
  });

  it('reports a chosen color through onColorChange', async () => {
    const user = userEvent.setup();
    const onColorChange = vi.fn();
    render(
      <CanvasBlock
        block={at({ kind: 'sticky', text: 'Note' })}
        selected
        onColorChange={onColorChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Change fill color' }));
    await user.click(screen.getByRole('button', { name: DEFAULT_CANVAS_FILL_PRESETS[0] }));

    expect(onColorChange).toHaveBeenCalledWith(expect.stringMatching(/^#[0-9a-f]{6}$/i));
  });
});

describe('CanvasBlock shape editing', () => {
  it('forwards editing/onTextChange to a shape block, the same way sticky already works', () => {
    const onTextChange = vi.fn();
    render(
      <CanvasBlock
        block={at({ kind: 'shape', shape: 'rectangle', text: 'Draft' })}
        editing
        onTextChange={onTextChange}
      />,
    );
    expect(screen.getByLabelText('Shape label')).toHaveValue('Draft');
  });
});

describe('CanvasBlock shape AI trigger', () => {
  const shapeBlock = at({ kind: 'shape', shape: 'diamond', text: 'a draft label' });

  it('offers it only for shape blocks, only while selected, not editing, and only with an AIProvider', () => {
    // Not selected.
    expect(
      render(
        <CanvasBlock block={shapeBlock} aiRewrite onTextChange={() => {}} />,
      ).container.querySelector('button[aria-label="Rewrite with AI"]'),
    ).toBeNull();

    // Editing — pointer gestures belong to the input, not a popover trigger.
    expect(
      render(
        <CanvasBlock block={shapeBlock} aiRewrite selected editing onTextChange={() => {}} />,
      ).container.querySelector('button[aria-label="Rewrite with AI"]'),
    ).toBeNull();

    // No AIProvider mounted.
    expect(
      render(
        <CanvasBlock block={shapeBlock} aiRewrite selected onTextChange={() => {}} />,
      ).container.querySelector('button[aria-label="Rewrite with AI"]'),
    ).toBeNull();
  });

  it('renders the trigger for a selected shape block with an AIProvider mounted', () => {
    const client: AIClient = { complete: vi.fn().mockResolvedValue('x') };
    render(
      <AIProvider client={client}>
        <CanvasBlock block={shapeBlock} aiRewrite selected onTextChange={() => {}} />
      </AIProvider>,
    );
    expect(screen.getByRole('button', { name: 'Rewrite with AI' })).toBeInTheDocument();
  });

  it('accepting the suggestion calls onTextChange with the result', async () => {
    const user = userEvent.setup();
    const client: AIClient = { complete: vi.fn().mockResolvedValue('Decision?') };

    function Controlled() {
      const [text, setText] = useState('a draft label');
      return (
        <AIProvider client={client}>
          <CanvasBlock
            block={at({ kind: 'shape', shape: 'diamond', text })}
            aiRewrite
            selected
            onTextChange={setText}
          />
        </AIProvider>
      );
    }
    render(<Controlled />);

    await user.click(screen.getByRole('button', { name: 'Rewrite with AI' }));
    expect(client.complete).toHaveBeenCalledWith(
      expect.objectContaining({ prompt: expect.stringContaining('a draft label') }),
    );

    await screen.findByText('Decision?');
    await user.click(screen.getByRole('button', { name: 'Accept' }));

    expect(screen.getByText('Decision?')).toBeInTheDocument();
  });

  it('has no accessibility violations with the trigger shown', async () => {
    const client: AIClient = { complete: vi.fn().mockResolvedValue('x') };
    const { container } = render(
      <AIProvider client={client}>
        <CanvasBlock block={shapeBlock} aiRewrite selected onTextChange={() => {}} />
      </AIProvider>,
    );
    await expectNoA11yViolations(container);
  });
});

describe('CanvasBlock node ports and renaming', () => {
  it('reports output/input port clicks and reflects the armed state via nodeConnecting', () => {
    const onOutputPortClick = vi.fn();
    const onInputPortClick = vi.fn();
    render(
      <CanvasBlock
        block={at({ kind: 'node', name: 'Auth' })}
        onOutputPortClick={onOutputPortClick}
        onInputPortClick={onInputPortClick}
        nodeConnecting
      />,
    );

    expect(screen.getByRole('button', { name: /output/i })).toHaveAttribute('data-connecting', '');

    fireEvent.click(screen.getByRole('button', { name: /output/i }));
    expect(onOutputPortClick).toHaveBeenCalledWith('x');

    fireEvent.click(screen.getByRole('button', { name: /input/i }));
    expect(onInputPortClick).toHaveBeenCalledWith('x');
  });

  it('renders ports as inert spans without click handlers', () => {
    render(<CanvasBlock block={at({ kind: 'node', name: 'Auth' })} />);
    expect(screen.queryByRole('button', { name: /output/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /input/i })).not.toBeInTheDocument();
  });

  it('renaming a node reports through onNameChange', () => {
    const onNameChange = vi.fn();
    render(<CanvasBlock block={at({ kind: 'node', name: 'Auth' })} onNameChange={onNameChange} />);

    fireEvent.doubleClick(screen.getByText('Auth'));
    fireEvent.change(screen.getByLabelText('Node name'), { target: { value: 'Auth service' } });
    fireEvent.keyDown(screen.getByLabelText('Node name'), { key: 'Enter' });

    expect(onNameChange).toHaveBeenCalledWith('Auth service');
  });
});

describe('CanvasBlock document chrome', () => {
  const documentBlock = at({ kind: 'document', pages: ['<p>Resume text</p>'] });

  it('embeds bare by default — no standalone view/zoom chrome', () => {
    render(<CanvasBlock block={documentBlock} />);
    expect(screen.queryByRole('button', { name: 'List view' })).not.toBeInTheDocument();
  });

  it('renders Document’s standalone chrome when chrome is set', () => {
    render(<CanvasBlock block={documentBlock} chrome />);
    expect(screen.getByRole('button', { name: 'List view' })).toBeInTheDocument();
  });
});
