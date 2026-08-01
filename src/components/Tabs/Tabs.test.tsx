import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Tabs } from './Tabs';

function BasicTabs(props: { onValueChange?: (value: string) => void }) {
  return (
    <Tabs defaultValue="one" onValueChange={props.onValueChange}>
      <Tabs.List>
        <Tabs.Tab value="one">One</Tabs.Tab>
        <Tabs.Tab value="two">Two</Tabs.Tab>
        <Tabs.Tab value="three" disabled>
          Three
        </Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="one">Content one</Tabs.Panel>
      <Tabs.Panel value="two">Content two</Tabs.Panel>
      <Tabs.Panel value="three">Content three</Tabs.Panel>
    </Tabs>
  );
}

describe('Tabs', () => {
  it('selects defaultValue initially and shows only its panel', () => {
    render(<BasicTabs />);
    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Content one')).toBeVisible();
    expect(screen.getByText('Content two')).not.toBeVisible();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<BasicTabs />);
    await expectNoA11yViolations(container);
  });

  it('selects a tab on click and shows its panel', async () => {
    const user = userEvent.setup();
    render(<BasicTabs />);
    await user.click(screen.getByRole('tab', { name: 'Two' }));
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByText('Content two')).toBeVisible();
    expect(screen.getByText('Content one')).not.toBeVisible();
  });

  it('calls onValueChange when the selection changes', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<BasicTabs onValueChange={onValueChange} />);
    await user.click(screen.getByRole('tab', { name: 'Two' }));
    expect(onValueChange).toHaveBeenCalledWith('two');
  });

  it('moves focus and selection with ArrowRight/ArrowLeft, skipping disabled tabs', async () => {
    const user = userEvent.setup();
    render(<BasicTabs />);
    screen.getByRole('tab', { name: 'One' }).focus();

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute('aria-selected', 'true');

    // "Three" is disabled and excluded from the query, so ArrowRight wraps to "One"
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'One' })).toHaveFocus();

    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveFocus();
  });

  it('moves to the first/last tab with Home/End', async () => {
    const user = userEvent.setup();
    render(<BasicTabs />);
    screen.getByRole('tab', { name: 'One' }).focus();

    await user.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveFocus(); // last non-disabled tab

    await user.keyboard('{Home}');
    expect(screen.getByRole('tab', { name: 'One' })).toHaveFocus();
  });

  it('uses roving tabIndex so only the selected tab is in the tab order', () => {
    render(<BasicTabs />);
    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('tabIndex', '0');
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute('tabIndex', '-1');
  });

  it('throws when a Tabs part is used outside <Tabs>', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Tabs.List>content</Tabs.List>)).toThrow(
      '<Tabs.List> must be used within <Tabs>',
    );
    consoleError.mockRestore();
  });
});
