import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Dropdown } from './Dropdown';

function BasicDropdown(props: { onSelect?: (item: string) => void }) {
  return (
    <Dropdown>
      <Dropdown.Trigger>Options</Dropdown.Trigger>
      <Dropdown.Menu>
        <Dropdown.Item onSelect={() => props.onSelect?.('edit')}>Edit</Dropdown.Item>
        <Dropdown.Item onSelect={() => props.onSelect?.('duplicate')}>Duplicate</Dropdown.Item>
        <Dropdown.Item disabled onSelect={() => props.onSelect?.('delete')}>
          Delete
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
}

describe('Dropdown', () => {
  it('is closed by default and has no menu in the document', () => {
    render(<BasicDropdown />);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Options' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('opens the menu on trigger click and focuses the first item', async () => {
    const user = userEvent.setup();
    render(<BasicDropdown />);
    await user.click(screen.getByRole('button', { name: 'Options' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Options' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toHaveFocus();
  });

  it('has no accessibility violations', async () => {
    const user = userEvent.setup();
    render(<BasicDropdown />);
    await user.click(screen.getByRole('button', { name: 'Options' }));
    await expectNoA11yViolations(document.body);
  });

  it('toggles closed when the trigger is clicked again', async () => {
    const user = userEvent.setup();
    render(<BasicDropdown />);
    const trigger = screen.getByRole('button', { name: 'Options' });
    await user.click(trigger);
    expect(screen.getByRole('menu')).toBeInTheDocument();
    await user.click(trigger);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('selects an item on click, calling onSelect and closing the menu', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<BasicDropdown onSelect={onSelect} />);
    await user.click(screen.getByRole('button', { name: 'Options' }));
    await user.click(screen.getByRole('menuitem', { name: 'Duplicate' }));
    expect(onSelect).toHaveBeenCalledWith('duplicate');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('returns focus to the trigger after selecting an item', async () => {
    const user = userEvent.setup();
    render(<BasicDropdown />);
    const trigger = screen.getByRole('button', { name: 'Options' });
    await user.click(trigger);
    await user.click(screen.getByRole('menuitem', { name: 'Edit' }));
    expect(trigger).toHaveFocus();
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    render(<BasicDropdown />);
    const trigger = screen.getByRole('button', { name: 'Options' });
    await user.click(trigger);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('closes on an outside click but not on a click on the trigger itself', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <BasicDropdown />
        <button type="button">elsewhere</button>
      </div>,
    );
    const trigger = screen.getByRole('button', { name: 'Options' });
    await user.click(trigger);
    expect(screen.getByRole('menu')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'elsewhere' }));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('moves focus with ArrowDown/ArrowUp, skipping disabled items, and wraps around', async () => {
    const user = userEvent.setup();
    render(<BasicDropdown />);
    await user.click(screen.getByRole('button', { name: 'Options' }));

    expect(screen.getByRole('menuitem', { name: 'Edit' })).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'Duplicate' })).toHaveFocus();
    // "Delete" is disabled and excluded, so ArrowDown wraps back to "Edit"
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toHaveFocus();
    await user.keyboard('{ArrowUp}');
    expect(screen.getByRole('menuitem', { name: 'Duplicate' })).toHaveFocus();
  });

  it('closes on Tab without trapping focus', async () => {
    const user = userEvent.setup();
    render(<BasicDropdown />);
    await user.click(screen.getByRole('button', { name: 'Options' }));
    await user.keyboard('{Tab}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('throws when a Dropdown part is used outside <Dropdown>', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Dropdown.Trigger>content</Dropdown.Trigger>)).toThrow(
      '<Dropdown.Trigger> must be used within <Dropdown>',
    );
    consoleError.mockRestore();
  });
});
