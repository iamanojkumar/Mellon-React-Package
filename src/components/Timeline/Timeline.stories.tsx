import type { Meta, StoryObj } from '@storybook/react';
import { Timeline } from './Timeline';
import { Text } from '../Text/Text';

const meta: Meta<typeof Timeline> = {
  title: 'Data Display/Timeline',
  component: Timeline,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Timeline>;

export const Default: Story = {
  render: () => (
    <Timeline>
      <Timeline.Item time="Jan 3, 2026 · 9:02 AM" title="Order placed" color="brand">
        <Text size="sm">Order #48213 was placed and payment was confirmed.</Text>
      </Timeline.Item>
      <Timeline.Item time="Jan 3, 2026 · 2:45 PM" title="Processing" color="neutral">
        <Text size="sm">Warehouse started picking and packing items.</Text>
      </Timeline.Item>
      <Timeline.Item time="Jan 4, 2026 · 8:15 AM" title="Shipped" color="warning">
        <Text size="sm">Carrier picked up the package.</Text>
      </Timeline.Item>
      <Timeline.Item time="Jan 6, 2026 · 11:30 AM" title="Delivered" color="success">
        <Text size="sm">Left at the front door.</Text>
      </Timeline.Item>
    </Timeline>
  ),
};

/** Each `Timeline.Item` variant, shown together — no fixed `variant` prop, just `color`. */
export const Variants: Story = {
  render: () => (
    <Timeline>
      <Timeline.Item title="Neutral" color="neutral">
        <Text size="sm">Default marker color.</Text>
      </Timeline.Item>
      <Timeline.Item title="Brand" color="brand">
        <Text size="sm">Highlighted step.</Text>
      </Timeline.Item>
      <Timeline.Item title="Success" color="success">
        <Text size="sm">Completed step.</Text>
      </Timeline.Item>
      <Timeline.Item title="Warning" color="warning">
        <Text size="sm">Needs attention.</Text>
      </Timeline.Item>
      <Timeline.Item title="Danger" color="danger">
        <Text size="sm">Failed step.</Text>
      </Timeline.Item>
    </Timeline>
  ),
};

/** `icon` replaces an item's dot with custom content. */
export const CustomIcons: Story = {
  render: () => (
    <Timeline>
      <Timeline.Item
        title="Order placed"
        color="brand"
        icon={
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path
              d="M2 6l2.5 2.5L10 3"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        }
      >
        <Text size="sm">Confirmed and paid.</Text>
      </Timeline.Item>
      <Timeline.Item
        title="Delivered"
        color="success"
        icon={
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path
              d="M2 6l2.5 2.5L10 3"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        }
      >
        <Text size="sm">Left at the front door.</Text>
      </Timeline.Item>
    </Timeline>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <Timeline orientation="horizontal">
      <Timeline.Item time="Step 1" title="Cart" color="success" />
      <Timeline.Item time="Step 2" title="Shipping" color="success" />
      <Timeline.Item time="Step 3" title="Payment" color="brand" />
      <Timeline.Item time="Step 4" title="Confirm" color="neutral" />
    </Timeline>
  ),
};

export const Responsive: Story = {
  render: () => (
    <div style={{ maxWidth: 320 }}>
      <Timeline>
        <Timeline.Item time="Jan 3" title="Order placed" color="brand">
          <Text size="sm">
            Long description text wraps naturally within the constrained content column instead of
            overflowing the marker column.
          </Text>
        </Timeline.Item>
        <Timeline.Item time="Jan 6" title="Delivered" color="success" />
      </Timeline>
    </div>
  ),
};

export const Accessibility: Story = {
  render: () => (
    <Timeline>
      <Timeline.Item time="Jan 3, 2026" title="Order placed" color="brand">
        <Text size="sm">
          Rendered as a native ordered list (`ol`/`li`) — no custom roles needed for a
          non-interactive, presentational sequence of events.
        </Text>
      </Timeline.Item>
      <Timeline.Item time="Jan 6, 2026" title="Delivered" color="success" />
    </Timeline>
  ),
};
