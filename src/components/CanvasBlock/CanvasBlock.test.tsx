import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { CanvasBlock } from './CanvasBlock';
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
