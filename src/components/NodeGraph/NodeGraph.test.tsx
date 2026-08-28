import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { NodeGraph } from './NodeGraph';
import type { NodeGraphData } from '../../utilities/nodeGraph';

function graphWithTwoNodes(): NodeGraphData {
  return {
    nodes: [
      { id: 'a', name: 'Source', data: { value: 'A' }, x: 0, y: 0 },
      { id: 'b', name: 'Target', data: { value: 'B' }, x: 400, y: 0 },
    ],
    connections: [],
    groups: [],
  };
}

function Controlled({ initial }: { initial: NodeGraphData }) {
  const [value, setValue] = useState(initial);
  return <NodeGraph value={value} onChange={setValue} />;
}

describe('NodeGraph', () => {
  it('renders every node by name', () => {
    render(<Controlled initial={graphWithTwoNodes()} />);

    expect(screen.getByRole('group', { name: 'Source' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Target' })).toBeInTheDocument();
  });

  it('renders a node with no renderNode using a default string/JSON rendering', () => {
    render(<Controlled initial={graphWithTwoNodes()} />);

    expect(screen.getByText('{"value":"A"}')).toBeInTheDocument();
  });

  it('uses renderNode when supplied', () => {
    render(<NodeGraph value={graphWithTwoNodes()} renderNode={(node) => `Custom: ${node.name}`} />);

    expect(screen.getByText('Custom: Source')).toBeInTheDocument();
  });

  it('connects two nodes via click-to-connect: arm the output, then click the target input', () => {
    const onChange = vi.fn();
    render(<NodeGraph value={graphWithTwoNodes()} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: /Connect Source's output/ }));
    fireEvent.click(screen.getByRole('button', { name: /Connect to Target's input/ }));

    const [next] = onChange.mock.calls[onChange.mock.calls.length - 1] as [NodeGraphData];
    expect(next.connections).toHaveLength(1);
    expect(next.connections[0]).toMatchObject({ source: 'a', target: 'b' });
  });

  it('reflects a connected node holding the upstream node in its computed output via computeNodeOutput', async () => {
    const { computeNodeOutput } = await import('../../utilities/nodeGraph');
    const graph = graphWithTwoNodes();
    graph.connections = [{ id: 'c1', source: 'a', target: 'b' }];

    expect(computeNodeOutput('b', graph.nodes, graph.connections)).toEqual({
      a: { value: 'A' },
      b: { value: 'B' },
    });
  });

  it('does not connect a node to itself', () => {
    const onChange = vi.fn();
    render(<NodeGraph value={graphWithTwoNodes()} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: /Connect Source's output/ }));
    fireEvent.click(screen.getByRole('button', { name: /Connect to Source's input/ }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it('Escape cancels an armed connection without connecting', () => {
    const onChange = vi.fn();
    const { container } = render(<NodeGraph value={graphWithTwoNodes()} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: /Connect Source's output/ }));
    fireEvent.keyDown(container.firstElementChild as HTMLElement, { key: 'Escape' });
    fireEvent.click(screen.getByRole('button', { name: /Connect to Target's input/ }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it('selects a node on pointerdown, reported via data-selected', () => {
    render(<Controlled initial={graphWithTwoNodes()} />);

    fireEvent.pointerDown(screen.getByRole('group', { name: 'Source' }));

    expect(screen.getByRole('group', { name: 'Source' })).toHaveAttribute('data-selected', '');
  });

  it('clicking the background clears the selection', () => {
    render(<Controlled initial={graphWithTwoNodes()} />);

    fireEvent.pointerDown(screen.getByRole('group', { name: 'Source' }));
    expect(screen.getByRole('group', { name: 'Source' })).toHaveAttribute('data-selected', '');

    fireEvent.pointerDown(
      screen.getByRole('group', { name: 'Source' }).parentElement as HTMLElement,
    );
    expect(screen.getByRole('group', { name: 'Source' })).not.toHaveAttribute('data-selected');
  });

  it('Delete removes a selected node along with any connection touching it', () => {
    const graph = graphWithTwoNodes();
    graph.connections = [{ id: 'c1', source: 'a', target: 'b' }];
    const onChange = vi.fn();
    const { container } = render(<NodeGraph value={graph} onChange={onChange} />);

    fireEvent.pointerDown(screen.getByRole('group', { name: 'Source' }));
    fireEvent.keyDown(container.firstElementChild as HTMLElement, { key: 'Delete' });

    const [next] = onChange.mock.calls[0] as [NodeGraphData];
    expect(next.nodes.map((n) => n.id)).toEqual(['b']);
    expect(next.connections).toHaveLength(0);
  });

  it('ArrowRight nudges every selected node to the right', () => {
    const onChange = vi.fn();
    const { container } = render(<NodeGraph value={graphWithTwoNodes()} onChange={onChange} />);

    fireEvent.pointerDown(screen.getByRole('group', { name: 'Source' }));
    fireEvent.keyDown(container.firstElementChild as HTMLElement, { key: 'ArrowRight' });

    const [next] = onChange.mock.calls[0] as [NodeGraphData];
    expect(next.nodes.find((n) => n.id === 'a')?.x).toBe(8);
  });

  it('is read-only safe: readOnly renders no ports and ignores keyboard mutation', () => {
    const onChange = vi.fn();
    render(<NodeGraph value={graphWithTwoNodes()} onChange={onChange} readOnly />);

    expect(screen.queryByRole('button', { name: /Connect/ })).not.toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Controlled initial={graphWithTwoNodes()} />);

    await expectNoA11yViolations(container);
  });
});
