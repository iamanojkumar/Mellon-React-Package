import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Avatar, avatarColorFromKey } from './Avatar';
import type { AvatarColor } from './Avatar';

describe('Avatar', () => {
  it('renders as a span by default', () => {
    render(<Avatar data-testid="avatar" name="Ada Lovelace" />);
    expect(screen.getByTestId('avatar').tagName).toBe('SPAN');
  });

  it('renders as the element passed via the "as" prop', () => {
    render(<Avatar as="div" data-testid="avatar" name="Ada Lovelace" />);
    expect(screen.getByTestId('avatar').tagName).toBe('DIV');
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<Avatar ref={ref} name="Ada Lovelace" />);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it('merges a custom className with the base style', () => {
    render(<Avatar data-testid="avatar" className="custom" name="Ada Lovelace" />);
    expect(screen.getByTestId('avatar').className).toContain('custom');
  });

  it('has no accessibility violations with an image', async () => {
    const { container } = render(<Avatar src="https://example.com/a.png" alt="Ada Lovelace" />);
    await expectNoA11yViolations(container);
  });

  it('has no accessibility violations with initials', async () => {
    const { container } = render(<Avatar name="Ada Lovelace" />);
    await expectNoA11yViolations(container);
  });

  it('renders an img with alt text when src is given', () => {
    render(<Avatar src="https://example.com/a.png" alt="Ada Lovelace" />);
    expect(screen.getByRole('img', { name: 'Ada Lovelace' })).toHaveAttribute(
      'src',
      'https://example.com/a.png',
    );
  });

  it('falls back to initials derived from name when there is no src', () => {
    render(<Avatar name="Ada Lovelace" />);
    expect(screen.getByRole('img', { name: 'Ada Lovelace' })).toHaveTextContent('AL');
  });

  it('derives initials from a single-word name using its first two letters', () => {
    render(<Avatar name="Cher" />);
    expect(screen.getByText('CH')).toBeInTheDocument();
  });

  it('defaults to size=md and shape=circle', () => {
    render(<Avatar data-testid="avatar" name="Ada Lovelace" />);
    const el = screen.getByTestId('avatar');
    expect(el).toHaveAttribute('data-size', 'md');
    expect(el).toHaveAttribute('data-shape', 'circle');
  });
  describe('color', () => {
    it('is neutral by default — the untinted look every existing call site already has', () => {
      render(<Avatar data-testid="avatar" name="Ada Lovelace" />);
      expect(screen.getByTestId('avatar')).toHaveAttribute('data-color', 'neutral');
    });

    it('applies an explicit color', () => {
      render(<Avatar data-testid="avatar" name="Ada Lovelace" color="success" />);
      expect(screen.getByTestId('avatar')).toHaveAttribute('data-color', 'success');
    });

    it('derives a stable color from colorFrom', () => {
      const { unmount } = render(<Avatar data-testid="avatar" name="Ada" colorFrom="acct_1" />);
      const first = screen.getByTestId('avatar').getAttribute('data-color');
      unmount();

      render(<Avatar data-testid="avatar" name="Ada" colorFrom="acct_1" />);
      expect(screen.getByTestId('avatar')).toHaveAttribute('data-color', first!);
    });

    it('lets an explicit color win over colorFrom', () => {
      render(<Avatar data-testid="avatar" name="Ada" color="danger" colorFrom="acct_1" />);
      expect(screen.getByTestId('avatar')).toHaveAttribute('data-color', 'danger');
    });

    it('spreads keys across the whole rotation rather than collapsing onto one tint', () => {
      const keys = Array.from({ length: 200 }, (_, index) => `account_${index}`);
      const seen = new Set(keys.map(avatarColorFromKey));
      expect(seen.size).toBe(5);
    });

    it('changes tint when a single character of the key changes', () => {
      // The point of hashing rather than using length or a character sum:
      // same-length sequential ids must not all land on one colour.
      expect(avatarColorFromKey('acct_10')).not.toBe(avatarColorFromKey('acct_11'));
    });

    it('has no accessibility violations when tinted', async () => {
      const colors: AvatarColor[] = ['neutral', 'info', 'success', 'warning', 'danger'];
      const { container } = render(
        <>
          {colors.map((color) => (
            <Avatar key={color} name="Ada Lovelace" color={color} />
          ))}
        </>,
      );
      await expectNoA11yViolations(container);
    });
  });
});
