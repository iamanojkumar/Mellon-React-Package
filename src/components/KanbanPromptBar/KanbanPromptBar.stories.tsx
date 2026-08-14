import type { Meta, StoryObj } from '@storybook/react';
import { KanbanPromptBar } from './KanbanPromptBar';

const meta: Meta<typeof KanbanPromptBar> = {
  title: 'Board/KanbanPromptBar',
  component: KanbanPromptBar,
  args: {
    cards: [
      { id: 'c1', title: 'Audit chart tokens' },
      { id: 'c2', title: 'Fix login redirect' },
      { id: 'c3', title: 'Ship release 0.2' },
    ],
    onSubmit: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof KanbanPromptBar>;

export const Default: Story = {};

/** Type `@` to reference a card. The pick resolves to a card id before the prompt is sent. */
export const CardReference: Story = {};

export const Busy: Story = { args: { status: 'loading' } };

export const WithError: Story = { args: { error: 'The model could not be reached.' } };

export const Disabled: Story = { args: { disabled: true } };
