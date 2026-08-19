import type { Meta, StoryObj } from '@storybook/react';
import { AudioWaveTranscriptionIcon, DownloadFolderIcon } from '@mellon-design/icons';
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

function PlusIcon() {
  return (
    <svg width="1em" height="1em" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export const WithIcon: Story = {
  render: () => (
    <Flex gap="sm">
      <Button icon={<PlusIcon />}>Leading icon</Button>
      <Button icon={<PlusIcon />} iconPosition="end">
        Trailing icon
      </Button>
      <Button icon={<PlusIcon />} loading>
        Loading (icon hidden)
      </Button>
    </Flex>
  ),
};

/** Icons sourced from the `@mellon-design/icons` package — verifies the package renders correctly through `Button`'s `icon` prop. */
export const FromMellonIconsPackage: Story = {
  render: () => (
    <Flex gap="sm">
      <Button icon={<AudioWaveTranscriptionIcon />} variant="secondary">
        Extract script
      </Button>
      <Button icon={<DownloadFolderIcon />} variant="secondary">
        Choose output folder
      </Button>
    </Flex>
  ),
};
