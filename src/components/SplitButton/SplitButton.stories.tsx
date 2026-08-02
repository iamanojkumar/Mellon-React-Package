import type { Meta, StoryObj } from '@storybook/react';
import { SplitButton } from './SplitButton';
import { Dropdown } from '../Dropdown/Dropdown';

const meta: Meta<typeof SplitButton> = {
  title: 'Buttons/SplitButton',
  component: SplitButton,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SplitButton>;

export const Default: Story = {
  render: () => (
    <SplitButton
      groupLabel="Save actions"
      onClick={() => console.log('Save clicked')}
      menu={
        <>
          <Dropdown.Item onSelect={() => console.log('Save as...')}>Save as...</Dropdown.Item>
          <Dropdown.Item onSelect={() => console.log('Save and close')}>
            Save and close
          </Dropdown.Item>
        </>
      }
    >
      Save
    </SplitButton>
  ),
};

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--ds-space-md)' }}>
      <SplitButton variant="primary" menu={<Dropdown.Item>Option</Dropdown.Item>}>
        Primary
      </SplitButton>
      <SplitButton variant="secondary" menu={<Dropdown.Item>Option</Dropdown.Item>}>
        Secondary
      </SplitButton>
      <SplitButton variant="danger" menu={<Dropdown.Item>Option</Dropdown.Item>}>
        Delete
      </SplitButton>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <SplitButton disabled menu={<Dropdown.Item>Option</Dropdown.Item>}>
      Save
    </SplitButton>
  ),
};

export const Loading: Story = {
  render: () => (
    <SplitButton loading menu={<Dropdown.Item>Option</Dropdown.Item>}>
      Saving...
    </SplitButton>
  ),
};
