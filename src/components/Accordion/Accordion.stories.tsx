import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Accordion } from './Accordion';
import { Text } from '../Text/Text';
import { Button } from '../Button/Button';

const meta: Meta<typeof Accordion> = {
  title: 'Data Display/Accordion',
  component: Accordion,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Accordion>;

export const Default: Story = {
  render: () => (
    <Accordion defaultValue="shipping">
      <Accordion.Item value="shipping">
        <Accordion.Trigger>What are your shipping options?</Accordion.Trigger>
        <Accordion.Content>
          <Text>
            We offer standard (5-7 days), express (2-3 days), and overnight shipping at checkout.
          </Text>
        </Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="returns">
        <Accordion.Trigger>What is your return policy?</Accordion.Trigger>
        <Accordion.Content>
          <Text>Unused items can be returned within 30 days of delivery for a full refund.</Text>
        </Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="warranty">
        <Accordion.Trigger>Is there a warranty?</Accordion.Trigger>
        <Accordion.Content>
          <Text>All products include a 1-year limited manufacturer warranty.</Text>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion>
  ),
};

/** `type="multiple"` lets more than one section stay open at once. */
export const Multiple: Story = {
  render: () => (
    <Accordion type="multiple" defaultValues={['shipping', 'warranty']}>
      <Accordion.Item value="shipping">
        <Accordion.Trigger>Shipping</Accordion.Trigger>
        <Accordion.Content>
          <Text>Standard, express, and overnight options are available.</Text>
        </Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="returns">
        <Accordion.Trigger>Returns</Accordion.Trigger>
        <Accordion.Content>
          <Text>30-day return window on unused items.</Text>
        </Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="warranty">
        <Accordion.Trigger>Warranty</Accordion.Trigger>
        <Accordion.Content>
          <Text>1-year limited manufacturer warranty included.</Text>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Accordion defaultValue="one">
      <Accordion.Item value="one">
        <Accordion.Trigger>Available section</Accordion.Trigger>
        <Accordion.Content>
          <Text>This section can be toggled normally.</Text>
        </Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="two" disabled>
        <Accordion.Trigger>Disabled section</Accordion.Trigger>
        <Accordion.Content>
          <Text>This content is unreachable while the item is disabled.</Text>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion>
  ),
};

export const Responsive: Story = {
  render: () => (
    <div style={{ maxWidth: 480, width: '100%' }}>
      <Accordion defaultValue="one">
        <Accordion.Item value="one">
          <Accordion.Trigger>Narrow-container section</Accordion.Trigger>
          <Accordion.Content>
            <Text>
              The trigger and content both flex to the width of their container at any viewport
              size.
            </Text>
          </Accordion.Content>
        </Accordion.Item>
        <Accordion.Item value="two">
          <Accordion.Trigger>Another section</Accordion.Trigger>
          <Accordion.Content>
            <Text>No fixed widths anywhere in the implementation.</Text>
          </Accordion.Content>
        </Accordion.Item>
      </Accordion>
    </div>
  ),
};

/**
 * Tab to a trigger, then use ArrowUp/ArrowDown to move between triggers
 * (moving focus does not open/close), or Home/End to jump to the first/
 * last enabled trigger. Enter or Space toggles the focused trigger.
 */
export const KeyboardNavigation: Story = {
  render: () => (
    <Accordion>
      <Accordion.Item value="one">
        <Accordion.Trigger>One</Accordion.Trigger>
        <Accordion.Content>
          <Text>Content one</Text>
        </Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="two">
        <Accordion.Trigger>Two</Accordion.Trigger>
        <Accordion.Content>
          <Text>Content two</Text>
        </Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="three">
        <Accordion.Trigger>Three</Accordion.Trigger>
        <Accordion.Content>
          <Text>Content three</Text>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion>
  ),
};

export const Accessibility: Story = {
  render: () => (
    <Accordion defaultValue="one">
      <Accordion.Item value="one">
        <Accordion.Trigger>Accessible section</Accordion.Trigger>
        <Accordion.Content>
          <Text>
            Each trigger is a real button with aria-expanded/aria-controls, wrapped in an h3 so
            screen readers can jump between sections via heading navigation. Each panel is a
            labelled region.
          </Text>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion>
  ),
};

export const Controlled: Story = {
  render: function ControlledAccordion() {
    const [value, setValue] = useState<string | undefined>('one');
    return (
      <>
        <Button size="sm" onClick={() => setValue(value ? undefined : 'one')}>
          {value ? 'Collapse from outside' : 'Expand from outside'}
        </Button>
        <Accordion value={value} onValueChange={setValue}>
          <Accordion.Item value="one">
            <Accordion.Trigger>Controlled section</Accordion.Trigger>
            <Accordion.Content>
              <Text>Open state is driven by the button above as well as this trigger.</Text>
            </Accordion.Content>
          </Accordion.Item>
          <Accordion.Item value="two">
            <Accordion.Trigger>Another section</Accordion.Trigger>
            <Accordion.Content>
              <Text>Selecting this closes &ldquo;Controlled section&rdquo; (single type).</Text>
            </Accordion.Content>
          </Accordion.Item>
        </Accordion>
      </>
    );
  },
};

export const Uncontrolled: Story = {
  render: () => (
    <Accordion defaultValue="two">
      <Accordion.Item value="one">
        <Accordion.Trigger>One</Accordion.Trigger>
        <Accordion.Content>
          <Text>Content one</Text>
        </Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="two">
        <Accordion.Trigger>Two (open by default)</Accordion.Trigger>
        <Accordion.Content>
          <Text>Content two — this component manages its own open state.</Text>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion>
  ),
};
