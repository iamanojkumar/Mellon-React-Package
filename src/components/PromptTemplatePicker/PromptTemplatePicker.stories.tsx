import type { Meta, StoryObj } from '@storybook/react';
import { PromptTemplatePicker } from './PromptTemplatePicker';
import type { PromptTemplate } from './PromptTemplatePicker';

const meta: Meta<typeof PromptTemplatePicker> = {
  title: 'AI Chat/PromptTemplatePicker',
  component: PromptTemplatePicker,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof PromptTemplatePicker>;

const TEMPLATES: PromptTemplate[] = [
  {
    id: '1',
    title: 'Summarize',
    description: 'Summarize the conversation so far',
    content: 'Summarize the above conversation in 3 bullet points.',
  },
  {
    id: '2',
    title: 'Translate to French',
    description: 'Translate the last message',
    content: 'Translate the above message into French.',
  },
  {
    id: '3',
    title: 'Code review',
    description: 'Review the last code block for bugs',
    content: 'Review the above code for correctness, style, and potential bugs.',
  },
];

export const Default: Story = {
  args: {
    templates: TEMPLATES,
    onSelect: (template) => alert(`Inserted: ${template.content}`),
  },
};

export const Empty: Story = {
  args: {
    templates: [],
    onSelect: () => {},
  },
};

export const CustomTriggerLabel: Story = {
  args: {
    templates: TEMPLATES,
    onSelect: () => {},
    triggerLabel: 'Prompts',
  },
};
