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
    const block = at({ kind: 'sticky', text: 'Note' });

    const plain = render(<CanvasBlock block={block} resizable />);
    expect(plain.container.querySelector('[data-canvas-resize-handles]')).toBeNull();
    plain.unmount();

    const selected = render(<CanvasBlock block={block} resizable selected />);
    expect(selected.container.querySelector('[data-canvas-resize-handles]')).toBeInTheDocument();
  });

  it('hides the handles from assistive tech — Alt+arrows is the keyboard path', () => {
    const { container } = render(
      <CanvasBlock block={at({ kind: 'sticky', text: 'Note' })} resizable selected />,
    );

    expect(container.querySelector('[data-canvas-resize-handles]')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <CanvasBlock block={at({ kind: 'sticky', text: 'Note' })} selected resizable />,
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
