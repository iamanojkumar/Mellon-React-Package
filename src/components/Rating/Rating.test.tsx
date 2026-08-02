import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Rating } from './Rating';

function mockRowRect(row: HTMLElement, width: number) {
  row.getBoundingClientRect = () =>
    ({
      left: 0,
      top: 0,
      right: width,
      bottom: 20,
      width,
      height: 20,
      x: 0,
      y: 0,
      toJSON() {
        return this;
      },
    }) as DOMRect;
}

describe('Rating', () => {
  it('renders a role=slider element', () => {
    render(<Rating aria-label="Rating" />);
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Rating aria-label="Rating" defaultValue={3} />);
    await expectNoA11yViolations(container);
  });

  it('defaults max to 5 and value to 0', () => {
    render(<Rating aria-label="Rating" />);
    const rating = screen.getByRole('slider');
    expect(rating).toHaveAttribute('aria-valuemax', '5');
    expect(rating).toHaveAttribute('aria-valuenow', '0');
  });

  it('sets a default aria-valuetext', () => {
    render(<Rating aria-label="Rating" defaultValue={3} />);
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuetext', '3 out of 5 stars');
  });

  it('supports a custom max', () => {
    render(<Rating aria-label="Rating" max={10} defaultValue={7} />);
    const rating = screen.getByRole('slider');
    expect(rating).toHaveAttribute('aria-valuemax', '10');
    expect(rating).toHaveAttribute('aria-valuenow', '7');
  });

  it('increases/decreases by whole stars via arrow keys by default', async () => {
    const user = userEvent.setup();
    render(<Rating aria-label="Rating" defaultValue={2} />);
    const rating = screen.getByRole('slider');
    rating.focus();
    await user.keyboard('{ArrowRight}');
    expect(rating).toHaveAttribute('aria-valuenow', '3');
    await user.keyboard('{ArrowLeft}');
    expect(rating).toHaveAttribute('aria-valuenow', '2');
  });

  it('increases/decreases by half stars when allowHalf is set', async () => {
    const user = userEvent.setup();
    render(<Rating aria-label="Rating" allowHalf defaultValue={2} />);
    const rating = screen.getByRole('slider');
    rating.focus();
    await user.keyboard('{ArrowRight}');
    expect(rating).toHaveAttribute('aria-valuenow', '2.5');
  });

  it('clamps at 0 and max', async () => {
    const user = userEvent.setup();
    render(<Rating aria-label="Rating" defaultValue={0} />);
    const rating = screen.getByRole('slider');
    rating.focus();
    await user.keyboard('{ArrowLeft}');
    expect(rating).toHaveAttribute('aria-valuenow', '0');
  });

  it('jumps to 0/max on Home/End', async () => {
    const user = userEvent.setup();
    render(<Rating aria-label="Rating" defaultValue={2} max={5} />);
    const rating = screen.getByRole('slider');
    rating.focus();
    await user.keyboard('{End}');
    expect(rating).toHaveAttribute('aria-valuenow', '5');
    await user.keyboard('{Home}');
    expect(rating).toHaveAttribute('aria-valuenow', '0');
  });

  it('calls onChange with the new value', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Rating aria-label="Rating" defaultValue={2} onChange={onChange} />);
    screen.getByRole('slider').focus();
    await user.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it('works controlled, deferring to the value prop', async () => {
    function Controlled() {
      const [value, setValue] = useState(1);
      return <Rating aria-label="Rating" value={value} onChange={setValue} />;
    }
    const user = userEvent.setup();
    render(<Controlled />);
    const rating = screen.getByRole('slider');
    expect(rating).toHaveAttribute('aria-valuenow', '1');
    rating.focus();
    await user.keyboard('{ArrowRight}');
    expect(rating).toHaveAttribute('aria-valuenow', '2');
  });

  it('sets a whole-star value on click (5 stars, no allowHalf)', () => {
    const onChange = vi.fn();
    render(<Rating aria-label="Rating" onChange={onChange} />);
    const rating = screen.getByRole('slider');
    mockRowRect(rating, 100);
    // Click at x=45 -> 45% of 5 stars = 2.25, rounds to whole star (2).
    fireEvent.click(rating, { clientX: 45 });
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('sets a half-star value on click when allowHalf is set', () => {
    const onChange = vi.fn();
    render(<Rating aria-label="Rating" allowHalf onChange={onChange} />);
    const rating = screen.getByRole('slider');
    mockRowRect(rating, 100);
    // Click at x=45 -> 2.25 -> rounds to nearest 0.5 -> 2.5.
    fireEvent.click(rating, { clientX: 45 });
    expect(onChange).toHaveBeenCalledWith(2.5);
  });

  it('is not focusable when disabled', () => {
    render(<Rating aria-label="Rating" disabled />);
    expect(screen.getByRole('slider')).toHaveAttribute('tabindex', '-1');
  });

  it('ignores clicks when disabled', () => {
    const onChange = vi.fn();
    render(<Rating aria-label="Rating" disabled onChange={onChange} />);
    const rating = screen.getByRole('slider');
    mockRowRect(rating, 100);
    fireEvent.click(rating, { clientX: 45 });
    expect(onChange).not.toHaveBeenCalled();
  });
});
