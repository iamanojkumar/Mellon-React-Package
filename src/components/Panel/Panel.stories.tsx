import type { Meta, StoryObj } from '@storybook/react';
import { Panel } from './Panel';
import { Stack } from '../Stack/Stack';
import { Field } from '../Field/Field';
import { Select } from '../Select/Select';
import { NumberField } from '../NumberField/NumberField';
import { Button } from '../Button/Button';
import { Heading } from '../Heading/Heading';

const meta: Meta<typeof Panel> = {
  title: 'Data Display/Panel',
  component: Panel,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Panel>;

export const Default: Story = {
  render: () => (
    <Panel style={{ height: 320 }}>
      <Stack gap="sm">
        <Heading level={3} size="sm">
          Properties
        </Heading>
        <Field label="Font size">
          <NumberField defaultValue="16" />
        </Field>
      </Stack>
    </Panel>
  ),
};

/**
 * `header`/`footer` pin above and below a scrollable body — the property
 * panel this component exists for: select a block, see its font/size/color,
 * keep the panel open while clicking around the canvas beside it.
 */
export const WithHeaderAndFooter: Story = {
  render: () => (
    <Panel
      style={{ height: 420 }}
      header={
        <Heading level={3} size="sm">
          Text block
        </Heading>
      }
      footer={
        <Button variant="primary" size="sm">
          Apply
        </Button>
      }
    >
      <Stack gap="md">
        <Field label="Font family">
          <Select
            options={[
              { value: 'sans', label: 'Sans' },
              { value: 'serif', label: 'Serif' },
              { value: 'mono', label: 'Mono' },
            ]}
            defaultValue="sans"
          />
        </Field>
        <Field label="Font size">
          <NumberField defaultValue="16" min={8} max={96} />
        </Field>
      </Stack>
    </Panel>
  ),
};

/** `dock="start"` puts the border on the opposite edge — for a panel docked to the left of its content instead of the right. */
export const DockedStart: Story = {
  render: () => (
    <Panel dock="start" style={{ height: 320 }}>
      <Stack gap="sm">
        <Heading level={3} size="sm">
          Layers
        </Heading>
      </Stack>
    </Panel>
  ),
};

/**
 * The pattern this component targets: a panel docked beside a main work
 * surface, staying open while the user keeps interacting with it — unlike
 * `Drawer`, nothing here closes on an outside click.
 */
export const DockedBesideContent: Story = {
  render: () => (
    <div style={{ display: 'flex', height: 360 }}>
      <div
        style={{
          flex: '1 1 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--ds-color-surface-secondary)',
        }}
      >
        Main work surface
      </div>
      <Panel
        header={
          <Heading level={3} size="sm">
            Properties
          </Heading>
        }
      >
        <Stack gap="md">
          <Field label="Color">
            <Select
              options={[
                { value: 'brand', label: 'Brand' },
                { value: 'neutral', label: 'Neutral' },
              ]}
              defaultValue="brand"
            />
          </Field>
        </Stack>
      </Panel>
    </div>
  ),
};
