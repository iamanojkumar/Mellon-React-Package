import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { RichTextEditor } from './RichTextEditor';
import { AIProvider } from '../../providers/AIProvider';
import type { AIClient } from '../../contexts/AIContext';

const meta: Meta<typeof RichTextEditor> = {
  title: 'Inputs/RichTextEditor',
  component: RichTextEditor,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof RichTextEditor>;

export const Default: Story = {
  args: {
    'aria-label': 'Notes',
    placeholder: 'Write something…',
  },
};

export const WithContent: Story = {
  args: {
    'aria-label': 'Notes',
    defaultValue:
      '<p>Some <b>bold</b>, some <i>italic</i>, and a list:</p><ul><li>One</li><li>Two</li></ul>',
  },
};

export const Invalid: Story = {
  args: {
    'aria-label': 'Notes',
    defaultValue: '<p>Too short</p>',
    invalid: true,
  },
};

export const Disabled: Story = {
  args: {
    'aria-label': 'Notes',
    defaultValue: '<p>Can’t edit this</p>',
    disabled: true,
  },
};

export const ReadOnly: Story = {
  args: {
    'aria-label': 'Notes',
    defaultValue: '<p>Read-only content — toolbar is disabled, text is still selectable.</p>',
    readOnly: true,
  },
};

/** Select some text, then use the toolbar's Link button to attach a URL to it. */
export const InsertingALink: Story = {
  args: {
    'aria-label': 'Notes',
    defaultValue: '<p>Select this text, then click the link button.</p>',
  },
};

export const Controlled: Story = {
  render: (args) => {
    function ControlledEditor() {
      const [value, setValue] = useState('<p>Controlled from the outside.</p>');
      return <RichTextEditor {...args} value={value} onChange={setValue} />;
    }
    return <ControlledEditor />;
  },
  args: {
    'aria-label': 'Notes',
  },
};

const mockAIClient: AIClient = {
  complete: async ({ prompt }) => {
    const html = prompt.slice(prompt.lastIndexOf('\n') + 1);
    return html.replace(/>([^<]+)</g, (_match, text: string) => `>${text.trim()}, rewritten.<`);
  },
};

/**
 * `aiRewrite` is a no-op without an ancestor `AIProvider` — this story
 * wraps a deterministic mock client so the "Rewrite with AI" trigger
 * actually appears. It sits at the end of the toolbar row rather than
 * floating over the text: the editor already owns a control strip, and an
 * overlaid trigger would have to permanently indent the writing surface.
 * The suggestion is applied as HTML, so formatting survives the rewrite.
 */
export const WithAIRewrite: Story = {
  decorators: [
    (Story) => (
      <AIProvider client={mockAIClient}>
        <Story />
      </AIProvider>
    ),
  ],
  args: {
    'aria-label': 'Accomplishments',
    defaultValue: '<p>Led the <b>migration</b> and shipped it early.</p>',
    aiRewrite: true,
  },
};
