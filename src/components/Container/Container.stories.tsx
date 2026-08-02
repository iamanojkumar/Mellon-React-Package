import type { Meta, StoryObj } from '@storybook/react';
import { Container } from './Container';
import type { ContainerMaxWidth } from './Container';

const MAX_WIDTHS: ContainerMaxWidth[] = ['sm', 'md', 'lg', 'xl', 'full'];

const meta: Meta<typeof Container> = {
  title: 'Foundations/Container',
  component: Container,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Container>;

function Block() {
  return (
    <div
      style={{
        background: 'var(--ds-color-surface-secondary)',
        padding: 'var(--ds-space-md)',
      }}
    >
      Container content
    </div>
  );
}

export const Default: Story = {
  render: () => (
    <Container>
      <Block />
    </Container>
  ),
};

export const MaxWidths: Story = {
  render: () => (
    <>
      {MAX_WIDTHS.map((maxWidth) => (
        <Container
          key={maxWidth}
          maxWidth={maxWidth}
          style={{ marginBottom: 'var(--ds-space-sm)' }}
        >
          <div
            style={{
              background: 'var(--ds-color-surface-secondary)',
              padding: 'var(--ds-space-sm)',
            }}
          >
            maxWidth: {maxWidth}
          </div>
        </Container>
      ))}
    </>
  ),
};
