import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Document } from './Document';
import { Text } from '../Text/Text';
import { Stack } from '../Stack/Stack';

const meta: Meta<typeof Document> = {
  title: 'Canvas/Document',
  component: Document,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div style={{ height: '36rem', padding: 'var(--ds-space-md)' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Document>;

const resume = [
  '<p>Mathematician and writer, best known for her work on Charles Babbage’s proposed mechanical general-purpose computer, the Analytical Engine.</p>',
];

/**
 * Standalone use — no canvas involved. `chrome` (default `true`) renders the
 * list/grid toggle and zoom controls; Ctrl/Cmd+wheel also zooms.
 */
export const Standalone: Story = {
  args: {
    defaultPages: resume,
    header: <strong>Ada Lovelace</strong>,
    footer: <span>Page — confidential</span>,
    'aria-label': 'Resume',
  },
};

/**
 * Read-only by default; `editable` mounts a `RichTextEditor` per page.
 * Supplying `defaultHeaderValue`/`defaultFooterValue` (or the controlled
 * `headerValue`/`footerValue` + `onHeaderChange`/`onFooterChange`) makes the
 * header and footer real editable surfaces too — the whole page is one
 * continuous editable document, not just its body. A single formatting
 * toolbar (bold/italic/underline/lists/link, plus a paragraph-style picker —
 * headings 1–6, body, caption, quote, note) sits above the page and acts on
 * whichever of the header/body/footer was last focused, rather than each
 * region owning its own toolbar.
 */
export const Editable: Story = {
  render: () => (
    <Stack gap="sm" style={{ height: '100%' }}>
      <Text size="sm">
        Type enough into the last page to fill it — a new blank page is added automatically, and
        focus follows it. The header is editable too, and the paragraph-style picker applies to
        whichever of the header/body you clicked into last.
      </Text>
      <Document
        defaultPages={['<p>Start typing…</p>']}
        defaultHeaderValue="Untitled note"
        editable
        aria-label="Note"
      />
    </Stack>
  ),
};

/** `layout="sidebar"` and `"two-column"` arrange each page's body in a `Grid` — a small, resume-shaped starting point rather than a freeform section builder. */
export const SidebarLayout: Story = {
  args: {
    defaultPages: [
      '<div><h3>About</h3><p>Builder, seeks efficient tools.</p></div><div><h3>Goals</h3><p>Ship faster, hire well.</p></div>',
    ],
    layout: 'sidebar',
    header: <strong>Persona</strong>,
    'aria-label': 'Persona',
  },
};

/** Arrow keys move between pages once the viewport (or a page) has focus — not while typing inside one. */
export const MultiplePages: Story = {
  args: {
    defaultPages: ['<p>Page one.</p>', '<p>Page two.</p>', '<p>Page three.</p>'],
    'aria-label': 'Report',
  },
};

/**
 * `name` is the document's own identity (a file name), supplied by the
 * consumer rather than typed in — a small tab-style label above the page's
 * top-left corner, separate from in-page content. Double-clicking it swaps in
 * a text input, since `onNameChange` is supplied here. Any `h1`–`h6` found
 * across `pages` shows up in the table-of-contents panel to the left, toggled
 * by the icon at the start of the toolbar; clicking an entry jumps to its
 * page.
 */
function NamedWithTocDemo() {
  const [name, setName] = useState('Q3-roadmap.doc');
  return (
    <Document
      name={name}
      onNameChange={setName}
      defaultPages={[
        '<h1>Q3 Roadmap</h1><p>Overview of the quarter.</p><h2>Goals</h2><p>Ship faster, hire well.</p>',
        '<h2>Risks</h2><p>Staffing and scope.</p><h3>Mitigation</h3><p>Weekly check-ins.</p>',
      ]}
      aria-label="Q3 Roadmap"
    />
  );
}

export const NamedWithToc: Story = {
  render: () => <NamedWithTocDemo />,
};

/**
 * `aspectRatio` takes the named presets or a custom `{width, height}` ratio —
 * the same "preset union + escape hatch" shape used throughout this library.
 */
function AspectRatioDemo() {
  const [ratio, setRatio] = useState<'a4' | '16:9' | '4:3'>('a4');
  return (
    <Stack gap="sm" style={{ height: '100%' }}>
      <div role="radiogroup" aria-label="Aspect ratio" style={{ display: 'flex', gap: 8 }}>
        {(['a4', '16:9', '4:3'] as const).map((preset) => (
          <label key={preset} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <input
              type="radio"
              name="aspect-ratio"
              checked={ratio === preset}
              onChange={() => setRatio(preset)}
            />
            {preset}
          </label>
        ))}
      </div>
      <Document defaultPages={['<p>Content</p>']} aspectRatio={ratio} aria-label="Preview" />
    </Stack>
  );
}

export const AspectRatios: Story = {
  render: () => <AspectRatioDemo />,
};

/** `chrome={false}` — no view/zoom controls, just the active page. This is how `Canvas` embeds it inside a `document` block. */
export const NoChrome: Story = {
  args: {
    defaultPages: resume,
    header: <strong>Ada Lovelace</strong>,
    chrome: false,
    'aria-label': 'Resume',
  },
};
