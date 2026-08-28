import type { Meta, StoryObj } from '@storybook/react';
import { DocumentPage } from './DocumentPage';

const meta: Meta<typeof DocumentPage> = {
  title: 'Canvas/DocumentPage',
  component: DocumentPage,
  decorators: [
    (Story) => (
      <div style={{ width: '20rem', padding: 'var(--ds-space-md)' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DocumentPage>;

/** One page's surface — a fixed-aspect-ratio sheet reusing `Card`'s box. */
export const Default: Story = {
  render: () => (
    <DocumentPage>
      <DocumentPage.Header>
        <strong>Ada Lovelace</strong>
      </DocumentPage.Header>
      <DocumentPage.Body>
        <p>Mathematician and writer, known for her work on the Analytical Engine.</p>
      </DocumentPage.Body>
      <DocumentPage.Footer>Page 1</DocumentPage.Footer>
    </DocumentPage>
  ),
};

/** Named presets plus a custom `{width, height}` ratio — the same shape `Document`'s own `aspectRatio` prop uses. */
export const AspectRatios: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      {(['a4', '16:9', '4:3'] as const).map((ratio) => (
        <div key={ratio} style={{ width: '10rem' }}>
          <DocumentPage aspectRatio={ratio}>
            <DocumentPage.Body>{ratio}</DocumentPage.Body>
          </DocumentPage>
        </div>
      ))}
    </div>
  ),
};

/** `layout="two-column"`/`"sidebar"` wrap the body in a `Grid`; `"single"` (default) stays plain flow. */
export const Layouts: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16 }}>
      <div style={{ width: '10rem' }}>
        <DocumentPage>
          <DocumentPage.Body layout="two-column">
            <div>Left</div>
            <div>Right</div>
          </DocumentPage.Body>
        </DocumentPage>
      </div>
      <div style={{ width: '10rem' }}>
        <DocumentPage>
          <DocumentPage.Body layout="sidebar">
            <div>Photo</div>
            <div>Details</div>
          </DocumentPage.Body>
        </DocumentPage>
      </div>
    </div>
  ),
};
