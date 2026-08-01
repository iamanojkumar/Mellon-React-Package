import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { FocusTrap } from './FocusTrap';
import { Button } from '../Button/Button';
import { Stack } from '../Stack/Stack';
import { Text } from '../Text/Text';

const meta: Meta<typeof FocusTrap> = {
  title: 'Utilities/FocusTrap',
  component: FocusTrap,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof FocusTrap>;

export const KeyboardNavigation: Story = {
  render: () => {
    function Demo() {
      const [active, setActive] = useState(false);
      return (
        <Stack gap="sm" style={{ maxWidth: 320 }}>
          <Button onClick={() => setActive((a) => !a)}>
            {active ? 'Deactivate' : 'Activate'} trap
          </Button>
          <Text size="sm" color="secondary">
            Tab through the buttons below — focus wraps between them while active, and clicking
            outside pulls focus back in.
          </Text>
          <FocusTrap active={active}>
            <Stack gap="xs" p="sm" style={{ border: '1px dashed var(--ds-color-border-primary)' }}>
              <Button variant="secondary">First</Button>
              <Button variant="secondary">Second</Button>
              <Button variant="secondary">Last</Button>
            </Stack>
          </FocusTrap>
        </Stack>
      );
    }
    return <Demo />;
  },
};
