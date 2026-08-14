import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { RichTextEditor } from './RichTextEditor';

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
