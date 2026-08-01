import type { Meta, StoryObj } from '@storybook/react';
import { Tabs } from './Tabs';
import { Text } from '../Text/Text';

const meta: Meta<typeof Tabs> = {
  title: 'Navigation/Tabs',
  component: Tabs,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="account">
      <Tabs.List>
        <Tabs.Tab value="account">Account</Tabs.Tab>
        <Tabs.Tab value="billing">Billing</Tabs.Tab>
        <Tabs.Tab value="notifications">Notifications</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="account">
        <Text>Account settings go here.</Text>
      </Tabs.Panel>
      <Tabs.Panel value="billing">
        <Text>Billing details go here.</Text>
      </Tabs.Panel>
      <Tabs.Panel value="notifications">
        <Text>Notification preferences go here.</Text>
      </Tabs.Panel>
    </Tabs>
  ),
};

export const WithDisabledTab: Story = {
  render: () => (
    <Tabs defaultValue="account">
      <Tabs.List>
        <Tabs.Tab value="account">Account</Tabs.Tab>
        <Tabs.Tab value="billing" disabled>
          Billing (disabled)
        </Tabs.Tab>
        <Tabs.Tab value="notifications">Notifications</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="account">
        <Text>Account settings go here.</Text>
      </Tabs.Panel>
      <Tabs.Panel value="billing">
        <Text>Billing details go here.</Text>
      </Tabs.Panel>
      <Tabs.Panel value="notifications">
        <Text>Notification preferences go here.</Text>
      </Tabs.Panel>
    </Tabs>
  ),
};

/**
 * Click a tab to focus it, then use ArrowLeft/ArrowRight to move between
 * tabs (selection follows focus), or Home/End to jump to the first/last.
 */
export const KeyboardNavigation: Story = {
  render: () => (
    <Tabs defaultValue="one">
      <Tabs.List>
        <Tabs.Tab value="one">One</Tabs.Tab>
        <Tabs.Tab value="two">Two</Tabs.Tab>
        <Tabs.Tab value="three">Three</Tabs.Tab>
        <Tabs.Tab value="four">Four</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="one">
        <Text>Content one</Text>
      </Tabs.Panel>
      <Tabs.Panel value="two">
        <Text>Content two</Text>
      </Tabs.Panel>
      <Tabs.Panel value="three">
        <Text>Content three</Text>
      </Tabs.Panel>
      <Tabs.Panel value="four">
        <Text>Content four</Text>
      </Tabs.Panel>
    </Tabs>
  ),
};
