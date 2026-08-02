import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Accordion } from './Accordion';

function BasicAccordion(props: {
  type?: 'single' | 'multiple';
  collapsible?: boolean;
  onValueChange?: (value: string | undefined) => void;
  onValuesChange?: (values: string[]) => void;
  defaultValue?: string;
  defaultValues?: string[];
}) {
  return (
    <Accordion
      type={props.type}
      collapsible={props.collapsible}
      defaultValue={props.defaultValue}
      defaultValues={props.defaultValues}
      onValueChange={props.onValueChange}
      onValuesChange={props.onValuesChange}
    >
      <Accordion.Item value="one">
        <Accordion.Trigger>One</Accordion.Trigger>
        <Accordion.Content>Content one</Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="two">
        <Accordion.Trigger>Two</Accordion.Trigger>
        <Accordion.Content>Content two</Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="three" disabled>
        <Accordion.Trigger>Three</Accordion.Trigger>
        <Accordion.Content>Content three</Accordion.Content>
      </Accordion.Item>
    </Accordion>
  );
}

describe('Accordion', () => {
  it('renders all triggers collapsed by default', () => {
    render(<BasicAccordion />);
    expect(screen.getByRole('button', { name: 'One' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('Content one')).not.toBeVisible();
  });

  it('opens the item matching defaultValue', () => {
    render(<BasicAccordion defaultValue="one" />);
    expect(screen.getByRole('button', { name: 'One' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Content one')).toBeVisible();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<BasicAccordion defaultValue="one" />);
    await expectNoA11yViolations(container);
  });

  it('single type: opening one item closes the previously open one', async () => {
    const user = userEvent.setup();
    render(<BasicAccordion defaultValue="one" />);
    await user.click(screen.getByRole('button', { name: 'Two' }));
    expect(screen.getByRole('button', { name: 'One' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('button', { name: 'Two' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Content one')).not.toBeVisible();
    expect(screen.getByText('Content two')).toBeVisible();
  });

  it('single type: collapsible (default) closes the open item on repeat click', async () => {
    const user = userEvent.setup();
    render(<BasicAccordion defaultValue="one" />);
    await user.click(screen.getByRole('button', { name: 'One' }));
    expect(screen.getByRole('button', { name: 'One' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('single type: collapsible=false keeps the open item open on repeat click', async () => {
    const user = userEvent.setup();
    render(<BasicAccordion defaultValue="one" collapsible={false} />);
    await user.click(screen.getByRole('button', { name: 'One' }));
    expect(screen.getByRole('button', { name: 'One' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('calls onValueChange in single type', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<BasicAccordion onValueChange={onValueChange} />);
    await user.click(screen.getByRole('button', { name: 'One' }));
    expect(onValueChange).toHaveBeenCalledWith('one');
  });

  it('multiple type: items open independently', async () => {
    const user = userEvent.setup();
    render(<BasicAccordion type="multiple" defaultValues={['one']} />);
    await user.click(screen.getByRole('button', { name: 'Two' }));
    expect(screen.getByRole('button', { name: 'One' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Two' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('multiple type: calls onValuesChange with the full open set', async () => {
    const user = userEvent.setup();
    const onValuesChange = vi.fn();
    render(
      <BasicAccordion type="multiple" defaultValues={['one']} onValuesChange={onValuesChange} />,
    );
    await user.click(screen.getByRole('button', { name: 'Two' }));
    expect(onValuesChange).toHaveBeenCalledWith(['one', 'two']);
  });

  it('does not toggle a disabled item on click', async () => {
    const user = userEvent.setup();
    render(<BasicAccordion />);
    await user.click(screen.getByRole('button', { name: 'Three' }));
    expect(screen.getByRole('button', { name: 'Three' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('moves focus with ArrowDown/ArrowUp, skipping disabled triggers, and wraps', async () => {
    const user = userEvent.setup();
    render(<BasicAccordion />);
    screen.getByRole('button', { name: 'One' }).focus();

    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('button', { name: 'Two' })).toHaveFocus();

    // "Three" is disabled and excluded, so ArrowDown wraps back to "One"
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('button', { name: 'One' })).toHaveFocus();

    await user.keyboard('{ArrowUp}');
    expect(screen.getByRole('button', { name: 'Two' })).toHaveFocus();
  });

  it('moves focus to the first/last enabled trigger with Home/End', async () => {
    const user = userEvent.setup();
    render(<BasicAccordion />);
    screen.getByRole('button', { name: 'One' }).focus();

    await user.keyboard('{End}');
    expect(screen.getByRole('button', { name: 'Two' })).toHaveFocus();

    await user.keyboard('{Home}');
    expect(screen.getByRole('button', { name: 'One' })).toHaveFocus();
  });

  it('toggles the focused trigger with Enter', async () => {
    const user = userEvent.setup();
    render(<BasicAccordion />);
    screen.getByRole('button', { name: 'One' }).focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: 'One' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('associates each trigger and panel via aria-controls/aria-labelledby', () => {
    render(<BasicAccordion defaultValue="one" />);
    const trigger = screen.getByRole('button', { name: 'One' });
    const panel = screen.getByText('Content one');
    expect(trigger).toHaveAttribute('aria-controls', panel.id);
    expect(panel).toHaveAttribute('aria-labelledby', trigger.id);
  });

  it('throws when an Accordion part is used outside <Accordion>', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(
        <Accordion.Item value="a">
          <Accordion.Trigger>a</Accordion.Trigger>
        </Accordion.Item>,
      ),
    ).toThrow('<Accordion.Item> must be used within <Accordion>');
    consoleError.mockRestore();
  });

  it('throws when Accordion.Trigger is used outside <Accordion.Item>', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(
        <Accordion>
          <Accordion.Trigger>a</Accordion.Trigger>
        </Accordion>,
      ),
    ).toThrow('<Accordion.Trigger> must be used within <Accordion.Item>');
    consoleError.mockRestore();
  });
});
