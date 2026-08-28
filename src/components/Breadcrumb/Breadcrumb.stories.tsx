import type { Meta, StoryObj } from '@storybook/react';
import { Breadcrumb } from './Breadcrumb';

const meta: Meta<typeof Breadcrumb> = {
  title: 'Navigation/Breadcrumb',
  component: Breadcrumb,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Breadcrumb>;

export const Default: Story = {
  render: () => (
    <Breadcrumb>
      <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
      <Breadcrumb.Item href="/products">Products</Breadcrumb.Item>
      <Breadcrumb.Item href="/products/widgets">Widgets</Breadcrumb.Item>
      <Breadcrumb.Item current>Blue Widget</Breadcrumb.Item>
    </Breadcrumb>
  ),
};

export const CustomSeparator: Story = {
  render: () => (
    <Breadcrumb separator=">">
      <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
      <Breadcrumb.Item href="/settings">Settings</Breadcrumb.Item>
      <Breadcrumb.Item current>Profile</Breadcrumb.Item>
    </Breadcrumb>
  ),
};

export const TwoLevels: Story = {
  render: () => (
    <Breadcrumb>
      <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
      <Breadcrumb.Item current>Dashboard</Breadcrumb.Item>
    </Breadcrumb>
  ),
};

export const Responsive: Story = {
  render: () => (
    <div style={{ maxWidth: 260 }}>
      <Breadcrumb>
        <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
        <Breadcrumb.Item href="/a">Category</Breadcrumb.Item>
        <Breadcrumb.Item href="/a/b">Subcategory</Breadcrumb.Item>
        <Breadcrumb.Item current>Current Page With A Long Title</Breadcrumb.Item>
      </Breadcrumb>
    </div>
  ),
};

export const Accessibility: Story = {
  render: () => (
    <Breadcrumb>
      <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
      <Breadcrumb.Item current>Current page</Breadcrumb.Item>
    </Breadcrumb>
  ),
};

/**
 * A trail step that navigates through a router's own `navigate()` has no
 * `href`, so it renders as a real `<button>`. It must be indistinguishable
 * from the `<a>` items beside it — this story is the check, since jsdom
 * applies no stylesheet and a unit test can't see native button chrome
 * leaking through.
 */
export const AsButton: Story = {
  render: () => (
    <Breadcrumb>
      <Breadcrumb.Item as="button" type="button" onClick={() => {}}>
        Home
      </Breadcrumb.Item>
      <Breadcrumb.Item href="/products">Products</Breadcrumb.Item>
      <Breadcrumb.Item current>Blue Widget</Breadcrumb.Item>
    </Breadcrumb>
  ),
};
