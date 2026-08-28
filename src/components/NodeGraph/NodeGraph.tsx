import { useRef, useState } from 'react';
import type {
  CSSProperties,
  KeyboardEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from 'react';
import { mergeClasses } from '../../utilities/mergeClasses';
import { useControllableState } from '../../hooks/useControllableState';
import {
  canConnect,
  findNode,
  groupBounds,
  inputPortPoint,
  outputPortPoint,
  DEFAULT_NODE_HEIGHT,
  DEFAULT_NODE_WIDTH,
} from '../../utilities/nodeGraph';
import type {
  NodeConnectionData,
  NodeData,
  NodeGraphData,
  NodeGroupData,
} from '../../utilities/nodeGraph';
import { Node } from '../Node/Node';
import { NodeConnector } from '../NodeConnector/NodeConnector';
import { NodeGroup } from '../NodeGroup/NodeGroup';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden';
import styles from './NodeGraph.module.css';

const DRAG_THRESHOLD = 3;

const EMPTY_GRAPH: NodeGraphData = { nodes: [], connections: [], groups: [] };

type DragGesture = {
  id: string;
  originX: number;
  originY: number;
  startX: number;
  startY: number;
  moved: boolean;
};

export interface NodeGraphProps<T = unknown> {
  value?: NodeGraphData<T>;
  defaultValue?: NodeGraphData<T>;
  onChange?: (value: NodeGraphData<T>) => void;
  /** Renders a node's held `data` — the content slot, since `data` can be anything from a string to an entire scene from another module. Falls back to a plain string/JSON rendering when omitted. */
  renderNode?: (node: NodeData<T>) => ReactNode;
  readOnly?: boolean;
  className?: string;
  style?: CSSProperties;
}

function defaultRenderNode(node: NodeData): ReactNode {
  const { data } = node;
  if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
    return String(data);
  }
  try {
    return JSON.stringify(data);
  } catch {
    return null;
  }
}

/**
 * A graph of `Node`s: draggable, connectable, and groupable. Nodes hold
 * arbitrary `data` (`NodeData.data`) — this component never inspects it,
 * only positions the box and hands it to `renderNode`. Connecting node A's
 * output to node B's input doesn't merge anything here: `computeNodeOutput`
 * (`utilities/nodeGraph.ts`) derives B's effective output — A's data plus
 * B's own — on read, from any module, which is what "nodes can be referred
 * on other modules" means in practice: the graph's data (`NodeGraphData`)
 * and its pure functions are the public surface, not an internal state
 * machine only this component can drive.
 *
 * Connecting is click-driven, not drag-driven: click an output port to arm
 * it, then click a target's input port to complete the connection (or
 * Escape to cancel) — reachable from the keyboard the same way every other
 * pointer-only gesture in this library gets a non-pointer path. Repositioning
 * a node is still pointer-drag-only, with arrow keys as its keyboard
 * equivalent once a node has focus, the same split `Canvas` draws between
 * spatial dragging and keyboard navigation.
 */
export function NodeGraph<T = unknown>({
  value,
  defaultValue,
  onChange,
  renderNode,
  readOnly = false,
  className,
  style,
}: NodeGraphProps<T>) {
  const [graph, setGraph] = useControllableState<NodeGraphData<T>>({
    value,
    defaultValue: defaultValue ?? (EMPTY_GRAPH as NodeGraphData<T>),
    onChange,
  });
  const { nodes, connections, groups } = graph;

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | undefined>();
  const [pendingSource, setPendingSource] = useState<string | undefined>();
  const [gesture, setGesture] = useState<DragGesture | undefined>();

  const idCounterRef = useRef(0);
  function nextId(prefix: string) {
    return `${prefix}-${++idCounterRef.current}`;
  }

  function updateGraph(next: Partial<NodeGraphData<T>>) {
    setGraph({ ...graph, ...next });
  }

  function selectNode(id: string, additive: boolean) {
    setSelectedIds((current) => {
      if (additive) {
        return current.includes(id)
          ? current.filter((existing) => existing !== id)
          : [...current, id];
      }
      return [id];
    });
    setSelectedConnectionId(undefined);
  }

  function clearSelection() {
    setSelectedIds([]);
    setSelectedConnectionId(undefined);
    setPendingSource(undefined);
  }

  function onRootPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    clearSelection();
  }

  function onNodeHeaderPointerDown(event: ReactPointerEvent<HTMLDivElement>, node: NodeData<T>) {
    if (readOnly) return;
    setGesture({
      id: node.id,
      originX: event.clientX,
      originY: event.clientY,
      startX: node.x,
      startY: node.y,
      moved: false,
    });
  }

  function onRootPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!gesture) return;
    const dx = event.clientX - gesture.originX;
    const dy = event.clientY - gesture.originY;
    if (!gesture.moved && Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;

    if (!gesture.moved) {
      event.currentTarget.setPointerCapture?.(event.pointerId);
      setGesture({ ...gesture, moved: true });
    }

    updateGraph({
      nodes: nodes.map((node) =>
        node.id === gesture.id ? { ...node, x: gesture.startX + dx, y: gesture.startY + dy } : node,
      ),
    });
  }

  function onRootPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (!gesture) return;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    setGesture(undefined);
  }

  function onOutputPortClick(id: string) {
    if (readOnly) return;
    setPendingSource((current) => (current === id ? undefined : id));
  }

  function onInputPortClick(id: string) {
    if (readOnly || !pendingSource) return;
    if (canConnect(pendingSource, id, connections)) {
      const connection: NodeConnectionData = {
        id: nextId('connection'),
        source: pendingSource,
        target: id,
      };
      updateGraph({ connections: [...connections, connection] });
    }
    setPendingSource(undefined);
  }

  function renameNode(id: string, name: string) {
    updateGraph({ nodes: nodes.map((node) => (node.id === id ? { ...node, name } : node)) });
  }

  function renameGroup(id: string, name: string) {
    updateGraph({ groups: groups.map((group) => (group.id === id ? { ...group, name } : group)) });
  }

  function ungroup(id: string) {
    updateGraph({ groups: groups.filter((group) => group.id !== id) });
  }

  function groupSelection() {
    if (readOnly || selectedIds.length < 2) return;
    const group: NodeGroupData = {
      id: nextId('group'),
      name: `Group ${groups.length + 1}`,
      nodeIds: selectedIds,
    };
    updateGraph({ groups: [...groups, group] });
  }

  function deleteSelection() {
    if (readOnly || selectedIds.length === 0) return;
    const removed = new Set(selectedIds);
    updateGraph({
      nodes: nodes.filter((node) => !removed.has(node.id)),
      connections: connections.filter(
        (connection) => !removed.has(connection.source) && !removed.has(connection.target),
      ),
      groups: groups
        .map((group) => ({ ...group, nodeIds: group.nodeIds.filter((id) => !removed.has(id)) }))
        .filter((group) => group.nodeIds.length > 0),
    });
    clearSelection();
  }

  function moveSelection(dx: number, dy: number) {
    if (readOnly || selectedIds.length === 0) return;
    const moving = new Set(selectedIds);
    updateGraph({
      nodes: nodes.map((node) =>
        moving.has(node.id) ? { ...node, x: node.x + dx, y: node.y + dy } : node,
      ),
    });
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      clearSelection();
      return;
    }
    if (readOnly) return;

    if ((event.key === 'Delete' || event.key === 'Backspace') && selectedIds.length > 0) {
      event.preventDefault();
      deleteSelection();
      return;
    }
    if (
      event.key.toLowerCase() === 'g' &&
      !event.metaKey &&
      !event.ctrlKey &&
      selectedIds.length >= 2
    ) {
      event.preventDefault();
      groupSelection();
      return;
    }
    const step = event.shiftKey ? 24 : 8;
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveSelection(0, -step);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveSelection(0, step);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      moveSelection(-step, 0);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      moveSelection(step, 0);
    }
  }

  const pendingSourceNode = pendingSource ? findNode(nodes, pendingSource) : undefined;

  return (
    // A composite widget, the same shape `Canvas`'s surface and `KanbanBoard`
    // use: the graph itself takes focus and owns arrow/Delete/"G", while
    // nodes stay readable `role="group"`s rather than each claiming its own
    // tab stop. Neither a11y rule below can model a widget whose focus lives
    // on the container.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      className={mergeClasses(styles.graph, className)}
      style={style}
      role="group"
      aria-label="Node graph"
      /* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */
      tabIndex={0}
      onPointerDown={onRootPointerDown}
      onPointerMove={onRootPointerMove}
      onPointerUp={onRootPointerUp}
      onPointerCancel={onRootPointerUp}
      onKeyDown={onKeyDown}
    >
      <svg className={styles.connectors} aria-hidden="true">
        {connections.map((connection) => {
          const source = findNode(nodes, connection.source);
          const target = findNode(nodes, connection.target);
          if (!source || !target) return null;
          return (
            <NodeConnector
              key={connection.id}
              id={connection.id}
              from={outputPortPoint(source)}
              to={inputPortPoint(target)}
              selected={selectedConnectionId === connection.id}
              onSelect={readOnly ? undefined : setSelectedConnectionId}
            />
          );
        })}
      </svg>

      {groups.map((group) => {
        const bounds = groupBounds(group, nodes);
        if (!bounds) return null;
        return (
          <NodeGroup
            key={group.id}
            name={group.name}
            style={{ left: bounds.x, top: bounds.y, width: bounds.width, height: bounds.height }}
            onRename={readOnly ? undefined : (name) => renameGroup(group.id, name)}
            onUngroup={readOnly ? undefined : () => ungroup(group.id)}
          />
        );
      })}

      {nodes.map((node) => (
        <Node
          key={node.id}
          id={node.id}
          name={node.name}
          selected={selectedIds.includes(node.id)}
          connecting={pendingSource === node.id}
          onRename={readOnly ? undefined : (name) => renameNode(node.id, name)}
          onSelect={selectNode}
          onHeaderPointerDown={(event) => onNodeHeaderPointerDown(event, node)}
          onOutputPortClick={readOnly ? undefined : onOutputPortClick}
          onInputPortClick={readOnly ? undefined : onInputPortClick}
          style={{
            left: node.x,
            top: node.y,
            width: node.width ?? DEFAULT_NODE_WIDTH,
            height: node.height ?? DEFAULT_NODE_HEIGHT,
          }}
        >
          {renderNode ? renderNode(node) : defaultRenderNode(node)}
        </Node>
      ))}

      {pendingSourceNode && (
        <VisuallyHidden role="status">
          Connecting from {pendingSourceNode.name}. Select another node&apos;s input to connect, or
          press Escape to cancel.
        </VisuallyHidden>
      )}
    </div>
  );
}

NodeGraph.displayName = 'NodeGraph';
