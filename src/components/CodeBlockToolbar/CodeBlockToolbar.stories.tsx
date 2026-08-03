import type { Meta, StoryObj } from '@storybook/react';
import { CodeBlockToolbar } from './CodeBlockToolbar';
import { Code } from '../Code/Code';

const meta: Meta<typeof CodeBlockToolbar> = {
  title: 'AI Chat/CodeBlockToolbar',
  component: CodeBlockToolbar,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CodeBlockToolbar>;

export const Default: Story = {
  args: {
    label: 'TypeScript',
    onCopy: () => alert('Copied'),
    onDownload: () => alert('Downloading'),
    onRun: () => alert('Running'),
  },
};

export const WithExpandToggle: Story = {
  args: {
    label: 'TypeScript',
    onCopy: () => {},
    defaultExpanded: false,
    onExpandedChange: () => {},
  },
};

export const AboveACodeBlock: Story = {
  render: () => (
    <div>
      <CodeBlockToolbar label="TypeScript" onCopy={() => {}} onDownload={() => {}} />
      <Code block>{'function add(a: number, b: number): number {\n  return a + b;\n}'}</Code>
    </div>
  ),
};
