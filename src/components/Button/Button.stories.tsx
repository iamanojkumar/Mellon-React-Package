import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';
import { Flex } from '../Flex/Flex';
import type { ButtonSize, ButtonVariant } from './Button';

const VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'ghost', 'danger'];
const SIZES: ButtonSize[] = ['sm', 'md', 'lg'];

const meta: Meta<typeof Button> = {
  title: 'Buttons/Button',
  component: Button,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: {
    children: 'Button',
  },
};

export const Variants: Story = {
  render: () => (
    <Flex gap="sm">
      {VARIANTS.map((variant) => (
        <Button key={variant} variant={variant}>
          {variant}
        </Button>
      ))}
    </Flex>
  ),
};

export const Sizes: Story = {
  render: () => (
    <Flex gap="sm" align="center">
      {SIZES.map((size) => (
        <Button key={size} size={size}>
          {size}
        </Button>
      ))}
    </Flex>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Flex gap="sm">
      {VARIANTS.map((variant) => (
        <Button key={variant} variant={variant} disabled>
          {variant}
        </Button>
      ))}
    </Flex>
  ),
};

export const Loading: Story = {
  render: () => (
    <Flex gap="sm">
      {VARIANTS.map((variant) => (
        <Button key={variant} variant={variant} loading>
          Saving
        </Button>
      ))}
    </Flex>
  ),
};

export const AsLink: Story = {
  render: () => (
    <Button as="a" href="#" variant="secondary">
      An anchor styled as a button
    </Button>
  ),
};
