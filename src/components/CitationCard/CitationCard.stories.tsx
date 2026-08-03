import type { Meta, StoryObj } from '@storybook/react';
import { CitationCard } from './CitationCard';
import { Inline } from '../Inline/Inline';

const meta: Meta<typeof CitationCard> = {
  title: 'AI Chat/CitationCard',
  component: CitationCard,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CitationCard>;

export const Default: Story = {
  args: {
    index: 1,
    title: 'Using CSS flexible boxes',
    href: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_flexible_box_layout/Basic_concepts_of_flexbox',
    source: 'developer.mozilla.org',
    snippet: 'Flexbox is a one-dimensional layout method for arranging items in rows or columns.',
  },
};

export const WithoutSnippet: Story = {
  args: {
    index: 2,
    title: 'CSS Grid vs Flexbox',
    href: 'https://css-tricks.com',
    source: 'css-tricks.com',
  },
};

export const NotALink: Story = {
  args: {
    title: 'Internal knowledge base article',
    source: 'Team wiki',
    snippet: 'This card has no href, so it renders as a plain, non-interactive div.',
  },
};

export const SourceList: Story = {
  render: () => (
    <Inline gap="sm" wrap>
      <CitationCard
        index={1}
        title="Using CSS flexible boxes"
        href="https://developer.mozilla.org"
        source="developer.mozilla.org"
      />
      <CitationCard
        index={2}
        title="A Complete Guide to Flexbox"
        href="https://css-tricks.com"
        source="css-tricks.com"
      />
    </Inline>
  ),
};
