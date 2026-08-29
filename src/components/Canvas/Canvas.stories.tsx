import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Canvas } from './Canvas';
import { Text } from '../Text/Text';
import { Stack } from '../Stack/Stack';
import { Inline } from '../Inline/Inline';
import { Button } from '../Button/Button';
import { AIProvider } from '../../providers/AIProvider';
import { ToastProvider } from '../../providers/ToastProvider';
import type { AIClient } from '../../contexts/AIContext';
import type { CanvasScene } from '../../utilities/canvasReducer';

const meta: Meta<typeof Canvas> = {
  title: 'Canvas/Canvas',
  component: Canvas,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div style={{ height: '32rem', padding: 'var(--ds-space-md)' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Canvas>;

const board: CanvasScene = {
  blocks: [
    { id: 'f1', kind: 'frame', title: 'Sign-in flow', x: 20, y: 20, width: 560, height: 260 },
    {
      id: 'n1',
      kind: 'sticky',
      text: 'Users bounce after SSO',
      tone: 'danger',
      x: 60,
      y: 80,
      width: 150,
      height: 110,
    },
    {
      id: 'n2',
      kind: 'sticky',
      text: 'Add a retry banner',
      tone: 'success',
      x: 250,
      y: 80,
      width: 150,
      height: 110,
    },
    {
      id: 's1',
      kind: 'shape',
      shape: 'diamond',
      text: 'Token valid?',
      x: 430,
      y: 70,
      width: 130,
      height: 130,
    },
    {
      id: 'n3',
      kind: 'sticky',
      text: 'Check the audit log first',
      x: 60,
      y: 330,
      width: 150,
      height: 110,
    },
    { id: 'd1', kind: 'divider', x: 250, y: 320, width: 320, height: 24 },
    {
      id: 'i1',
      kind: 'image',
      src: 'https://placehold.co/240x140/png',
      alt: 'Login funnel chart',
      x: 250,
      y: 370,
      width: 240,
      height: 140,
    },
  ],
  connectors: [
    { id: 'c1', from: 'n1', to: 'n2', label: 'fix' },
    { id: 'c2', from: 'n2', to: 's1', variant: 'orthogonal' },
  ],
};

/**
 * Drag a block to move it. Drag empty space to marquee-select. Scroll or
 * two-finger swipe to pan freely, Shift+wheel for sideways, Ctrl/Cmd+wheel to
 * zoom about the pointer, Alt-drag or middle-drag to pan. Double-click a note
 * to edit it.
 *
 * Keyboard: focus the canvas, then — with nothing selected — arrows pan and
 * Shift+arrows pan further; `+`/`-` zoom, `0` resets, `1` zooms to fit, and
 * PageUp/PageDown jump vertically. With a block selected, arrows nudge it,
 * Alt+arrows resize it, Ctrl/Cmd+arrows still pan, Enter edits a note, Delete
 * removes, Escape deselects.
 */
export const Default: Story = {
  args: { defaultScene: board, 'aria-label': 'Workspace' },
};

/**
 * The linear navigation aid over the layout. Blocks themselves stay in the
 * accessibility tree — they hold real text and real controls — so this isn't a
 * substitute for them. What it supplies is what a screen reader can't perceive:
 * reading order, and the connector graph stated as text (the SVG that draws it
 * is `aria-hidden` geometry). Normally visually hidden; shown here.
 */
export const WithOutline: Story = {
  args: { defaultScene: board, outlineVisible: true, 'aria-label': 'Workspace' },
};

/** Every shape in the flowchart vocabulary, each labelled with real wrapping text. */
export const Shapes: Story = {
  args: {
    'aria-label': 'Shapes',
    defaultScene: {
      connectors: [],
      blocks: [
        {
          id: '1',
          kind: 'shape',
          shape: 'rectangle',
          text: 'Process',
          x: 20,
          y: 20,
          width: 140,
          height: 90,
        },
        {
          id: '2',
          kind: 'shape',
          shape: 'ellipse',
          text: 'Start',
          x: 190,
          y: 20,
          width: 140,
          height: 90,
        },
        {
          id: '3',
          kind: 'shape',
          shape: 'diamond',
          text: 'Decision',
          x: 360,
          y: 10,
          width: 140,
          height: 110,
        },
        {
          id: '4',
          kind: 'shape',
          shape: 'triangle',
          text: 'Warn',
          x: 530,
          y: 20,
          width: 140,
          height: 90,
        },
        {
          id: '5',
          kind: 'shape',
          shape: 'parallelogram',
          text: 'Input',
          x: 20,
          y: 150,
          width: 160,
          height: 90,
        },
      ],
    },
  },
};

/**
 * The full block catalogue. Beyond notes, shapes, text, images, dividers,
 * embeds and frames, a canvas holds the things people actually paste onto one:
 * a snippet, a table, a saved link, a checklist, a chart, and a small
 * resume-style document.
 *
 * Most are delegation — `Code`, `Table`, `Link`, `ChartSurface` are already in
 * the library, and wrapping them in folders would add files without adding
 * behaviour. `checklist` is the exception and gets its own component, because
 * it is the one face with state to change; ticking a box goes through the same
 * `update` command a model would use. `document` delegates to `Document`
 * itself (`chrome={false}`, so no view/zoom controls fight the canvas's own),
 * rendered read-only here — double-click it to open its editor, which enters
 * `Canvas`'s own focus mode, locked by default.
 */
export const BlockCatalogue: Story = {
  args: {
    'aria-label': 'Catalogue',
    outlineVisible: true,
    defaultScene: {
      connectors: [],
      blocks: [
        {
          id: 'code',
          kind: 'code',
          language: 'ts',
          code: 'const canvas = useCanvasViewport();\ncanvas.zoomBy(1.2);',
          x: 20,
          y: 20,
          width: 320,
          height: 150,
        },
        {
          id: 'table',
          kind: 'table',
          caption: 'Deployments',
          columns: ['Env', 'Version', 'Status'],
          rows: [
            ['prod', '4.2.1', 'green'],
            ['staging', '4.3.0-rc', 'amber'],
            ['dev', '4.3.0'],
          ],
          x: 370,
          y: 20,
          width: 360,
          height: 200,
        },
        {
          id: 'link',
          kind: 'link',
          url: 'https://example.com/design-review',
          title: 'Design review notes',
          description: 'What we agreed about the sign-in flow.',
          x: 20,
          y: 200,
          width: 300,
          height: 130,
        },
        {
          id: 'list',
          kind: 'checklist',
          title: 'Before launch',
          items: [
            { id: 'i1', text: 'Copy reviewed', done: true },
            { id: 'i2', text: 'Contrast checked', done: true },
            { id: 'i3', text: 'Keyboard pass' },
            { id: 'i4', text: 'Ship note drafted' },
          ],
          x: 350,
          y: 250,
          width: 250,
          height: 200,
        },
        {
          id: 'chart',
          kind: 'chart',
          label: 'Signups per week',
          chartType: 'line',
          data: [
            { label: 'W1', value: 120 },
            { label: 'W2', value: 180 },
            { label: 'W3', value: 165 },
            { label: 'W4', value: 240 },
          ],
          x: 640,
          y: 250,
          width: 380,
          height: 240,
        },
        {
          id: 'document',
          kind: 'document',
          header: '<h2>Ada Lovelace</h2>',
          pages: [
            '<p>Mathematician and writer, known for work on Babbage’s Analytical Engine.</p>',
          ],
          x: 20,
          y: 520,
          width: 200,
          height: 283,
        },
      ],
    },
  },
};

/** All five note tones. Tone is decoration — the note's text carries the meaning. */
export const NoteTones: Story = {
  args: {
    'aria-label': 'Notes',
    defaultScene: {
      connectors: [],
      blocks: (['neutral', 'brand', 'success', 'warning', 'danger'] as const).map(
        (tone, index) => ({
          id: tone,
          kind: 'sticky' as const,
          text: `${tone} note`,
          tone,
          x: 20 + index * 160,
          y: 30,
          width: 140,
          height: 120,
        }),
      ),
    },
  },
};

/** The three connector routings, and labels that stay readable over their own line. */
export const Connectors: Story = {
  args: {
    'aria-label': 'Connectors',
    defaultScene: {
      blocks: [
        {
          id: 'a',
          kind: 'shape',
          shape: 'rectangle',
          text: 'A',
          x: 30,
          y: 30,
          width: 110,
          height: 70,
        },
        {
          id: 'b',
          kind: 'shape',
          shape: 'rectangle',
          text: 'B',
          x: 380,
          y: 30,
          width: 110,
          height: 70,
        },
        {
          id: 'c',
          kind: 'shape',
          shape: 'rectangle',
          text: 'C',
          x: 380,
          y: 180,
          width: 110,
          height: 70,
        },
        {
          id: 'd',
          kind: 'shape',
          shape: 'rectangle',
          text: 'D',
          x: 380,
          y: 320,
          width: 110,
          height: 70,
        },
      ],
      connectors: [
        { id: '1', from: 'a', to: 'b', variant: 'straight', label: 'straight' },
        { id: '2', from: 'a', to: 'c', variant: 'orthogonal', label: 'orthogonal' },
        { id: '3', from: 'a', to: 'd', variant: 'curved', label: 'curved' },
      ],
    },
  },
};

/**
 * `node` blocks: pill-shaped, colored, connected by click-to-connect ports —
 * click a source's right-hand output dot, then a target's left-hand input
 * dot. Connections reuse `Canvas`'s own connector system, not the standalone
 * `NodeGraph`'s.
 */
export const NodeDiagram: Story = {
  args: {
    'aria-label': 'Node diagram',
    defaultScene: {
      blocks: [
        {
          id: 'brief',
          kind: 'node',
          name: 'Vague brief',
          color: '#c9e4d0',
          x: 40,
          y: 40,
          width: 150,
          height: 44,
        },
        {
          id: 'reports',
          kind: 'node',
          name: 'Public reports',
          x: 260,
          y: 40,
          width: 150,
          height: 44,
        },
        {
          id: 'summary',
          kind: 'node',
          name: 'Aggregated summary',
          color: '#f6c9d6',
          x: 480,
          y: 40,
          width: 170,
          height: 44,
        },
      ],
      connectors: [
        { id: 'c1', from: 'brief', to: 'reports', arrow: 'end' },
        { id: 'c2', from: 'reports', to: 'summary', arrow: 'end' },
      ],
    },
  },
};

/**
 * Sticky notes and shapes carry the same ports a `node` does, so a diagram
 * isn't limited to one block kind — arm any output dot, then click any input
 * dot. All three are also fixed-size: selecting one draws a rounded highlight,
 * not a resize frame with corner points, because none of them resizes. The
 * sized kinds (`text`, `image`, `code`, `table`, …) still get their handles.
 */
export const MixedNodeDiagram: Story = {
  args: {
    'aria-label': 'Mixed node diagram',
    defaultScene: {
      blocks: [
        {
          id: 'brief',
          kind: 'sticky',
          text: 'Vague brief',
          color: '#c9e4d0',
          x: 40,
          y: 40,
          width: 150,
          height: 90,
        },
        {
          id: 'gate',
          kind: 'shape',
          shape: 'diamond',
          text: 'Enough detail?',
          x: 260,
          y: 30,
          width: 170,
          height: 110,
        },
        {
          id: 'summary',
          kind: 'node',
          name: 'Aggregated summary',
          color: '#f6c9d6',
          x: 500,
          y: 60,
          width: 170,
          height: 44,
        },
      ],
      connectors: [
        { id: 'c1', from: 'brief', to: 'gate', arrow: 'end' },
        { id: 'c2', from: 'gate', to: 'summary', arrow: 'end' },
      ],
    },
  },
};

/** No `AIProvider` or resolver needed — a click-driven way to add sticky notes, shapes, nodes and frames. */
export const ShapeToolbar: Story = {
  args: {
    'aria-label': 'Shape toolbar',
    shapeToolbar: true,
    defaultScene: { blocks: [], connectors: [] },
  },
};

/** HTML and external pages, each isolated in a sandboxed iframe without `allow-same-origin`. */
export const Embeds: Story = {
  args: {
    'aria-label': 'Embeds',
    defaultScene: {
      connectors: [],
      blocks: [
        {
          id: 'e1',
          kind: 'embed',
          title: 'Inline HTML',
          html: '<body style="font-family:sans-serif;padding:12px">Sandboxed HTML — no same-origin access.</body>',
          x: 30,
          y: 30,
          width: 280,
          height: 160,
        },
        {
          id: 'e2',
          kind: 'embed',
          title: 'Nothing embedded yet',
          x: 340,
          y: 30,
          width: 240,
          height: 160,
        },
      ],
    },
  },
};

/** Read-only: pans, zooms and reads, but nothing can be moved, resized or deleted. */
export const ReadOnly: Story = {
  args: { defaultScene: board, readOnly: true, 'aria-label': 'Workspace' },
};

/** Controlled — the parent owns the scene and sees every command. */
export const Controlled: Story = {
  render: function ControlledCanvas() {
    const [scene, setScene] = useState<CanvasScene>(board);
    const [log, setLog] = useState<string[]>([]);

    return (
      <Stack gap="sm" style={{ height: '100%' }}>
        <Canvas
          scene={scene}
          onSceneChange={setScene}
          onCommand={(command) =>
            setLog((entries) => [
              `${command.op}${'id' in command ? ` ${command.id}` : ''}`,
              ...entries,
            ])
          }
          aria-label="Workspace"
        />
        <Text size="sm" color="secondary">
          {log.length === 0 ? 'No changes yet.' : `Commands: ${log.slice(0, 6).join(', ')}`}
        </Text>
      </Stack>
    );
  },
};

/**
 * `renderBackdrop` renders beneath every block, inside the same world
 * transform, so an externally-rendered layer (here a stand-in for a
 * `pdf.js`-rasterized page) shares the canvas coordinate space and pans/
 * zooms in lockstep with blocks placed over it — the sanctioned composition
 * for overlaying selectable regions on external raster content (see
 * `docs/COMPONENT_LIST.md`). The backdrop itself is `aria-hidden`, since a
 * raster page carries no text of its own; any actually-readable content
 * (here, the two sticky notes standing in for selectable text runs) stays a
 * real block in the accessibility tree.
 */
export const ExternalBackdrop: Story = {
  render: () => (
    <Canvas
      defaultScene={{
        blocks: [
          { id: 'a', kind: 'sticky', text: 'Selected run', x: 40, y: 40, width: 160, height: 60 },
          { id: 'b', kind: 'sticky', text: 'Another run', x: 260, y: 160, width: 160, height: 60 },
        ],
        connectors: [],
      }}
      renderBackdrop={() => (
        <div
          style={{
            width: 600,
            height: 400,
            background: 'var(--ds-color-surface-secondary)',
            border: '1px solid var(--ds-color-border-primary)',
          }}
        />
      )}
      aria-label="Page workspace"
    />
  ),
};

/**
 * Controlled viewport — the parent owns pan/zoom, the same shape a page that
 * renders its own `pdf.js` canvas needs so the two stay pixel-locked
 * (`useCanvasViewport`'s controlled mode under the hood). Try the zoom
 * buttons, then pan the canvas: the readout below tracks every change.
 */
export const ControlledViewport: Story = {
  render: function ControlledViewportCanvas() {
    const [viewport, setViewport] = useState({ panX: 0, panY: 0, zoom: 1 });

    return (
      <Stack gap="sm" style={{ height: '100%' }}>
        <Inline gap="sm">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setViewport((v) => ({ ...v, zoom: Math.min(4, v.zoom * 1.2) }))}
          >
            Zoom in
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setViewport((v) => ({ ...v, zoom: Math.max(0.1, v.zoom / 1.2) }))}
          >
            Zoom out
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setViewport({ panX: 0, panY: 0, zoom: 1 })}
          >
            Reset
          </Button>
        </Inline>
        <Canvas
          defaultScene={board}
          viewport={viewport}
          onViewportChange={setViewport}
          aria-label="Workspace"
        />
        <Text size="sm" color="secondary">
          pan {Math.round(viewport.panX)}, {Math.round(viewport.panY)} · zoom{' '}
          {viewport.zoom.toFixed(2)}
        </Text>
      </Stack>
    );
  },
};

/** An empty canvas states its emptiness in the outline rather than going silent. */
export const Empty: Story = {
  args: { 'aria-label': 'Workspace', outlineVisible: true },
};

/**
 * A deterministic stand-in for a real model — this library never bundles a
 * vendor SDK, key or `fetch` call. Keyed off the user's own words, which
 * `buildCanvasPrompt` appends after a "Request:" line.
 */
/**
 * Buckets whatever blocks the clustering prompt listed, by keyword. Crude on
 * purpose — a real model reads meaning — but it's deterministic and it works
 * off the scene's actual content, so the layout below is doing the real work
 * either way.
 */
function mockClusters(prompt: string): string {
  const listed: Array<{ id: string; label: string }> = JSON.parse(
    (prompt.split('Blocks:').pop() ?? '[]').trim(),
  );

  const themeOf = (label: string) => {
    const text = label.toLowerCase();
    if (/\?|valid|decide|whether/.test(text)) return 'Open decisions';
    if (/bounce|slow|bug|fail|broken|confus|drop/.test(text)) return 'Problems';
    if (/add|retry|fix|ship|improve|write|check/.test(text)) return 'Actions';
    return 'Everything else';
  };

  const buckets = new Map<string, string[]>();
  for (const block of listed) {
    const theme = themeOf(block.label ?? '');
    buckets.set(theme, [...(buckets.get(theme) ?? []), block.id]);
  }

  return JSON.stringify({
    groups: [...buckets].map(([title, blockIds]) => ({ title, blockIds })),
    message: `Grouped ${listed.length} blocks into ${buckets.size} themes.`,
  });
}

/**
 * A canned graph per kind of request. Note it returns **no coordinates** — the
 * layered layout in `canvasDiagram.ts` places every node, which is the whole
 * point of the `aiDiagram` path.
 */
function mockDiagram(prompt: string): string {
  const request = (prompt.split('Request:').pop() ?? prompt).toLowerCase();

  if (request.includes('sign') || request.includes('login') || request.includes('auth')) {
    return JSON.stringify({
      title: 'Sign-in flow',
      direction: 'down',
      nodes: [
        { id: 'open', label: 'Open app', role: 'start' },
        { id: 'token', label: 'Token valid?', role: 'decision' },
        { id: 'home', label: 'Show home', role: 'end' },
        { id: 'login', label: 'Show login', role: 'process' },
        { id: 'creds', label: 'Enter credentials', role: 'input' },
        { id: 'verify', label: 'Verify with SSO', role: 'process' },
      ],
      edges: [
        { from: 'open', to: 'token' },
        { from: 'token', to: 'home', label: 'yes' },
        { from: 'token', to: 'login', label: 'no' },
        { from: 'login', to: 'creds' },
        { from: 'creds', to: 'verify' },
        { from: 'verify', to: 'token', label: 'retry' },
      ],
    });
  }

  if (request.includes('pipeline') || request.includes('release') || request.includes('deploy')) {
    return JSON.stringify({
      title: 'Release pipeline',
      direction: 'right',
      nodes: [
        { id: 'pr', label: 'Pull request', role: 'start' },
        { id: 'ci', label: 'CI', role: 'process' },
        { id: 'review', label: 'Review', role: 'process' },
        { id: 'green', label: 'All green?', role: 'decision' },
        { id: 'ship', label: 'Deploy', role: 'end' },
        { id: 'fix', label: 'Send back', role: 'process' },
      ],
      edges: [
        { from: 'pr', to: 'ci' },
        { from: 'pr', to: 'review' },
        { from: 'ci', to: 'green' },
        { from: 'review', to: 'green' },
        { from: 'green', to: 'ship', label: 'yes' },
        { from: 'green', to: 'fix', label: 'no' },
      ],
    });
  }

  return JSON.stringify({
    nodes: [],
    message: 'I can draw a process, a flow or a pipeline — tell me the steps.',
  });
}

const mockClient: AIClient = {
  complete: async ({ prompt }) => {
    // Both checked first: neither instruction has a "Request:" line of the
    // prompt-bar shape, so their own wording would fall through to its
    // branches.
    if (prompt.includes('affinity mapping')) return mockClusters(prompt);
    if (prompt.includes('drafting a diagram')) return mockDiagram(prompt);

    const request = (prompt.split('Request:').pop() ?? prompt).toLowerCase();

    if (request.includes('what') || request.includes('summar')) {
      return JSON.stringify({
        thinking: 'This is a question, not an instruction — answer it and change nothing.',
        commands: [],
        message: 'Two notes about the SSO bounce, a decision diamond, and a funnel chart.',
        highlightBlockIds: ['n1', 'n2'],
      });
    }
    if (request.includes('add') && request.includes('note')) {
      return JSON.stringify({
        commands: [
          {
            op: 'create',
            block: {
              id: `n${Date.now()}`,
              kind: 'sticky',
              text: 'New note',
              x: 640,
              y: 60,
              tone: 'brand',
            },
          },
        ],
      });
    }
    if (request.includes('flow') || request.includes('diagram')) {
      return JSON.stringify({
        commands: [
          {
            op: 'create',
            block: {
              id: 'flow1',
              kind: 'shape',
              shape: 'ellipse',
              text: 'Start',
              x: 640,
              y: 40,
              width: 130,
              height: 80,
            },
          },
          {
            op: 'create',
            block: {
              id: 'flow2',
              kind: 'shape',
              shape: 'rectangle',
              text: 'Verify token',
              x: 640,
              y: 170,
              width: 130,
              height: 80,
            },
          },
          {
            op: 'create',
            block: {
              id: 'flow3',
              kind: 'shape',
              shape: 'diamond',
              text: 'Valid?',
              x: 640,
              y: 300,
              width: 130,
              height: 110,
            },
          },
          {
            op: 'connect',
            connector: { id: 'fc1', from: 'flow1', to: 'flow2', variant: 'orthogonal' },
          },
          {
            op: 'connect',
            connector: { id: 'fc2', from: 'flow2', to: 'flow3', variant: 'orthogonal' },
          },
        ],
        message: 'Sketched the sign-in flow to the right of your existing content.',
      });
    }
    if (request.includes('tidy') || request.includes('clean')) {
      return JSON.stringify({
        commands: [
          { op: 'move', id: 'n1', x: 60, y: 80 },
          { op: 'move', id: 'n2', x: 250, y: 80 },
          { op: 'delete', id: 'd1' },
        ],
        message: 'Aligned the notes and removed the stray divider.',
      });
    }
    if (request.includes('ghost') || request.includes('missing')) {
      return JSON.stringify({ commands: [{ op: 'move', id: 'not-a-real-block', x: 0, y: 0 }] });
    }
    if (request.includes('thing we discussed')) {
      return JSON.stringify({
        commands: [],
        message: 'Which item did you mean? Name it and I will add a note for it.',
      });
    }
    return JSON.stringify({
      commands: [],
      message: 'Try “add a note”, “draw the sign-in flow”, “tidy the canvas”, or “what is here?”.',
    });
  },
};

/**
 * The AI-native canvas. Every prompt runs the same pipeline — resolve,
 * validate, then classify by blast radius:
 *
 * - **“what is here?”** — a question. Highlights, changes nothing.
 * - **“add a note”** — one create. Additive, so it applies with an undo toast.
 * - **“draw the sign-in flow”** — shapes plus connectors. Staged for review,
 *   and the connectors reference blocks created in the same batch.
 * - **“tidy the canvas”** — moves plus a delete. Always staged.
 * - **“move the ghost block”** — a hallucinated id, reported not applied.
 * - **“add a card for the thing we discussed”** — ambiguous; it asks.
 *
 * "what is here?" also carries `thinking` — the model's own one-line account
 * of why it answered rather than acted — shown collapsed under a "Show
 * reasoning" toggle above the answer. It rides in the same JSON response as
 * `message`, so it costs nothing extra to wire up on a custom `resolveCommands`.
 *
 * Notes also carry a per-block "Rewrite with AI" trigger, and the toolbar's
 * **Group by theme** runs the affinity-mapping path through the same review
 * panel — see `AICluster`.
 */
export const AIPrompt: Story = {
  render: () => (
    <ToastProvider>
      <AIProvider client={mockClient}>
        <Stack gap="sm" style={{ height: '100%' }}>
          <Text size="sm">
            Try: <strong>what is here?</strong> · <strong>add a note</strong> ·{' '}
            <strong>draw the sign-in flow</strong> · <strong>tidy the canvas</strong> ·{' '}
            <strong>move the ghost block</strong>
          </Text>
          <Canvas
            defaultScene={board}
            aiPrompt
            aiRewrite
            aiCluster
            aiDiagram
            aria-label="Workspace"
          />
        </Stack>
      </AIProvider>
    </ToastProvider>
  ),
};

/**
 * Same pipeline as `AIPrompt`, decoupled from the top row: `aiPromptFloating`
 * moves the prompt into a `CanvasChatPanel` — a draggable, resizable,
 * minimizable panel over the canvas itself, styled as a compact card with a
 * bare drag-handle bar, a borderless input, and its scrollbar hidden on the
 * scrollable history. Drag it by its header; double-click the header (or its
 * hover-revealed icon button, or a host-supplied `minimizeShortcut`) to
 * minimize — there is no close control, only expanded/minimized, so the
 * assistant is always reachable. Drag the corner handle (or Alt+Arrow with
 * the panel focused) to resize it.
 *
 * Every exchange stays in the scrollable history, not just the most recent
 * one — ask more than once to see earlier turns still there, scrolled past.
 *
 * Select the "Sign-in flow" frame — every note visually inside a frame
 * moves with it (drag or keyboard nudge alike, geometric membership, not a
 * stored relationship), and selecting the frame hands the chat its own data
 * *plus* its contents, not just the frame's title. Selecting many blocks at
 * once collapses the chip row into one "N items selected" summary past
 * `MAX_SELECTION_CHIPS`.
 */
export const AIPromptFloating: Story = {
  render: () => (
    <ToastProvider>
      <AIProvider client={mockClient}>
        <Stack gap="sm" style={{ height: '100%' }}>
          <Text size="sm">
            Drag the panel by its header; double-click to minimize. Drag the corner handle to resize
            it. Ask more than once — every exchange stays in the scrollable history. Drag the
            &ldquo;Sign-in flow&rdquo; frame and its notes move with it. Select the frame and ask
            about it for group-aware context.
          </Text>
          <Canvas
            defaultScene={board}
            aiPrompt
            aiPromptFloating
            defaultSelectedIds={['f1']}
            aria-label="Workspace"
          />
        </Stack>
      </AIProvider>
    </ToastProvider>
  ),
};

/**
 * `chatContext` folds arbitrary consumer data into every floating-chat
 * prompt alongside the current selection — anything the host app wants the
 * model to see that isn't canvas block data. Here it's the signed-in user
 * and the workspace's plan; a real app might send its own app-level state,
 * a page's metadata, or anything else it owns.
 */
export const AIPromptFloatingWithContext: Story = {
  render: () => (
    <ToastProvider>
      <AIProvider client={mockClient}>
        <Stack gap="sm" style={{ height: '100%' }}>
          <Text size="sm">
            Every prompt also carries <code>chatContext</code> — the user and plan below — folded in
            alongside the selection.
          </Text>
          <Canvas
            defaultScene={board}
            aiPrompt
            aiPromptFloating
            chatContext={{ user: { name: 'Priya', role: 'admin' }, plan: 'pro' }}
            aria-label="Workspace"
          />
        </Stack>
      </AIProvider>
    </ToastProvider>
  ),
};

/** A pile of raw research notes — the state affinity mapping exists for. */
const researchNotes: CanvasScene = {
  blocks: [
    'Users bounce after SSO',
    'Signup form feels slow',
    'Confusing verification email',
    'Add a retry banner',
    'Write a plain-language error',
    'Check the audit log first',
    'Billing page drops the discount',
    'Should we ship without SSO?',
  ].map((text, index) => ({
    id: `r${index + 1}`,
    kind: 'sticky' as const,
    text,
    x: (index % 4) * 190,
    y: Math.floor(index / 4) * 150,
    width: 170,
    height: 130,
  })),
  connectors: [],
};

/**
 * Affinity mapping: press **Group by theme** and the notes are read, grouped,
 * and each group framed.
 *
 * The split that makes this work is that the model is asked only *which notes
 * belong together* — never where to put them. Placement is
 * `clusterCommands`, which is pure, deterministic and lays out a grid clear of
 * whatever isn't moving. A model asked for coordinates returns overlapping
 * boxes; a model asked for themes is doing the part it's actually good at.
 *
 * It always stages, never auto-applies: this rearranges work the user
 * arranged themselves. Select two or more notes first to group only those.
 */
export const AICluster: Story = {
  render: () => (
    <AIProvider client={mockClient}>
      <Stack gap="sm" style={{ height: '100%' }}>
        <Text size="sm">
          Press <strong>Group by theme</strong>, review the proposed frames, then apply.
        </Text>
        <Canvas defaultScene={researchNotes} aiCluster aria-label="Research notes" />
      </Stack>
    </AIProvider>
  ),
};

/**
 * Diagram generation. Describe a flow — try **the sign-in flow** or **the
 * release pipeline** — and it's drawn as shapes and connectors.
 *
 * The model returns a **graph**: nodes with a `role` (start, decision,
 * process…) and edges between them, and no coordinates at all. Everything
 * spatial is `canvasDiagram.ts` — longest-path ranking, ranks centred against
 * the widest, orthogonal edges, the whole thing placed clear of existing
 * content. That's why the sign-in flow's loop back to "Token valid?" doesn't
 * wreck the layout: a cycle simply ranks as a chain.
 *
 * Unlike clustering, it **applies straight away with an undo toast**. A
 * diagram adds content and touches none, so there's nothing to review — and
 * approving twelve "Add shape" lines is a worse way to judge a drawing than
 * looking at it.
 *
 * Ask for something with no steps and it declines instead of drawing.
 */
export const AIDiagram: Story = {
  render: () => (
    <ToastProvider>
      <AIProvider client={mockClient}>
        <Stack gap="sm" style={{ height: '100%' }}>
          <Text size="sm">
            Try: <strong>the sign-in flow</strong> · <strong>the release pipeline</strong> ·{' '}
            <strong>the colour blue</strong>
          </Text>
          <Canvas aiDiagram aria-label="Workspace" />
        </Stack>
      </AIProvider>
    </ToastProvider>
  ),
};

/**
 * The load-bearing rule made visible: `aiPrompt`, `aiRewrite`, `aiCluster` and
 * `aiDiagram` are all set, but no `AIProvider` is mounted — so this renders markup
 * byte-identical to `Default`. Inert, not broken.
 */
export const AIWithoutProvider: Story = {
  args: {
    defaultScene: board,
    aiPrompt: true,
    aiRewrite: true,
    aiCluster: true,
    aiDiagram: true,
    'aria-label': 'Workspace',
  },
};

/**
 * `resolveCommands` replaces the text round-trip entirely — where a real app
 * calls its own tool-calling endpoint. It enables the prompt bar on its own,
 * with no `AIProvider`, and its commands are validated just the same, so the
 * bad id below is reported rather than applied.
 */
export const CustomResolver: Story = {
  render: () => (
    <Canvas
      defaultScene={board}
      aiPrompt
      aria-label="Workspace"
      resolveCommands={async ({ prompt, snapshot }) => ({
        commands: [
          {
            op: 'create',
            block: {
              id: `local-${Date.now()}`,
              kind: 'sticky',
              text: `Resolved locally from ${snapshot.blocks.length} blocks`,
              x: 640,
              y: 60,
              width: 180,
              height: 140,
            },
          },
          { op: 'move', id: 'not-a-real-block', x: 0, y: 0 },
        ],
        message: `No model involved. You asked: “${prompt}”.`,
      })}
    />
  ),
};
