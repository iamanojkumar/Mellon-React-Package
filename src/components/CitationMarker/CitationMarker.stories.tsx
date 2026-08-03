import type { Meta, StoryObj } from '@storybook/react';
import { CitationMarker } from './CitationMarker';
import { Paragraph } from '../Paragraph/Paragraph';

const meta: Meta<typeof CitationMarker> = {
  title: 'AI Chat/CitationMarker',
  component: CitationMarker,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CitationMarker>;

export const Default: Story = {
  args: {
    index: 1,
  },
};

export const AsLink: Story = {
  args: {
    index: 1,
    href: '#source-1',
    label: 'Source 1: MDN Web Docs',
  },
};

export const AsButton: Story = {
  args: {
    index: 2,
    onClick: () => alert('Open citation detail'),
    label: 'Source 2: React documentation',
  },
};

export const InlineInText: Story = {
  render: () => (
    <Paragraph>
      Flexbox is the recommended way to center content <CitationMarker index={1} href="#source-1" />
      , and has broad browser support <CitationMarker index={2} href="#source-2" />.
    </Paragraph>
  ),
};
