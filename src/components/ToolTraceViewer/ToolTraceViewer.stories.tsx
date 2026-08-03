import type { Meta, StoryObj } from '@storybook/react';
import { ToolTraceViewer } from './ToolTraceViewer';

const meta: Meta<typeof ToolTraceViewer> = {
  title: 'AI Chat/ToolTraceViewer',
  component: ToolTraceViewer,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ToolTraceViewer>;

export const Default: Story = {
  args: {
    steps: [
      { id: '1', label: 'Searching the web…', status: 'done', detail: 'flexbox centering' },
      { id: '2', label: 'Reading 3 pages…', status: 'done' },
      { id: '3', label: 'Drafting a response', status: 'done' },
    ],
  },
};

export const InProgress: Story = {
  args: {
    steps: [
      { id: '1', label: 'Searching the web…', status: 'done', detail: 'flexbox centering' },
      { id: '2', label: 'Reading 3 pages…', status: 'active' },
      { id: '3', label: 'Drafting a response', status: 'pending' },
    ],
  },
};

export const WithAnError: Story = {
  args: {
    steps: [
      { id: '1', label: 'Searching the web…', status: 'done' },
      { id: '2', label: 'Reading page 2 of 3', status: 'error', detail: 'Request timed out' },
      { id: '3', label: 'Drafting a response', status: 'pending' },
    ],
  },
};
