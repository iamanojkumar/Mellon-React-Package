import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { SplitButton } from './SplitButton';
import { Dropdown } from '../Dropdown/Dropdown';

function BasicSplitButton(props: { onClick?: () => void; onSelect?: (item: string) => void }) {
  return (
    <SplitButton
      onClick={props.onClick}
      menu={
        <>
          <Dropdown.Item onSelect={() => props.onSelect?.('save-as')}>Save as...</Dropdown.Item>
          <Dropdown.Item onSelect={() => props.onSelect?.('save-close')}>
            Save and close
          </Dropdown.Item>
        </>
      }
    >
      Save
    </SplitButton>
  );
}

describe('SplitButton', () => {
  it('renders a primary button and a separate menu-toggle button', () => {
    render(<BasicSplitButton />);
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'More actions' })).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<BasicSplitButton />);
    await expectNoA11yViolations(container);
  });

  it('calls onClick when the primary button is activated', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<BasicSplitButton onClick={onClick} />);
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('opens the secondary-actions menu from the chevron without triggering onClick', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<BasicSplitButton onClick={onClick} />);
    await user.click(screen.getByRole('button', { name: 'More actions' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('selects a menu item and calls onSelect', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<BasicSplitButton onSelect={onSelect} />);
    await user.click(screen.getByRole('button', { name: 'More actions' }));
    await user.click(screen.getByRole('menuitem', { name: 'Save as...' }));
    expect(onSelect).toHaveBeenCalledWith('save-as');
  });

  it('uses a custom menuLabel', () => {
    render(
      <SplitButton menuLabel="Save options" menu={<Dropdown.Item>Save as...</Dropdown.Item>}>
        Save
      </SplitButton>,
    );
    expect(screen.getByRole('button', { name: 'Save options' })).toBeInTheDocument();
  });

  it('disables both buttons when disabled', () => {
    render(
      <SplitButton disabled menu={<Dropdown.Item>Save as...</Dropdown.Item>}>
        Save
      </SplitButton>,
    );
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'More actions' })).toBeDisabled();
  });

  it('disables the chevron while the primary action is loading', () => {
    render(
      <SplitButton loading menu={<Dropdown.Item>Save as...</Dropdown.Item>}>
        Save
      </SplitButton>,
    );
    expect(screen.getByRole('button', { name: 'More actions' })).toBeDisabled();
  });

  it('applies an optional group label to the wrapper', () => {
    render(
      <SplitButton groupLabel="Save actions" menu={<Dropdown.Item>Save as...</Dropdown.Item>}>
        Save
      </SplitButton>,
    );
    expect(screen.getByRole('group', { name: 'Save actions' })).toBeInTheDocument();
  });
});
